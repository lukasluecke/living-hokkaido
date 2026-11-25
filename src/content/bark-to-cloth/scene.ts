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

// The three smaller places reuse objects and activities from the lake house
// (same claims); only the set around them is new. Illustrative sets, not
// reconstructions of real places.

/** Listening grove: the owl's story and the words activity, outdoors. */
export const listeningGrove: DetailSceneInput = {
  id: "listening-grove",
  locationId: "listening-grove",
  knowledgeId: "bark-to-cloth",
  title: "Listening grove",
  setting: "grove",
  entry: "fly-in",
  bounds: { width: 8, depth: 7, height: 4 },
  views: {
    outside: { eye: [2, 15, 15], target: [0, 0, -0.5] },
    home: { eye: [3.4, 4.2, 6.4], target: [0, 0.7, -0.9] },
  },
  placements: [
    {
      artifactId: "fiber",
      position: [-1.4, 0.4, -1.3],
      rotationY: 0.4,
      focusView: { eye: [-0.4, 1.6, 0.5], target: [-1.4, 0.5, -1.3] },
      key: 1,
    },
  ],
  activityIds: ["story-bark-to-cloth", "words-objects"],
};

/** Makers' clearing: the loom and the weaving activity at a workbench. */
export const makersClearing: DetailSceneInput = {
  id: "makers-clearing",
  locationId: "makers-clearing",
  knowledgeId: "bark-to-cloth",
  title: "Makers’ clearing",
  setting: "clearing",
  entry: "fly-in",
  bounds: { width: 8, depth: 7, height: 4 },
  views: {
    outside: { eye: [-2, 15, 15], target: [0, 0, -0.5] },
    home: { eye: [3.2, 4.4, 6.2], target: [0, 0.7, -1] },
  },
  placements: [
    {
      artifactId: "cloth",
      position: [1.1, 0, -1.2],
      rotationY: -0.35,
      focusView: { eye: [-0.4, 1.6, 1.9], target: [1.1, 0.8, -1.2] },
      key: 1,
    },
    {
      artifactId: "fiber",
      position: [-1.5, 0.75, -1.2],
      rotationY: 0.25,
      focusView: { eye: [-0.6, 1.9, 0.5], target: [-1.5, 0.85, -1.2] },
      key: 2,
    },
  ],
  activityIds: ["weave-rows", "material"],
};

/** Memory cabin: the curator memory card and the "Over time" slider. */
export const memoryCabin: DetailSceneInput = {
  id: "memory-cabin",
  locationId: "memory-cabin",
  knowledgeId: "bark-to-cloth",
  title: "Memory cabin",
  setting: "cabin",
  entry: "roof-lift",
  bounds: { width: 5.2, depth: 3.7, height: 2.3 },
  views: {
    outside: { eye: [7.5, 8.5, 9], target: [0, 0.6, 0] },
    home: { eye: [3, 4.6, 4.4], target: [0, 0.5, -0.5] },
  },
  placements: [
    {
      artifactId: "cloth",
      position: [-1.2, 0, -0.9],
      rotationY: 0.35,
      focusView: { eye: [0.7, 1.5, 1.6], target: [-1.2, 0.8, -0.9] },
      key: 1,
    },
    {
      artifactId: "garment",
      position: [1.35, 0, -0.45],
      rotationY: -0.45,
      focusView: { eye: [2.1, 1.5, 1.7], target: [1.35, 0.95, -0.45] },
      key: 2,
    },
  ],
  activityIds: ["variation", "care", "trace-sources"],
  timelineIds: ["house-over-time"],
};
