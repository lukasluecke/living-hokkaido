// Heritage Journal: stamp definitions (content) and progress (per visitor).
import { z } from "zod";
import { idSchema } from "./ids";
import { seasonIdSchema } from "./season";

export const unlockRuleSchema = z.discriminatedUnion("on", [
  z.object({ on: z.literal("location-visited"), locationId: idSchema }),
  z.object({
    on: z.literal("artifacts-inspected"),
    artifactIds: z.array(idSchema).min(1),
  }),
  z.object({
    on: z.literal("hotspots-read"),
    /** Every hotspot of these artifacts was opened. */
    artifactIds: z.array(idSchema).min(1),
  }),
  z.object({
    on: z.literal("activities-completed"),
    activityIds: z.array(idSchema).min(1),
  }),
  z.object({
    on: z.literal("seasons-seen"),
    seasons: z.array(seasonIdSchema).min(1),
  }),
  z.object({ on: z.literal("reveal-opened") }),
]);
export type UnlockRule = z.infer<typeof unlockRuleSchema>;

export const stampSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  /** What the visitor did. No new cultural claims. */
  description: z.string().min(1),
  /** Icon key the journal part maps to artwork. */
  icon: z.string().min(1),
  unlock: unlockRuleSchema,
  /** Optional claims the journal page shows again as a reminder. */
  claimIds: z.array(idSchema).default([]),
});
export type Stamp = z.infer<typeof stampSchema>;

export const JOURNAL_STORAGE_KEY = "lh-journal-v2";

/**
 * Visitor progress. Only ids from the content pack. No names, no free text,
 * no personal data. Unknown ids are dropped on load.
 */
export const journalStateSchema = z.object({
  version: z.literal(2),
  visited: z.array(idSchema),
  inspected: z.array(idSchema),
  /** "<artifactId>/<hotspotId>" */
  hotspotsRead: z.array(z.string()),
  completed: z.array(idSchema),
  seasonsSeen: z.array(seasonIdSchema),
  revealOpened: z.boolean(),
  stamps: z.array(z.object({ stampId: idSchema, earnedAt: z.string() })),
  /** "<activityId>/<foundId>": things found in activities (slope-run
   *  exhibits). Additive: older saved journals parse with []. */
  found: z.array(z.string()).default([]),
  /** Places whose story film was watched (opened, then closed or ended).
   *  Additive: older saved journals parse with []. */
  filmsSeen: z.array(idSchema).default([]),
});
export type JournalState = z.infer<typeof journalStateSchema>;

export const EMPTY_JOURNAL: JournalState = {
  version: 2,
  visited: [],
  inspected: [],
  hotspotsRead: [],
  completed: [],
  seasonsSeen: [],
  revealOpened: false,
  stamps: [],
  found: [],
  filmsSeen: [],
};
