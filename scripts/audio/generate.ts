// Generates the original placeholder sounds in public/audio/ (ambient loops
// and UI sounds). Pure synthesis with a fixed seed: no samples, no third-party
// material, so the files carry the repository's MIT licence (see
// public/audio/ATTRIBUTION.md). Needs ffmpeg on PATH for .ogg/.m4a.
//
//   npm run audio:generate            # all sounds
//   npm run audio:generate -- stamp   # only the named sounds
//
// Tune loudness per file with `rmsDb` / `peakDb` below, or later in
// src/audio/manifest.ts (volume) without regenerating.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SR = 44100;
const OUT = join(process.cwd(), "public", "audio");
const TAU = Math.PI * 2;

// ---------- tiny DSP kit ----------

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rand = ReturnType<typeof rng>;

class Biquad {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;
  constructor(
    private type: "lp" | "hp" | "bp",
    freq: number,
    q = 0.707,
  ) {
    this.set(freq, q);
  }
  set(freq: number, q = 0.707) {
    const w = (TAU * Math.min(freq, SR * 0.45)) / SR;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    const a0 = 1 + alpha;
    if (this.type === "lp") {
      this.b0 = (1 - cos) / 2 / a0;
      this.b1 = (1 - cos) / a0;
      this.b2 = this.b0;
    } else if (this.type === "hp") {
      this.b0 = (1 + cos) / 2 / a0;
      this.b1 = -(1 + cos) / a0;
      this.b2 = this.b0;
    } else {
      this.b0 = alpha / a0;
      this.b1 = 0;
      this.b2 = -alpha / a0;
    }
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
  }
  run(x: number) {
    const y =
      this.b0 * x +
      this.b1 * this.x1 +
      this.b2 * this.x2 -
      this.a1 * this.y1 -
      this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

/** Smooth random curve in [0, 1] with a new knot every `period` s. */
function smoothRandom(r: Rand, seconds: number, period: number) {
  const knots = Array.from({ length: Math.ceil(seconds / period) + 2 }, () =>
    r(),
  );
  return (t: number) => {
    const p = t / period;
    const i = Math.floor(p);
    const f = p - i;
    const k = (1 - Math.cos(f * Math.PI)) / 2;
    return knots[i] * (1 - k) + knots[i + 1] * k;
  };
}

function brown(r: Rand) {
  let v = 0;
  return () => {
    v = (v + (r() * 2 - 1) * 0.02) * 0.998;
    return v * 6;
  };
}

/** Small Schroeder reverb for a bit of room or air. */
function reverb(input: Float32Array, mix: number, size = 1): Float32Array {
  const combs = [1557, 1617, 1491, 1422].map((d) => ({
    buf: new Float32Array(Math.round(d * size)),
    i: 0,
  }));
  const aps = [225, 556].map((d) => ({ buf: new Float32Array(d), i: 0 }));
  const out = new Float32Array(input.length);
  for (let n = 0; n < input.length; n++) {
    let wet = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.buf[c.i] = input[n] + y * 0.78;
      c.i = (c.i + 1) % c.buf.length;
      wet += y;
    }
    wet /= 4;
    for (const a of aps) {
      const y = a.buf[a.i];
      a.buf[a.i] = wet + y * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      wet = y - wet * 0.5;
    }
    out[n] = input[n] * (1 - mix) + wet * mix;
  }
  return out;
}

const env = (t: number, attack: number, decay: number) =>
  t < 0 ? 0 : t < attack ? t / attack : Math.exp(-(t - attack) / decay);

function buffer(seconds: number) {
  return new Float32Array(Math.round(seconds * SR));
}

/** Make a loop seamless: render loop + tail, then fold the tail into the head. */
function loopFold(raw: Float32Array, loopSec: number, xSec: number) {
  const L = Math.round(loopSec * SR);
  const X = Math.round(xSec * SR);
  const out = raw.slice(0, L);
  for (let i = 0; i < X; i++) {
    const t = (i / X) * (Math.PI / 2);
    out[i] = raw[i] * Math.sin(t) + raw[L + i] * Math.cos(t);
  }
  return out;
}

// ---------- sound recipes ----------

type Stereo = [Float32Array, Float32Array];
type Recipe = {
  kind: "ambient" | "ui";
  rmsDb: number;
  peakDb: number;
  make: () => Float32Array | Stereo;
};

const LOOP = 24;
const XF = 2;
const LEN = LOOP + XF;

function ambient(make: (r: Rand, ch: number) => Float32Array, seed: number) {
  return (): Stereo => {
    const [l, r] = [0, 1].map((ch) =>
      loopFold(make(rng(seed + ch * 7919), ch), LOOP, XF),
    );
    return [l, r];
  };
}

function wind(r: Rand, cutLo: number, cutSpan: number, shared: Rand) {
  const out = buffer(LEN);
  const b = brown(r);
  const lp = new Biquad("lp", cutLo);
  const gust = smoothRandom(shared, LEN, 4.5);
  const flutter = smoothRandom(r, LEN, 0.7);
  for (let n = 0; n < out.length; n++) {
    const t = n / SR;
    const g = gust(t);
    if (n % 32 === 0) lp.set(cutLo + cutSpan * g * (0.7 + 0.3 * flutter(t)));
    out[n] = lp.run(b()) * (0.35 + 0.65 * g);
  }
  return out;
}

const recipes: Record<string, Recipe> = {
  "ambient/island-wind": {
    kind: "ambient",
    rmsDb: -24,
    peakDb: -4,
    make: ambient((r) => wind(r, 260, 700, rng(11)), 10),
  },
  "ambient/island-winter-wind": {
    kind: "ambient",
    rmsDb: -24,
    peakDb: -4,
    make: ambient((r) => {
      const out = buffer(LEN);
      const shared = rng(21);
      const howl = smoothRandom(shared, LEN, 2.2);
      const gust = smoothRandom(shared, LEN, 5);
      const bp1 = new Biquad("bp", 400, 9);
      const bp2 = new Biquad("bp", 640, 7);
      const rumble = new Biquad("lp", 140);
      const b = brown(r);
      for (let n = 0; n < out.length; n++) {
        const t = n / SR;
        const h = howl(t);
        if (n % 32 === 0) {
          bp1.set(280 + 380 * h, 9);
          bp2.set((280 + 380 * h) * 1.6, 7);
        }
        const w = r() * 2 - 1;
        const g = 0.3 + 0.7 * gust(t);
        out[n] =
          (bp1.run(w) * 1.4 + bp2.run(w) * 0.6) * g + rumble.run(b()) * 0.5;
      }
      return out;
    }, 20),
  },
  "ambient/island-birds": {
    kind: "ambient",
    rmsDb: -36,
    peakDb: -10,
    make: () => {
      const r = rng(31);
      const L = buffer(LEN);
      const R = buffer(LEN);
      const chirp = (
        start: number,
        dur: number,
        f0: number,
        f1: number,
        amp: number,
        pan: number,
      ) => {
        let ph = 0;
        const n0 = Math.round(start * SR);
        const len = Math.round(dur * SR);
        for (let i = 0; i < len && n0 + i < L.length; i++) {
          const x = i / len;
          const f = f0 + (f1 - f0) * Math.sin((x * Math.PI) / 2);
          ph += (TAU * f) / SR;
          const a = Math.sin(Math.PI * x) ** 1.5 * amp;
          const s = (Math.sin(ph) + 0.15 * Math.sin(2 * ph)) * a;
          L[n0 + i] += s * (1 - pan);
          R[n0 + i] += s * pan;
        }
      };
      let t = 0.3;
      while (t < LEN - 1.5) {
        const pan = 0.15 + r() * 0.7;
        const amp = 0.3 + r() * 0.7;
        const kind = r();
        if (kind < 0.4) {
          // Short chirps.
          const notes = 2 + Math.floor(r() * 4);
          const base = 2600 + r() * 1400;
          for (let k = 0; k < notes; k++)
            chirp(
              t + k * (0.09 + r() * 0.05),
              0.06,
              base,
              base + 900,
              amp,
              pan,
            );
        } else if (kind < 0.7) {
          // Falling whistle, twice.
          const base = 2200 + r() * 800;
          chirp(t, 0.32, base + 900, base, amp * 0.8, pan);
          chirp(t + 0.45, 0.28, base + 700, base - 100, amp * 0.7, pan);
        } else {
          // Fast trill.
          const base = 3600 + r() * 1200;
          for (let k = 0; k < 10; k++)
            chirp(t + k * 0.035, 0.03, base, base - 400, amp * 0.6, pan);
        }
        t += 0.9 + r() * 2.2;
      }
      return [
        loopFold(reverb(L, 0.25), LOOP, XF),
        loopFold(reverb(R, 0.25), LOOP, XF),
      ];
    },
  },
  "ambient/island-insects": {
    kind: "ambient",
    rmsDb: -34,
    peakDb: -12,
    make: () => {
      const r = rng(41);
      const L = buffer(LEN);
      const R = buffer(LEN);
      for (let v = 0; v < 4; v++) {
        const f = 3900 + r() * 900;
        const every = 0.45 + r() * 0.35;
        const pan = 0.1 + r() * 0.8;
        const amp = 0.3 + r() * 0.5;
        let t = r() * every;
        while (t < LEN) {
          for (let p = 0; p < 3; p++) {
            const n0 = Math.round((t + p * 0.03) * SR);
            const len = Math.round(0.016 * SR);
            for (let i = 0; i < len && n0 + i < L.length; i++) {
              const s =
                Math.sin((TAU * f * i) / SR) *
                Math.sin((Math.PI * i) / len) *
                amp;
              L[n0 + i] += s * (1 - pan);
              R[n0 + i] += s * pan;
            }
          }
          t += every * (0.95 + r() * 0.1);
        }
      }
      return [
        loopFold(reverb(L, 0.2), LOOP, XF),
        loopFold(reverb(R, 0.2), LOOP, XF),
      ];
    },
  },
  "ambient/island-leaves": {
    kind: "ambient",
    rmsDb: -30,
    peakDb: -8,
    make: ambient((r) => {
      const out = buffer(LEN);
      const gust = smoothRandom(rng(51), LEN, 3);
      const bp = new Biquad("bp", 3200, 0.6);
      const hp = new Biquad("hp", 1500);
      let crackle = 0;
      for (let n = 0; n < out.length; n++) {
        const t = n / SR;
        const g = Math.max(0, gust(t) - 0.25) / 0.75;
        if (r() < (40 + 120 * g) / SR) crackle = 0.5 + r();
        crackle *= 0.997;
        const w = r() * 2 - 1;
        out[n] = hp.run(bp.run(w) * (0.15 + 0.5 * g + crackle * g));
      }
      return out;
    }, 50),
  },
  "ambient/island-water": {
    kind: "ambient",
    rmsDb: -27,
    peakDb: -6,
    make: ambient((r) => {
      const out = buffer(LEN);
      const lp = new Biquad("lp", 600);
      const drop = new Biquad("bp", 1400, 12);
      const swells: number[] = [];
      const sr = rng(61);
      for (let t = 0; t < LEN; t += 2.4 + sr() * 1.6) swells.push(t);
      let dropAmp = 0;
      for (let n = 0; n < out.length; n++) {
        const t = n / SR;
        let s = 0.15;
        for (const t0 of swells) s += env(t - t0, 0.5, 0.9) * 0.85;
        if (n % 32 === 0) lp.set(380 + 500 * Math.min(1, s));
        if (r() < 0.6 / SR) dropAmp = 0.6;
        dropAmp *= 0.9993;
        const w = r() * 2 - 1;
        out[n] = lp.run(w) * s + drop.run(w) * dropAmp * 3;
      }
      return out;
    }, 60),
  },
  "ambient/interior-hearth": {
    kind: "ambient",
    rmsDb: -26,
    peakDb: -5,
    make: ambient((r) => {
      const out = buffer(LEN);
      const b = brown(r);
      const rumble = new Biquad("lp", 180);
      const hiss = new Biquad("hp", 4500);
      const click = new Biquad("hp", 1800);
      const pop = new Biquad("bp", 900, 4);
      const flicker = smoothRandom(rng(71), LEN, 0.8);
      let c = 0;
      let p = 0;
      for (let n = 0; n < out.length; n++) {
        const t = n / SR;
        const f = flicker(t);
        if (r() < 9 / SR) c = (0.2 + r() ** 3) * 1.5;
        if (r() < 0.5 / SR) p = 0.8 + r() * 0.6;
        const w = r() * 2 - 1;
        out[n] =
          rumble.run(b()) * (0.6 + 0.4 * f) +
          hiss.run(w) * 0.05 * f +
          click.run(w * c) * 0.9 +
          pop.run(w * p) * 1.4;
        c *= 0.992;
        p *= 0.9975;
      }
      return out;
    }, 70),
  },
  "ambient/interior-wind": {
    kind: "ambient",
    rmsDb: -27,
    peakDb: -6,
    make: ambient((r) => wind(r, 120, 200, rng(81)), 80),
  },

  // ---------- UI ----------
  "ui/hover": {
    kind: "ui",
    rmsDb: -30,
    peakDb: -6,
    make: () => {
      const out = buffer(0.08);
      for (let n = 0; n < out.length; n++) {
        const t = n / SR;
        out[n] =
          (Math.sin(TAU * 1760 * t) + 0.3 * Math.sin(TAU * 3520 * t)) *
          env(t, 0.003, 0.018);
      }
      return out;
    },
  },
  "ui/select": { kind: "ui", rmsDb: -20, peakDb: -3, make: () => knock(520) },
  "ui/back": { kind: "ui", rmsDb: -20, peakDb: -3, make: () => knock(380) },
  "ui/pick-up": {
    kind: "ui",
    rmsDb: -24,
    peakDb: -4,
    make: () => swish(0.22, 700, 2600, 92),
  },
  "ui/put-down": {
    kind: "ui",
    rmsDb: -20,
    peakDb: -3,
    make: () => mixAt(swish(0.14, 2200, 800, 93), knock(300, 0.6), 0.1),
  },
  "ui/card-flip": {
    kind: "ui",
    rmsDb: -22,
    peakDb: -3,
    make: () => mixAt(swish(0.18, 1200, 4200, 94), snap(95), 0.15),
  },
  "ui/page": {
    kind: "ui",
    rmsDb: -24,
    peakDb: -4,
    make: () => {
      const r = rng(96);
      let out = buffer(0.5);
      for (let k = 0; k < 5; k++)
        out = mixAt(
          out,
          swish(0.08 + r() * 0.06, 1500, 3500 + r() * 1500, 97 + k),
          0.04 + k * 0.07 + r() * 0.03,
        );
      return out;
    },
  },
  "ui/book-close": {
    kind: "ui",
    rmsDb: -18,
    peakDb: -3,
    make: () => mixAt(swish(0.12, 3000, 1200, 103), thump(110, 0.25), 0.08),
  },
  "ui/stamp": {
    kind: "ui",
    rmsDb: -16,
    peakDb: -2,
    make: () => {
      const r = rng(104);
      const out = mixAt(thump(95, 0.35), snap(105), 0);
      const lp = new Biquad("lp", 900);
      for (let n = 0; n < out.length; n++) {
        const t = n / SR;
        out[n] += lp.run(r() * 2 - 1) * env(t, 0.002, 0.04) * 0.8;
      }
      return out;
    },
  },
  "ui/weave-step": {
    kind: "ui",
    rmsDb: -22,
    peakDb: -4,
    make: () => mixAt(swish(0.09, 1800, 3000, 106), knock(700, 0.35), 0.06),
  },
  "ui/hotspot": {
    kind: "ui",
    rmsDb: -24,
    peakDb: -5,
    make: () => reverb(bell([1568, 2352], 0.6), 0.2),
  },
  "ui/complete": {
    kind: "ui",
    rmsDb: -20,
    peakDb: -4,
    make: () => {
      let out = buffer(1.6);
      [1046.5, 1318.5, 1568].forEach((f, i) => {
        out = mixAt(out, bell([f, f * 2.01], 1), i * 0.13);
      });
      return reverb(out, 0.25);
    },
  },
  "ui/season": {
    kind: "ui",
    rmsDb: -24,
    peakDb: -5,
    make: () =>
      reverb(
        mixAt(swish(0.9, 400, 1800, 107), bell([1318.5, 1975.5], 1.2), 0.25),
        0.3,
        1.2,
      ),
  },
  "ui/owl-hoot": {
    kind: "ui",
    rmsDb: -20,
    peakDb: -3,
    make: () => {
      const r = rng(108);
      const out = buffer(1.6);
      const breath = new Biquad("lp", 700);
      const hoot = (start: number, dur: number, f: number) => {
        let ph = 0;
        const n0 = Math.round(start * SR);
        for (let i = 0; i < dur * SR; i++) {
          const x = i / (dur * SR);
          const freq =
            f * (1.04 - 0.08 * x) * (1 + 0.01 * Math.sin(TAU * 6 * x * dur));
          ph += (TAU * freq) / SR;
          const a =
            Math.sin(Math.PI * Math.min(1, x * 1.6)) ** 0.8 * (1 - x) ** 0.4;
          out[n0 + i] +=
            (Math.sin(ph) +
              0.12 * Math.sin(2 * ph) +
              breath.run(r() * 2 - 1) * 0.25) *
            a;
        }
      };
      hoot(0.02, 0.28, 360);
      hoot(0.5, 0.5, 340);
      return reverb(out, 0.3, 1.3);
    },
  },
  "ui/owl-takeoff": {
    kind: "ui",
    rmsDb: -20,
    peakDb: -3,
    make: () => {
      let out = buffer(0.9);
      for (let k = 0; k < 4; k++) {
        const flap = swish(0.14, 300, 900, 110 + k);
        out = mixAt(
          out,
          flap.map((v) => v * (1 - k * 0.2)),
          k * 0.16,
        );
      }
      return out;
    },
  },
  "ui/scene-enter": {
    kind: "ui",
    rmsDb: -22,
    peakDb: -4,
    make: () =>
      mixAt(reverb(swish(1, 200, 900, 115), 0.3), knock(220, 0.5), 0.85),
  },
};

function knock(f: number, gain = 1) {
  const r = rng(Math.round(f));
  const out = buffer(0.18);
  const hp = new Biquad("hp", 2000);
  for (let n = 0; n < out.length; n++) {
    const t = n / SR;
    out[n] =
      (Math.sin(TAU * f * t) * env(t, 0.001, 0.035) +
        0.5 * Math.sin(TAU * f * 2.37 * t) * env(t, 0.001, 0.015) +
        hp.run(r() * 2 - 1) * env(t, 0.0005, 0.004) * 0.6) *
      gain;
  }
  return out;
}

function thump(f: number, dur: number) {
  const out = buffer(dur);
  let ph = 0;
  for (let n = 0; n < out.length; n++) {
    const t = n / SR;
    ph += (TAU * f * (1 + 1.5 * Math.exp(-t / 0.02))) / SR;
    out[n] = Math.sin(ph) * env(t, 0.002, dur / 4);
  }
  return out;
}

function snap(seed: number) {
  const r = rng(seed);
  const out = buffer(0.05);
  const bp = new Biquad("bp", 2500, 1.5);
  for (let n = 0; n < out.length; n++)
    out[n] = bp.run(r() * 2 - 1) * env(n / SR, 0.0005, 0.008) * 2;
  return out;
}

function swish(dur: number, f0: number, f1: number, seed: number) {
  const r = rng(seed);
  const out = buffer(dur);
  const bp = new Biquad("bp", f0, 1.2);
  for (let n = 0; n < out.length; n++) {
    const x = n / out.length;
    if (n % 16 === 0) bp.set(f0 * (f1 / f0) ** x, 1.2);
    out[n] = bp.run(r() * 2 - 1) * Math.sin(Math.PI * x) ** 2;
  }
  return out;
}

function bell(freqs: number[], dur: number) {
  const out = buffer(dur);
  for (let n = 0; n < out.length; n++) {
    const t = n / SR;
    let s = 0;
    freqs.forEach((f, i) => {
      s += (Math.sin(TAU * f * t) * env(t, 0.002, dur / (3 + i * 2))) / (1 + i);
    });
    out[n] = s;
  }
  return out;
}

function mixAt(a: Float32Array, b: Float32Array, atSec: number) {
  const off = Math.round(atSec * SR);
  const out = new Float32Array(Math.max(a.length, off + b.length));
  out.set(a);
  for (let i = 0; i < b.length; i++) out[off + i] += b[i];
  return out;
}

// ---------- output ----------

function normalise(chs: Float32Array[], rmsDb: number, peakDb: number) {
  let peak = 0;
  let sum = 0;
  let count = 0;
  for (const c of chs)
    for (const v of c) {
      peak = Math.max(peak, Math.abs(v));
      sum += v * v;
      count++;
    }
  const rms = Math.sqrt(sum / count) || 1e-9;
  const g = Math.min(
    10 ** (rmsDb / 20) / rms,
    10 ** (peakDb / 20) / (peak || 1e-9),
  );
  for (const c of chs) for (let i = 0; i < c.length; i++) c[i] *= g;
}

function wav(chs: Float32Array[]): Buffer {
  const n = chs[0].length;
  const buf = Buffer.alloc(44 + n * chs.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * chs.length * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(chs.length, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * chs.length * 2, 28);
  buf.writeUInt16LE(chs.length * 2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * chs.length * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++)
    for (const c of chs) {
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, c[i])) * 32767), o);
      o += 2;
    }
  return buf;
}

