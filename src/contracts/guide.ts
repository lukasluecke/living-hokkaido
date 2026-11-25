// Owl guide lines. The owl is a fictional navigation character, not a claimed
// spiritual representation. Lines navigate and invite; they do not state
// cultural facts. A line that needs a fact must cite a claim.
import { z } from "zod";
import { idSchema } from "./ids";

export const guideLineSchema = z.object({
  id: idSchema,
  text: z.string().min(1),
  /** Event type that triggers the line (see events.ts). */
  on: z.string().min(1),
  /** Optional filter: only for this location / scene / artifact id. */
  targetId: idSchema.optional(),
  claimIds: z.array(idSchema).default([]),
});
export type GuideLine = z.infer<typeof guideLineSchema>;
