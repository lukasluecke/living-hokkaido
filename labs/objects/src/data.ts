// Sample object records. Texts are taken from the existing research-preview
// story data (src/data/story.ts in the main app); nothing new is claimed.
import { type ArtifactObject, artifactObjectSchema } from "./schema";

export const knowledge = [
  {
    id: "bark-to-cloth",
    claims: [
      { id: "bark-fiber", text: "The museum describes inner bark fibers used to weave cloth.", source: "Hokkaido Digital Museum · Bark clothes" },
      { id: "variation", text: "The museum describes variation in clothing by region, material and occasion.", source: "Hokkaido Digital Museum · Outline of Ainu clothing" },
      { id: "illustrative", text: "Sketch geometry made for this demo. It is not a museum object, scan or reconstruction.", source: "Living Hokkaido · ATTRIBUTION.md" },
      { id: "no-technique", text: "This grid invites close looking. It does not teach an authenticated weaving technique.", source: "Living Hokkaido · editorial note" },
    ],
  },
];

const sketch = {
  format: "glb" as const,
  representation: "illustrative" as const,
  license: "MIT (original)",
  rights: "approved" as const,
  consent: "not-required" as const,
  attribution: "Living Hokkaido team, original sketch geometry",
};

export const objects: ArtifactObject[] = [
  {
    id: "fiber",
    knowledgeId: "bark-to-cloth",
    title: "A material",
    label: "Inner bark fibers",
    claimIds: ["bark-fiber", "illustrative"],
    model: { ...sketch, assetId: "fiber-sketch", url: "/models/fiber.glb", nodes: ["strands", "bark", "tie"] },
    display: { restRotation: [0, 0.4, 0], inspectScale: 1.4, pitchLimit: 0.6 },
    hotspots: [
      { id: "f1", position: [0.05, 0.3, 0.12], normal: [0, 0.6, 0.8], node: "strands", title: "Fibers", claimId: "bark-fiber", kind: "claim" },
      { id: "f2", position: [0.3, -0.05, -0.1], normal: [0.3, 0.9, 0.2], node: "bark", title: "About this model", claimId: "illustrative", kind: "disclaimer" },
    ],
    activityIds: ["material"],
    journal: { stampId: "three-objects", unlock: "all-hotspots" },
  },
  {
    id: "loom",
    knowledgeId: "bark-to-cloth",
    title: "A woven surface",
    label: "From fiber to cloth",
    claimIds: ["no-technique", "illustrative"],
    model: { ...sketch, assetId: "loom-sketch", url: "/models/loom.glb", nodes: ["frame", "warp", "woven", "shuttle"] },
    display: { restRotation: [0.5, 0, 0], inspectScale: 1.3, pitchLimit: 0.7 },
    hotspots: [
      { id: "l1", position: [0, 0.12, 0.27], normal: [0, 1, 0.3], node: "woven", title: "The woven part", claimId: "no-technique", kind: "claim" },
      { id: "l2", position: [0.42, 0.1, -0.3], normal: [0.6, 0.8, 0], node: "frame", title: "About this model", claimId: "illustrative", kind: "disclaimer" },
    ],
    activityIds: [],
    journal: { stampId: "three-objects", unlock: "all-hotspots" },
  },
  {
    id: "garment",
    knowledgeId: "bark-to-cloth",
    title: "A garment",
    label: "More than one story",
    claimIds: ["variation", "illustrative"],
    model: { ...sketch, assetId: "garment-sketch", url: "/models/garment.glb", nodes: ["body", "hem", "pole"] },
    display: { restRotation: [0, 0, 0], inspectScale: 0.75, pitchLimit: 0.4 },
    hotspots: [
      { id: "g1", position: [0, 0.05, 0.1], normal: [0, 0, 1], node: "body", title: "One garment, many stories", claimId: "variation", kind: "claim" },
      { id: "g2", position: [0.25, -0.66, 0.11], normal: [0, 0, 1], node: "hem", title: "The hem band", claimId: "illustrative", kind: "disclaimer" },
    ],
    activityIds: ["variation"],
    journal: { stampId: "three-objects", unlock: "all-hotspots" },
  },
].map((o) => artifactObjectSchema.parse(o));

export function claimText(id: string) {
  return knowledge[0].claims.find((c) => c.id === id);
}
