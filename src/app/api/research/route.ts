// Source suggestions for the reviewer (docs/INGEST.md), via Linkup. Returns
// links only. A suggestion never becomes a claim or a citation by itself.
import { z } from "zod";
import { suggestSources } from "@/integrations/research";

export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  claims: z.array(z.string().max(400)).max(6).default([]),
  /** The contributor allows this text to go to external services. */
  allowAi: z.literal(true),
});

export async function POST(request: Request) {
  const raw = await request.text().catch(() => "");
  if (raw.length > 4_000)
    return Response.json({ error: "Request too large." }, { status: 413 });
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {}
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      { error: "Give a title, and allow external processing first." },
      { status: 400 },
    );
  const { title, claims } = parsed.data;
  const q = `Sources about: ${title}. ${claims.join(" ")}`.slice(0, 500);
  return Response.json(await suggestSources(q, process.env, request.signal));
}
