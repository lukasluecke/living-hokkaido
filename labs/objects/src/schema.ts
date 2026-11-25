// Draft contract: links a 3D object to knowledge entries (claims + sources).
// Designed to extend src/domain/contracts.ts in the main app, not replace it.
import { z } from "zod";

const vec3 = z.tuple([z.number(), z.number(), z.number()]);

/** How the geometry relates to a real object. Drives labels and rights rules. */
export const representationSchema = z.enum([
  "illustrative", // original sketch geometry; must say so in the UI
  "reconstruction", // modelled from documented references; needs reviewer sign-off
  "scan", // photogrammetry / museum 3D data; needs rights + consent
]);

export const modelAssetSchema = z.object({
  assetId: z.string().min(1),
  url: z.string().min(1),
  format: z.literal("glb"),
  representation: representationSchema,
  license: z.string().min(1), // e.g. "MIT (original)", "CC0-1.0", "museum permission #..."
  rights: z.enum(["unknown", "restricted", "approved"]),
  consent: z.enum(["not-required", "pending", "granted", "withdrawn"]),
  attribution: z.string().min(1),
  sourceId: z.string().optional(), // source record that holds the permission
  bytes: z.number().int().positive().optional(),
  triangles: z.number().int().positive().optional(),
  /** Mesh/material names a look or hotspot may target. */
  nodes: z.array(z.string()).default([]),
});

export const hotspotSchema = z.object({
  id: z.string().min(1),
  /** Local-space anchor on the model, plus outward normal for back-face hiding. */
  position: vec3,
  normal: vec3,
  node: z.string().optional(),
  title: z.string().min(1),
  /** Every hotspot text must come from a claim; no free-floating facts. */
  claimId: z.string().min(1),
  kind: z.enum(["claim", "disclaimer"]).default("claim"),
});

export const artifactObjectSchema = z
  .object({
    id: z.string().min(1),
    knowledgeId: z.string().min(1),
    title: z.string().min(1),
    label: z.string().min(1),
    claimIds: z.array(z.string()).min(1),
    model: modelAssetSchema,
    display: z.object({
      restRotation: vec3.default([0, 0, 0]),
      inspectScale: z.number().positive().default(1),
      /** Pitch clamp for the turn viewer, radians. */
      pitchLimit: z.number().min(0).max(Math.PI / 2).default(0.5),
    }),
    hotspots: z.array(hotspotSchema).default([]),
    activityIds: z.array(z.string()).default([]),
    journal: z
      .object({ stampId: z.string(), unlock: z.enum(["inspect", "all-hotspots"]) })
      .optional(),
  })
  .superRefine((o, ctx) => {
    for (const h of o.hotspots)
      if (!o.claimIds.includes(h.claimId))
        ctx.addIssue({ code: "custom", path: ["hotspots", h.id], message: `claim ${h.claimId} not linked to object` });
    const m = o.model;
    if (m.representation !== "illustrative" && m.rights !== "approved")
      ctx.addIssue({ code: "custom", path: ["model", "rights"], message: "scans and reconstructions need approved rights" });
    if (m.representation === "scan" && m.consent !== "granted")
      ctx.addIssue({ code: "custom", path: ["model", "consent"], message: "scans need granted consent" });
    if (m.consent === "withdrawn")
      ctx.addIssue({ code: "custom", path: ["model", "consent"], message: "withdrawn: do not show" });
  });

export type ArtifactObject = z.infer<typeof artifactObjectSchema>;

/** Cross-check against the knowledge graph the platform curates. */
export function checkLinks(
  objects: ArtifactObject[],
  knowledge: { id: string; claims: { id: string }[] }[],
): string[] {
  const errors: string[] = [];
  for (const o of objects) {
    const k = knowledge.find((x) => x.id === o.knowledgeId);
    if (!k) {
      errors.push(`${o.id}: unknown knowledge entry ${o.knowledgeId}`);
      continue;
    }
    for (const c of o.claimIds)
      if (!k.claims.some((x) => x.id === c)) errors.push(`${o.id}: claim ${c} not in ${k.id}`);
  }
  return errors;
}
