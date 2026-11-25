// Island locations. The island is a focused, purpose-built diorama, not a map.
import { z } from "zod";
import { idSchema } from "./ids";
import { seasonIdSchema } from "./season";
import { cameraViewSchema, vec3Schema } from "./space";

export const locationSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  /** One short line for the pin and the HTML fallback list. */
  teaser: z.string().min(1),
  /** "open" has a detail scene; "soon" is a closed building that hints at more. */
  status: z.enum(["open", "soon"]),
  /** Ground position in island space (du). y is filled from the terrain. */
  anchor: vec3Schema,
  /** Where the owl lands, relative to anchor (du). */
  owlPerch: vec3Schema.default([0.9, 0.6, 0.4]),
  /** Camera when the owl arrives, island space. */
  arrivalView: cameraViewSchema.optional(),
  /** Detail scene entered from here. Required when status is "open". */
  sceneId: idSchema.optional(),
  /** Knowledge entries this place is about. */
  knowledgeIds: z.array(idSchema).default([]),
  /** Building style key the island part maps to a model. */
  building: z.string().min(1).default("house"),
  /** Optional season-specific teaser text (no new cultural claims). */
  seasonNotes: z.partialRecord(seasonIdSchema, z.string()).default({}),
  /** True while the position or name is a design placeholder. */
  placeholder: z.boolean().default(false),
});
export type Location = z.infer<typeof locationSchema>;
export type LocationInput = z.input<typeof locationSchema>;

export const islandSchema = z.object({
  /** Where the owl waits at the start, island space. */
  owlHome: vec3Schema,
  /** Overview camera at the start. */
  overview: cameraViewSchema,
  locations: z.array(locationSchema).min(1),
});
export type Island = z.infer<typeof islandSchema>;
