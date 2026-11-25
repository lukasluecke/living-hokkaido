// Lake house interior. Positions and views come from labs/detail-scene
// (src/room/Artifacts.tsx, src/App.tsx). Scene space, metres.
import type { DetailSceneInput } from "@/contracts";

export const lakeHouse: DetailSceneInput = {
  id: "lake-house",
  locationId: "lake-house",
  knowledgeId: "bark-to-cloth",
  title: "From bark to cloth",
  bounds: { width: 7, depth: 5, height: 3 },
  views: {
    outside: { eye: [10, 11, 12], target: [0, 0.8, 0] },
    // High 3/4 dollhouse view with the roof lifted (labs/detail-scene NOTES).
    home: { eye: [4.2, 6.2, 5.8], target: [0, 0.6, -0.6] },
  },
  entry: "roof-lift",
  roofNode: "roof",
  technique: "low-poly",
  placements: [
    {
      artifactId: "fiber",
      position: [-2.3, 0.4, -2.1],
      rotationY: 0.25,
      focusView: { eye: [-1.25, 1.62, -0.3], target: [-2.3, 0.5, -2.1] },
      key: 1,
    },
    {
      artifactId: "cloth",
      position: [2.3, 0, -1.55],
      rotationY: -0.55,
      focusView: { eye: [-0.02, 1.55, 1.15], target: [2.3, 0.8, -1.55] },
      key: 2,
    },
    {
      artifactId: "garment",
      position: [0.95, 0, -2.15],
      rotationY: 0,
      focusView: { eye: [2.1, 1.6, 0.4], target: [0.95, 0.95, -2.15] },
      key: 3,
    },
  ],
  activityIds: [
    "material",
    "weave-rows",
    "variation",
    "care",
    "story-bark-to-cloth",
    "words-objects",
    "trace-sources",
  ],
};
