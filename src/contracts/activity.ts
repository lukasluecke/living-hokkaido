// Activity definitions. A part emits activity.complete when the visitor
// finishes (the activity stays open) and activity.close to leave.
// One discriminated union; each kind has one renderer
// (story, words and trace: prototypes in labs/activities-kinds)
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

/**
 * Where a voice or a sound comes from. Never a URL alone: a recording must
 * point to a source with approved rights and granted consent, so withdrawal
 * of that source removes the sound everywhere.
 */
export const mediaRefSchema = z.discriminatedUnion("kind", [
  /** No sound. Captions / text only. Always valid. */
  z.object({ kind: z.literal("none") }),
  /**
   * The browser's own speech engine reads the text. A placeholder only: the
   * UI must say "Device voice · placeholder" and it must never read Ainu.
   */
  z.object({ kind: z.literal("device-voice-placeholder") }),
  /** A real recording from a consenting person, held as a source. */
  z.object({
    kind: z.literal("recording"),
    sourceId: idSchema,
    /** Seconds into the source, as the evidence locator. */
    start: z.number().nonnegative().optional(),
    end: z.number().positive().optional(),
  }),
]);
export type MediaRef = z.infer<typeof mediaRefSchema>;

// ---------------------------------------------------------------- story

/**
 * A narrated story in chapters. A "fact" line restates claims and cites them.
 * A "frame" line only guides ("Look closely…") and states no cultural fact,
 * the same rule as owl guide lines. Pauses offer small choices that only
 * navigate (continue, jump, open the reveal); they never add facts.
 */
export const storyLineSchema = z.discriminatedUnion("role", [
  z.object({
    id: idSchema,
    role: z.literal("fact"),
    text: z.string().min(1),
    claimIds: z.array(idSchema).min(1),
  }),
  z.object({
    id: idSchema,
    role: z.literal("frame"),
    text: z.string().min(1),
  }),
]);

export const storyChoiceSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
  action: z.discriminatedUnion("to", [
    z.object({ to: z.literal("continue") }),
    z.object({ to: z.literal("chapter"), chapterId: idSchema }),
    z.object({ to: z.literal("reveal"), claimId: idSchema }),
  ]),
});

export const storyActivitySchema = z.object({
  ...base,
  kind: z.literal("story"),
  narrator: z.object({
    /** Who reads. "owl" = the fictional guide, never a cultural authority. */
    character: z.enum(["owl", "curator", "practitioner"]),
    /** Shown under the narrator, e.g. "Read by the owl guide". */
    credit: z.string().min(1),
    voice: mediaRefSchema,
  }),
  chapters: z
    .array(
      z.object({
        id: idSchema,
        title: z.string().min(1),
        lines: z.array(storyLineSchema).min(1),
        pause: z
          .object({
            prompt: z.string().min(1),
            choices: z.array(storyChoiceSchema).min(1).max(3),
          })
          .optional(),
      }),
    )
    .min(1),
  /** Shown at the end. Must only restate claims. */
  completion: z.string().min(1),
});

// ---------------------------------------------------------------- words

/** The five checks a qualified person signs off before a word is shown. */
export const termReviewSchema = z.object({
  spelling: z.boolean(),
  region: z.boolean(),
  meaning: z.boolean(),
  pronunciation: z.boolean(),
  consent: z.boolean(),
});

export const termSchema = z.object({
  id: idSchema,
  /** The word as shown. */
  text: z.string().min(1),
  /** BCP 47 tag. Ainu is "ain", its own language, never "ja-*". */
  lang: z.string().min(2),
  /** Short meaning in the visitor's language. */
  gloss: z.string().min(1),
  /** The object it names, for the match step. */
  artifactId: idSchema,
  /** Claim that backs the word and its meaning. */
  claimId: idSchema,
  audio: mediaRefSchema,
  review: termReviewSchema,
});
export type Term = z.infer<typeof termSchema>;

/**
 * Listen, repeat, match. `standIn: true` means the terms are English
 * stand-ins that only show the mechanic; the UI must say so.
 */
export const wordsActivitySchema = z.object({
  ...base,
  kind: z.literal("words"),
  /** Target language of the real activity, e.g. "ain". */
  lang: z.string().min(2),
  standIn: z.boolean(),
  prompt: z.string().min(1),
  steps: z.array(z.enum(["listen", "repeat", "match"])).min(1),
  terms: z.array(termSchema).min(2).max(8),
});

// ---------------------------------------------------------------- trace

/**
 * Follow the thread: match each claim to the source that backs it, then see
 * the locator, rights, consent and review state. Built only from the
 * knowledge entry, so it cannot invent anything.
 */
export const traceActivitySchema = z.object({
  ...base,
  kind: z.literal("trace"),
  prompt: z.string().min(1),
  completion: z.string().min(1),
});

export const activitySchema = z.discriminatedUnion("kind", [
  quizActivitySchema,
  weaveActivitySchema,
  sequenceActivitySchema,
  storyActivitySchema,
  wordsActivitySchema,
  traceActivitySchema,
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
