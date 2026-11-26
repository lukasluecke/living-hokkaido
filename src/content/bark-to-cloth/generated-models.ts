// AI-generated models (Hyper3D Rodin Gen-2.5, text prompts only, no museum
// photos) that replace the code sketches unless the visitor picks "Sketch".
// Prompts and task ids: public/models/ATTRIBUTION.md. Each card shows the
// note claim instead of the sketch note. Ainu objects add that no curator has
// checked them (claim object-generated / garment-generated).
import type { ArtifactInput } from "@/contracts";

const NOTE: Record<string, string> = {
  "land-and-sea": "area-generated",
  "hokkaido-museum": "object-generated",
  "bark-to-cloth": "garment-generated",
};

/** Ainu objects outside "hokkaido-museum" that need the curator line. */
const NOTE_BY_ID: Record<string, string> = { "set-bow": "set-bow-generated" };

/** Artifact ids with a GLB in public/models/<id>.glb, and its size. */
const GENERATED: Record<string, number> = {
  herring: 324_088,
  saw: 235_216,
  shovel: 163_460,
  "set-bow": 202_320,
  deer: 161_396,
  tonkori: 157_096,
  canoe: 178_968,
  garment: 170_720,
  "lacquer-vessel": 275_992,
};

export function withGenerated(list: ArtifactInput[]): ArtifactInput[] {
  return list.map((a) => {
    const bytes = GENERATED[a.id];
    const noteClaimId = NOTE_BY_ID[a.id] ?? NOTE[a.knowledgeId];
    if (!bytes || !noteClaimId) return a;
    return {
      ...a,
      claimIds: [...a.claimIds, noteClaimId],
      generated: {
        source: { kind: "glb", url: `/models/${a.id}.glb` },
        tool: "Hyper3D Rodin Gen-2.5, text prompt",
        license: "Generated for Living Hokkaido (Hyper3D terms)",
        noteClaimId,
        bytes,
      },
    };
  });
}
