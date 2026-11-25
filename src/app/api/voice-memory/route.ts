import { voiceMemoryProvider } from "@/integrations/voice-memory";

export const dynamic = "force-dynamic";

/** Which provider is active. Never returns the key. */
export async function GET() {
  return Response.json({ provider: voiceMemoryProvider().id });
}
