// Artifact objects: 3D objects with info cards, hotspots and a turn viewer.
// Started from labs/artifacts/src/schema.ts.
import { z } from "zod";
import { idSchema } from "./ids";
import { vec3Schema } from "./space";

/** How the geometry relates to a real object. Drives labels and rights rules. */
export const representationSchema = z.enum([
  /** Original sketch geometry. The UI must say "illustrative". */
  "illustrative",
  /** Modelled from documented references. Needs approved rights. */
  "reconstruction",
  /** Photogrammetry or museum 3D data. Needs approved rights and consent. */
  "scan",
]);
export type Representation = z.infer<typeof representationSchema>;

export const modelSourceSchema = z.discriminatedUnion("kind", [
  /** A GLB under public/models. Node names must stay (hotspots use them). */
  z.object({ kind: z.literal("glb"), url: z.string().min(1) }),
  /** Built in code by the artifacts part. builder = key in its builder map. */
  z.object({ kind: z.literal("procedural"), builder: idSchema }),
]);

export const modelAssetSchema = z.object({
  assetId: idSchema,
  source: modelSourceSchema,
  representation: representationSchema,
  /** For example "MIT (original)", "CC0-1.0", "museum permission #...". */
  license: z.string().min(1),
  rights: z.enum(["unknown", "restricted", "approved"]),
  consent: z.enum(["not-required", "pending", "granted", "withdrawn"]),
  attribution: z.string().min(1),
  /** Source record that holds the permission. */
  sourceId: z.string().optional(),
  bytes: z.number().int().positive().optional(),
  triangles: z.number().int().positive().optional(),
  /** Mesh names that a look or a hotspot may target. */
  nodes: z.array(z.string()).default([]),
});
export type ModelAsset = z.infer<typeof modelAssetSchema>;

export const hotspotSchema = z.object({
  id: idSchema,
  /** Artifact space anchor (m) and outward normal for back-face hiding. */
  position: vec3Schema,
  normal: vec3Schema,
  node: z.string().optional(),
  /** Short UI label. The body text is always the cited claim's text. */
  title: z.string().min(1),
  claimId: idSchema,
  kind: z.enum(["claim", "disclaimer"]).default("claim"),
});
export type Hotspot = z.infer<typeof hotspotSchema>;

/** Hotspots that point at a fact on the object ("Look closer" rows, dots,
 *  journal counts). A "disclaimer" hotspot is a note about the model. */
export function factHotspots<H extends Pick<Hotspot, "kind">>(a: {
  hotspots: readonly H[];
}): H[] {
  return a.hotspots.filter((h) => h.kind !== "disclaimer");
}

/** Notes about the model itself, shown as a small footnote on the card. */
export function modelNotes<H extends Pick<Hotspot, "kind">>(a: {
  hotspots: readonly H[];
}): H[] {
  return a.hotspots.filter((h) => h.kind === "disclaimer");
}

export const artifactSchema = z
  .object({
    id: idSchema,
    knowledgeId: idSchema,
    /** Card heading, for example "A garment". */
    title: z.string().min(1),
    /** Hover label, for example "More than one story". */
    label: z.string().min(1),
    /** Claim whose text is the card body. Must be in claimIds. */
    summaryClaimId: idSchema,
    claimIds: z.array(idSchema).min(1),
    model: modelAssetSchema,
    display: z
      .object({
        restRotation: vec3Schema.default([0, 0, 0]),
        inspectScale: z.number().positive().default(1),
        /** Pitch clamp for the turn viewer (radians). */
        pitchLimit: z
          .number()
          .min(0)
          .max(Math.PI / 2)
          .default(0.5),
      })
      .default({ restRotation: [0, 0, 0], inspectScale: 1, pitchLimit: 0.5 }),
    hotspots: z.array(hotspotSchema).default([]),
    activityIds: z.array(idSchema).default([]),
    /**
     * Optional AI-generated model (for example Hyper3D Rodin from a text
     * prompt) shown instead of the sketch unless the visitor picks "Sketch".
     * Never a scan or a reconstruction: noteClaimId says so on the card.
     */
    generated: z
      .object({
        source: z.object({ kind: z.literal("glb"), url: z.string().min(1) }),
        /** Tool and input, for example "Hyper3D Rodin Gen-2.5, text prompt". */
        tool: z.string().min(1),
        license: z.string().min(1),
        /** Claim shown as the "About this model" note for this model. */
        noteClaimId: idSchema,
        bytes: z.number().int().positive().optional(),
      })
      .optional(),
  })
  .superRefine((o, ctx) => {
    if (o.generated && !o.claimIds.includes(o.generated.noteClaimId))
      ctx.addIssue({
        code: "custom",
        path: ["generated", "noteClaimId"],
        message: `Claim ${o.generated.noteClaimId} is not linked to the artifact`,
      });
    if (!o.claimIds.includes(o.summaryClaimId))
      ctx.addIssue({
        code: "custom",
        path: ["summaryClaimId"],
        message: "Summary claim must be linked to the artifact",
      });
    for (const h of o.hotspots)
      if (!o.claimIds.includes(h.claimId))
        ctx.addIssue({
          code: "custom",
          path: ["hotspots", h.id],
          message: `Claim ${h.claimId} is not linked to the artifact`,
        });
    const m = o.model;
    if (m.representation !== "illustrative" && m.rights !== "approved")
      ctx.addIssue({
        code: "custom",
        path: ["model", "rights"],
        message: "Scans and reconstructions need approved rights",
      });
    if (m.representation === "scan" && m.consent !== "granted")
      ctx.addIssue({
        code: "custom",
        path: ["model", "consent"],
        message: "Scans need granted consent",
      });
    if (m.consent === "withdrawn")
      ctx.addIssue({
        code: "custom",
        path: ["model", "consent"],
        message: "Withdrawn asset: do not show",
      });
  });
export type Artifact = z.infer<typeof artifactSchema>;
export type ArtifactInput = z.input<typeof artifactSchema>;

/** True when the generated model is shown (it exists, visitor did not pick "Sketch"). */
export function showsGenerated(
  a: Pick<Artifact, "generated">,
  prefs: { sketchModels?: boolean },
): boolean {
  return !!a.generated && !prefs.sketchModels;
}

/** The model the viewer and the room load for this artifact. */
export function activeModelSource(
  a: Pick<Artifact, "generated" | "model">,
  prefs: { sketchModels?: boolean },
): ModelAsset["source"] {
  return a.generated && !prefs.sketchModels
    ? a.generated.source
    : a.model.source;
}
