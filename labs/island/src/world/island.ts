// The showcase island, authored in code. It is not a map of a real place.
// Each feature exists to show something: the peak shows the snow line, the lake
// holds the lake house, the river valley leads to a village, the north coast
// collects drift ice, the hill carries the lavender field.
import { fbm, vnoise } from "./field";

const segDist = (px: number, pz: number, ax: number, az: number, bx: number, bz: number) => {
  const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)));
  return { d: Math.hypot(px - ax - vx * t, pz - az - vz * t), t };
};
const ell = (x: number, z: number, cx: number, cz: number, rx: number, rz: number, rot = 0) => {
  const c = Math.cos(rot), s = Math.sin(rot), dx = x - cx, dz = z - cz;
  const u = (dx * c + dz * s) / rx, v = (-dx * s + dz * c) / rz;
  return 1 - Math.hypot(u, v); // > 0 inside
};
const sstep = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const SITES = {
  lake: { x: -2.75, z: 1.55 },
  forest: { x: 4.3, z: -0.7 },
  river: { x: 1.1, z: 4.5 },
  coast: { x: 8.4, z: -4.4 },
  perch: { x: -0.7, z: 1.9 },
  lavender: { x: -3.2, z: 4.6 },
};
export const LAKE = { x: -4.3, z: 1.1, r: 1.35 };
export const LAKE_LEVEL = 26;
export const RIVER: [number, number][] = [[0.2, -0.6], [1.0, 1.4], [1.9, 3.2], [2.3, 5.0], [3.0, 7.2]];

export const ISLAND = {
  size: 26,
  depth: 22,
  cells: 320,
  pads: [
    { ...SITES.lake, r: 0.9 }, { ...SITES.forest, r: 1.1 }, { ...SITES.river, r: 1.0 },
    { ...SITES.coast, r: 0.8 }, { ...SITES.perch, r: 0.5 }, { ...SITES.lavender, r: 1.0 },
  ],
  elevation(x: number, z: number): number {
    // coastline: a few overlapping lobes with a noisy edge, and a southern bay
    let land = Math.max(
      ell(x, z, 0, -0.3, 8.6, 6.2),
      ell(x, z, 6.6, -3.6, 3.4, 1.5, -0.45),
      ell(x, z, -7.6, 3.8, 3.3, 2.0, 0.55),
      ell(x, z, -1.5, -4.2, 4.5, 2.6, 0.2),
    );
    land -= Math.max(0, ell(x, z, 3.1, 7.4, 2.0, 1.7)) * 1.6;
    land += (fbm(x * 0.45 + 11, z * 0.45 - 4) - 0.5) * 0.28;
    if (land <= 0) return -40 + land * 600;
    const inland = sstep(0, 0.35, land);
    let e = 25 + 260 * inland;
    // peak + ridge running east
    const pd = Math.hypot(x + 1.2, z + 2.6);
    const ridged = 1 - Math.abs(2 * vnoise(x * 1.6 + 5, z * 1.6) - 1);
    e += 1900 * Math.exp(-((pd / 1.9) ** 1.5)) * (0.8 + 0.35 * ridged);
    const r = segDist(x, z, -1.2, -2.6, 5.4, -2.9);
    e += 820 * Math.exp(-((r.d / 1.1) ** 2)) * (1 - r.t * 0.6) * inland;
    // rolling hills
    e += (fbm(x * 0.32, z * 0.32) - 0.35) * 420 * inland;
    // lake: basin with a gentle rim
    const ld = Math.hypot(x - LAKE.x, z - LAKE.z) / LAKE.r;
    if (ld < 1) return LAKE_LEVEL - 25 * (1 - ld); // lake bed under the lake surface
    e = e * sstep(1, 2.0, ld) + (LAKE_LEVEL + 12 + 40 * (ld - 1)) * (1 - sstep(1, 2.0, ld));
    // river valley and channel
    let rd = 99, rt = 0;
    for (let k = 0; k < RIVER.length - 1; k++) {
      const s = segDist(x, z, ...RIVER[k], ...RIVER[k + 1]);
      if (s.d < rd) { rd = s.d; rt = (k + s.t) / (RIVER.length - 1); }
    }
    const valley = Math.exp(-((rd / (0.7 + rt * 0.9)) ** 2)) * sstep(0, 0.15, rt);
    e = e * (1 - valley * 0.85) + 32 * valley * 0.85;
    if (rt > 0.12) e -= 18 * Math.exp(-((rd / (0.1 + rt * 0.12)) ** 2)); // shallow channel under the river ribbon
    return Math.max(4, e);
  },
};
