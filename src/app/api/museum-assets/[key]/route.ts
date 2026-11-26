// Streams one museum capture (src/integrations/museum-assets): a public
// key to everybody, a gated key only with the demo password cookie. HEAD answers the same status without
// the body, so the viewer can ask for the password before it loads.
import { defaultPack } from "@/content";
import {
  access,
  CONTENT_TYPE,
  findAsset,
  validKey,
} from "@/integrations/museum-assets";

export const dynamic = "force-dynamic";

/** Keys of captures whose activity is not gated (`asset.gated: false`). */
const PUBLIC_KEYS = new Set(
  defaultPack.activities.flatMap((a) =>
    a.kind === "splat-look" && !a.asset.gated ? [a.asset.key] : [],
  ),
);

const HEADERS = {
  "cache-control": "private, max-age=3600",
  "x-robots-tag": "noindex, nofollow, noarchive, noai, noimageai",
};

async function serve(
  request: Request,
  params: Promise<{ key: string }>,
  withBody: boolean,
) {
  const { key } = await params;
  if (!validKey(key))
    return new Response("Not found", { status: 404, headers: HEADERS });
  const a = await access(
    request,
    process.env.MUSEUM_ASSET_PASSWORD,
    PUBLIC_KEYS.has(key),
  );
  if (a === "off")
    return new Response("Museum assets are not set up here.", {
      status: 503,
      headers: HEADERS,
    });
  if (a === "locked")
    return new Response("Password required.", {
      status: 401,
      headers: HEADERS,
    });
  const file = await findAsset(key, withBody);
  if (!file)
    return new Response("Not found", { status: 404, headers: HEADERS });
  return new Response(withBody ? (file.body ?? null) : null, {
    status: 200,
    headers: {
      ...HEADERS,
      "content-type": CONTENT_TYPE,
      "content-length": String(file.size),
    },
  });
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
