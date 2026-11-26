// Synthesised sounds (Web Audio, no files): wind that rises with speed,
// a soft thump for a crash, a chime when an exhibit is noticed, a tick for
// a close call, a short tune at the canal. The context starts on the first
// user action (browsers need a gesture). Mute stops everything.

export function createSfx(muted = false) {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let wind: GainNode | null = null;
  let windFilter: BiquadFilterNode | null = null;
  let isMuted = muted;

  function start() {
    if (ctx || typeof AudioContext === "undefined") return;
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = isMuted ? 0 : 0.6;
    master.connect(ctx.destination);
    // Wind: looping noise through a band-pass filter.
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    windFilter = ctx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.value = 500;
    windFilter.Q.value = 0.7;
    wind = ctx.createGain();
    wind.gain.value = 0;
    src.connect(windFilter).connect(wind).connect(master);
    src.start();
  }

  function tone(
    freq: number,
    at: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    slideTo?: number,
  ) {
    if (!ctx || !master) return;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  return {
    /** Call from a user action (start, restart). */
    start,
    /** Wind follows the speed (m/s). */
    speed(v: number) {
      if (!ctx || !wind || !windFilter) return;
      const k = Math.min(1, v / 22);
      wind.gain.setTargetAtTime(k * 0.35, ctx.currentTime, 0.2);
      windFilter.frequency.setTargetAtTime(350 + k * 900, ctx.currentTime, 0.2);
    },
    crash() {
      tone(110, 0, 0.35, "sine", 0.7, 40);
      tone(220, 0, 0.12, "triangle", 0.2, 90);
    },
    notice() {
      tone(880, 0, 0.35, "triangle", 0.25);
      tone(1320, 0.09, 0.45, "triangle", 0.2);
    },
    /** A gentle wind-chime shatter (crashing into a glass workshop). */
    chime() {
      tone(4200, 0, 0.12, "square", 0.03, 1400);
      const bells = [2093, 2637, 3136, 2349, 3520, 2794, 2093];
      bells.forEach((f, i) =>
        tone(f, 0.04 + i * 0.07, 0.7 + (i % 3) * 0.2, "triangle", 0.07),
      );
    },
    /** Falling into the canal: a deep plunge and a fizz of droplets. */
    splash() {
      tone(260, 0, 0.5, "sine", 0.6, 55);
      tone(900, 0.03, 0.35, "triangle", 0.12, 200);
      for (let i = 0; i < 6; i++)
        tone(1400 + i * 260, 0.08 + i * 0.05, 0.12, "sine", 0.05);
    },
    /** Skates digging into the ice (start of a brace). */
    scrape() {
      tone(420, 0, 0.35, "sawtooth", 0.035, 140);
      tone(900, 0, 0.2, "square", 0.012, 300);
    },
    /** A soft camera shutter (a tourist's photo). */
    shutter() {
      tone(2400, 0, 0.025, "square", 0.025);
      tone(1800, 0.05, 0.03, "square", 0.02);
    },
    closeCall() {
      tone(1600, 0, 0.08, "square", 0.05);
    },
    finish() {
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(f, i * 0.14, 0.5, "triangle", 0.22),
      );
    },
    get muted() {
      return isMuted;
    },
    setMuted(m: boolean) {
      isMuted = m;
      if (ctx && master)
        master.gain.setTargetAtTime(m ? 0 : 0.6, ctx.currentTime, 0.05);
    },
    destroy() {
      void ctx?.close();
      ctx = null;
    },
  };
}
