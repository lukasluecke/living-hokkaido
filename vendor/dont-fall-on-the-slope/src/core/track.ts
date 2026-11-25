// Procedural street layout: the path (steepness and curves), obstacles in
// the street and the shopfronts that line it. Pure data; physics and
// rendering both build from it. All positions are track coordinates
// (x across, s downhill; see path.ts).
import { buildPath, type Path, type Section } from "./path";
import { rng } from "./random";

export const STREET = {
  /** Length of the run, start to canal (m). */
  length: 320,
  /** Half the width of the open street between the shopfronts (m). */
  halfWidth: 5,
  /** Path continues this far past the canal edge (for the water view). */
  tail: 60,
} as const;

export type ObstacleKind =
  | "snow-pile"
  | "lamp-post"
  | "crate"
  | "bicycle"
  | "tourist"
  /** A street exhibit (core/exhibits.ts): drawn by render/exhibits.ts. */
  | "exhibit";

export type Obstacle = {
  id: string;
  kind: ObstacleKind;
  /** Centre across the street (m). */
  x: number;
  /** Distance downhill (m). */
  s: number;
  /** Footprint across (w) and along (d) the street, and height (m). */
  w: number;
  d: number;
  h: number;
  /** Turn about the vertical axis relative to the street (radians). */
  turn: number;
  /** Small seed for per-object looks (coat colour, pose). */
  look: number;
};

export type BuildingKind = "stone-warehouse" | "wooden-shop" | "glass-workshop";

export type Building = {
  id: string;
  kind: BuildingKind;
  side: -1 | 1;
  /** Start and end along the street (m). */
  s0: number;
  s1: number;
  /** Wall height (m). */
  h: number;
  /** How deep the building goes back from the street (m). */
  depth: number;
  look: number;
};

export type Track = {
  seed: number;
  length: number;
  halfWidth: number;
  sections: Section[];
  path: Path;
  obstacles: Obstacle[];
  buildings: Building[];
  /** The guaranteed clear lane, one point per obstacle row. */
  lanes: { s: number; x: number }[];
};

/** No obstacles this close to the start or the canal. */
export const START_CLEAR = 30;
export const END_CLEAR = 20;
/** A clear lane this wide runs the whole street (body ≈ 0.6 m). */
export const MIN_GAP = 2.2;
/** The lane drifts sideways at most this many metres per metre downhill,
 *  so it can be followed at speed. */
export const LANE_DRIFT = 0.18;
/** Steepest and gentlest sections (degrees). */
export const PITCH = { start: 9, min: 7, max: 18, canal: 5 } as const;
/** Sharpest curve (radians per metre). */
export const MAX_CURVE = 1 / 200;

const SIZES: Record<ObstacleKind, { w: number; d: number; h: number }> = {
  "snow-pile": { w: 1.6, d: 1.4, h: 0.8 },
  "lamp-post": { w: 0.3, d: 0.3, h: 3.6 },
  crate: { w: 1.0, d: 1.0, h: 1.0 },
  bicycle: { w: 0.6, d: 1.7, h: 1.0 },
  tourist: { w: 0.55, d: 0.45, h: 1.7 },
  exhibit: { w: 0.9, d: 1.6, h: 0.9 },
};
/** Weighted kinds for obstacles out in the street. */
const ROW_KINDS: ObstacleKind[] = [
  "snow-pile",
  "snow-pile",
  "snow-pile",
  "crate",
  "crate",
  "tourist",
  "tourist",
  "lamp-post",
];
const BUILDINGS: BuildingKind[] = [
  "stone-warehouse",
  "wooden-shop",
  "glass-workshop",
];

/** Widest free interval across the street, given row obstacles. */
export function widestGap(halfWidth: number, row: Obstacle[]): number {
  const spans = row
    .map((o) => [o.x - o.w / 2, o.x + o.w / 2] as const)
    .sort((a, b) => a[0] - b[0]);
  let edge = -halfWidth;
  let best = 0;
  for (const [a, b] of spans) {
    best = Math.max(best, a - edge);
    edge = Math.max(edge, b);
  }
  return Math.max(best, halfWidth - edge);
}

/** Steeper further down, with a few gentle curves; flattens at the canal. */
export function generateSections(
  r: () => number,
  length: number,
  tail: number,
): Section[] {
  const out: Section[] = [{ length: 35, pitch: PITCH.start, curve: 0 }];
  let s = 35;
  while (s < length - 40) {
    const len = Math.min(35 + r() * 35, length - 25 - s);
    const progress = s / length;
    const pitch = Math.max(
      PITCH.min,
      Math.min(PITCH.max, 9 + progress * 8 + (r() - 0.5) * 5),
    );
    const curve = r() < 0.35 ? 0 : (r() * 2 - 1) * MAX_CURVE;
    out.push({ length: len, pitch, curve });
    s += len;
  }
  out.push({ length: length - s + tail, pitch: PITCH.canal, curve: 0 });
  return out;
}

