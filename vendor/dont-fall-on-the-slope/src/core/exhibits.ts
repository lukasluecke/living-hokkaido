// Exhibits: real things of the street that the host's cited claims
// explain (a stone warehouse wall, a shachihoko on a ridge, straw sacks,
// herring boxes, the canal). Slide close past one to notice it; the end
// card explains what you noticed. Each street shows a few, with new ones
// first, so every run teaches something. Pure: no three/Rapier.
import type { Obstacle, Track } from "./track";
import { END_CLEAR, START_CLEAR } from "./track";

export const EXHIBIT_LOOKS = [
  "warehouse-wall",
  "shachihoko",
  "straw-sacks",
  "sack-cart",
  "herring-boxes",
  "canal",
] as const;
export type ExhibitLook = (typeof EXHIBIT_LOOKS)[number];

/** One exhibit as the host gives it. */
export type FindInfo = {
  id: string;
  /** Short name (a game label; it states no fact). */
  label: string;
  /** What the street shows for it. */
  look: ExhibitLook;
  /** The cited claim text, shown on the end card. */
  text: string;
  /** Source title (and locator), shown under the text. */
  source?: string;
};

/** Where an exhibit is on this street. */
export type ExhibitSpot = {
  id: string;
  look: ExhibitLook;
  side: -1 | 1;
  /** Along the street (m): the building's span, or the prop's centre. */
  s0: number;
  s1: number;
  /** Across (m): the wall line, or the prop's centre. */
  x: number;
  /** The building it belongs to (wall, shachihoko, props in front). */
  buildingId?: string;
};

/** Buildings: notice within this distance of the wall (m). */
export const NOTICE_WALL = 3;
/** Props: notice within this distance, along and across (m). */
export const NOTICE_PROP = { s: 2.5, x: 2.6 } as const;
/** Footprint of the props (m). They are solid: touching one is a crash. */
export const PROP_SIZE = {
  "straw-sacks": { w: 0.9, d: 1.6, h: 0.9 },
  "sack-cart": { w: 1.0, d: 1.9, h: 1.1 },
  "herring-boxes": { w: 0.8, d: 1.4, h: 0.8 },
} as const;

const ON_BUILDING: ReadonlySet<ExhibitLook> = new Set([
  "warehouse-wall",
  "shachihoko",
]);
const isProp = (l: ExhibitLook): l is keyof typeof PROP_SIZE => l in PROP_SIZE;

