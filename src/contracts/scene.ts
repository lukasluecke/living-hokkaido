// Detail scenes: one small interior world per open location.
import { z } from "zod";
import { clipSchema, filmSchema } from "./media";
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
  /** "roof-lift" = B3 entry; "fly-in" = outdoor glide, no roof; "cut" =
   * reduced motion / fallback. */
  entry: z.enum(["roof-lift", "fly-in", "cut"]).default("roof-lift"),
  /** Look key the detail-scene part maps to a set (like Location.building):
   * "house", "grove", "clearing", "cabin". Unknown keys fall back to "house". */
  setting: z.string().min(1).default("house"),
  /** "Over time" timelines offered in this scene, besides the one whose
   * locationId is this scene's location. */
  timelineIds: z.array(idSchema).default([]),
  /** Name of the roof node in the scene model, so it can lift. */
  roofNode: z.string().default("roof"),
  placements: z.array(artifactPlacementSchema).min(1),
  /** Activities that start from this scene, in suggested order. */
  activityIds: z.array(idSchema).default([]),
  /** Rendering technique, for the reveal and the asset manifest. */
  technique: z.enum(["low-poly", "splat", "scan"]).default("low-poly"),
  /** Optional ambient "postcard" clip of the place ("Watch"). */
  clip: clipSchema.optional(),
  /** Optional story film shown in this place (the story hall). */
  film: filmSchema.optional(),
});
export type DetailScene = z.infer<typeof detailSceneSchema>;
export type DetailSceneInput = z.input<typeof detailSceneSchema>;
