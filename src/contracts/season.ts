// Season state. One number drives every season-aware part.
//
// value: 0 = spring, 1 = summer, 2 = autumn, 3 = winter, wraps at 4.
// Fractions are valid in-between frames (2.75 = late autumn into winter).
// The shell owns the clock; parts only read it. Implementation tip from the
// island lab: feed seasonWeights() into one shared shader uniform.
import { z } from "zod";

export const SEASON_IDS = ["spring", "summer", "autumn", "winter"] as const;
export const seasonIdSchema = z.enum(SEASON_IDS);
export type SeasonId = z.infer<typeof seasonIdSchema>;

export const seasonStateSchema = z.object({
  value: z.number().min(0).lt(4),
  /** Timelapse running. */
  playing: z.boolean(),
  /** Timelapse speed in seasons per second. */
  speed: z.number().positive(),
});
export type SeasonState = z.infer<typeof seasonStateSchema>;

export const DEFAULT_SEASON: SeasonState = {
  value: 0,
  playing: false,
  speed: 0.25,
};

/** Per-season values, for example a location note or a colour. */
export type Seasonal<T> = Partial<Record<SeasonId, T>>;

export function wrapSeason(value: number): number {
  return ((value % 4) + 4) % 4;
}

/** The season that dominates at this value (nearest whole season). */
export function seasonAt(value: number): SeasonId {
  return SEASON_IDS[Math.round(wrapSeason(value)) % 4];
}

/**
 * Plateau-eased blend weights [spring, summer, autumn, winter], sum = 1.
 * Each season holds for `hold` of its interval, then blends into the next.
 */
export function seasonWeights(
  value: number,
  hold = 0.55,
): [number, number, number, number] {
  const t = wrapSeason(value);
  const i = Math.floor(t);
  const f = t - i;
  const x = f < hold ? 0 : (f - hold) / (1 - hold);
  const k = x * x * (3 - 2 * x);
  const w: [number, number, number, number] = [0, 0, 0, 0];
  w[i] = 1 - k;
  w[(i + 1) % 4] += k;
  return w;
}
