// Checks the demo password for museum captures and sets an HttpOnly cookie
// (src/integrations/museum-assets). The password never goes to the client.
import { COOKIE, sameToken, tokenFor } from "@/integrations/museum-assets";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expected = process.env.MUSEUM_ASSET_PASSWORD;
  if (!expected)
    return Response.json(
      { error: "Museum assets are not set up here." },
      { status: 503 },
    );
  const raw = await request.text().catch(() => "");
  if (raw.length > 1_000)
    return Response.json({ error: "Request too large." }, { status: 413 });
  let password = "";
  try {
    const body: unknown = JSON.parse(raw);
    if (body && typeof body === "object" && "password" in body)
      password = String((body as { password: unknown }).password ?? "");
  } catch {}
  const token = await tokenFor(password);
  if (!sameToken(token, await tokenFor(expected)))
    return Response.json({ error: "Wrong password." }, { status: 401 });
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return Response.json(
    { ok: true },
    {
      headers: {
        "set-cookie": `${COOKIE}=${token}; Path=/api/museum-assets; HttpOnly; SameSite=Strict; Max-Age=2592000${secure}`,
      },
    },
  );
}
