// Source ingestion (docs/INGEST.md). Keys stay here on the server. The model
// drafts cited claims and one quiz; every claim's quote is checked against
// the source text. With ORCAROUTER_API_KEY the model call goes through the
// OrcaRouter gateway and its guardrails; without it, only the local rules
// run. Any model, guard or network problem falls back to the deterministic
// mock draft, labelled as such. Nothing is stored and nothing is approved
// here: approval is a human step in the contributor studio.
import {
  type IngestDraft,
  ingestMessages,
  ingestRequestSchema,
  mockDraft,
  parseIngestReply,
} from "@/domain/ingest";
import { guardedModel, guardStatus } from "@/integrations/guard";
import { chatModel } from "@/integrations/llm";
import { researchAvailable } from "@/integrations/research";

export const dynamic = "force-dynamic";

const model = () => guardedModel() ?? chatModel();

/** Which mode is active. Never returns a key. */
export async function GET() {
  const m = model();
  return Response.json({
    live: !!m,
    provider: m?.id ?? "none",
    model: m?.model ?? null,
    guard: guardStatus(),
    research: researchAvailable(),
  });
}

export async function POST(request: Request) {
  const raw = await request.text().catch(() => "");
  if (raw.length > 12_000)
    return Response.json(
      { error: "Source too large (8,000 characters maximum)." },
      { status: 413 },
    );
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {}
  const parsed = ingestRequestSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      {
        error:
          "Give a source title, a locator and 20 to 8,000 characters of source text.",
      },
      { status: 400 },
    );
  const req = parsed.data;
  const m = model();
  const guard = guardStatus();
  const reply = (d: IngestDraft) => Response.json({ ...d, guard });
  if (!req.allowAi)
    return reply(
      mockDraft(
        req,
        "Mock draft: you did not allow AI processing. Each claim is one sentence of the source.",
      ),
    );
  if (!m)
    return reply(
      mockDraft(
        req,
        "Mock draft: no AI model on the server. Each claim is one sentence of the source.",
      ),
    );
  try {
    const text = await m.complete(ingestMessages(req), request.signal, {
      maxTokens: 2_000,
      timeoutMs: 40_000,
    });
    const draft = parseIngestReply(
      req,
      text,
      `AI draft (${m.model}${guard.active ? ", via OrcaRouter" : ""}). Unverified: check every claim against the source.`,
    );
    if (draft) return reply(draft);
    return reply(
      mockDraft(req, "Mock draft: the AI reply did not pass the quote check."),
    );
  } catch (err) {
    const msg = (err as Error).message;
    console.warn("[ingest] live call failed:", msg);
    const http = /HTTP (\d{3})/.exec(msg)?.[1];
    return reply(
      mockDraft(
        req,
        guard.active && http
          ? `Mock draft: OrcaRouter blocked or refused the request (HTTP ${http}). Check the source for instructions.`
          : "Mock draft: the AI model did not answer in time.",
      ),
    );
  }
}
