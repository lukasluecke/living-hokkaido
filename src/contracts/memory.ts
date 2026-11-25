// Curator voice memories: an authorized curator records a memory or context
// about one artifact in their own language. Visitors can play the original
// and, where consent allows, a machine translation in a voice that matches
// the speaker (a consented voice clone) or a stock voice.
//
// Rules (checked here and in validateContentPack):
// - The original recording stays playable. A translation never replaces it.
// - Every translation is labelled: "machine" until a named person checks it.
// - A cloned voice needs the speaker's explicit voice-clone consent.
// - Any translation needs the speaker's translation consent (a placeholder
//   sample has no speaker and is exempt; it can never use a cloned voice).
// - Prototype (Lukas, 2026-11-25): review gates are open. Ainu content may be
//   machine-translated now; `needsReview` flags it quietly as a draft and
//   docs/REVIEW.md lists the review pass. Voice-clone consent stays enforced.
// - Withdrawn consent or a withdrawn review hides the memory everywhere.
import { z } from "zod";
import { idSchema } from "./ids";

/** BCP 47 language tag, simple form: "ja", "en", "ain", "zh-Hant", "pt-BR". */
export const langTagSchema = z
  .string()
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "Use a BCP 47 tag such as ja");

/** Ainu is "ain". It is a distinct language, never a Japanese variety. */
export const isAinu = (lang: string) =>
  lang.toLowerCase().split("-")[0] === "ain";

export const memoryAudioSchema = z.discriminatedUnion("kind", [
  /** No audio file. Text only. */
  z.object({ kind: z.literal("none") }),
  /** A real file (public/ path or storage URL). Never invent one. */
  z.object({
    kind: z.literal("file"),
    url: z.string().min(1),
    mime: z.string().optional(),
    durationSec: z.number().positive().optional(),
  }),
]);
export type MemoryAudio = z.infer<typeof memoryAudioSchema>;

export const memoryVoiceSchema = z.enum([
  /** Synthetic voice cloned from this speaker. Needs voice-clone consent. */
  "cloned",
  /** A provider's stock voice. Not the speaker. */
  "stock",
  /** No synthetic audio. Text only. */
  "none",
]);
export type MemoryVoice = z.infer<typeof memoryVoiceSchema>;

export const memoryTranslationSchema = z.object({
  lang: langTagSchema,
  text: z.string().min(1),
  audio: memoryAudioSchema.default({ kind: "none" }),
  voice: memoryVoiceSchema.default("none"),
  /** "machine" until a named person checks it, then "human-checked". */
  mode: z.enum(["machine", "human-checked"]).default("machine"),
  /** "mock" for the offline demo, "elevenlabs" for the live adapter. */
  provider: z.string().min(1),
  createdAt: z.string().min(1),
  checkedBy: z.string().optional(),
});
export type MemoryTranslation = z.infer<typeof memoryTranslationSchema>;

export const consentValueSchema = z.enum([
  "pending",
  "granted",
  "declined",
  "withdrawn",
]);
export type ConsentValue = z.infer<typeof consentValueSchema>;

/** The speaker's consent, recorded per memory. Production keeps a signed or
 *  spoken record under recordId in private storage, with a withdrawal path. */
export const memoryConsentSchema = z.object({
  /** Keep and play the recording for visitors. */
  recording: consentValueSchema,
  /** Translate the words into other languages. */
  translation: consentValueSchema,
  /** Make a synthetic copy of this voice for the translations. */
  voiceClone: consentValueSchema,
  recordId: z.string().min(1),
  recordedAt: z.string().min(1),
  method: z.enum(["spoken", "written", "form"]),
});
export type MemoryConsent = z.infer<typeof memoryConsentSchema>;

