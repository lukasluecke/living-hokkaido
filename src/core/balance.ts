// How unstable the slider gets. Faster = wobblier; bracing steadies you.
// The wobble is a smooth, seeded mix of sines, so it feels like losing
// balance rather than random jitter. Pure; physics applies the result.

/** Speed (m/s) where wobble starts, and where it is at full strength. */
export const WOBBLE = { from: 9, full: 23, accel: 3.2, braceFactor: 0.35 };

/** 0 when slow, rising to 1 at full speed. */
export function instability(speed: number): number {
  const t = (speed - WOBBLE.from) / (WOBBLE.full - WOBBLE.from);
  return Math.max(0, Math.min(1, t));
}

/** Smooth wobble in about -1..1 at time t (s), seeded by phases. */
export function wobble(t: number, phase: readonly [number, number, number]) {
  return (
    (Math.sin(1.3 * t + phase[0]) +
      0.6 * Math.sin(2.9 * t + phase[1]) +
      0.3 * Math.sin(5.3 * t + phase[2])) /
    1.9
  );
}

/** Sideways push from losing balance (m/s²). */
export function wobbleAccel(
  speed: number,
  t: number,
  phase: readonly [number, number, number],
  brace: boolean,
): number {
  return (
    wobble(t, phase) *
    instability(speed) *
    WOBBLE.accel *
    (brace ? WOBBLE.braceFactor : 1)
  );
}
