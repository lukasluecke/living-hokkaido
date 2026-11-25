// Island layout. A focused, purpose-built diorama, NOT a geographic map.
// Positions are design placeholders in island units (see src/contracts/space.ts).
import type { LocationInput } from "@/contracts";

export const owlHome: [number, number, number] = [-6, 0, 8];

export const overview = {
  eye: [0, 42, 46] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
};

export const locations: LocationInput[] = [
  {
    id: "lake-house",
    title: "Lake house",
    teaser: "From bark to cloth",
    status: "open",
    anchor: [4, 0, 2],
    arrivalView: { eye: [8, 6, 9], target: [4, 0.6, 2] },
    sceneId: "lake-house",
    knowledgeIds: ["bark-to-cloth", "hokkaido-museum"],
    building: "house",
    placeholder: true,
  },
  {
    id: "listening-grove",
    title: "Listening grove",
    teaser: "The owl’s story and words for things",
    status: "open",
    anchor: [-9, 0, -6],
    arrivalView: { eye: [-5, 6, 1], target: [-9, 0.6, -6] },
    sceneId: "listening-grove",
    knowledgeIds: ["bark-to-cloth", "hokkaido-museum"],
    building: "grove",
    placeholder: true,
  },
  {
    id: "makers-clearing",
    title: "Makers’ clearing",
    teaser: "Weave a few rows at the workbench",
    status: "open",
    anchor: [11, 0, -8],
    arrivalView: { eye: [7, 6, -1], target: [11, 0.6, -8] },
    sceneId: "makers-clearing",
    knowledgeIds: ["bark-to-cloth", "hokkaido-museum"],
    building: "workshop",
    placeholder: true,
  },
  {
    id: "memory-cabin",
    title: "Memory cabin",
    teaser: "Curator memories and the house over time",
    status: "open",
    anchor: [-3, 0, 12],
    arrivalView: { eye: [1, 6, 19], target: [-3, 0.6, 12] },
    sceneId: "memory-cabin",
    knowledgeIds: ["bark-to-cloth", "house-over-time", "hokkaido-museum"],
    building: "cabin",
    placeholder: true,
  },
];
