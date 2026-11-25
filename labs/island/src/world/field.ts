// Real Hokkaido heightfield (baked by scripts/bake-terrain.mjs) and world-space helpers.
export type Meta = {
  width: number; height: number; maxElevation: number;
  bbox: { w: number; e: number; s: number; n: number }; zoom: number;
};
export type Field = {
  meta: Meta; w: number; h: number; elev: Float32Array; coastDist: Float32Array;
  size: number; depth: number;
  /** elevation in metres at world x/z (bilinear) */
  elevAt(x: number, z: number): number;
  /** world Y of the ground surface at x/z */
  groundY(x: number, z: number): number;
  toWorld(lon: number, lat: number): [number, number];
};

export const WORLD_SIZE = 40; // island width in world units
export const EXAG = 2.7; // vertical scale at the highest peak

export function heightFromElev(e: number, terrace = 0): number {
  if (e <= 0) return -0.45 + Math.max(e, -400) / 400 * 0.35;
  const q = terrace > 0 ? Math.ceil(e / terrace) * terrace : e;
  return 0.3 + (Math.min(q, 2300) / 2300) ** 0.8 * EXAG;
}

const cache = new Map<number, Promise<Field>>();
export function loadField(res = 512): Promise<Field> {
  let p = cache.get(res);
  if (!p) {
    p = (async () => {
      const [meta, buf] = await Promise.all([
        fetch(`/data/hokkaido-${res}.json`).then((r) => r.json() as Promise<Meta>),
        fetch(`/data/hokkaido-${res}.bin`).then((r) => r.arrayBuffer()),
      ]);
      return makeField(meta, new Int16Array(buf));
    })();
    cache.set(res, p);
  }
  return p;
}

function makeField(meta: Meta, raw: Int16Array): Field {
  const { width: w, height: h } = meta;
  const elev = Float32Array.from(raw);
  // soften ridges: one 3x3 blur on land cells (keeps the coastline exact)
  const src = Float32Array.from(elev);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (src[i] <= 0) continue;
      let s = 0, c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const v = src[i + dy * w + dx]; if (v > 0) { s += v; c++; } }
      elev[i] = s / c;
    }
  const size = WORLD_SIZE;
  const depth = (WORLD_SIZE * h) / w;
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
  const { bbox, zoom } = meta;
  const lon2x = (lon: number) => ((lon + 180) / 360) * 2 ** zoom * 256;
  const lat2y = (lat: number) => {
    const r = (lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** zoom * 256;
  };
  const X0 = Math.floor(lon2x(bbox.w)), X1 = Math.ceil(lon2x(bbox.e));
  const Y0 = Math.floor(lat2y(bbox.n)), Y1 = Math.ceil(lat2y(bbox.s));
  return {
    meta, w, h, elev, coastDist, size, depth, elevAt,
    groundY: (x, z) => heightFromElev(elevAt(x, z)),
    toWorld: (lon, lat) => [((lon2x(lon) - X0) / (X1 - X0) - 0.5) * size, ((lat2y(lat) - Y0) / (Y1 - Y0) - 0.5) * depth],
  };
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

/** Flatten a gentle pad around each site so props sit on level ground (mutates once). */
const padded = new WeakSet<Field>();
export function flattenPads(f: Field, pads: { x: number; z: number; r: number }[]) {
  if (padded.has(f)) return;
  padded.add(f);
  for (const p of pads) {
    const target = Math.max(20, f.elevAt(p.x, p.z));
    const ci = (p.x / f.size + 0.5) * (f.w - 1), cj = (p.z / f.depth + 0.5) * (f.h - 1);
    const rc = (p.r * 1.8 / f.size) * (f.w - 1);
    for (let j = Math.floor(cj - rc); j <= Math.ceil(cj + rc); j++)
      for (let i = Math.floor(ci - rc); i <= Math.ceil(ci + rc); i++) {
        if (i < 0 || j < 0 || i >= f.w || j >= f.h) continue;
        const d = Math.hypot(i - ci, j - cj) / rc;
        if (d >= 1) continue;
        const k = j * f.w + i, t = d < 0.55 ? 1 : 1 - (d - 0.55) / 0.45;
        if (f.elev[k] > 0) f.elev[k] += (target - f.elev[k]) * t * t * (3 - 2 * t);
      }
  }
}
