// Web Audio engine: ambient beds per zone and season with crossfades, UI cues,
// mute, and autoplay rules (nothing plays before the first click or key).
// Framework-free; the React glue is in react.tsx.
import type { ExperienceEvent, ExperienceState } from "@/contracts";
import { domCue, hoverKey, SOUND_DOM_EVENT } from "./dom";
import { ambientSounds, cueForEvent, layerGains, zoneForView } from "./mix";
import type { ResolvedManifest } from "./types";

export const MUTE_STORAGE_KEY = "living-hokkaido.sound.muted";

export type SoundScene = {
  view: ExperienceState["view"];
  overlay: ExperienceState["overlay"];
  season: number;
  /** Open detail scene, for scene-specific zones. */
  sceneId?: string | null;
};

type Bus = "master" | "ambient" | "ui";
type Ambient = { gain: GainNode; src: AudioBufferSourceNode };

const MIME: Record<string, string> = {
  ogg: 'audio/ogg; codecs="vorbis"',
  m4a: 'audio/mp4; codecs="mp4a.40.2"',
  mp3: "audio/mpeg",
  wav: "audio/wav",
  webm: 'audio/webm; codecs="opus"',
};

function playable(srcs: string[]): string[] {
  if (typeof Audio === "undefined") return srcs;
  const probe = new Audio();
  const ok = srcs.filter((s) => {
    const mime = MIME[s.split(".").pop()?.toLowerCase() ?? ""];
    return !mime || probe.canPlayType(mime) !== "";
  });
  // Keep the rest as a last try: canPlayType can be wrong.
  return [...ok, ...srcs.filter((s) => !ok.includes(s))];
}

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private buses: Partial<Record<Bus | "duck", GainNode>> = {};
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private ambient = new Map<string, Ambient>();
  private lastPlayed = new Map<string, number>();
  private listeners = new Set<() => void>();
  private scene: SoundScene = { view: "island", overlay: null, season: 0 };
  private zone: string | null = null;
  private eventCount = 0;
  private hovered: Element | null = null;
  private _muted = false;

  constructor(
    readonly manifest: ResolvedManifest,
    private storage: Storage | null = null,
  ) {
    try {
      this._muted = storage?.getItem(MUTE_STORAGE_KEY) === "1";
    } catch {}
  }

  get muted() {
    return this._muted;
  }
  get unlocked() {
    return this.ctx?.state === "running";
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  setMuted(muted: boolean) {
    this._muted = muted;
    try {
      this.storage?.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
    } catch {}
    this.ramp(this.buses.master, muted ? 0 : this.manifest.buses.master, 0.15);
    if (!muted) this.applyMix(0.3);
    for (const l of this.listeners) l();
  }

  /** Change a bus gain at run time (for a future volume slider). */
  setBus(bus: Bus, value: number) {
    this.manifest.buses[bus] = value;
    if (bus !== "master" || !this._muted)
      this.ramp(this.buses[bus], value, 0.1);
  }

  /** Must run inside a user gesture the first time (autoplay rules). */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      this.ctx = ctx;
      const mk = (v: number, to: AudioNode) => {
        const g = ctx.createGain();
        g.gain.value = v;
        g.connect(to);
        return g;
      };
      const b = this.manifest.buses;
      const master = mk(this._muted ? 0 : b.master, ctx.destination);
      const duck = mk(1, master);
      this.buses = {
        master,
        duck,
        ambient: mk(b.ambient, duck),
        ui: mk(b.ui, master),
      };
    }
    if (this.ctx.state !== "running")
      void this.ctx.resume().then(() => {
        this.applyMix(this.manifest.zoneFadeSec);
        for (const l of this.listeners) l();
      });
  }

  /** Current view, overlay and season from the shell. */
  setScene(next: SoundScene) {
    const zoneChanged =
      zoneForView(this.manifest, next.view, next.sceneId) !==
      zoneForView(this.manifest, this.scene.view, this.scene.sceneId);
    this.scene = next;
    this.applyMix(
      zoneChanged ? this.manifest.zoneFadeSec : this.manifest.seasonFadeSec,
    );
  }

  /** Forward every shared event here (the shell's emit does this). */
  onEvent(e: ExperienceEvent) {
    const cue = cueForEvent(this.manifest, e, this.scene.season);
    if (e.type === "season.set")
      this.scene = { ...this.scene, season: e.value };
    if (!cue) return;
    this.eventCount++;
    this.play(cue);
  }

  play(cueId: string) {
    const cue = this.manifest.cues[cueId];
    const ctx = this.ctx;
    if (!cue || !ctx || ctx.state !== "running" || this._muted) return;
    const now = performance.now();
    if (now - (this.lastPlayed.get(cueId) ?? -1e9) < cue.minIntervalMs) return;
    this.lastPlayed.set(cueId, now);
    const sound = this.manifest.sounds[cue.sound];
    void this.load(cue.sound).then((buf) => {
      const bus = this.buses.ui;
      if (!buf || !bus) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.detune.value = (Math.random() * 2 - 1) * sound.detuneJitter;
      const g = ctx.createGain();
      g.gain.value = cue.volume * sound.volume;
      src.connect(g).connect(bus);
      src.start(ctx.currentTime + cue.delayMs / 1000);
      src.onended = () => g.disconnect();
    });
  }

  /** Preload files (e.g. the UI set) so the first click is not late. */
  preload(soundIds: string[] = Object.keys(this.manifest.sounds)) {
    for (const id of soundIds) void this.load(id);
  }

  /** Listen for the first gesture, DOM hover/click, lh:sound, tab hiding. */
  attach(doc: Document = document): () => void {
    const win = doc.defaultView ?? window;
    const off: Array<() => void> = [];
    const on = <K extends keyof DocumentEventMap>(
      type: K,
      fn: (e: DocumentEventMap[K]) => void,
      target: Document | Window = doc,
    ) => {
      const h = fn as EventListener;
      target.addEventListener(type, h, { capture: true, passive: true });
      off.push(() => target.removeEventListener(type, h, { capture: true }));
    };
    const gesture = () => {
      this.unlock();
      this.preload();
    };
    on("pointerdown", gesture);
    on("keydown", gesture);
    on("pointerover", (e) => {
      const key = hoverKey(this.manifest, e.target);
      if (key === this.hovered) return;
      this.hovered = key;
      const cue = domCue(this.manifest, "hover", e.target);
      if (cue) this.play(cue);
    });
    on("focusin", (e) => {
      const el = e.target;
      if (!(el instanceof Element) || !el.matches(":focus-visible")) return;
      const cue = domCue(this.manifest, "hover", el);
      if (cue) this.play(cue);
    });
    on("click", (e) => {
      const cue = domCue(this.manifest, "click", e.target);
      if (!cue) return;
      // Let the event cue win: if this click emits an event with a cue in
      // the same task (journal.open -> page), skip the generic click sound.
      const before = this.eventCount;
      setTimeout(() => {
        if (this.eventCount === before) this.play(cue);
      }, 0);
    });
    const custom = (e: Event) => {
      const d = (e as CustomEvent<unknown>).detail;
      if (typeof d === "string") this.play(d);
    };
    win.addEventListener(SOUND_DOM_EVENT, custom);
    off.push(() => win.removeEventListener(SOUND_DOM_EVENT, custom));
    on("visibilitychange", () => {
      if (!this.ctx) return;
      if (doc.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
    return () => {
      for (const f of off) f();
    };
  }

  /** Stop everything and release the audio device. */
  dispose() {
    void this.ctx?.close();
    this.ctx = null;
    this.ambient.clear();
    this.buses = {};
  }

  private applyMix(fadeSec: number) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const m = this.manifest;
    this.zone = zoneForView(m, this.scene.view, this.scene.sceneId);
    const gains = layerGains(m, this.zone, this.scene.season);
    this.ramp(this.buses.duck, this.scene.overlay ? m.overlayDuck : 1, 0.4);
    for (const id of ambientSounds(m)) {
      const target = (gains[id] ?? 0) * (m.sounds[id]?.volume ?? 1);
      const node = this.ambient.get(id);
      if (node) this.ramp(node.gain, target, fadeSec);
      else if (target > 0.001) void this.startAmbient(id, fadeSec);
    }
  }

  private async startAmbient(id: string, fadeSec: number) {
    const ctx = this.ctx;
    const bus = this.buses.ambient;
    if (!ctx || !bus || this.ambient.has(id)) return;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const src = ctx.createBufferSource();
    this.ambient.set(id, { gain, src });
    const buf = await this.load(id);
    if (!buf || this.ctx !== ctx) {
      this.ambient.delete(id);
      return;
    }
    src.buffer = buf;
    src.loop = true;
    src.connect(gain).connect(bus);
    // Random start so layers do not line up the same way every visit.
    src.start(0, Math.random() * buf.duration);
    this.applyMix(fadeSec);
  }

  private ramp(node: GainNode | undefined, value: number, sec: number) {
    if (!node || !this.ctx) return;
    const t = this.ctx.currentTime;
    node.gain.cancelScheduledValues(t);
    node.gain.setTargetAtTime(value, t, Math.max(sec, 0.01) / 3);
  }

  private load(id: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(id);
    if (cached) return cached;
    const sound = this.manifest.sounds[id];
    const ctx = this.ctx;
    if (!sound || !ctx) return Promise.resolve(null);
    const p = (async () => {
      for (const url of playable(sound.src)) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          return await ctx.decodeAudioData(await res.arrayBuffer());
        } catch {}
      }
      console.warn(`[sound] could not load ${id}`);
      return null;
    })();
    this.buffers.set(id, p);
    return p;
  }
}
