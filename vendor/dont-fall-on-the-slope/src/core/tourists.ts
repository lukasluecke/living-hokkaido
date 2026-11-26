// Tourists who photograph the slider as they pass (step 7). Pure timing;
// the view animates the camera arm and the flash.
import { rng } from "./random";
import type { Obstacle } from "./track";

/** About 60 % of tourists carry a camera (same draw as the old static one). */
export function isPhotographer(o: Pick<Obstacle, "kind" | "look">): boolean {
  return o.kind === "tourist" && rng(o.look + 5)() < 0.6;
}

/** Raise the camera from this far ahead (m), take the photo at FLASH_AT,
 *  while the tourist is still well in view of the chase camera (playtest:
 *  at 2 m the photo happened off screen). */
export const RAISE_FROM = 14;
export const FLASH_AT = 6;

/** 0 = camera at the chest, 1 = at the eye, by how far ahead the slider
 *  is (`ahead` = tourist s − player s). Lowers again once passed. */
export function cameraRaise(ahead: number): number {
  if (ahead > RAISE_FROM || ahead < -6) return 0;
  if (ahead > RAISE_FROM - 3) return (RAISE_FROM - ahead) / 3;
  if (ahead < -3) return (ahead + 6) / 3;
  return 1;
}

/** True on the step the slider crosses the photo point. */
export function flashNow(prevAhead: number, ahead: number): boolean {
  return prevAhead > FLASH_AT && ahead <= FLASH_AT;
}
