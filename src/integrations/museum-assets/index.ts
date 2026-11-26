// Museum asset store: captures of museum material (the Omusha splat) that
// must never be in Git. A capture is public only when its activity says
// `asset.gated: false` (the Omusha splat, Lukas 2026-11-26). On Cloudflare they live in a
// private R2 bucket (binding MUSEUM_ASSETS); in `next dev` they may be read
// from the git-ignored folder `.museum-assets/`. A gated read needs the demo
// password (MUSEUM_ASSET_PASSWORD), sent once to /api/museum-assets/unlock,
// which sets an HttpOnly cookie. No password configured: gated keys are shut.
//
// Withdrawal: delete the object from the bucket (`wrangler r2 object delete
// living-hokkaido-museum/<key>`); the viewer then shows its list fallback.

export const COOKIE = "lh_museum";
const KEY_RE = /^[a-z0-9-]+\.(sog|spz|mp4|webm)$/;

/** Only plain file names of splat or video formats. No paths. */
export const validKey = (key: string) => KEY_RE.test(key);

/** Cookie value for a password: SHA-256 hex of a fixed prefix + password. */
export async function tokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode(`museum-assets:v1:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Same length and every char compared, so timing says little. */
export function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function readCookie(header: string | null, name: string): string {
  for (const part of (header ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return "";
}

export type Access = "open" | "locked" | "off";

/**
 * "open" without a password for a key the content pack marks as not gated
 * (`asset.gated: false`). Otherwise "off" when no password is set (the
 * store is shut for everybody), else the cookie decides.
 */
export async function access(
  request: Request,
  password: string | undefined,
  publicKey = false,
): Promise<Access> {
  if (publicKey) return "open";
  if (!password) return "off";
  const got = readCookie(request.headers.get("cookie"), COOKIE);
  return got && sameToken(got, await tokenFor(password)) ? "open" : "locked";
}

/** The part of R2's API this store uses. */
export type Bucket = {
  get(key: string): Promise<{ body: ReadableStream; size: number } | null>;
  head(key: string): Promise<{ size: number } | null>;
};

export type AssetFile = { size: number; body?: ReadableStream };

/** Finds the bucket binding on Cloudflare, or null in Node. */
async function bucket(): Promise<Bucket | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const b = (env as unknown as Record<string, unknown>).MUSEUM_ASSETS;
    return b ? (b as Bucket) : null;
  } catch {
    return null;
  }
}

/** Local folder, only in development (never on the Worker). */
async function local(
  key: string,
  withBody: boolean,
): Promise<AssetFile | null> {
  if (process.env.NODE_ENV !== "development") return null;
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { Readable } = await import("node:stream");
    const file = path.join(process.cwd(), ".museum-assets", key);
    const st = await fs.promises.stat(file);
    if (!st.isFile()) return null;
    return {
      size: st.size,
      body: withBody
        ? (Readable.toWeb(fs.createReadStream(file)) as ReadableStream)
        : undefined,
    };
  } catch {
    return null;
  }
}

export async function findAsset(
  key: string,
  withBody: boolean,
): Promise<AssetFile | null> {
  // Dev first: `next dev` may give an empty local R2 (wrangler proxy).
  const dev = await local(key, withBody);
  if (dev) return dev;
  const b = await bucket();
  if (b) {
    if (!withBody) return b.head(key);
    return b.get(key);
  }
  return null;
}
