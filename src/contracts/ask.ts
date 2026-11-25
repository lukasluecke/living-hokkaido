// "Ask the owl": the visitor asks a free-text question. The owl answers only
// from claims in the content pack, cites them, and may offer one navigation
// action chosen from real ids. The scripted fallback (src/domain/ask.ts) and
// the live route (/api/ask) return the same AskAnswer shape.
import { z } from "zod";
import { idSchema } from "./ids";

export const ASK_MAX_QUESTION = 300;

/** Where the visitor is now. Helps pick the nearest place for an action. */
export const askContextSchema = z.object({
  locationId: idSchema.nullable().default(null),
  sceneId: idSchema.nullable().default(null),
  artifactId: idSchema.nullable().default(null),
});
export type AskContext = z.infer<typeof askContextSchema>;

export const askRequestSchema = z.object({
  question: z.string().trim().min(2).max(ASK_MAX_QUESTION),
  context: askContextSchema.default({
    locationId: null,
    sceneId: null,
    artifactId: null,
  }),
});
export type AskRequest = z.infer<typeof askRequestSchema>;

/** A cited claim, by id. The UI resolves the text from the pack. */
export const askCitationSchema = z.object({
  knowledgeId: idSchema,
  claimId: idSchema,
});
export type AskCitation = z.infer<typeof askCitationSchema>;

/** One navigation offer. Every id must exist in the pack. */
export const askActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("location"), locationId: idSchema }),
  z.object({
    kind: z.literal("artifact"),
    locationId: idSchema,
    artifactId: idSchema,
  }),
  z.object({ kind: z.literal("timeline"), timelineId: idSchema }),
]);
export type AskAction = z.infer<typeof askActionSchema>;

export const askAnswerSchema = z.object({
  /** live = model answer from cited claims; scripted = keyword fallback. */
  mode: z.enum(["live", "scripted"]),
  /** false = "I don't know yet": no claim in the pack fits. */
  known: z.boolean(),
  /** The owl's short reply. Live mode: a model summary of the cited claims. */
  text: z.string().min(1).max(800),
  citations: z.array(askCitationSchema).max(4),
  action: askActionSchema.nullable(),
  /** Why the answer is in this mode (for example "No LLM key on the server"). */
  notice: z.string(),
});
export type AskAnswer = z.infer<typeof askAnswerSchema>;

/** Content for the ask box. Additive: old packs parse with no suggestions. */
const questions = z.array(z.string().min(1).max(ASK_MAX_QUESTION));

export const askContentSchema = z.object({
  /** Example questions shown as chips on the island overview. Questions
   *  only, never answers. */
  suggestions: questions.default([]),
  /** Questions about one place, shown inside it (additive). */
  byLocation: z.record(idSchema, questions).default({}),
  /** Questions about one object, shown while it is in focus (additive). */
  byArtifact: z.record(idSchema, questions).default({}),
});

/** The example questions for where the visitor is now. Object first, then
 *  the place, then the island questions. */
export function askSuggestionsFor(
  ask: AskContent,
  ctx: { locationId: string | null; artifactId: string | null },
): string[] {
  const art = ctx.artifactId ? ask.byArtifact[ctx.artifactId] : undefined;
  if (art?.length) return art;
  const loc = ctx.locationId ? ask.byLocation[ctx.locationId] : undefined;
  if (loc?.length) return loc;
  return ask.suggestions;
}
export type AskContent = z.infer<typeof askContentSchema>;