function shuffle<T>(xs: readonly T[], random: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/**
 * The exhibits of one street: up to `fresh` the visitor has not seen,
 * then seen ones up to `total`. The canal is the finish, so it is always
 * in (it does not count).
 */
export function pickExhibits(
  pool: readonly FindInfo[],
  seen: readonly string[],
  random: () => number,
  fresh = 2,
  total = 4,
): FindInfo[] {
  const canal = pool.filter((f) => f.look === "canal");
  const rest = pool.filter((f) => f.look !== "canal");
  const unseen = shuffle(
    rest.filter((f) => !seen.includes(f.id)),
    random,
  ).slice(0, fresh);
  const again = shuffle(
    rest.filter((f) => seen.includes(f.id)),
    random,
  ).slice(0, total - unseen.length);
  return [...unseen, ...again, ...canal];
}

/** The clear lane's x at `s` (between the lane points). */
export function laneAt(track: Track, s: number): number {
  const l = track.lanes;
  const i = l.findIndex((p) => p.s >= s);
  if (i < 0) return l.at(-1)?.x ?? 0;
  if (i === 0) return l[0]?.x ?? 0;
  const a = l[i - 1];
  const b = l[i];
  if (!a || !b) return 0;
  return a.x + ((s - a.s) / (b.s - a.s)) * (b.x - a.x);
}

/**
 * Puts the picked exhibits on the street, spread out between the start
 * and the canal. Wall and shachihoko exhibits turn the nearest building
 * into a stone warehouse. Props stand at the foot of a wall on the side
 * away from the clear lane, as solid "exhibit" obstacles; street furniture
 * next to them moves out of the way. Returns a new track.
 */
export function placeExhibits(
  track: Track,
  picks: readonly FindInfo[],
): { track: Track; spots: ExhibitSpot[] } {
  const W = track.halfWidth;
  const buildings = track.buildings.map((b) => ({ ...b }));
  let obstacles = [...track.obstacles];
  const spots: ExhibitSpot[] = [];
  const used = new Set<string>();
  const placedOnes = picks.filter((p) => p.look !== "canal");
  const from = START_CLEAR + 6;
  const to = track.length - END_CLEAR - 6;

  placedOnes.forEach((p, i) => {
    const want = from + ((i + 0.5) / placedOnes.length) * (to - from);
    // The side away from the lane (the lane leaves that wall free).
    const away: -1 | 1 = laneAt(track, want) > 0 ? -1 : 1;
    const side: -1 | 1 = ON_BUILDING.has(p.look) ? (i % 2 ? 1 : -1) : away;
    let best: (typeof buildings)[number] | undefined;
    for (const b of buildings) {
      if (b.side !== side || used.has(b.id) || b.s1 - b.s0 < 6) continue;
      const d = Math.abs((b.s0 + b.s1) / 2 - want);
      if (!best || d < Math.abs((best.s0 + best.s1) / 2 - want)) best = b;
    }
    if (!best) return;
    used.add(best.id);
    if (ON_BUILDING.has(p.look)) {
      best.kind = "stone-warehouse";
      spots.push({
        id: p.id,
        look: p.look,
        side,
        s0: best.s0,
        s1: best.s1,
        x: side * W,
        buildingId: best.id,
      });
      return;
    }
    if (!isProp(p.look)) return;
    const size = PROP_SIZE[p.look];
    const s = (best.s0 + best.s1) / 2;
    const x = side * (W - size.w / 2 - 0.1);
    // Furniture against this wall moves out of the way.
    obstacles = obstacles.filter(
      (o) =>
        !(
          Math.sign(o.x) === side &&
          Math.abs(o.x) > W - 1.8 &&
          Math.abs(o.s - s) < size.d / 2 + o.d / 2 + 1.5
        ),
    );
    const prop: Obstacle = {
      id: `exhibit-${p.id}`,
      kind: "exhibit",
      x,
      s,
      ...size,
      turn: 0,
      look: i,
    };
    obstacles.push(prop);
    spots.push({
      id: p.id,
      look: p.look,
      side,
      s0: s,
      s1: s,
      x,
      buildingId: best.id,
    });
  });

  for (const p of picks)
    if (p.look === "canal")
      spots.push({
        id: p.id,
        look: "canal",
        side: 1,
        s0: track.length,
        s1: track.length,
        x: 0,
      });

  obstacles.sort((a, b) => a.s - b.s);
  return { track: { ...track, buildings, obstacles }, spots };
}

/** Ids of exhibits the body at (s, x) notices now (not the canal). */
export function noticeAt(
  spots: readonly ExhibitSpot[],
  noticed: readonly string[],
  s: number,
  x: number,
): string[] {
  return spots
    .filter((e) => {
      if (e.look === "canal" || noticed.includes(e.id)) return false;
      if (ON_BUILDING.has(e.look))
        return (
          s >= e.s0 - 1 && s <= e.s1 + 1 && Math.abs(x - e.x) <= NOTICE_WALL
        );
      return (
        Math.abs(s - e.s0) <= NOTICE_PROP.s &&
        Math.abs(x - e.x) <= NOTICE_PROP.x
      );
    })
    .map((e) => e.id);
}

/**
 * One fact for the end card, so a run without a new notice still teaches
 * something: an exhibit this run passed (`passed`) but did not notice,
 * new ones first.
 */
export function slidPast(
  picks: readonly FindInfo[],
  seen: readonly string[],
  noticed: readonly string[],
  passed: (id: string) => boolean,
): FindInfo | undefined {
  const missed = picks.filter(
    (p) => p.look !== "canal" && !noticed.includes(p.id) && passed(p.id),
  );
  return missed.find((p) => !seen.includes(p.id)) ?? missed[0];
}
