// Request parsing for the voice-memory routes. Bounded sizes, zod at the edge.
import { z } from "zod";
import { MAX_MEMORY_AUDIO_BYTES } from "@/domain/voice-memory";

const lang = z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/);
const consent = z.enum(["pending", "granted", "declined", "withdrawn"]);

export const translateFields = z.object({
  sourceLang: lang,
  targetLang: lang,
  transcript: z.string().min(1).max(20_000),
  containsAinu: z.enum(["true", "false"]).transform((v) => v === "true"),
  translationConsent: consent,
  voiceCloneConsent: consent,
});

export function audioFrom(form: FormData): Blob | string {
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0)
    return "Attach an audio recording.";
  if (audio.size > MAX_MEMORY_AUDIO_BYTES)
    return "The recording is too large (25 MB maximum).";
  return audio;
}

export const bad = (notice: string, status = 400) =>
  Response.json({ mode: "unavailable", value: null, notice }, { status });

export { lang };
