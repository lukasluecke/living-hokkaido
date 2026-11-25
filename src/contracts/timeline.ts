// "Over time" timelines: one place shown in a few dated states (eras).
// A visitor scrubs between eras; every era text cites claims in one
// knowledge entry. The `stage` keys only pick illustrative shapes in the
// renderer. They are not cultural statements and never stand alone: the
// era's claims carry the facts.
import { z } from "zod";
import { idSchema } from "./ids";

/** House form shown in an era (illustrative shapes, see the era claims). */
export const timelineHouseSchema = z.enum([
  /** Square pit dwelling dug into the ground, roof to the ground. */
  "pit-dwelling",
  /** House on flat ground with a hearth inside. */
  "flat-ground",
  /** Thatched house of wood, grass and bark, with a storehouse. */
  "thatched",
  /** A house rebuilt today in a museum or park. */
  "reconstructed",
]);
export type TimelineHouse = z.infer<typeof timelineHouseSchema>;

/** Land around the house in an era (illustrative shapes). */
export const timelineLandSchema = z.enum([
  /** Settlement near a river mouth, small fields and fishing. */
  "estuary",
  /** Forest and river around a village. */
  "forest-river",
  /** Forest cleared for farm fields and roads. */
  "cleared-farmland",
  /** Paths and a museum building in a park. */
  "museum-park",
]);
export type TimelineLand = z.infer<typeof timelineLandSchema>;

export const timelineEraSchema = z.object({
  id: idSchema,
  /** Short label for the scrub bar ("Meiji era"). */
  label: z.string().min(1),
  /** Human period text ("7th–12th century"). */
  period: z.string().min(1),
  /** Approximate start year (CE) for the scrub axis. Negative = BCE. */
  year: z.number().int(),
  title: z.string().min(1),
  /** Card text. Must only restate the cited claims. */
  summary: z.string().min(1),
  /** Claims in the timeline's knowledge entry that support this era. */
  claimIds: z.array(idSchema).min(1),
  stage: z.object({
    house: timelineHouseSchema,
    land: timelineLandSchema,
    /** Show a raised storehouse next to the house. */
    storehouse: z.boolean().default(false),
  }),
});
export type TimelineEra = z.infer<typeof timelineEraSchema>;

export const timelineSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    subtitle: z.string().optional(),
    knowledgeId: idSchema,
    /** Location the timeline belongs to (optional link from the island). */
    locationId: idSchema.optional(),
    /** The 3D shapes are always made for the demo, never scans. */
    representation: z.literal("illustrative").default("illustrative"),
    /** Claims that apply to the whole timeline (e.g. "illustrative"). */
    claimIds: z.array(idSchema).default([]),
    eras: z.array(timelineEraSchema).min(2),
  })
  .superRefine((t, ctx) => {
    for (let i = 1; i < t.eras.length; i++)
      if (t.eras[i].year <= t.eras[i - 1].year)
        ctx.addIssue({
          code: "custom",
          path: ["eras", i, "year"],
          message: "Eras must be in time order",
        });
  });
export type Timeline = z.infer<typeof timelineSchema>;
export type TimelineInput = z.input<typeof timelineSchema>;

/**
 * Era weights for a continuous scrub position `t` in [0, eras - 1]:
 * linear blend between the two nearest eras, sum = 1.
 */
export function eraWeights(count: number, t: number): number[] {
  const w = Array.from({ length: count }, () => 0);
  if (count === 0) return w;
  const x = Math.min(Math.max(t, 0), count - 1);
  const i = Math.min(Math.floor(x), count - 1);
  const f = x - i;
  w[i] = 1 - f;
  if (f > 0 && i + 1 < count) w[i + 1] = f;
  return w;
}

/** Index of the era nearest to scrub position `t`. */
export function eraAt(count: number, t: number): number {
  return Math.min(Math.max(Math.round(t), 0), Math.max(count - 1, 0));
}
