// Turns raw input into the two things the player controls: lean (-1..1) and
// brace. Pure, so keyboard, buttons and drag all combine the same way.

export type Held = {
  left: boolean;
  right: boolean;
  brace: boolean;
};

export type Controls = { lean: number; brace: boolean };

/** Pixels of horizontal drag for a full lean. */
export const DRAG_FULL = 70;

export function controlsFrom(held: Held, dragPx: number | null): Controls {
  let lean = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  if (dragPx !== null) lean += dragPx / DRAG_FULL;
  return { lean: Math.max(-1, Math.min(1, lean)), brace: held.brace };
}

/** How the applied lean follows the keys: it eases toward the wanted lean
 *  (about 63 % of the way in 1/LEAN_RESPONSE s) and never changes faster
 *  than LEAN_MAX_RATE per second. Playtest: a straight linear ramp felt
 *  twitchy, especially switching A ↔ D. */
export const LEAN_RESPONSE = 8;
export const LEAN_MAX_RATE = 5;

/** Moves the applied lean smoothly toward the wanted lean. */
export function easeLean(current: number, target: number, dt: number): number {
  const want = (target - current) * (1 - Math.exp(-LEAN_RESPONSE * dt));
  const cap = LEAN_MAX_RATE * dt;
  const next = current + Math.max(-cap, Math.min(cap, want));
  return Math.abs(target - next) < 0.01 ? target : next;
}

/** Two-finger trackpad swipes steer: this much sideways scroll (px) is a
 *  full lean. Fingers moving right lean right (with macOS natural
 *  scrolling that is a negative deltaX). */
export const SWIPE_FULL = 140;
/** A swipe keeps its lean this long (s) after the last scroll event. */
export const SWIPE_HOLD = 0.12;

/** Add one sideways scroll event to the swipe lean (-1..1). */
export function swipeLean(current: number, deltaX: number): number {
  return Math.max(-1, Math.min(1, current - deltaX / SWIPE_FULL));
}

/** Let a swipe lean fade once the scrolling stops. */
export function swipeDecay(current: number, idle: number, dt: number) {
  if (idle <= SWIPE_HOLD) return current;
  const next = current * Math.exp(-dt * 10);
  return Math.abs(next) < 0.02 ? 0 : next;
}
