// Style points: near misses. Passing an obstacle with a small gap (but no
// touch) is a "close call". Pure: no three/Rapier.
import { SOFT_KINDS } from "./soft";
import type { Obstacle } from "./track";

/** A gap this small (m) between body and obstacle counts as a close call. */
export const CLOSE_GAP = 0.45;

/** Half the obstacle's footprint across the street. */
const halfAcross = (o: Pick<Obstacle, "w" | "d" | "turn">) =>
  (Math.abs(Math.cos(o.turn)) * o.w + Math.abs(Math.sin(o.turn)) * o.d) / 2;

/**
 * Ids of obstacles the body (radius `r`) is passing right now with a gap
 * of at most CLOSE_GAP, not counted yet. Snow piles do not count (they are
 * soft), and neither do obstacles the body touches.
 */
export function closeCalls(
  obstacles: readonly Obstacle[],
  counted: ReadonlySet<string>,
  s: number,
  x: number,
  r: number,
): string[] {
  const out: string[] = [];
  for (const o of obstacles) {
    if (counted.has(o.id) || SOFT_KINDS.has(o.kind)) continue;
    if (Math.abs(o.s - s) > o.d / 2) continue;
    const gap = Math.abs(o.x - x) - halfAcross(o) - r;
    if (gap > 0 && gap <= CLOSE_GAP) out.push(o.id);
  }
  return out;
}
