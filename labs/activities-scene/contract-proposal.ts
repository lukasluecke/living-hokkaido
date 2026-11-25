// Proposal only (not wired). Additive activity kind "place" for
// src/contracts/activity.ts. Follow docs/CONTRACTS.md § Changing contracts.
import { z } from "zod";

const Id = z.string().regex(/^[a-z0-9-]+$/);

export const PlaceSpot = z.object({
  id: Id,
  /** Position in the activity's own 2D stage, 0..1 of width and height. */
  at: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
  /** Figure ids that fit here. Omit when the source does not say who. */
  figures: z.array(Id).optional(),
  /** Pose id the source supports. Omit for objects (no pose step). */
  pose: Id.optional(),
  /** Only open in this season (ties into the season clock). */
  season: z.enum(["spring", "summer", "autumn", "winter"]).optional(),
  /** Claim that supports the answer; feedback text comes from it. */
  claimId: Id,
  /** True when the support is only "seen in the diorama" (weaker). */
  observed: z.boolean().default(false),
  hint: z.string(),
});

export const PlaceActivity = z.object({
  kind: z.literal("place"),
  /** Steps in story order. Each step: one cited fact, then one figure. */
  steps: z.array(
    z.object({
      sayClaimId: Id,
      figure: Id.optional(),
      /** Ring ids offered in this step (2-3); one is right. */
      options: z.array(Id).optional(),
      /** Pose ids on the sheet in this step (4). */
      poses: z.array(Id).optional(),
      season: z.enum(["spring", "summer", "autumn", "winter"]).optional(),
    }),
  ),
  figures: z.array(
    z.object({
      id: Id,
      /** Named by look ("Straw hat"), never a personal name. */
      label: z.string(),
      look: z.object({ hat: z.string(), colour: z.string() }).optional(),
      note: z.string().optional(),
    }),
  ),
  /** Pose ids shown on the pose sheet, including decoys. */
  poses: z.array(Id),
  spots: z.array(PlaceSpot).min(1),
  /** "people" scenes have a pose step; "objects" scenes do not. */
  subject: z.enum(["people", "objects"]),
  illustrative: z.literal(true),
});
