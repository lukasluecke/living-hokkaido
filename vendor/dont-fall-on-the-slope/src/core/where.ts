// Which building is at a track position (for a "shopfront" crash: physics
// only reports the label, so the game finds the building from where the
// body is). Pure.
import type { Building } from "./track";

/** The building on the side the body is on, nearest along the street. */
export function buildingAt(
  buildings: readonly Building[],
  s: number,
  x: number,
): Building | null {
  const side = x < 0 ? -1 : 1;
  let best: Building | null = null;
  let bestD = Infinity;
  for (const b of buildings) {
    if (b.side !== side) continue;
    const d = s < b.s0 ? b.s0 - s : s > b.s1 ? s - b.s1 : 0;
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return bestD <= 1 ? best : null;
}
