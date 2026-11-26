// Speech to text for "Ask the owl" (ElevenLabs Scribe, server key only).
//   GET  -> { available }  (false without ELEVENLABS_API_KEY: the UI hides the mic)
//   POST multipart { audio, lang? } -> ProviderResult<{ text, lang }>
// The recording is sent to ElevenLabs for transcription and not stored here.
import { voiceMemoryProvider } from "@/integrations/voice-memory";
import { bad, lang } from "../../voice-memory/shared";

/** A spoken question is short; 2 MB is about 1 to 2 minutes of webm/opus. */
const MAX_QUESTION_AUDIO_BYTES = 2 * 1024 * 1024;

const live = () => voiceMemoryProvider().id === "elevenlabs";

export function GET() {
  return Response.json({ available: live() });
}

export async function POST(request: Request) {
  if (!live())
    return bad("Voice questions are not set up on this server.", 503);
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0)
    return bad("Attach an audio recording.");
  if (audio.size > MAX_QUESTION_AUDIO_BYTES)
    return bad("The recording is too long. Ask a shorter question.");
  const l = lang.safeParse(form?.get("lang"));
  const result = await voiceMemoryProvider().transcribe({
    audio,
    lang: l.success ? l.data : null,
  });
  return Response.json(result);
}
