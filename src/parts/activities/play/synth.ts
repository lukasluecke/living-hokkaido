// A tiny Web Audio synth for the music kinds. Synthetic, illustrative tones
// only: never a recording, never a voice. Silent where Web Audio is missing.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

const hz = (semitones: number, base = 146.83) => base * 2 ** (semitones / 12);

/** A plucked string: bright attack, fast decay. */
export function pluck(semitones: number, gauge: "thick" | "medium" | "thin") {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  osc.type = gauge === "thick" ? "sawtooth" : "triangle";
  osc.frequency.value = hz(semitones);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(gauge === "thin" ? 4200 : 2400, t);
  filter.frequency.exponentialRampToValueAtTime(400, t + 0.6);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.25, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  osc.connect(filter).connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 1.2);
}

/** A soft held tone for one canon voice. */
export function hum(semitones: number, seconds: number, pan = 0) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const panner = c.createStereoPanner?.();
  osc.type = "sine";
  osc.frequency.value = hz(semitones, 220);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.12, t + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds * 0.95);
  let node: AudioNode = osc.connect(gain);
  if (panner) {
    panner.pan.value = pan;
    node = node.connect(panner);
  }
  node.connect(c.destination);
  osc.start(t);
  osc.stop(t + seconds);
}

/** A short click for the shared beat. */
export function tick(accent: boolean) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "square";
  osc.frequency.value = accent ? 1600 : 1100;
  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.06);
}
