// "Ask the owl" (docs/ASK.md). The key stays here on the server. Every reply
// is checked against the content pack; any model or network problem falls
// back to the scripted answer, labelled as such.
import { defaultPack } from "@/content";
import {
  type AskAnswer,
  type AskRequest,
  askAnswerSchema,
  askRequestSchema,
} from "@/contracts";
import {
  checkAnswer,
  livePlan,
  parseLiveReply,
  scriptedAnswer,
} from "@/domain/ask";
import { chatModel } from "@/integrations/llm";
import {
  HERITAGE_DOMAINS,
  researchAvailable,
  suggestSources,
} from "@/integrations/research";

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
  const [answer, web] = await Promise.all([
    answerFor(req, request.signal),
    webLinks(req.question, request.signal),
  ]);
  return Response.json({ ...answer, web });
}

/** Linkup "read more" links. Links only; the model never sees them. */
async function webLinks(question: string, signal: AbortSignal) {
  if (!researchAvailable()) return [];
  const r = await suggestSources(
    `Ainu culture, Hokkaido heritage: ${question}`,
    process.env,
    signal,
    { includeDomains: HERITAGE_DOMAINS, timeoutMs: 8_000 },
  );
  return r.suggestions.slice(0, 3).map(({ name, url }) => ({ name, url }));
}

async function answerFor(
  req: AskRequest,
  signal: AbortSignal,
): Promise<AskAnswer> {
  const pack = defaultPack;
  const model = chatModel();
  if (!model)
    return scriptedAnswer(
      pack,
      req,
      "Scripted answer: no LLM key on the server (keyword match, no AI).",
    );

  const plan = livePlan(pack, req);
  const notice = `AI summary (${model.model}) of the cited claims. Research preview.`;
  try {
    // No claim fits: do not spend a model call to say "I don't know yet".
    if (plan.claims.size === 0)
      return scriptedAnswer(
        pack,
        req,
        "No museum claim fits this question, so the AI was not asked.",
      );
    const reply = await model.complete(plan.messages, signal);
    const answer = parseLiveReply(plan, reply, notice);
    if (answer) {
      const checked = askAnswerSchema.safeParse(checkAnswer(pack, answer));
      if (checked.success) return checked.data;
    }
    return scriptedAnswer(
      pack,
      req,
      "Scripted answer: the model reply did not pass the checks.",
    );
  } catch (err) {
    console.warn("[ask] live call failed:", (err as Error).message);
    return scriptedAnswer(
      pack,
      req,
      "Scripted answer: the model did not answer in time.",
    );
  }
}
