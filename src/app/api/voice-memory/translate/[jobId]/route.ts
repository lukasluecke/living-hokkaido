import { voiceMemoryProvider } from "@/integrations/voice-memory";
import { bad, lang } from "../../shared";

/** Poll one translation job. ?lang=ja&clone=1 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const url = new URL(request.url);
  const l = lang.safeParse(url.searchParams.get("lang"));
  if (!l.success || !/^[\w-]{1,128}$/.test(jobId)) return bad("Invalid job.");
  const clone = url.searchParams.get("clone") === "1";
  return Response.json(
    await voiceMemoryProvider().checkTranslation(jobId, l.data, clone),
  );
}
