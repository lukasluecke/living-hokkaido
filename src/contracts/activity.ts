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
  /**
   * The story's refrain (sakehe) comes back here. Shows `refrain` of the
   * activity; the device voice never reads it.
   */
  z.object({
    id: idSchema,
    role: z.literal("refrain"),
  }),
]);

/** A refrain taken from a named teller's performance, as the source writes it. */
export const storyRefrainSchema = z.object({
  text: z.string().min(1),
  romanised: z.string().optional(),
  /** BCP 47 tag, e.g. "ain". */
  lang: z.string().min(2),
  /** Who it belongs to, e.g. the teller and the source. */
  credit: z.string().min(1),
  claimId: idSchema,
});

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
  /** Optional refrain, shown by "refrain" lines. */
  refrain: storyRefrainSchema.optional(),
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

// ---------------------------------------------------------------- map

/**
 * Places on a stylised figure (a sketch map of Hokkaido or a house plan).
 * "explore": open every spot to see its word. "match": pick a word and
 * put it on its spot. Figures are drawn by the renderer and are sketches,
 * not survey maps; spot positions are design guesses unless a claim backs
 * them, so `placeholder` defaults to true.
 */
export const mapSpotSchema = z.object({
  id: idSchema,
  /** Position on the figure, 0..1 from the left and from the top. */
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  /** The word as written by the source (e.g. katakana). */
  text: z.string().min(1),
  /** A Latin spelling, if any. */
  romanised: z.string().optional(),
  /** BCP 47 tag. Ainu is "ain", never "ja-*". */
  lang: z.string().min(2),
  /** What the word means or names, in the visitor's language. */
  gloss: z.string().min(1),
  /** Where it is used (region / dialect), shown with the word. */
  region: z.string().optional(),
  claimId: idSchema,
});
export type MapSpot = z.infer<typeof mapSpotSchema>;

export const mapActivitySchema = z.object({
  ...base,
  kind: z.literal("map"),
  figure: z.enum(["hokkaido", "cise-plan"]),
  mode: z.enum(["explore", "match"]),
  prompt: z.string().min(1),
  /** Shown when every spot is open or matched. Must only restate claims. */
  completion: z.string().min(1),
  spots: z.array(mapSpotSchema).min(2).max(16),
  placeholder: z.boolean().default(true),
});

// ---------------------------------------------------------------- board

/**
 * A documented, non-sacred game played against the owl guide or by two
 * people on one device. The rules live in the renderer, one per `game`,
 * and `rulesClaimId` is the claim that records them.
 */
export const boardActivitySchema = z.object({
  ...base,
  kind: z.literal("board"),
  /** stick-grid: three sticks each on a 田 grid (Hokkaido Museum, Q021). */
  game: z.literal("stick-grid"),
  prompt: z.string().min(1),
  rulesClaimId: idSchema,
  /** Shown when a game ends. Must only restate claims. */
  completion: z.string().min(1),
  opponent: z.enum(["owl", "two-players"]).default("owl"),
});

// ---------------------------------------------------------------- music

/**
 * Canon (ukouk structure): voices enter one after another on a shared beat.
 * The visitor brings in each voice on its mark. Sound is a synthetic
 * illustration of the structure, never the song or a recording; the words
 * shown are the source's text with their claim.
 */
export const canonActivitySchema = z.object({
  ...base,
  kind: z.literal("canon"),
  prompt: z.string().min(1),
  completion: z.string().min(1),
  voices: z
    .array(z.object({ id: idSchema, label: z.string().min(1) }))
    .min(2)
    .max(4),
  /** Beats between one voice's entry and the next. */
  offset: z.number().int().min(1).max(8).default(1),
  /** Length of the looped pattern, in beats. */
  beats: z.number().int().min(4).max(32).default(8),
  /** Claim that describes the structure (voices, entries). */
  structureClaimId: idSchema,
  /** Song words as the source writes them, each with its claim. */
  lyrics: z
    .array(
      z.object({
        text: z.string().min(1),
        lang: z.string().min(2),
        claimId: idSchema,
      }),
    )
    .default([]),
});

/**
 * Pluck a stringed instrument (tonkori mechanics): open strings, each with
 * a gauge and the hands that play it, and an optional short tab. Tones are
 * synthetic and illustrative, not the instrument's tuning.
 */
export const pluckActivitySchema = z
  .object({
    ...base,
    kind: z.literal("pluck"),
    prompt: z.string().min(1),
    completion: z.string().min(1),
    strings: z
      .array(
        z.object({
          id: idSchema,
          gauge: z.enum(["thick", "medium", "thin"]),
          hands: z.array(z.enum(["left", "right"])).min(1),
        }),
      )
      .min(2)
      .max(8),
    stringsClaimId: idSchema,
    tune: z
      .object({
        title: z.string().min(1),
        /** 1-based string numbers, with the hand that plucks each. */
        notes: z
          .array(
            z.object({
              string: z.number().int().min(1),
              hand: z.enum(["left", "right"]),
            }),
          )
          .min(1),
        /** Phrase lengths for display, e.g. [2, 2, 1, 2]. */
        groups: z.array(z.number().int().min(1)).default([]),
        claimId: idSchema,
      })
      .optional(),
  })
  .refine(
    (a) => !a.tune || a.tune.notes.every((n) => n.string <= a.strings.length),
    "Tune notes must name existing strings",
  );

