// Streams one AI-generated clip (src/integrations/media) with byte ranges,
// so a <video> can seek. Public: the clips are not museum material.
import {
  clipSize,
  parseRange,
  readClip,
  validClipKey,
} from "@/integrations/media";

export const dynamic = "force-dynamic";

const HEADERS = {
  "cache-control": "public, max-age=86400",
  "accept-ranges": "bytes",
  "x-robots-tag": "noindex, noai, noimageai",
};

async function serve(
  request: Request,
  params: Promise<{ key: string }>,
  withBody: boolean,
) {
  const { key } = await params;
  if (!validClipKey(key))
    return new Response("Not found", { status: 404, headers: HEADERS });
  const size = await clipSize(key);
  if (size === null)
    return new Response("Not found", { status: 404, headers: HEADERS });
  const range = parseRange(request.headers.get("range"), size);
  if (range === "bad")
    return new Response("Range not satisfiable", {
      status: 416,
      headers: { ...HEADERS, "content-range": `bytes */${size}` },
    });
  const body = withBody ? await readClip(key, range) : null;
  if (withBody && !body)
    return new Response("Not found", { status: 404, headers: HEADERS });
  const headers: Record<string, string> = {
    ...HEADERS,
    "content-type": "video/mp4",
    "content-length": String(range ? range.length : size),
  };
  if (range)
    headers["content-range"] =
      `bytes ${range.offset}-${range.offset + range.length - 1}/${size}`;
  return new Response(body, { status: range ? 206 : 200, headers });
}

export function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  return serve(request, params, true);
}

export function HEAD(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  return serve(request, params, false);
}
