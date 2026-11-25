// Experience state. Owned by the shell (src/shell/state.ts), read by parts.
import type { ActivityId, ArtifactId, LocationId, SceneId } from "./ids";
import type { SeasonState } from "./season";

export type View =
  /** Overview of the island, owl at home or perched. */
  | "island"
  /** Owl flying to a location; island part animates. */
  | "travel"
  /** Inside a detail scene, dollhouse home view. */
  | "scene"
  /** One artifact picked up (C2 turn viewer + card). */
  | "focus"
  /** An activity is open. */
  | "activity";

export type Overlay = "journal" | "reveal" | null;

export type Prefs = {
  /** prefers-reduced-motion: cut cameras, no timelapse autoplay. */
  reducedMotion: boolean;
  /** False when WebGL failed; parts render their HTML fallback. */
  webgl: boolean;
};

export type ExperienceState = {
  view: View;
  overlay: Overlay;
  locationId: LocationId | null;
  sceneId: SceneId | null;
  artifactId: ArtifactId | null;
  activityId: ActivityId | null;
  /** Reveal target, when overlay is "reveal". */
  reveal: { knowledgeId: string; claimId?: string; artifactId?: string } | null;
  season: SeasonState;
  prefs: Prefs;
};
