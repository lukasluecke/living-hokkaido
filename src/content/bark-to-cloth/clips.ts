// AI-imagined clips (PixVerse V6, text prompts, 2026-11-26), stored in R2
// and loaded only on "Watch". Demo rule (Lukas 2026-11-26): the prompts may go
// beyond the cited claims, so every note says the clip is AI-imagined and
// that a finished product would send it through curator approval.
// Prompts and video ids: public/models/ATTRIBUTION.md, "Generated clips".
import type { ClipInput, DetailSceneInput, TimelineInput } from "@/contracts";

const NOTE =
  "AI-imagined clip (PixVerse) for this demo, not historical footage. In the finished product a curator would check and approve it.";

const clip = (key: string, title: string, audio = false): ClipInput => ({
  key,
  title,
  note: NOTE,
  tool: "PixVerse V6, text prompt",
  audio,
  seconds: 5,
});

/**
 * Era id → clip. Only keys that are uploaded to the bucket. The round-2 "meiji" prompt came out as a present-day river town, so that clip
 * is used for "today" (key keeps its file name). Round 3
 * (owl-film look: dusk, hearth light, people in plain robes) gave flat-ground,
 * the night pit dwellings, cise-and-kotan and Meiji.
 */
export const ERA_CLIPS: Record<string, ClipInput> = {
  "pit-dwellings": clip(
    "era-1-pit-night-v3.mp4",
    "Watch: the river mouth in this era",
    true,
  ),
  "flat-ground": clip(
    "era-2-flat-v2.mp4",
    "Watch: the river mouth in this era",
    true,
  ),
  "cise-and-kotan": clip(
    "era-3-cise-v3.mp4",
    "Watch: the river mouth in this era",
    true,
  ),
  meiji: clip("era-4-meiji-v3.mp4", "Watch: the river mouth in this era", true),
  today: clip("era-4-meiji.mp4", "Watch: the river mouth today"),
};

/** Scene id → ambient postcard. */
export const SCENE_CLIPS: Record<string, ClipInput> = {
  "herring-coast": clip("place-coast.mp4", "Watch: the coast", true),
  "survey-forest": clip("place-forest-night.mp4", "Watch: the forest", true),
  "animal-hills": clip("place-hills.mp4", "Watch: the hills", true),
  "coal-mountain": clip("place-mine.mp4", "Watch: the mountain", true),
};

export function withSceneClips(list: DetailSceneInput[]): DetailSceneInput[] {
  return list.map((s) =>
    SCENE_CLIPS[s.id] ? { ...s, clip: SCENE_CLIPS[s.id] } : s,
  );
}

export function withEraClips(t: TimelineInput): TimelineInput {
  return {
    ...t,
    eras: t.eras.map((e) =>
      ERA_CLIPS[e.id] ? { ...e, clip: ERA_CLIPS[e.id] } : e,
    ),
  };
}
