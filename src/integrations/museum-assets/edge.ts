// Fast path for large public media (the Omusha splat, the intro video),
// used by the custom Worker entry (worker.ts) BEFORE OpenNext. Streaming an
// R2 body through a Next route handler (web → Node → web stream) ran at
// about 40 KB/s on Cloudflare; here the R2 body goes straight into the
// Response. Range requests get 206. Gated keys are not handled here: they
// fall through to the Next route, which checks the demo password.
//
// Framework-free: no Next, no OpenNext, no content import (worker.ts must
// stay small). tests/omusha.test.ts checks PUBLIC_MEDIA against the pack.

/** Keys served here without a password. Keep in sync with the pack. */
export const PUBLIC_MEDIA: ReadonlySet<string> = new Set([
  "omusha.sog",
  "intro.mp4",
  "intro.webm",
  // Story film for the Listening grove (content/bark-to-cloth/films.ts).
  "owl-story.mp4",
]);

const PREFIX = "/api/museum-assets/";

const TYPES: Record<string, string> = {
  sog: "application/octet-stream",
  spz: "application/octet-stream",
  mp4: "video/mp4",
  webm: "video/webm",
};

export const mediaType = (key: string) =>
  TYPES[key.split(".").pop() ?? ""] ?? "application/octet-stream";

/** The part of R2's API this path uses. */
export type R2Range = { offset: number; length?: number } | { suffix: number };
export type R2Body = {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  range?: { offset?: number; length?: number; suffix?: number };
};
export type R2Head = { size: number; httpEtag: string };
export type MediaBucket = {
  get(key: string, options?: { range?: R2Range }): Promise<R2Body | null>;
  head(key: string): Promise<R2Head | null>;
};

/** Parses one "bytes=a-b", "bytes=a-" or "bytes=-n" range. */
export function parseRange(header: string | null): R2Range | null {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? "");
  if (!m) return null;
  const [, a, b] = m;
  if (a === "" && b === "") return null;
  if (a === "") return { suffix: Number(b) };
  const offset = Number(a);
  if (b === "") return { offset };
  const end = Number(b);
  if (end < offset) return null;
  return { offset, length: end - offset + 1 };
}

/** The key, if this request is for public media; otherwise null. */
export function publicKey(request: Request): string | null {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const path = new URL(request.url).pathname;
  if (!path.startsWith(PREFIX)) return null;
  const key = decodeURIComponent(path.slice(PREFIX.length));
  return PUBLIC_MEDIA.has(key) ? key : null;
}

const baseHeaders = (key: string, etag: string) => ({
  "content-type": mediaType(key),
  "accept-ranges": "bytes",
  etag,
  "cache-control": "public, max-age=86400",
  "x-robots-tag": "noindex, nofollow, noarchive, noai, noimageai",
});

/**
 * Serves public media straight from R2, or returns null to fall through to
 * OpenNext (not public media, or no bucket bound).
 */
export async function serveMedia(
  request: Request,
  bucket: MediaBucket | undefined,
): Promise<Response | null> {
  const key = publicKey(request);
  if (!key || !bucket) return null;
  if (request.method === "HEAD") {
    const h = await bucket.head(key);
    if (!h) return new Response(null, { status: 404 });
    return new Response(null, {
      status: 200,
      headers: {
        ...baseHeaders(key, h.httpEtag),
        "content-length": String(h.size),
      },
    });
  }
  const range = parseRange(request.headers.get("range"));
  const obj = await bucket.get(key, range ? { range } : undefined);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers: Record<string, string> = baseHeaders(key, obj.httpEtag);
  if (!range) {
    headers["content-length"] = String(obj.size);
    return new Response(obj.body, { status: 200, headers });
  }
  const start =
    "suffix" in range
      ? Math.max(obj.size - range.suffix, 0)
      : Math.min(range.offset, obj.size);
  const len =
    "suffix" in range
      ? obj.size - start
      : Math.min(range.length ?? obj.size - start, obj.size - start);
  if (len <= 0) {
    return new Response(null, {
      status: 416,
      headers: { "content-range": `bytes */${obj.size}` },
    });
  }
  headers["content-length"] = String(len);
  headers["content-range"] = `bytes ${start}-${start + len - 1}/${obj.size}`;
  return new Response(obj.body, { status: 206, headers });
}
