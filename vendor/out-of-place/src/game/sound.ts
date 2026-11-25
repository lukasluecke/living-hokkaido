// Synthesised sound stings (Web Audio, no audio files, nothing to license).
// Funny, short and soft: being found is a joke, not a punishment.
// Everything also feeds an optional MediaStream so clips can record it.

export class Sfx {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;

  constructor(private readonly muted: boolean) {}

  private ensure(): AudioContext | null {
    if (this.muted || typeof AudioContext === "undefined") return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.out = this.ctx.createGain();
      this.out.gain.value = 0.18;
      this.out.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** A stream carrying every sting from now on (for the clip recorder). */
  recordStream(): MediaStream | null {
    const ctx = this.ensure();
    if (!ctx || !this.out) return null;
    if (!this.recordDest) {
      this.recordDest = ctx.createMediaStreamDestination();
      this.out.connect(this.recordDest);
    }
    return this.recordDest.stream;
  }

  private tone(
    type: OscillatorType,
    from: number,
    to: number,
    start: number,
    dur: number,
    peak = 1,
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.out) return;
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env).connect(this.out);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /** Found: a sliding whistle down, a boing, and a little pop. */
  found() {
    if (!this.ensure()) return;
    this.tone("triangle", 1400, 260, 0, 0.55, 0.9);
    for (let i = 0; i < 4; i++)
      this.tone(
        "sine",
        300 - i * 30,
        180 - i * 15,
        0.6 + i * 0.09,
        0.12,
        0.7 - i * 0.12,
      );
    this.tone("square", 900, 1800, 1.05, 0.06, 0.35);
  }

  /** Survived: a bright little fanfare. */
  survive() {
    if (!this.ensure()) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this.tone("triangle", f, f, i * 0.11, 0.18, 0.7));
    this.tone("triangle", 1047, 1047, 0.46, 0.7, 0.8);
    this.tone("sine", 1568, 1568, 0.46, 0.7, 0.3);
  }

  /** Soft click for a wrong tap. */
  miss() {
    if (!this.ensure()) return;
    this.tone("sine", 520, 300, 0, 0.12, 0.4);
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
    this.out = null;
    this.recordDest = null;
  }
}
