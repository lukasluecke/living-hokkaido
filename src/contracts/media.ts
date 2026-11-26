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
