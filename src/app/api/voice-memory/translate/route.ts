import { translationGate } from "@/domain/voice-memory";
import { voiceMemoryProvider } from "@/integrations/voice-memory";
import { audioFrom, bad, translateFields } from "../shared";

/** Start one translation. Consent and the Ainu rule are checked here too. */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return bad("Send multipart form data.");
  const audio = audioFrom(form);
  if (typeof audio === "string") return bad(audio);
  const f = translateFields.safeParse(Object.fromEntries(form));
  if (!f.success) return bad("Missing or invalid fields.");
  const req = {
    audio,
    sourceLang: f.data.sourceLang,
    targetLang: f.data.targetLang,
    transcript: f.data.transcript,
    containsAinu: f.data.containsAinu,
    consent: {
      translation: f.data.translationConsent,
      voiceClone: f.data.voiceCloneConsent,
    },
  };
  const gate = translationGate(req);
  if (!gate.ok) return bad(gate.reason, 403);
  return Response.json(await voiceMemoryProvider().startTranslation(req));
}
