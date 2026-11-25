import { voiceMemoryProvider } from "@/integrations/voice-memory";
import { audioFrom, bad, lang } from "../shared";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return bad("Send multipart form data.");
  const audio = audioFrom(form);
  if (typeof audio === "string") return bad(audio);
  const l = lang.safeParse(form.get("lang"));
  const result = await voiceMemoryProvider().transcribe({
    audio,
    lang: l.success ? l.data : null,
  });
  return Response.json(result);
}
