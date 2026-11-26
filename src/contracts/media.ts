// Short video clips (AI-generated with PixVerse from text prompts). Stored in
// R2, served by /api/media/<key>, loaded only when a visitor taps "Watch".
// A clip never states facts: its prompt only restates cited claims, and the
// note says it is AI-imagined, not historical footage.
import { z } from "zod";

export const clipKeySchema = z.string().regex(/^[a-z0-9-]+\.mp4$/);

export const clipSchema = z.object({
  /** Object key in the media bucket, for example "era-3-cise.mp4". */
  key: clipKeySchema,
  /** Button and player label ("Watch the river mouth in this era"). */
  title: z.string().min(1),
  /** Honesty note under the player. Shown unless model labels are hidden. */
  note: z.string().min(1),
  /** Tool and input, for example "PixVerse V6, text prompt". */
  tool: z.string().min(1),
  /** True when the clip has an ambient sound track. */
  audio: z.boolean().default(false),
  seconds: z.number().positive().default(5),
});
export type Clip = z.infer<typeof clipSchema>;
export type ClipInput = z.input<typeof clipSchema>;

/**
 * Where a longer story film plays from. "none" = not uploaded yet (the
 * player shows a "coming soon" poster). "r2" = public key in the museum
 * bucket, served by worker.ts at /api/museum-assets/<key> (add the key to
 * PUBLIC_MEDIA). "youtube" = an 11-character video id, embedded from
 * youtube-nocookie.com only after the visitor taps play.
 */
export const filmSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("r2"), key: clipKeySchema }),
  z.object({
    kind: z.literal("youtube"),
    id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  }),
]);
export type FilmSource = z.infer<typeof filmSourceSchema>;

/** A story film shown in a place (the "story hall"). Loads only on tap. */
export const filmSchema = z.object({
  title: z.string().min(1),
  /** One line under the title on the poster. */
  teaser: z.string().min(1),
  /** Who made it and how ("Made by our team with AI tools"). */
  credit: z.string().min(1),
  /** Honesty note: what the film is and is not. Always shown. */
  note: z.string().min(1),
  source: filmSourceSchema.default({ kind: "none" }),
});
export type Film = z.infer<typeof filmSchema>;
export type FilmInput = z.input<typeof filmSchema>;

/**
 * Reads one config value: "" → none, "name.mp4" → r2, a YouTube watch,
 * share, shorts or embed link (or a bare id) → youtube. Anything else → none.
 */
export function filmSourceFrom(value: string): FilmSource {
  const v = value.trim();
  if (v === "") return { kind: "none" };
  if (clipKeySchema.safeParse(v).success) return { kind: "r2", key: v };
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return { kind: "youtube", id: v };
  try {
    const u = new URL(v);
    const host = u.hostname.replace(/^(www\.|m\.)/, "");
    const id =
      host === "youtu.be"
        ? u.pathname.slice(1)
        : host === "youtube.com" || host === "youtube-nocookie.com"
          ? (u.searchParams.get("v") ??
            /^\/(?:embed|shorts|live)\/([^/]+)/.exec(u.pathname)?.[1] ??
            "")
          : "";
    if (/^[A-Za-z0-9_-]{11}$/.test(id)) return { kind: "youtube", id };
  } catch {
    // Not a URL.
  }
  return { kind: "none" };
}
