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
    id: "stamp",
    on: "stamp.earned",
    text: "A new stamp for your journal!",
  },
];
