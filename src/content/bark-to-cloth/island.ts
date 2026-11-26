// Island layout. A focused, purpose-built diorama, NOT a geographic map.
// Positions are design placeholders in island units (see src/contracts/space.ts).
// Tighter layout (Lukas, 2026-11-26): every x/z is 0.75 of the first layout,
// to match LAYOUT in src/parts/island/world/island.ts.
import type { LocationInput } from "@/contracts";

export const owlHome: [number, number, number] = [-4.5, 0, 6];

export const overview = {
  eye: [0, 33, 36] as [number, number, number],
  target: [0, 0, -0.5] as [number, number, number],
};

export const locations: LocationInput[] = [
  {
    id: "lake-house",
    title: "Lake house",
    teaser: "From bark to cloth",
    status: "open",
    anchor: [3, 0, 1.5],
    arrivalView: { eye: [6, 6, 6.75], target: [3, 0.6, 1.5] },
    sceneId: "lake-house",
    knowledgeIds: ["bark-to-cloth", "hokkaido-museum"],
    building: "house",
    placeholder: true,
  },
  {
    id: "listening-grove",
    title: "Listening grove",
    teaser: "The owl’s story film and words for things",
    status: "open",
    anchor: [-6.75, 0, -4.5],
    arrivalView: { eye: [-3.75, 6, 0.75], target: [-6.75, 0.6, -4.5] },
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
    anchor: [8.25, 0, -6],
    arrivalView: { eye: [5.25, 6, -0.75], target: [8.25, 0.6, -6] },
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
    anchor: [-2.25, 0, 9],
    arrivalView: { eye: [0.75, 6, 14.25], target: [-2.25, 0.6, 9] },
    sceneId: "memory-cabin",
    knowledgeIds: [
      "bark-to-cloth",
      "house-over-time",
      "hokkaido-museum",
      "omusha-diorama",
    ],
    building: "cabin",
    placeholder: true,
  },
  // Themed areas after Hokkaido Museum dioramas (theme 2 and theme 4). The
  // island draws each scene itself (src/parts/island/world/Areas.tsx); the
  // anchor must match AREAS there. Open (Lukas, 2026-11-26): each has a small outdoor scene (area-scenes.ts). Claims:
  // knowledge "land-and-sea".
  {
    id: "herring-coast",
    sceneId: "herring-coast",
    title: "Herring coast",
    teaser: "Living off the sea",
    status: "open",
    arrivalView: { eye: [12, 6, 12.75], target: [9, 0.8, 8.4] },
    anchor: [9, 0, 8.4],
    knowledgeIds: ["land-and-sea"],
    building: "area-coast",
    placeholder: true,
  },
  {
    id: "survey-forest",
    sceneId: "survey-forest",
    title: "Survey forest",
    teaser: "Forest plants and the 1890 land survey",
    status: "open",
    arrivalView: { eye: [-9, 6, 3.75], target: [-12, 1.4, -0.75] },
    anchor: [-12, 0, -0.75],
    knowledgeIds: ["land-and-sea"],
    building: "area-forest",
    placeholder: true,
  },
  {
    id: "animal-hills",
    sceneId: "animal-hills",
    title: "Animal hills",
    teaser: "Deer and bears in the hills",
    status: "open",
    arrivalView: { eye: [16.5, 6, 4.5], target: [14.25, 1.2, 0] },
    anchor: [14.25, 0, 0],
    knowledgeIds: ["land-and-sea"],
    building: "area-hills",
    placeholder: true,
  },
  {
    id: "coal-mountain",
    sceneId: "coal-mountain",
    title: "Coal mountain",
    teaser: "Coal mining and winter logging",
    status: "open",
    arrivalView: { eye: [-0.75, 7, -4.5], target: [-3.75, 2.8, -9.45] },
    anchor: [-3.75, 0, -9.45],
    knowledgeIds: ["land-and-sea"],
    building: "area-mountains",
    placeholder: true,
  },
];
