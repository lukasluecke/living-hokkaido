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
    knowledgeIds: ["bark-to-cloth"],
    building: "house",
    placeholder: true,
  },
  {
    id: "listening-grove",
    title: "Listening grove",
    teaser: "Future oral histories · no recordings yet",
    status: "soon",
    anchor: [-9, 0, -6],
    building: "grove",
    placeholder: true,
  },
  {
    id: "makers-clearing",
    title: "Maker’s clearing",
    teaser: "Future practitioner-led skills",
    status: "soon",
    anchor: [11, 0, -8],
    building: "workshop",
    placeholder: true,
  },
  {
    id: "memory-cabin",
    title: "Memory cabin",
    teaser: "Future community collections",
    status: "soon",
    anchor: [-3, 0, 12],
    building: "cabin",
    placeholder: true,
  },
];
