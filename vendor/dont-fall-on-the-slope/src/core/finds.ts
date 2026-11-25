// Finds: small museum labels floating in the street. Slide through one to
// collect it; the run's end card explains every find with its cited claim.
// Pure: placement and the collect test, no three/Rapier.
import { END_CLEAR, START_CLEAR, type Track } from "./track";

/** One find as the host gives it: a short label and the claim it explains. */
export type FindInfo = {
  id: string;
  /** Short name shown when collected (a game label, states no fact). */
  label: string;
  /** The cited claim text, shown on the end card. */
  text: string;
  /** Source title (and locator), shown under the text. */
  source?: string;
};

export type FindSpot = { id: string; s: number; x: number };

/** How close (m) the body must pass, along and across the street. */
export const FIND_REACH = { s: 1.2, x: 0.9 } as const;
/** Height of the floating label above the ice (m). */
export const FIND_HEIGHT = 1.1;

/**
 * Spreads the finds evenly down the street, each on the guaranteed clear
 * lane of an obstacle row (so it is always reachable, but between
 * obstacles). Without rows, in the middle of the street.
 */
export function placeFinds(track: Track, ids: string[]): FindSpot[] {
  if (!ids.length) return [];
  const from = START_CLEAR;
  const to = track.length - END_CLEAR;
  return ids.map((id, i) => {
    const want = from + ((i + 0.5) / ids.length) * (to - from);
    let best = track.lanes[0];
    for (const l of track.lanes)
      if (!best || Math.abs(l.s - want) < Math.abs(best.s - want)) best = l;
    return best ? { id, s: best.s, x: best.x } : { id, s: want, x: 0 };
  });
}

/** Ids of the spots the body at (s, x) touches now and has not collected. */
export function collectAt(
  spots: FindSpot[],
  collected: readonly string[],
  s: number,
  x: number,
): string[] {
  return spots
    .filter(
      (f) =>
        !collected.includes(f.id) &&
        Math.abs(f.s - s) <= FIND_REACH.s &&
        Math.abs(f.x - x) <= FIND_REACH.x,
    )
    .map((f) => f.id);
}
