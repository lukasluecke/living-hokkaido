# Hand-back: island lab

Part: island · Status: exploring (terrain to be redesigned) · Date: 2026-11-25
Details: `README.md` in this folder.

## Recommendation
React Three Fiber + one shared season uniform for all materials, instanced
trees, chase camera that follows the owl (cut camera for reduced motion),
tilt-shift. Stop the island view when the owl lands; the interior is a
separate scene.

## Keep
| What | Files | Notes for porting |
|---|---|---|
| Shader seasons | `src/world/season.ts`, `Environment.tsx` | weights now in `@/contracts` (`seasonWeights`), colours in `src/design/tokens.ts` |
| Instanced trees | `src/world/Trees.tsx` | ~8k at 1.5×, 2 draw calls |
| Owl flight + landing | `src/world/Owl.tsx` | land at `location.anchor + owlPerch`; emit `owl.arrived` |
| Camera rig, post FX | `src/lab/App.tsx` (Rig), TiltShift2 | targets from `island.overview` and `arrivalView` |
| Placement pads | `src/world/field.ts` (`flattenPads`) | pad radius `ISLAND.padRadius` |

## Drop
Real heightfield and outline (`bake-terrain.mjs`, `public/data/*`), lon/lat
`places.ts` (superseded by purpose-built `Location`s), hex and terrace looks.

## Contract impact
Uses `Location`, `Island`, `SeasonState`, events `location.select` /
`owl.arrived`. No changes proposed.

## Measurements
Software WebGL only: 63 draw calls, 1.6 M triangles (512 px field, 8k trees).
Not yet measured on the demo laptop.

## Open questions
Island shape and layout of the four places (design); toon or flat look.
