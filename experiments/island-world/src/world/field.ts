// Field = the island heightfield plus helpers. The island itself is authored in
// island.ts; this file only samples it and derives coast distance.
import { ISLAND } from "./island";

export type Field = {
  w: number; h: number; elev: Float32Array; coastDist: Float32Array;
  size: number; depth: number;
  /** elevation in metres at world x/z (bilinear) */
  elevAt(x: number, z: number): number;
  /** world Y of the ground surface at x/z */
  groundY(x: number, z: number): number;
};

export const EXAG = 3.0; // world units at 2300 m

export function heightFromElev(e: number, terrace = 0): number {
  if (e <= 0) return -0.45 + Math.max(e, -400) / 400 * 0.35;
  const q = terrace > 0 ? Math.ceil(e / terrace) * terrace : e;
  return 0.3 + (Math.min(q, 2300) / 2300) ** 0.85 * EXAG;
}

let cached: Field | null = null;
export function buildField(): Field {
  if (cached) return cached;
  const { size, depth, cells } = ISLAND;
  const w = cells, h = Math.round((cells * depth) / size);
  const elev = new Float32Array(w * h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) elev[j * w + i] = ISLAND.elevation((i / (w - 1) - 0.5) * size, (j / (h - 1) - 0.5) * depth);
  for (const p of ISLAND.pads) flattenPad(w, h, elev, size, depth, p);
  // distance (in cells) from each sea cell to the nearest land cell: two-pass chamfer
  const coastDist = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) coastDist[i] = elev[i] > 0 ? 0 : 1e9;
  const pass = (fwd: boolean) => {
    for (let k = 0; k < w * h; k++) {
      const i = fwd ? k : w * h - 1 - k, x = i % w, y = (i / w) | 0;
      const nb = fwd ? [[-1, 0, 1], [0, -1, 1], [-1, -1, 1.414], [1, -1, 1.414]] : [[1, 0, 1], [0, 1, 1], [1, 1, 1.414], [-1, 1, 1.414]];
      for (const [dx, dy, c] of nb) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const v = coastDist[yy * w + xx] + c;
        if (v < coastDist[i]) coastDist[i] = v;
      }
    }
  };
  pass(true); pass(false);
  const elevAt = (x: number, z: number) => {
    const fx = Math.min(w - 1.001, Math.max(0, (x / size + 0.5) * (w - 1)));
    const fz = Math.min(h - 1.001, Math.max(0, (z / depth + 0.5) * (h - 1)));
    const x0 = fx | 0, z0 = fz | 0, tx = fx - x0, tz = fz - z0;
    const a = elev[z0 * w + x0], b = elev[z0 * w + x0 + 1], c = elev[(z0 + 1) * w + x0], d = elev[(z0 + 1) * w + x0 + 1];
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  };
  cached = { w, h, elev, coastDist, size, depth, elevAt, groundY: (x, z) => heightFromElev(elevAt(x, z)) };
  return cached;
}

/** Level a pad so a house or field sits flat; smooth edge. */
function flattenPad(w: number, h: number, elev: Float32Array, size: number, depth: number, p: { x: number; z: number; r: number }) {
  const ci = (p.x / size + 0.5) * (w - 1), cj = (p.z / depth + 0.5) * (h - 1);
  const target = Math.max(25, elev[Math.round(cj) * w + Math.round(ci)]);
  const rc = ((p.r * 1.8) / size) * (w - 1);
  for (let j = Math.floor(cj - rc); j <= Math.ceil(cj + rc); j++)
    for (let i = Math.floor(ci - rc); i <= Math.ceil(ci + rc); i++) {
      if (i < 0 || j < 0 || i >= w || j >= h) continue;
      const d = Math.hypot(i - ci, j - cj) / rc;
      if (d >= 1) continue;
      const k = j * w + i, t = d < 0.55 ? 1 : 1 - (d - 0.55) / 0.45;
      if (elev[k] > 0) elev[k] += (target - elev[k]) * t * t * (3 - 2 * t);
    }
}

/** deterministic PRNG */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** cheap 2D value noise for placement (CPU) */
export function vnoise(x: number, y: number) {
  const h = (i: number, j: number) => {
    const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v;
}
export const fbm = (x: number, y: number) => vnoise(x, y) * 0.55 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.15;

