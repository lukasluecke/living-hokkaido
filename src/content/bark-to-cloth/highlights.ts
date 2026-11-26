// The signature experiences: shown first on the island, at the top of every
// activity list, and toured by the owl on a first visit (Lukas, 2026-11-26:
// "focus on the interactive experiences ... instead of all the quizzes").
// Order = tour order; places that share two highlights sit next to each
// other so the owl flies less. Titles and lines are UI text that point at
// existing activities, films and timelines; they add no facts.
import type { HighlightInput } from "@/contracts";

export const highlights: HighlightInput[] = [
  {
    id: "owl-film",
    title: "Watch the owl's film",
    teaser: "A short folktale film, told by the owl",
    icon: "film",
    locationId: "listening-grove",
    open: { kind: "film" },
    owl: "First, sit with me in the grove. I have a story film for you.",
  },
  {
    id: "tonkori",
    title: "Play the tonkori",
    teaser: "Pluck the five open strings",
    icon: "pluck",
    locationId: "listening-grove",
    open: { kind: "activity", activityId: "pluck-tonkori" },
    owl: "Now try the tonkori. Pluck the strings and listen.",
  },
  {
    id: "over-time",
    title: "See the house over time",
    teaser: "Pit dwellings to today, in one place",
    icon: "timeline",
    locationId: "lake-house",
    open: { kind: "timeline", timelineId: "house-over-time" },
    marker: {
      position: [2.0, 0, 0.9],
      rotationY: -0.4,
      prop: "hourglass",
      model: "/models/prop-hourglass.glb",
    },
    owl: "Let us fly to the lake house and watch it change over time.",
  },
  {
    id: "omusha",
    title: "Step into the Omusha diorama",
    teaser: "A museum diorama, captured in 3D",
    icon: "splat-look",
    locationId: "memory-cabin",
    open: { kind: "activity", activityId: "omusha-look" },
    owl: "In the memory cabin, a museum diorama waits. Look around in it.",
  },
  {
    id: "slope",
    title: "Don't fall on the slope",
    teaser: "Slide down an icy Otaru street",
    icon: "slope-run",
    locationId: "herring-coast",
    open: { kind: "activity", activityId: "slope-run-otaru" },
    marker: {
      position: [2.3, 0, 0.9],
      rotationY: -0.6,
      prop: "sled",
      model: "/models/prop-sled.glb",
    },
    owl: "To the coast! Slide down the icy street to the canal.",
  },
  {
    id: "out-of-place",
    title: "Find what is out of place",
    teaser: "Hide and seek in a herring warehouse",
    icon: "hide-seek",
    locationId: "herring-coast",
    open: { kind: "activity", activityId: "hide-seek-otaru-warehouse" },
    // Lukas: the tour ends with the slide game; this stays a highlight.
    tour: false,
    marker: {
      position: [-0.5, 0, 1.7],
      rotationY: 0.3,
      prop: "crates",
      model: "/models/prop-crates.glb",
    },
    owl: "One more game here: find what does not belong in the warehouse.",
  },
];
