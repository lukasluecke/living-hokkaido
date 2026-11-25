// The showcase island, authored in code. NOT a map of a real place.
// Shaped around the content pack's locations (src/content/*/island.ts), in
// island units (du, src/contracts/space.ts). Each feature has one job: the
// peak shows the snow line, the lake sits behind the lake house, the river
// runs to the south coast, the north coast collects drift ice, the west hill
// carries the lavender rows. Elevation is in "metres" so shader thresholds
// (snow line, tree line) stay readable; heightFromElev() maps it to du.
import { type Island, ISLAND as SPACE } from "@/contracts";
import { fbm, vnoise } from "./field";

const segDist = (
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
) => {
  const vx = bx - ax,
    vz = bz - az,
    t = Math.max(
      0,
      Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz)),
    );
  return { d: Math.hypot(px - ax - vx * t, pz - az - vz * t), t };
};
const ell = (
  x: number,
  z: number,
  cx: number,
  cz: number,
  rx: number,
  rz: number,
  rot = 0,
) => {
  const c = Math.cos(rot),
    s = Math.sin(rot),
    dx = x - cx,
    dz = z - cz;
  const u = (dx * c + dz * s) / rx,
    v = (-dx * s + dz * c) / rz;
  return 1 - Math.hypot(u, v); // > 0 inside
};
const sstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Feature length scale: features were designed at 1/K size, then scaled into du. */
const K = 2.3;

const at = (v: readonly number[]) => ({ x: v[0], z: v[2] });

export const PEAK = { x: 2, z: -13 };
export const LAKE = { x: 0.6, z: -2.4, r: 2.6 };
export const LAKE_LEVEL = 26;
export const RIVER: [number, number][] = [
  [-0.6, 0.2],
  [-0.2, 4.5],
  [1.6, 9.5],
  [2.6, 14],
  [3.4, 21],
];
export const FLOWER_FIELD = { x: -14, z: 6 };

/**
 * Themed areas (world/Areas.tsx): toy scenes after Hokkaido Museum dioramas.
 * Island-authored scenery like the flower field, not content-pack places.
 * ry turns the scene (0 = its front faces the overview camera, +z); s scales
 * it; r is the tree-free clearing and level pad around it (du).
 */
export type Area = {
  id: "coast" | "forest" | "hills" | "mountains";
  x: number;
  z: number;
  ry: number;
  s: number;
  r: number;
};
export const AREAS: Area[] = [
  { id: "coast", x: 12, z: 11.2, ry: 0.1, s: 1.25, r: 2.4 },
  { id: "forest", x: -16, z: -1, ry: 0.35, s: 1.35, r: 2.1 },
  { id: "hills", x: 19, z: 0, ry: -0.3, s: 1.4, r: 1.9 },
  { id: "mountains", x: -5, z: -12.6, ry: 0.15, s: 1.35, r: 2.4 },
];

export const ISLAND = {
  size: 64,
  depth: 56,
  cells: 360,
  pads(island: Island) {
    return [
      ...island.locations.map((l) => ({ ...at(l.anchor), r: SPACE.padRadius })),
      { ...at(island.owlHome), r: SPACE.padRadius * 0.6 },
      { ...FLOWER_FIELD, r: 2.2 },
      ...AREAS.map((a) => ({ x: a.x, z: a.z, r: a.r * 0.75 })),
    ];
  },
  elevation(x: number, z: number): number {
    // coastline: overlapping lobes with a noisy edge
    let land = Math.max(
      ell(x, z, 0, -0.5, 22, 17),
      ell(x, z, 17, -9.5, 8.5, 3.8, -0.45),
      ell(x, z, -18, 7.5, 8, 5, 0.55),
      ell(x, z, -3, -11, 11, 6.5, 0.2),
    );
    land += (fbm(x * 0.2 + 11, z * 0.2 - 4) - 0.5) * 0.26;
    if (land <= 0) return -40 + land * 600;
    const inland = sstep(0, 0.32, land);
    let e = 25 + 240 * inland;
    // peak + ridge running east
    const pd = Math.hypot(x - PEAK.x, z - PEAK.z);
    const ridged = 1 - Math.abs(2 * vnoise(x * 0.7 + 5, z * 0.7) - 1);
    e += 1900 * Math.exp(-((pd / (1.9 * K)) ** 1.5)) * (0.8 + 0.35 * ridged);
    const r = segDist(x, z, PEAK.x, PEAK.z, 15, -12);
    e += 780 * Math.exp(-((r.d / (1.1 * K)) ** 2)) * (1 - r.t * 0.6) * inland;
    // rolling hills
    e += (fbm(x * 0.14, z * 0.14) - 0.35) * 420 * inland;
    // lake basin with a gentle rim
    const ld = Math.hypot(x - LAKE.x, z - LAKE.z) / LAKE.r;
    if (ld < 1) return LAKE_LEVEL - 25 * (1 - ld);
    e =
      e * sstep(1, 2.0, ld) +
      (LAKE_LEVEL + 12 + 40 * (ld - 1)) * (1 - sstep(1, 2.0, ld));
    // river valley and a shallow channel under the river ribbon
    let rd = 99,
      rt = 0;
    for (let k = 0; k < RIVER.length - 1; k++) {
      const s = segDist(x, z, ...RIVER[k], ...RIVER[k + 1]);
      if (s.d < rd) {
        rd = s.d;
        rt = (k + s.t) / (RIVER.length - 1);
      }
    }
    const valley = Math.exp(-((rd / ((0.6 + rt * 0.8) * K)) ** 2));
    e = e * (1 - valley * 0.8) + 32 * valley * 0.8;
    if (rt > 0.02) e -= 18 * Math.exp(-((rd / ((0.1 + rt * 0.12) * K)) ** 2));
    return Math.max(4, e);
  },
};
