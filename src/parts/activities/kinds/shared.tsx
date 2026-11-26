// Props for one proposed activity kind. Same shape as ActivityPartProps
// (src/contracts/parts.ts), narrowed to one kind.
import type {
  ActivityKind,
  ActivityOf,
  Emit,
  Prefs,
  ResolvedClaim,
  VoiceIndex,
} from "@/contracts";
import { voiceDir, voiceIndexSchema } from "@/contracts";
import { useEffect, useMemo, useState } from "react";

export type KindProps<K extends ActivityKind> = {
  activity: ActivityOf<K>;
  claims: Record<string, ResolvedClaim>;
  prefs: Prefs;
  emit: Emit;
  /** Ids found in this activity before (from the journal). */
  found?: string[];
};

export const complete = (emit: Emit, activityId: string, score?: number) =>
  emit({
    type: "activity.complete",
    result: {
      activityId,
      completed: true,
      score,
      at: new Date().toISOString(),
    },
  });

/** Small citation chip: claim → first source + locator. */
export function Cite({
  claim,
  onReveal,
}: {
  claim: ResolvedClaim | undefined;
  onReveal: () => void;
}) {
  if (!claim) return null;
  const c = claim.claim.citations[0];
  const src = claim.sources.find((s) => s.id === c?.sourceId);
  return (
    <button type="button" className="cite" onClick={onReveal}>
      <span aria-hidden="true">❦</span> {src?.title ?? c?.sourceId}
      {c ? ` · ${c.locator}` : ""}
    </button>
  );
}

/** The browser speech engine, as a clearly labelled placeholder. */
export const deviceVoice = {
  available: () =>
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    window.speechSynthesis.getVoices().length > 0,
  speak(
    text: string,
    on: { word?: (charIndex: number) => void; end?: () => void } = {},
  ) {
    if (!("speechSynthesis" in window)) return on.end?.();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // Read in the page language (the shell sets <html lang>).
    u.lang = document.documentElement.lang === "ja" ? "ja-JP" : "en";
    u.rate = 0.95;
    u.onboundary = (e) => {
      if (e.name === "word") on.word?.(e.charIndex);
    };
    u.onend = () => on.end?.();
    u.onerror = () => on.end?.();
    window.speechSynthesis.speak(u);
  },
  stop() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  },
};

const voiceIndexes = new Map<string, Promise<VoiceIndex | null>>();

/** Index of one voice group in the page language (English or Japanese). */
function loadVoiceIndex(group: string) {
  const dir = voiceDir(group, document.documentElement.lang);
  let p = voiceIndexes.get(dir);
  if (!p) {
    p = fetch(`${dir}/index.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => voiceIndexSchema.safeParse(j).data ?? null)
      .catch(() => null);
    voiceIndexes.set(dir, p);
  }
  return { dir, index: p };
}

/**
 * Pre-generated AI voice lines of one group (scripts/audio/voices.ts), in
 * the page language. Null while loading or when the files are missing.
 */
export function useAiVoice(group: string | undefined) {
  const [loaded, setLoaded] = useState<{
    dir: string;
    index: VoiceIndex;
  } | null>(null);
  useEffect(() => {
    if (!group) return;
    let live = true;
    const { dir, index } = loadVoiceIndex(group);
    index.then((i) => live && setLoaded(i ? { dir, index: i } : null));
    return () => {
      live = false;
    };
  }, [group]);
  return useMemo(
    () =>
      group && loaded
        ? {
            index: loaded.index,
            url: (lineId: string) => `${loaded.dir}/${lineId}.mp3`,
          }
        : null,
    [group, loaded],
  );
}

let narrating: HTMLAudioElement | null = null;

/**
 * Read one line aloud: the pre-generated AI owl voice
 * (`voiceDir(group, lang)/<lineId>.mp3`, scripts/audio/voices.ts) when it
 * exists in the page language, else the device voice placeholder.
 */
export const narrator = {
  speak(group: string, lineId: string, text: string) {
    narrator.stop();
    const fallback = () => deviceVoice.speak(text);
    const { dir, index: p } = loadVoiceIndex(group);
    const audio = new Audio();
    narrating = audio;
    void p.then((index) => {
      if (narrating !== audio) return;
      if (!index?.lines[lineId]) return fallback();
      audio.src = `${dir}/${lineId}.mp3`;
      audio.play().catch(() => narrating === audio && fallback());
    });
  },
  stop() {
    narrating?.pause();
    narrating = null;
    deviceVoice.stop();
  },
};
