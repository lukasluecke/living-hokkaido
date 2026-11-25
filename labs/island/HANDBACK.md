# Hand-back: island lab

Part: island
Author: Lukas (+ agent)   Date: 2026-11-25
Status: ready to integrate (pending one real-GPU measurement)

## Recommendation
React Three Fiber v9 + three r180 (WebGL). A purpose-built island authored in
code around `content.island.locations` (no map data). One shared season uniform
from `seasonWeights()` drives every material. Instanced trees (2 draw calls).
Chase camera that follows the owl; cut camera when `prefs.reducedMotion`.
Tilt-shift for the miniature look. Stop at "owl lands, roof lifts"; the
interior is the detail scene.

## Keep
| What | Files | Notes for porting |
|---|---|---|
| Authored island | `src/world/island.ts`, `field.ts` | Coastline lobes, peak + ridge, lake, river, pads at every `location.anchor` and `owlHome` (`ISLAND.padRadius`). Elevation in "metres", mapped to du by `heightFromElev` (peak ≈ 7.8 du ≤ `ISLAND.maxHeight`). Island fits `ISLAND.radius` 30. |
| Ground shader | `src/world/Terrain.tsx` | Colour from elevation, slope, noise, snow line, season. Port the `onBeforeCompile` patch to three-custom-shader-material. |
| Seasons | `src/world/season.ts`, `Environment.tsx`, `Water.tsx` | Weights from `@/contracts` `seasonWeights`, colours from `@/design/tokens` (`season.*`). Sky, sun, sea, drift ice (north coast), lavender rows, petals / leaves / snow, lake and river freeze. |
| Trees | `src/world/Trees.tsx` | 9k, scale 2 → 0.65–1.2 du (inside `ISLAND.treeHeight`). Clearings at places, river, flower field and the arrival camera line of sight. |
| Owl | `src/world/Owl.tsx` | Wingspan `ISLAND.owlWingspan`. Lands at `anchor + owlPerch`. Flight curve clears terrain. |
| Buildings | `src/world/Places.tsx` | Footprint `ISLAND.buildingFootprint`; `building` keys house / grove / workshop / cabin; "soon" = grey, closed. Placeholder geometry, to be replaced by models from the artifacts lab. |
| Pins | `PinTracker` in `Places.tsx` + DOM buttons in `App.tsx` | Plain DOM buttons projected each frame (no drei `<Html>`, which dropped one label and logged React unmount warnings). |
| Camera rig | `Rig` in `src/lab/App.tsx` | `CameraControls`; overview from `island.overview`, arrival from `location.arrivalView`. |
| Part shape | `World` in `src/lab/App.tsx` | Takes `IslandPartProps` (+ lab options). Becomes `IslandPart`. |

## Drop
Real Hokkaido elevation and outline (version 1; Lukas: not a geographic map).
Terrace and hex looks (kept in the lab panel for comparison only). drei `<Html>`
labels.

## Contract impact
- Uses as-is: `IslandPartProps`, `Location`, `Island`, `SeasonState`,
  `seasonWeights`, `ISLAND` units, `createEventBus`, events `location.select`
  and `owl.arrived`. Tokens: `season`, `seasonItem`, `material`.
- Proposed changes: none.
- Note for content: the island features (lake, river, peak, flower field) are
  placed in `island.ts` to fit the current anchors. If anchors move, move the
  features too (one place: top of `island.ts`).

## Assets
| File | Source | Licence / rights | Size | Triangles |
|---|---|---|---|---|
| none | all geometry is generated in code (original) | MIT | – | – |

## Measurements
Software WebGL in a container only, so **no fps**. Scene cost from
`renderer.info` (incl. shadow pass):

| Setting | Draw calls | Triangles |
|---|---|---|
| default (painted, 9k trees, tilt-shift) | 70 | 1.21 M |
| default, owl at house | 52 | 1.21 M |
| hex, no trees | 64 | 0.11 M |

Inside `budget.island` (80 draw calls, 1.5 M triangles). Still to do: read
the perf line on the demo laptop. If slow: 4k trees, shadow map 1024, DPR 1.
Bundle ≈ 500 KB gzip JS; no data files.

## Acceptance (tested with Playwright)
- Click "Lake house": events are exactly `location.select {lake-house}` then
  `owl.arrived {lake-house}` once.
- Forced click on "Memory cabin · soon": no event.
- `season` 0–3.99 blends (screenshot at 2.8).
- 70 draw calls ≤ 80.

## Fallback and accessibility
"Places" list in the panel is the keyboard path; pins are real buttons;
closed places have `aria-disabled`. Camera "cut" when `prefers-reduced-motion`.
No-WebGL fallback is the shell's job (the HTML list works without the canvas).

## Screenshots
`shots/cmp-seasons.jpg`, `shots/cmp-owl.jpg`, `shots/cmp-timelapse.jpg`, `shots/cmp-terrain.jpg`
(the last two are from the previous scale and are kept for the look comparison).

## Open questions
- Toon outline or flat low-poly? (Flat is used now.)
- Building models from the artifacts lab; roof must stay a separate node to lift.
