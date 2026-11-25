# Hand-back: detail-scene lab

Part: detail-scene · Status: ready to integrate (variant A) · Date: 2026-11-25
Details: `README.md`, `NOTES.md` in this folder.

## Recommendation
Hand-built low-poly room (variant A) with baked light and one live hearth
light, seen from a high 3/4 dollhouse camera. Owl lands → roof lifts → home
view → click object → camera moves in → card → `Esc` back.

## Keep
| What | Files | Notes for porting |
|---|---|---|
| Entry director | `src/App.tsx` (`Director`) | views from `scene.views`; emit `scene.ready` at the end |
| One DOM overlay | `src/App.tsx` (`Projector`) | use for labels and hotspots in every part |
| Room geometry | `src/room/House.tsx`, `Hearth.tsx`, `textures.ts` | roof node named `roof` |
| Artifact placement + focus | `src/room/Artifacts.tsx` | positions/views now in `src/content/bark-to-cloth/scene.ts` |
| Static merge | `src/room/MergeStatic.tsx` | 572 → 396 draw calls |

## Drop (for Thursday)
Splat (variant B) and scan-in-room (variant C); real-time point-light shadows.
`public/assets/corset-opt.glb` is a technical stand-in only, never in the demo.

## Contract impact
Uses `DetailScene`, `ArtifactPlacement`; events `scene.ready`,
`artifact.focus`, `scene.exit`. No changes proposed.

## Measurements
SwiftShader only: 396 draw calls (fx on, merged). Over the 150 budget: bake
light and merge more. Not yet measured on a real GPU.

## Open questions
Art pass for contrast (room is brown on brown); hanging pot blocks the view.
