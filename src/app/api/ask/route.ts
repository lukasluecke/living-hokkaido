// "Ask the owl" (docs/ASK.md). The key stays here on the server. Every reply
// is checked against the content pack; any model or network problem falls
// back to the scripted answer, labelled as such.
import { defaultPack } from "@/content";
import { askAnswerSchema, askRequestSchema } from "@/contracts";
import {
  checkAnswer,
  livePlan,
  parseLiveReply,
  scriptedAnswer,
} from "@/domain/ask";
import { chatModel } from "@/integrations/llm";

export const dynamic = "force-dynamic";

/** Which mode is active. Never returns the key. */
export async function GET() {
  const m = chatModel();
  return Response.json({
    live: !!m,
    provider: m?.id ?? "none",
    model: m?.model ?? null,
  });
}

export async function POST(request: Request) {
  const raw = await request.text().catch(() => "");
  if (raw.length > 4_000)
    return Response.json({ error: "Request too large." }, { status: 413 });
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {}
  const parsed = askRequestSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      { error: "Ask a question of 2 to 300 characters." },
      { status: 400 },
    );
  const req = parsed.data;
  const pack = defaultPack;
  const model = chatModel();
  if (!model)
    return Response.json(
      scriptedAnswer(
        pack,
        req,
        "Scripted answer: no LLM key on the server (keyword match, no AI).",
      ),
    );

  const plan = livePlan(pack, req);
  const notice = `AI summary (${model.model}) of the cited claims. Research preview.`;
  try {
    // No claim fits: do not spend a model call to say "I don't know yet".
    if (plan.claims.size === 0)
      return Response.json(
        scriptedAnswer(
          pack,
          req,
          "No museum claim fits this question, so the AI was not asked.",
        ),
      );
    const reply = await model.complete(plan.messages, request.signal);
    const answer = parseLiveReply(plan, reply, notice);
    if (answer) {
      const checked = askAnswerSchema.safeParse(checkAnswer(pack, answer));
      if (checked.success) return Response.json(checked.data);
    }
    return Response.json(
      scriptedAnswer(
        pack,
        req,
        "Scripted answer: the model reply did not pass the checks.",
      ),
    );
  } catch (err) {
    console.warn("[ask] live call failed:", (err as Error).message);
    return Response.json(
      scriptedAnswer(
        pack,
        req,
        "Scripted answer: the model did not answer in time.",
      ),
    );
  }
}