export function generateTrack(
  seed: number,
  length: number = STREET.length,
  halfWidth: number = STREET.halfWidth,
): Track {
  const r = rng(seed);
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)] as T;
  const sections = generateSections(r, length, STREET.tail);
  const path = buildPath(sections);
  const obstacles: Obstacle[] = [];
  const lanes: { s: number; x: number }[] = [];
  let n = 0;

  const make = (
    kind: ObstacleKind,
    x: number,
    s: number,
    turn = 0,
  ): Obstacle => ({
    id: `o${n++}`,
    kind,
    x,
    s,
    ...SIZES[kind],
    turn,
    look: Math.floor(r() * 1000),
  });
  /** Footprint across the street, allowing for a turned object. */
  const halfAcross = (o: Pick<Obstacle, "w" | "d" | "turn">) =>
    (Math.abs(Math.cos(o.turn)) * o.w + Math.abs(Math.sin(o.turn)) * o.d) / 2;
  const clearOf = (o: Obstacle, lane: number) =>
    o.x + halfAcross(o) < lane - MIN_GAP / 2 ||
    o.x - halfAcross(o) > lane + MIN_GAP / 2;

  // Rows of obstacles out in the street, keeping the lane clear.
  let s = START_CLEAR;
  let lane = 0;
  let prevS = 0;
  const laneLimit = halfWidth - MIN_GAP / 2 - 0.3;
  while (s < length - END_CLEAR) {
    const reach = (s - prevS) * LANE_DRIFT;
    lane = Math.max(
      -laneLimit,
      Math.min(laneLimit, lane + (r() * 2 - 1) * reach),
    );
    prevS = s;
    lanes.push({ s, x: lane });

    const progress = s / length;
    const count = r() < 0.25 + progress * 0.5 ? 2 : 1;
    const row: Obstacle[] = [];
    for (let i = 0; i < count; i++) {
      const kind = pick(ROW_KINDS);
      const size = SIZES[kind];
      const limit = halfWidth - size.w / 2 - 0.2;
      for (let tries = 0; tries < 8; tries++) {
        const o = make(kind, (r() * 2 - 1) * limit, s + (r() - 0.5) * 2);
        o.turn = kind === "tourist" ? (r() - 0.5) * Math.PI * 2 : 0;
        if (clearOf(o, lane)) {
          row.push(o);
          break;
        }
        n--;
      }
    }
    // Tourists come in pairs: a friend stands next to them, if it fits.
    for (const o of [...row]) {
      if (o.kind !== "tourist") continue;
      const side = o.x > 0 ? -1 : 1;
      const friend = make("tourist", o.x + side * 0.7, o.s + 0.3, o.turn + 0.5);
      if (Math.abs(friend.x) < halfWidth - 0.4 && clearOf(friend, lane))
        row.push(friend);
      else n--;
    }
    obstacles.push(...row);
    s += 11 + r() * 8 - progress * 3;
  }

  // Street furniture along the edges: lamp posts at a steady rhythm and
  // parked bicycles in small groups, wherever the lane leaves room.
  const laneAt = (at: number) => {
    const i = lanes.findIndex((l) => l.s >= at);
    if (i < 0) return lanes.at(-1)?.x ?? 0;
    if (i === 0) return lanes[0]?.x ?? 0;
    const a = lanes[i - 1];
    const b = lanes[i];
    if (!a || !b) return 0;
    return a.x + ((at - a.s) / (b.s - a.s)) * (b.x - a.x);
  };
  const free = (o: Obstacle) =>
    obstacles.every(
      (p) =>
        Math.abs(p.s - o.s) > (p.d + o.d) / 2 + 0.6 ||
        Math.abs(p.x - o.x) > halfAcross(p) + halfAcross(o) + 0.4,
    );
  /** Clear of the lane wherever the lane is along this object's length. */
  const laneSafe = (o: Obstacle) =>
    [-o.d / 2, 0, o.d / 2].every((ds) => clearOf(o, laneAt(o.s + ds)));
  for (let at = START_CLEAR - 8; at < length - END_CLEAR; at += 24) {
    for (const side of [-1, 1] as const) {
      const post = make("lamp-post", side * (halfWidth - 0.45), at + side * 6);
      if (laneSafe(post) && free(post)) obstacles.push(post);
      else n--;
    }
  }
  for (let at = START_CLEAR + 5; at < length - END_CLEAR; at += 30 + r() * 25) {
    const side = r() < 0.5 ? -1 : 1;
    const group = 1 + Math.floor(r() * 3);
    for (let k = 0; k < group; k++) {
      const bike = make(
        "bicycle",
        side * (halfWidth - 0.75),
        at + k * 0.9,
        side * (0.35 + r() * 0.15),
      );
      if (laneSafe(bike) && free(bike)) obstacles.push(bike);
      else n--;
    }
  }
  obstacles.sort((a, b) => a.s - b.s);

  const buildings: Building[] = [];
  for (const side of [-1, 1] as const) {
    let b = -12;
    let i = 0;
    while (b < length + 8) {
      // Short facades so a straight wall stays close to a gentle curve.
      const len = Math.min(6 + r() * 7, length + 8 - b + 6);
      buildings.push({
        id: `b${side < 0 ? "l" : "r"}${i++}`,
        kind: pick(BUILDINGS),
        side,
        s0: b,
        s1: b + len,
        h: 5 + r() * 4,
        depth: 6 + r() * 3,
        look: Math.floor(r() * 1000),
      });
      b += len;
    }
  }

  return {
    seed,
    length,
    halfWidth,
    sections,
    path,
    obstacles,
    buildings,
    lanes,
  };
}