function main() {
  const only = process.argv.slice(2);
  const tmp = join(tmpdir(), `lh-audio-${process.pid}`);
  mkdirSync(tmp, { recursive: true });
  for (const [name, recipe] of Object.entries(recipes)) {
    if (only.length && !only.some((o) => name.endsWith(o))) continue;
    const made = recipe.make();
    const chs = made instanceof Float32Array ? [made] : made;
    if (recipe.kind === "ui") {
      // 5 ms fade-out so no click at the end.
      const f = Math.round(0.005 * SR);
      for (const c of chs)
        for (let i = 0; i < f; i++) c[c.length - 1 - i] *= i / f;
    }
    normalise(chs, recipe.rmsDb, recipe.peakDb);
    const src = join(tmp, `${name.replace("/", "-")}.wav`);
    writeFileSync(src, wav(chs));
    const dest = join(OUT, name);
    mkdirSync(join(dest, ".."), { recursive: true });
    const q = recipe.kind === "ambient" ? ["3", "96k"] : ["4", "128k"];
    const ff = ["-hide_banner", "-loglevel", "error", "-y", "-i", src];
    execFileSync("ffmpeg", [
      ...ff,
      "-c:a",
      "libvorbis",
      "-q:a",
      q[0],
      `${dest}.ogg`,
    ]);
    execFileSync("ffmpeg", [...ff, "-c:a", "aac", "-b:a", q[1], `${dest}.m4a`]);
    console.log(`made ${name}`);
  }
  rmSync(tmp, { recursive: true, force: true });
}

main();
