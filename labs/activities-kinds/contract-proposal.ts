// Contract proposal: three new activity kinds and one media reference.
// Additive only. Nothing here changes src/contracts on this branch.
// To adopt: copy the schemas into src/contracts/activity.ts, add them to
// `activitySchema`, move `checkActivityKinds` into validateContentPack
// (src/contracts/content.ts) and add tests (see HANDBACK.md).
import { z } from "zod";
import {
  idSchema,
  type KnowledgeEntry,
  type Source,
} from "@/contracts";

const base = {
  id: idSchema,
  knowledgeId: idSchema,
  title: z.string().min(1),
  claimIds: z.array(idSchema).min(1),
  artifactId: idSchema.optional(),
};

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

export const proposedActivitySchema = z.discriminatedUnion("kind", [
  storyActivitySchema,
  wordsActivitySchema,
  traceActivitySchema,
]);
export type ProposedActivity = z.infer<typeof proposedActivitySchema>;
export type ProposedOf<K extends ProposedActivity["kind"]> = Extract<
  ProposedActivity,
  { kind: K }
>;

// ---------------------------------------------------------------- rules

const allReviewed = (r: Term["review"]) =>
  r.spelling && r.region && r.meaning && r.pronunciation && r.consent;

function checkMedia(
  m: MediaRef,
  sources: Map<string, Source>,
  where: string,
  errors: string[],
) {
  if (m.kind !== "recording") return;
  const s = sources.get(m.sourceId);
  if (!s) return void errors.push(`${where}: unknown source ${m.sourceId}`);
  if (s.kind !== "audio")
    errors.push(`${where}: source ${s.id} is not an audio source`);
  if (s.rights !== "approved" || s.consent !== "granted")
    errors.push(`${where}: recording ${s.id} needs approved rights and consent`);
  if (s.placeholder) errors.push(`${where}: recording ${s.id} is a placeholder`);
}

/**
 * Cross-checks that a schema alone cannot do. Returns every problem.
 * Belongs in validateContentPack once adopted.
 */
export function checkActivityKinds(
  a: ProposedActivity,
  k: KnowledgeEntry,
): string[] {
  const errors: string[] = [];
  const claims = new Set(k.claims.map((c) => c.id));
  const cited = new Set(a.claimIds);
  const sources = new Map(k.sources.map((s) => [s.id, s]));
  const at = (p: string) => `${a.id}.${p}`;
  if (k.presentation === "withdrawn") errors.push(`${a.id}: entry withdrawn`);
  for (const c of a.claimIds)
    if (!claims.has(c)) errors.push(at(`claimIds: unknown claim ${c}`));

  if (a.kind === "story") {
    checkMedia(a.narrator.voice, sources, at("narrator"), errors);
    const chapters = new Set(a.chapters.map((c) => c.id));
    for (const ch of a.chapters) {
      for (const l of ch.lines)
        if (l.role === "fact")
          for (const c of l.claimIds)
            if (!cited.has(c))
              errors.push(at(`${ch.id}.${l.id}: claim ${c} not in claimIds`));
      for (const choice of ch.pause?.choices ?? []) {
        const act = choice.action;
        if (act.to === "chapter" && !chapters.has(act.chapterId))
          errors.push(at(`${choice.id}: unknown chapter ${act.chapterId}`));
        if (act.to === "reveal" && !cited.has(act.claimId))
          errors.push(at(`${choice.id}: claim ${act.claimId} not in claimIds`));
      }
    }
  }

  if (a.kind === "words") {
    for (const t of a.terms) {
      const where = at(`terms.${t.id}`);
      if (!cited.has(t.claimId))
        errors.push(`${where}: claim ${t.claimId} not in claimIds`);
      checkMedia(t.audio, sources, where, errors);
      if (t.lang.toLowerCase().startsWith("ja") && a.lang === "ain")
        errors.push(`${where}: Ainu is not a Japanese dialect (lang ${t.lang})`);
      if (a.standIn) {
        if (t.lang === a.lang)
          errors.push(`${where}: a stand-in term must not claim lang ${a.lang}`);
        continue;
      }
      // A real word: the gate the project rules ask for.
      if (k.presentation !== "approved")
        errors.push(`${where}: real terms need an approved entry`);
      if (!allReviewed(t.review))
        errors.push(`${where}: real terms need all five review checks`);
      if (t.audio.kind === "device-voice-placeholder")
        errors.push(`${where}: device voice must not read a real term`);
    }
  }
  return errors;
}
