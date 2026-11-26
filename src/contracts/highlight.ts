// Highlights: the few signature experiences the island shows first, and the
// owl's first-visit tour through them (Lukas, 2026-11-26). A highlight only
// points at things that already exist in the pack (an activity, a timeline,
// or a place's story film), so it adds no facts of its own.
import { z } from "zod";
import { idSchema } from "./ids";

export const highlightTargetSchema = z.discriminatedUnion("kind", [
  /** Start this activity when the owl lands. */
  z.object({ kind: z.literal("activity"), activityId: idSchema }),
  /** Open this "Over time" timeline when the owl lands. */
  z.object({ kind: z.literal("timeline"), timelineId: idSchema }),
  /** The place's story film (the scene's `film`); the visitor presses play. */
  z.object({ kind: z.literal("film") }),
]);
export type HighlightTarget = z.infer<typeof highlightTargetSchema>;

export const highlightSchema = z.object({
  id: idSchema,
  /** Short, verb-first name: "Play the tonkori". */
  title: z.string().min(1),
  /** One line under the title. UI text, not a claim. */
  teaser: z.string().min(1),
  /** Kind icon to show (an activity kind, "film" or "timeline"). */
  icon: z.string().min(1),
  locationId: idSchema,
  open: highlightTargetSchema,
  /** What the owl says when the tour offers this highlight. */
  owl: z.string().optional(),
  /**
   * A prop in the place's scene that opens the highlight, for experiences
   * with no object there (games, timelines). Scene space, metres. `prop`
   * names a code-built sign prop; `model` an optional GLB that replaces it.
   * Illustrative signposts only: they carry no facts (additive).
   */
  marker: z
    .object({
      position: z.tuple([z.number(), z.number(), z.number()]),
      rotationY: z.number().default(0),
      prop: z.enum(["sled", "crates", "hourglass"]),
      model: z.string().optional(),
    })
    .optional(),
});
export type Highlight = z.infer<typeof highlightSchema>;
export type HighlightInput = z.input<typeof highlightSchema>;

/** Done = the activity is completed, or the place was visited (film,
 *  timeline). Pure; works with any journal-like object. */
export function highlightDone(
  h: Highlight,
  journal: { completed: readonly string[]; visited: readonly string[] },
): boolean {
  return h.open.kind === "activity"
    ? journal.completed.includes(h.open.activityId)
    : journal.visited.includes(h.locationId);
}
