// Stamps for the Heritage Journal (E1). Descriptions say what the visitor
// did; they make no cultural claims.
import type { Stamp } from "@/contracts";

type StampInput = Omit<Stamp, "claimIds"> & { claimIds?: string[] };

export const stamps: StampInput[] = [
  {
    id: "lake-house-visit",
    title: "Arrived at the lake house",
    description: "You followed the owl to the lake house.",
    icon: "house",
    unlock: { on: "location-visited", locationId: "lake-house" },
  },
  {
    id: "grove-visit",
    title: "Sat in the grove",
    description: "You followed the owl to the listening grove.",
    icon: "leaf",
    unlock: { on: "location-visited", locationId: "listening-grove" },
  },
  {
    id: "clearing-visit",
    title: "At the workbench",
    description: "You followed the owl to the makers’ clearing.",
    icon: "shuttle",
    unlock: { on: "location-visited", locationId: "makers-clearing" },
  },
  {
    id: "cabin-visit",
    title: "Inside the memory cabin",
    description: "You followed the owl to the memory cabin.",
    icon: "house",
    unlock: { on: "location-visited", locationId: "memory-cabin" },
  },
  {
    id: "three-objects",
    title: "Looked closely",
    description: "You picked up and turned all three objects.",
    icon: "magnifier",
    unlock: {
      on: "artifacts-inspected",
      artifactIds: ["fiber", "cloth", "garment"],
    },
  },
  {
    id: "weaver",
    title: "A few rows",
    description: "You finished the weaving activity.",
    icon: "shuttle",
    unlock: { on: "activities-completed", activityIds: ["weave-rows"] },
    claimIds: ["no-technique"],
  },
  {
    id: "careful-reader",
    title: "Careful reader",
    description: "You answered all three reflections.",
    icon: "book",
    unlock: {
      on: "activities-completed",
      activityIds: ["material", "variation", "care"],
    },
  },
  {
    id: "four-seasons",
    title: "A full year",
    description: "You watched the island through all four seasons.",
    icon: "leaf",
    unlock: {
      on: "seasons-seen",
      seasons: ["spring", "summer", "autumn", "winter"],
    },
  },
  {
    id: "behind-the-card",
    title: "Behind the card",
    description: "You turned a card over to see where its knowledge came from.",
    icon: "card",
    unlock: { on: "reveal-opened" },
  },
];
