// Props contract for each part. A part is a React component that takes
// exactly these props. It reads data, renders, and reports what the visitor
// did through `emit`. It never imports another part or the shell.
//
// Types only: no React import, so labs with any renderer can implement them.
import type { ActivityDefinition } from "./activity";
import type { Artifact } from "./artifact";
import type { ContentPack } from "./content";
import type { Emit } from "./events";
import type { ExperienceState, Prefs } from "./experience";
import type { JournalState } from "./journal";
import type { ResolvedClaim } from "./knowledge";
import type { DetailScene } from "./scene";
import type { SeasonState } from "./season";

/** Every part gets this. */
export type PartContext = {
  content: ContentPack;
  season: SeasonState;
  prefs: Prefs;
  emit: Emit;
};

/** Island overview, owl flight, seasons on the island. */
export type IslandPartProps = PartContext & {
  view: ExperienceState["view"];
  /** Location the owl flies to / perches at. null = owl at home. */
  locationId: string | null;
};

/** One detail scene: entry, dollhouse view, artifact placement and focus. */
export type DetailScenePartProps = PartContext & {
  scene: DetailScene;
  artifacts: Artifact[];
  /** Focused artifact. The scene moves its camera; the viewer shows the card. */
  focusedArtifactId: string | null;
};

/** C2 pick-up-and-turn viewer, card and hotspots for one artifact. */
export type ArtifactViewerProps = PartContext & {
  artifact: Artifact;
  /** Resolved claims keyed by claim id (summary + hotspots). */
  claims: Record<string, ResolvedClaim>;
  /** Hotspots already read, as hotspot ids. */
  read: string[];
};

/** One activity of any kind. Emit activity.complete or activity.close. */
export type ActivityPartProps = PartContext & {
  activity: ActivityDefinition;
  claims: Record<string, ResolvedClaim>;
};

/** Heritage Journal (E1 stamp book). */
export type JournalPartProps = PartContext & {
  journal: JournalState;
};

/** F2 studio reveal: the card turns over to show source, AI step, review. */
export type RevealPartProps = PartContext & {
  knowledgeId: string;
  claim: ResolvedClaim | null;
  artifact: Artifact | null;
};

export type PartPropsMap = {
  island: IslandPartProps;
  "detail-scene": DetailScenePartProps;
  artifacts: ArtifactViewerProps;
  activities: ActivityPartProps;
  journal: JournalPartProps;
  reveal: RevealPartProps;
};