export const voiceMemorySchema = z
  .object({
    id: idSchema,
    artifactId: idSchema,
    knowledgeId: idSchema,
    /** Short UI heading, for example "Why this cloth matters to me". */
    title: z.string().min(1),
    curator: z.object({
      name: z.string().min(1),
      role: z.string().min(1),
      /** Record that authorizes this person as a curator. */
      authorizationId: z.string().min(1),
    }),
    /** Sample made by the team, no real curator or recording. UI says so. */
    placeholder: z.boolean().default(false),
    /** Language of the original recording. */
    lang: langTagSchema,
    /** True if an otherwise non-Ainu memory contains Ainu words. */
    containsAinu: z.boolean().default(false),
    /** Audio source in the knowledge entry (kind "audio"). */
    sourceId: z.string().min(1),
    audio: memoryAudioSchema,
    transcript: z.string().min(1),
    transcriptMode: z
      .enum(["curator-typed", "machine", "human-checked"])
      .default("curator-typed"),
    consent: memoryConsentSchema,
    review: z
      .object({
        status: z.enum(["unreviewed", "approved", "withdrawn"]),
        reviewer: z.string().optional(),
        reviewedAt: z.string().optional(),
      })
      .default({ status: "unreviewed" }),
    translations: z.array(memoryTranslationSchema).default([]),
  })
  .superRefine((m, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    if (
      m.review.status === "approved" &&
      (!m.review.reviewer || !m.review.reviewedAt)
    )
      issue(["review"], "Approved memories need a reviewer and a review date");
    const seen = new Set<string>();
    m.translations.forEach((t, i) => {
      if (seen.has(t.lang))
        issue(["translations", i], `Duplicate translation ${t.lang}`);
      seen.add(t.lang);
      if (t.lang === m.lang)
        issue(["translations", i], "A translation needs a different language");
      if (m.consent.translation !== "granted" && !m.placeholder)
        issue(
          ["translations", i],
          "Translations need granted translation consent",
        );
      if (t.voice === "cloned" && m.consent.voiceClone !== "granted")
        issue(
          ["translations", i],
          "A cloned voice needs granted voice-clone consent",
        );
      if (t.mode === "human-checked" && !t.checkedBy)
        issue(["translations", i], "A checked translation needs checkedBy");
    });
  });
export type VoiceMemory = z.infer<typeof voiceMemorySchema>;
export type VoiceMemoryInput = z.input<typeof voiceMemorySchema>;

/** True when a visitor may see and hear the memory. */
export const isMemoryVisible = (m: VoiceMemory) =>
  m.review.status !== "withdrawn" &&
  m.consent.recording !== "withdrawn" &&
  (m.placeholder || m.consent.recording === "granted");

/** Ainu content, or a translation into Ainu, that no reviewer checked yet.
 *  Shown as a quiet draft label; listed in docs/REVIEW.md. */
export const needsReview = (m: VoiceMemory, t?: MemoryTranslation | null) =>
  (isAinu(m.lang) || m.containsAinu || (!!t && isAinu(t.lang))) &&
  (m.review.status !== "approved" || (!!t && t.mode !== "human-checked"));

/** Visible memories for one artifact, in pack order. */
export const memoriesForArtifact = (
  memories: readonly VoiceMemory[],
  artifactId: string,
) => memories.filter((m) => m.artifactId === artifactId && isMemoryVisible(m));

/**
 * Best translation for the visitor's languages (most preferred first).
 * Matches the full tag, then the base language. null = play the original.
 * Translations whose consent is no longer granted are skipped.
 */
export function pickTranslation(
  m: VoiceMemory,
  preferred: readonly string[],
): MemoryTranslation | null {
  if (m.consent.translation !== "granted" && !m.placeholder) return null;
  const usable = m.translations.filter(
    (t) => t.voice !== "cloned" || m.consent.voiceClone === "granted",
  );
  const base = (l: string) => l.toLowerCase().split("-")[0];
  for (const p of preferred) {
    if (base(p) === base(m.lang)) return null;
    const exact = usable.find((t) => t.lang.toLowerCase() === p.toLowerCase());
    if (exact) return exact;
    const near = usable.find((t) => base(t.lang) === base(p));
    if (near) return near;
  }
  return null;
}
