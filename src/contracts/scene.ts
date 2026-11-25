// Detail scenes: one small interior world per open location.
import { z } from "zod";
import { idSchema } from "./ids";
import { cameraViewSchema, vec3Schema } from "./space";

export const artifactPlacementSchema = z.object({
  artifactId: idSchema,
  /** Scene space (m). */
  position: vec3Schema,
  rotationY: z.number().default(0),
  /** Camera when this artifact is focused (C2 move-in), scene space. */
  focusView: cameraViewSchema,
  /** Keyboard shortcut index, 1-based ("1".."9"). */
  key: z.number().int().min(1).max(9).optional(),
});
export type ArtifactPlacement = z.infer<typeof artifactPlacementSchema>;

export const detailSceneSchema = z.object({
  id: idSchema,
  locationId: idSchema,
  knowledgeId: idSchema,
  title: z.string().min(1),
  /** Interior size in metres. */
  bounds: z.object({
    width: z.number().positive(),
    depth: z.number().positive(),
    height: z.number().positive(),
  }),
  views: z.object({
    /** Start of the entry, above the closed roof. */
    outside: cameraViewSchema,
    /** High 3/4 "dollhouse" home view, roof lifted. */
    home: cameraViewSchema,
  }),
  /** "roof-lift" = B3 entry; "cut" = reduced motion / fallback. */
  entry: z.enum(["roof-lift", "cut"]).default("roof-lift"),
  /** Name of the roof node in the scene model, so it can lift. */
  roofNode: z.string().default("roof"),
  placements: z.array(artifactPlacementSchema).min(1),
  /** Activities that start from this scene, in suggested order. */
  activityIds: z.array(idSchema).default([]),
  /** Rendering technique, for the reveal and the asset manifest. */
  technique: z.enum(["low-poly", "splat", "scan"]).default("low-poly"),
});
export type DetailScene = z.infer<typeof detailSceneSchema>;
export type DetailSceneInput = z.input<typeof detailSceneSchema>;
