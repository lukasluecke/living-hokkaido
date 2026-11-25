// Coordinate spaces, units and camera views.
//
// Every 3D part uses Y-up, right-handed coordinates (three.js default).
// There are three spaces. Never mix them in one number.
//
// 1. Island space ("diorama units", du). The island is a purpose-built scene,
//    NOT a geographic map. Origin = island centre at sea level. The island
//    fits in a circle of ISLAND.radius du. Buildings and the owl are drawn
//    much larger than "real" scale so they read from the overview camera.
// 2. Scene space (metres). One detail scene (for example the lake house
//    interior). Origin = centre of the floor. +Z points to the open side that
//    faces the default "dollhouse" camera. Real-world sizes.
// 3. Artifact space (metres). One object. Origin = centre of the base where it
//    rests. Front faces +Z. Real-world size; the viewer scales it.
import { z } from "zod";

export const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3 = z.infer<typeof vec3Schema>;

export const cameraViewSchema = z.object({
  eye: vec3Schema,
  target: vec3Schema,
  /** Vertical field of view in degrees. Default: SCALE.defaultFov. */
  fov: z.number().min(10).max(90).optional(),
});
export type CameraView = z.infer<typeof cameraViewSchema>;

export const ISLAND = {
  /** Island fits inside this radius (du). */
  radius: 30,
  /** Sea level (du). */
  seaLevel: 0,
  /** Highest peak (du). Keep the silhouette low and readable. */
  maxHeight: 8,
  /** Footprint of one location building (du). */
  buildingFootprint: 1.3,
  /** Owl wingspan in island space (du). */
  owlWingspan: 0.6,
  /** Tree height range (du). */
  treeHeight: [0.4, 1.2] as const,
  /** Flat pad radius around a location so a building sits level (du). */
  padRadius: 1.2,
} as const;

export const SCENE = {
  /** Default interior footprint (m): width (X) × depth (Z) × height (Y). */
  room: { width: 7, depth: 5, height: 3 },
  /** Eye height of a standing visitor (m). */
  eyeHeight: 1.6,
  /** Artifact size range (m), longest side. */
  artifactSize: [0.2, 2] as const,
} as const;

export const SCALE = {
  /** Vertical FOV for the overview and dollhouse cameras (degrees). */
  defaultFov: 32,
  /** Max device pixel ratio for every canvas. */
  maxDpr: 1.5,
} as const;
