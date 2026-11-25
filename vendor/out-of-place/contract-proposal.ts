// Contract proposal for living-hokkaido (docs/CONTRACTS.md § Changing contracts).
//
// Additive change: a new activity kind "hide-seek". Paste the schema into
// src/contracts/activity.ts (where `base` and `idSchema` already exist), add it
// to `activitySchema`'s union, add `"hide-seek": "Game"` to KIND_LABEL in
// src/parts/activities/index.tsx, and add a test in tests/contracts.test.ts.
//
// This file is self-contained so it also typechecks here: `base` mirrors the
// one in living-hokkaido's activity.ts (id, knowledgeId, title, claimIds,
// artifactId).
import { z } from "zod";

export const idSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Ids are lower-case kebab-case");

const base = {
  id: idSchema,
  knowledgeId: idSchema,
  title: z.string().min(1),
  /** Claims the activity is grounded in. At least one. */
  claimIds: z.array(idSchema).min(1),
  /** Optional artifact that starts the activity in the scene. */
  artifactId: idSchema.optional(),
};

// ---------------------------------------------------------------- hide-seek

/**
 * Hide and seek in an illustrated historical scene (Out of Place). One
 * visitor hides Nuri (an original clay figure) by painting it with colours
 * sampled from the scene; a second visitor on the same device looks for it.
 * The reveal shows what in the scene is period-accurate and what is not there
 * yet, each line from a claim. The scene is drawn by the renderer (one per
 * `scene`) and is illustrative, so `illustrative` defaults to true.
 */
export const hideSeekActivitySchema = z
  .object({
    ...base,
    kind: z.literal("hide-seek"),
    /** Which illustrated scene the renderer draws. */
    scene: z.enum(["otaru-herring-warehouse", "sapporo-street"]),
    /** How to play. Frame text only: it states no historical fact. */
    prompt: z.string().min(1),
    /** Claims shown with the scene at the start (the history caption). */
    captionClaimIds: z.array(idSchema).min(1),
    /** Claims shown as "period-accurate here" on the reveal card. */
    accurateClaimIds: z.array(idSchema).min(1),
    /** Claims about things that are not in the scene yet (anachronisms). */
    anachronismClaimIds: z.array(idSchema).default([]),
    /** Shown when a round ends. Must only restate claims. */
    completion: z.string().min(1),
    /** Seconds per phase. The handoff between players has no clock. */
    durations: z
      .object({
        sceneReveal: z.number().int().min(3).max(60),
        disguise: z.number().int().min(15).max(300),
        seek: z.number().int().min(15).max(300),
        reveal: z.number().int().min(5).max(120),
      })
      .default({ sceneReveal: 10, disguise: 60, seek: 90, reveal: 20 }),
    /** Seconds taken off the seeker's clock for each wrong tap. */
    wrongTapPenalty: z.number().int().min(0).max(60).default(10),
    /** Only pass-and-play for now (no network play in the visitor app). */
    players: z.literal("pass-and-play").default("pass-and-play"),
    /** True while the scene art is not backed by an approved reconstruction. */
    illustrative: z.boolean().default(true),
  })
  .refine(
    (a) =>
      [
        ...a.captionClaimIds,
        ...a.accurateClaimIds,
        ...a.anachronismClaimIds,
      ].every((id) => a.claimIds.includes(id)),
    "Caption, accurate and anachronism claims must be listed in claimIds",
  );

export type HideSeekActivity = z.infer<typeof hideSeekActivitySchema>;
export type HideSeekActivityInput = z.input<typeof hideSeekActivitySchema>;
