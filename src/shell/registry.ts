// Which component renders each part. To integrate a teammate's work, change
// the implementation inside src/parts/<part>/ and keep the export name.
// Only change this file to swap a whole part (for example a lazy 3D version).
//
// The island and the owl's ask box are on the first screen, so they load
// with the page. Every other part loads on demand (its own chunk), and
// preloadParts() fetches them all once the island is up, so opening a
// place still feels instant.
import dynamic from "next/dynamic";
import { AskPart } from "@/parts/ask";
import { IslandPart } from "@/parts/island";

const load = {
  "detail-scene": () =>
    import("@/parts/detail-scene").then((m) => m.DetailScenePart),
  artifacts: () => import("@/parts/artifacts").then((m) => m.ArtifactViewer),
  activities: () => import("@/parts/activities").then((m) => m.ActivityPart),
  journal: () => import("@/parts/journal").then((m) => m.JournalPart),
  reveal: () => import("@/parts/reveal").then((m) => m.RevealPart),
  "over-time": () => import("@/parts/over-time").then((m) => m.TimelinePart),
};

export const parts = {
  island: IslandPart,
  "detail-scene": dynamic(load["detail-scene"]),
  artifacts: dynamic(load.artifacts),
  activities: dynamic(load.activities),
  journal: dynamic(load.journal),
  reveal: dynamic(load.reveal),
  "over-time": dynamic(load["over-time"]),
  ask: AskPart,
} as const;

let preloaded = false;
/** Fetch every lazy part in the background (call once the island shows). */
export function preloadParts() {
  if (preloaded) return;
  preloaded = true;
  for (const f of Object.values(load)) f().catch(() => {});
}
