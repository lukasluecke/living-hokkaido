// Provider contract for curator voice memories: transcribe the original,
// then translate it into a visitor language with a matching or stock voice.
// Framework-free. The live adapter runs on the server only.
import type { ProviderResult } from "./contracts";

export type ConsentState = "pending" | "granted" | "declined" | "withdrawn";

export type TranscribeRequest = {
  audio: Blob;
  /** BCP 47 tag the curator chose, or null to detect. */
  lang: string | null;
};
export type Transcript = { text: string; lang: string };

export type TranslateRequest = {
  audio: Blob;
  sourceLang: string;
  targetLang: string;
  /** Curator-checked transcript of the original. */
  transcript: string;
  containsAinu: boolean;
  consent: { translation: ConsentState; voiceClone: ConsentState };
};

export type TranslateJob = {
  jobId: string;
  targetLang: string;
  status: "running" | "done" | "failed";
  /** Seconds the provider expects the job to take, if known. */
  expectedSec?: number;
  result?: {
    text: string;
    /** data: URL of the synthetic audio, or null for text only. */
    audioDataUrl: string | null;
    voice: "cloned" | "stock" | "none";
  };
};

export interface VoiceMemoryProvider {
  readonly id: "mock" | "elevenlabs";
  transcribe(
    req: TranscribeRequest,
  ): Promise<ProviderResult<Transcript | null>>;
  startTranslation(
    req: TranslateRequest,
  ): Promise<ProviderResult<TranslateJob | null>>;
  /** cloneAllowed = what startTranslation was allowed to do (labels the voice). */
  checkTranslation(
    jobId: string,
    targetLang: string,
    cloneAllowed: boolean,
  ): Promise<ProviderResult<TranslateJob | null>>;
}

const base = (lang: string) => lang.toLowerCase().split("-")[0];
export const isAinuLang = (lang: string) => base(lang) === "ain";

export type GateResult =
  | { ok: true; allowClone: boolean; reviewNeeded: boolean }
  | { ok: false; reason: string };

/**
 * Consent and language gate. Runs in the browser and again on the server
 * before any provider call. Prototype: Ainu content is allowed and only
 * flagged (reviewNeeded) for the later review pass in docs/REVIEW.md.
 */
export function translationGate(
  r: Pick<
    TranslateRequest,
    "sourceLang" | "targetLang" | "containsAinu" | "consent"
  >,
): GateResult {
  if (r.consent.translation !== "granted")
    return {
      ok: false,
      reason: "The speaker has not granted translation consent.",
    };
  if (base(r.sourceLang) === base(r.targetLang))
    return {
      ok: false,
      reason: "Choose a language that differs from the original.",
    };
  return {
    ok: true,
    allowClone: r.consent.voiceClone === "granted",
    reviewNeeded:
      isAinuLang(r.sourceLang) || isAinuLang(r.targetLang) || r.containsAinu,
  };
}

/** Upper limit for one recording sent to a provider (bytes). */
export const MAX_MEMORY_AUDIO_BYTES = 25_000_000;
