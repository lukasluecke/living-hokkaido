// Owl lines. Navigation and invitation only; no cultural facts.
import type { GuideLine } from "@/contracts";

type GuideInput = Omit<GuideLine, "claimIds"> & { claimIds?: string[] };

export const guide: GuideInput[] = [
  {
    id: "welcome",
    on: "start",
    text: "Hello! Pick a glowing place and I will fly you there.",
  },
  {
    id: "arrive-lake-house",
    on: "owl.arrived",
    targetId: "lake-house",
    text: "Here we are. Let us lift the roof and look inside.",
  },
  {
    id: "scene-hint",
    on: "scene.ready",
    targetId: "lake-house",
    text: "Three objects are waiting. Pick one up and turn it.",
  },
  {
    id: "arrive-listening-grove",
    on: "owl.arrived",
    targetId: "listening-grove",
    text: "A quiet grove. Sit on a log and I will tell you a story.",
  },
  {
    id: "grove-hint",
    on: "scene.ready",
    targetId: "listening-grove",
    text: "Listen to my story, or learn some words for things.",
  },
  {
    id: "arrive-makers-clearing",
    on: "owl.arrived",
    targetId: "makers-clearing",
    text: "The workbench is ready. Shall we try some weaving?",
  },
  {
    id: "clearing-hint",
    on: "scene.ready",
    targetId: "makers-clearing",
    text: "Pick up the loom to start weaving, or look at the fibers on the bench.",
  },
  {
    id: "arrive-memory-cabin",
    on: "owl.arrived",
    targetId: "memory-cabin",
    text: "A small cabin full of memories. Let us look inside.",
  },
  {
    id: "cabin-hint",
    on: "scene.ready",
    targetId: "memory-cabin",
    text: "Open the loom card to see how curator memories will look, or press the hourglass.",
  },
  {
    id: "stamp",
    on: "stamp.earned",
    text: "A new stamp for your journal!",
  },
];