// ---------------------------------------------------------------- games

/**
 * Hide and seek in an illustrated historical scene ("Out of Place", vendored
 * from erinalin/out-of-place, see vendor/README.md). One visitor hides Nuri
 * (an original clay figure) by painting it with colours sampled from the
 * scene; a second visitor on the same device looks for it. The reveal shows
 * what in the scene is period-accurate and what is not there yet, each line
 * from a claim. Same shape as the game's own contract-proposal.ts.
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
    /** Only pass-and-play (no network play in the visitor app). */
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

/**
 * Slide down an icy street without touching anything ("Don't Fall on the
 * Slope", vendored from erinalin/dont-fall-on-the-slope). A 3D physics game;
 * the street is generic and illustrative, never a reconstruction. The game
 * shows no history text yet; claims are shown beside it by the renderer.
 */
export const slopeRunActivitySchema = z.object({
  ...base,
  kind: z.literal("slope-run"),
  /** How to play. Frame text only: it states no historical fact. */
  prompt: z.string().min(1),
  /** Shown when a run ends. Must only restate claims. */
  completion: z.string().min(1),
  /** Street layout seed. Same seed, same street. */
  seed: z.number().int().nonnegative().optional(),
  /** True while the street is not backed by an approved reconstruction. */
  illustrative: z.boolean().default(true),
});

// ---------------------------------------------------------------- place

/**
 * Build the scene (labs/activities-scene): a guided story, one step at a
 * time. A step says one cited fact (captions + device voice), then hands
 * over ONE figure or thing with a clue. The visitor puts it on one of 2–3
 * rings and, for people, picks a pose from the pose sheet; then the step
 * restates its claim. Figures are named by their look ("Straw hat"), never
 * with a personal name. Ainu scenes use `subject: "objects"` (no posed Ainu
 * figures). `observed: true` marks a step backed only by what a museum
 * diorama shows, not by panel text (weaker source; the UI says so).
 */
export const placePoseSchema = z.enum([
  "stand",
  "watch",
  "survey",
  "carry",
  "saw",
  "tent",
  "lead",
  "net",
  "rake",
  "shovel",
  "drill",
  "sleigh",
]);
export type PlacePose = z.infer<typeof placePoseSchema>;

export const placeStepSchema = z
  .object({
    id: idSchema,
    /** One fact, restating the claims below. Read aloud by the device voice. */
    say: z.string().min(1),
    claimIds: z.array(idSchema).min(1),
    observed: z.boolean().default(false),
    /** Switches the stage to this season from this step on. */
    season: z.enum(["summer", "winter"]).optional(),
    /** The clue question. Required with a figure. */
    ask: z.string().min(1).optional(),
    figure: z
      .object({
        label: z.string().min(1),
        note: z.string().optional(),
        /** People: hat and colour, so every figure looks different. */
        hat: z.enum(["cap", "straw", "band", "hood", "helmet"]).optional(),
        colour: z.string().optional(),
        /** Things: which drawing (objects scenes only). */
        thing: z
          .enum(["cattail", "bark", "mortar", "pot", "weave", "fish"])
          .optional(),
      })
      .optional(),
    /** Rings, 0..1 from the left and from the top of the stage. One is right. */
    options: z
      .array(
        z.object({
          x: z.number().min(0).max(1),
          y: z.number().min(0).max(1),
          right: z.boolean().default(false),
        }),
      )
      .default([]),
    pose: placePoseSchema.optional(),
    poses: z.array(placePoseSchema).default([]),
    hintPlace: z.string().optional(),
    hintPose: z.string().optional(),
    /** Shown after the step is done. Must only restate the claims. */
    why: z.string().optional(),
  })
  .refine(
    (s) =>
      !s.figure ||
      (Boolean(s.ask) &&
        s.options.filter((o) => o.right).length === 1 &&
        (!s.pose || s.poses.includes(s.pose))),
    "A step with a figure needs a clue, exactly one right ring, and its pose on the sheet",
  );

export const placeActivitySchema = z.object({
  ...base,
  kind: z.literal("place"),
  /** Which drawn stage the renderer shows. Illustrative sketches. */
  stage: z.enum(["survey-camp", "herring-yard", "cise", "mine-forest"]),
  subject: z.enum(["people", "objects"]),
  /** Season at the start (mine-forest switches at a step). */
  season: z.enum(["summer", "winter"]).default("summer"),
  steps: z.array(placeStepSchema).min(2),
  /** Shown at the end. Must only restate claims. */
  completion: z.string().min(1),
  illustrative: z.literal(true).default(true),
});

export const activitySchema = z.discriminatedUnion("kind", [
  quizActivitySchema,
  weaveActivitySchema,
  sequenceActivitySchema,
  storyActivitySchema,
  wordsActivitySchema,
  traceActivitySchema,
  mapActivitySchema,
  boardActivitySchema,
  canonActivitySchema,
  pluckActivitySchema,
  hideSeekActivitySchema,
  slopeRunActivitySchema,
  placeActivitySchema,
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
