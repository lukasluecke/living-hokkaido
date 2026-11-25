// Knowledge entries: the curated content that drives the visitor side.
//
// The contributor platform produces these (source -> claims -> human review).
// Visitor parts never write their own facts: every visible cultural statement
// is a claim with at least one citation. The provenance schemas live in
// src/domain/contracts.ts and are re-used here unchanged.
import { z } from "zod";
import { claimSchema, sourceSchema } from "@/domain/contracts";
import { idSchema } from "./ids";

export {
  citationSchema,
  claimSchema,
  sourceSchema,
  type Source,
} from "@/domain/contracts";
export type Claim = z.infer<typeof claimSchema>;

export const presentationSchema = z.enum([
  /** Seed research awaiting cultural/editorial approval. Must show a banner. */
  "research-preview",
  /** Approved by a named reviewer through the contributor workflow. */
  "approved",
  /** Withdrawn. No part may show it. */
  "withdrawn",
]);
export type Presentation = z.infer<typeof presentationSchema>;

export const knowledgeEntrySchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    subtitle: z.string().optional(),
    presentation: presentationSchema,
    /** Optional narration transcript. Text must only restate claims. */
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
  sources: z.infer<typeof sourceSchema>[];
  knowledgeId: string;
  presentation: Presentation;
};
