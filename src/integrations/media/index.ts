// Public media store for short AI-generated clips (PixVerse). Not museum
// material: generated from text prompts for this demo, so no password. On
// Cloudflare the clips live in the R2 bucket bound as MUSEUM_ASSETS (next to
// the splat); in `next dev` they may be read from `.museum-assets/`.
import { clipKeySchema } from "@/contracts";

export const validClipKey = (key: string) =>
  clipKeySchema.safeParse(key).success;

export type Range = { offset: number; length: number };
export type MediaFile = { size: number; body?: ReadableStream; range?: Range };

type R2Like = {
  get(
    key: string,
    opts?: { range?: Range },
  ): Promise<{ body: ReadableStream; size: number } | null>;
  head(key: string): Promise<{ size: number } | null>;
};

async function bucket(): Promise<R2Like | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const b = (env as unknown as Record<string, unknown>).MUSEUM_ASSETS;
    return b ? (b as R2Like) : null;
  } catch {
    return null;
  }
}

/** Parses "bytes=a-b" against a known size. Null = whole file. */
export function parseRange(
  header: string | null,
  size: number,
): Range | null | "bad" {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return "bad";
  let start: number;
  let end: number;
  if (m[1] === "") {
    const n = Number(m[2]);
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start > end || start >= size) return "bad";
  return { offset: start, length: end - start + 1 };
}

async function local(key: string, range: Range | null, withBody: boolean) {
  if (process.env.NODE_ENV !== "development") return null;
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { Readable } = await import("node:stream");
    const file = path.join(process.cwd(), ".museum-assets", key);
    const st = await fs.promises.stat(file);
    if (!st.isFile()) return null;
    const opts = range
      ? { start: range.offset, end: range.offset + range.length - 1 }
      : {};
    return {
      size: st.size,
      body: withBody
        ? (Readable.toWeb(fs.createReadStream(file, opts)) as ReadableStream)
        : undefined,
    };
  } catch {
    return null;
  }
}

/** Size of a clip, or null when it is not there. */
export async function clipSize(key: string): Promise<number | null> {
  const b = await bucket();
  const r = b ? await b.head(key) : null;
  if (r) return r.size;
  return (await local(key, null, false))?.size ?? null;
}

export async function readClip(
  key: string,
  range: Range | null,
): Promise<ReadableStream | null> {
  const b = await bucket();
  const o = b ? await b.get(key, range ? { range } : undefined) : null;
  if (o) return o.body;
  return (await local(key, range, true))?.body ?? null;
}
