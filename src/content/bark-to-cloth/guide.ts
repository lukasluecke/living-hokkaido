// Owl lines. Navigation and invitation only; no cultural facts.
import type { GuideLine } from "@/contracts";
import { lakeHouse } from "./scene";

type GuideInput = Omit<GuideLine, "claimIds"> & { claimIds?: string[] };

const COUNT = [
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
];

/** "Four objects are waiting…", counted from the scene's placements so the
 *  line stays true when objects are added (src/i18n/ja/places.ts has each). */
export function objectsWaiting(n: number): string {
  const word = COUNT[n - 1] ?? String(n);
  return n === 1
    ? "One object is waiting. Pick it up and turn it."
    : `${word} objects are waiting. Pick one up and turn it.`;
}

export const guide: GuideInput[] = [
  {
    id: "welcome",
    on: "start",
    text: "Welcome to the island! I am the owl. Follow me through the highlights, or pick any glowing place to explore.",
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
    text: objectsWaiting(lakeHouse.placements.length),
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
