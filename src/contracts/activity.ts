// Activity definitions. A part emits activity.complete when the visitor
// finishes (the activity stays open) and activity.close to leave.
// One discriminated union; each kind has one renderer
// in src/parts/activities. Add a kind = additive contract change.
import { z } from "zod";
import { idSchema } from "./ids";

const base = {
  id: idSchema,
  knowledgeId: idSchema,
  title: z.string().min(1),
  /** Claims the activity is grounded in. At least one. */
  claimIds: z.array(idSchema).min(1),
  /** Optional artifact that starts the activity in the scene. */
  artifactId: idSchema.optional(),
};

export const quizActivitySchema = z
  .object({
    ...base,
    kind: z.literal("quiz"),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    answer: z.number().int().nonnegative(),
    explanation: z.string().min(1),
  })
  .refine(
    (a) => a.answer < a.options.length,
    "Answer must reference an option",
  );

/**
 * Weave (D2): the visitor completes rows on a simple loom. It is a
 * hands-on observation game, not instruction in an authenticated technique;
 * the UI must say so unless an approved claim supports the steps.
 */
export const weaveActivitySchema = z.object({
  ...base,
  kind: z.literal("weave"),
  prompt: z.string().min(1),
  rows: z.number().int().min(1).max(24),
  columns: z.number().int().min(2).max(32),
  /** Shown when finished. Must only restate claims. */
  completion: z.string().min(1),
  /** True while the steps are not backed by an approved technique claim. */
  illustrative: z.boolean().default(true),
});

/** Put steps in order. Each step cites a claim. */
export const sequenceActivitySchema = z
  .object({
    ...base,
    kind: z.literal("sequence"),
    prompt: z.string().min(1),
    steps: z
      .array(
        z.object({ id: idSchema, label: z.string().min(1), claimId: idSchema }),
      )
      .min(2),
    /** Step ids in the correct order. */
    order: z.array(idSchema).min(2),
    explanation: z.string().min(1),
  })
  .refine(
    (a) =>
      a.order.length === a.steps.length &&
      a.steps.every((s) => a.order.includes(s.id)),
    "Order must list every step once",
  );

export const activitySchema = z.discriminatedUnion("kind", [
  quizActivitySchema,
  weaveActivitySchema,
  sequenceActivitySchema,
]);
export type ActivityDefinition = z.infer<typeof activitySchema>;
export type ActivityInput = z.input<typeof activitySchema>;
export type ActivityKind = ActivityDefinition["kind"];
export type ActivityOf<K extends ActivityKind> = Extract<
  ActivityDefinition,
  { kind: K }
>;

export const activityResultSchema = z.object({
  activityId: idSchema,
  completed: z.boolean(),
  /** 0..1 where it makes sense (quiz correct = 1). */
  score: z.number().min(0).max(1).optional(),
  at: z.string(),
});
export type ActivityResult = z.infer<typeof activityResultSchema>;
