// Local mirror of the living-hokkaido experience contracts this game touches.
//
// Names, fields and rules match living-hokkaido's src/contracts (knowledge.ts,
// activity.ts ActivityResult, events.ts, experience.ts Prefs) and
// src/domain/contracts.ts (source, claim, citation). When the game is ported,
// replace imports of this file with `@/contracts` and delete it.
// Keep it in sync by hand; do not add fields living-hokkaido does not have.
import { z } from "zod";
import { type HideSeekActivity, idSchema } from "../../contract-proposal";

export {
  type HideSeekActivity,
  type HideSeekActivityInput,
  hideSeekActivitySchema,
  idSchema,
} from "../../contract-proposal";

// ---------------------------------------------------------------- provenance

export const citationSchema = z.object({
  sourceId: z.string().min(1),
  locator: z.string().min(1),
});
export const claimSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  citations: z.array(citationSchema).min(1),
});
export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.url().optional(),
  kind: z.enum(["museum", "interview", "document", "image", "audio"]),
  rights: z.enum(["unknown", "restricted", "approved"]),
  consent: z.enum(["pending", "granted", "withdrawn"]),
  attribution: z.string(),
  placeholder: z.boolean(),
});
export type Claim = z.infer<typeof claimSchema>;
export type Source = z.infer<typeof sourceSchema>;

// ---------------------------------------------------------------- knowledge

export const presentationSchema = z.enum([
  /** Seed research awaiting editorial approval. Must show a banner. */
  "research-preview",
  /** Approved by a named reviewer through the contributor workflow. */
  "approved",
  /** Withdrawn. Nothing may show it. */
  "withdrawn",
]);
export type Presentation = z.infer<typeof presentationSchema>;

export const knowledgeEntrySchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    subtitle: z.string().optional(),
    presentation: presentationSchema,
    narration: z.string().optional(),
    sources: z.array(sourceSchema).min(1),
    claims: z.array(claimSchema).min(1),
    reviewer: z.string().optional(),
    reviewedAt: z.string().optional(),
  })
  .superRefine((k, ctx) => {
    if (k.presentation === "approved" && (!k.reviewer || !k.reviewedAt))
      ctx.addIssue({
        code: "custom",
        path: ["reviewer"],
        message: "Approved entries need a reviewer and a review date",
      });
    const sources = new Set(k.sources.map((s) => s.id));
    for (const c of k.claims)
      for (const cit of c.citations)
        if (!sources.has(cit.sourceId))
          ctx.addIssue({
            code: "custom",
            path: ["claims", c.id],
            message: `Unknown source ${cit.sourceId}`,
          });
  });
export type KnowledgeEntry = z.infer<typeof knowledgeEntrySchema>;

/** A claim joined with its sources, ready for a card or the reveal. */
export type ResolvedClaim = {
  claim: Claim;
  sources: Source[];
  knowledgeId: string;
  presentation: Presentation;
};

/** Resolve every claim of an entry, keyed by claim id (as parts receive them). */
export function resolveClaims(
  entry: KnowledgeEntry,
): Record<string, ResolvedClaim> {
  const out: Record<string, ResolvedClaim> = {};
  if (entry.presentation === "withdrawn") return out;
  for (const claim of entry.claims) {
    const ids = new Set(claim.citations.map((c) => c.sourceId));
    out[claim.id] = {
      claim,
      sources: entry.sources.filter((s) => ids.has(s.id)),
      knowledgeId: entry.id,
      presentation: entry.presentation,
    };
  }
  return out;
}

// ---------------------------------------------------------------- events

export const activityResultSchema = z.object({
  activityId: idSchema,
  completed: z.boolean(),
  /** 0..1 where it makes sense. */
  score: z.number().min(0).max(1).optional(),
  at: z.string(),
});
export type ActivityResult = z.infer<typeof activityResultSchema>;

/** The subset of living-hokkaido's ExperienceEvent this game emits. */
export type ExperienceEvent =
  | { type: "activity.complete"; result: ActivityResult }
  | { type: "activity.close"; activityId: string }
  | {
      type: "reveal.open";
      knowledgeId: string;
      claimId?: string;
      artifactId?: string;
    };
export type Emit = (event: ExperienceEvent) => void;

/** Same as living-hokkaido's Prefs. */
export type Prefs = {
  /** prefers-reduced-motion: no hops, pulses or floating labels. */
  reducedMotion: boolean;
  /** False when WebGL failed. The game then runs on Canvas 2D. */
  webgl: boolean;
};

/** Props for the game, shaped like living-hokkaido's ActivityPartProps. */
export type OutOfPlaceProps = {
  /** The activity to play (living-hokkaido passes exactly one). */
  activity: HideSeekActivity;
  /**
   * Optional: several scenes to choose from. With two or more, the game opens
   * on a scene select screen. `claims` must cover every activity listed.
   */
  activities?: HideSeekActivity[];
  claims: Record<string, ResolvedClaim>;
  prefs: Prefs;
  emit: Emit;
  /** Dev only: clock multiplier (the standalone page reads ?speed=N). */
  speed?: number;
  /** Silence the synthesised stings (e.g. when the host's sound is off). */
  muted?: boolean;
  /**
   * Receives a saved 9:16 reveal clip. Without it the game opens the share
   * sheet (phones) or downloads the file.
   */
  onClip?: (clip: Blob, ext: string) => void;
};
