// Which component renders each part. To integrate a teammate's work, change
// the implementation inside src/parts/<part>/ and keep the export name.
// Only change this file to swap a whole part (for example a lazy 3D version).
import { ActivityPart } from "@/parts/activities";
import { ArtifactViewer } from "@/parts/artifacts";
import { DetailScenePart } from "@/parts/detail-scene";
import { IslandPart } from "@/parts/island";
import { JournalPart } from "@/parts/journal";
import { TimelinePart } from "@/parts/over-time";
import { RevealPart } from "@/parts/reveal";

export const parts = {
  island: IslandPart,
  "detail-scene": DetailScenePart,
  artifacts: ArtifactViewer,
  activities: ActivityPart,
  journal: JournalPart,
  reveal: RevealPart,
  "over-time": TimelinePart,
} as const;
