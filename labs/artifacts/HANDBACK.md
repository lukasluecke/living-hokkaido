# Hand-back: artifacts lab

Part: artifacts · Status: ready to integrate · Date: 2026-11-25
Details: `README.md` in this folder.

## Recommendation
Original stylized models, toon shading with ink outline, gold hull on hover,
C2 inspect view with inertia yaw and clamped pitch, hotspots that fade when
facing away, and a card that cites the claim source.

## Keep
| What | Files | Notes for porting |
|---|---|---|
| Procedural models | `src/models.ts` | builder ids `fiber`, `cloth` (was `loom`), `garment` |
| Looks + outline | `src/looks.ts`, `src/hover.ts` | palette now `material.*` in `src/design/tokens.ts` |
| Inspect viewer | `src/InspectView.tsx` | props → `ArtifactViewerProps`; emit `artifact.inspected`, `hotspot.open` |
| GLB pipeline | `scripts/export.mjs`, gltf-transform | keep node names (`--join false --flatten false`) |

## Contract impact
`src/schema.ts` became `src/contracts/artifact.ts`: `model.url` →
`model.source` (`glb` or `procedural`), `journal` → stamps in the content
pack, new `summaryClaimId`. Sample data moved to
`src/content/bark-to-cloth/artifacts.ts`.

## Open questions
Who makes the final models (code or Blender)? Toon for the island too?
