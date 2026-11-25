# Part: island

The purpose-built island diorama: terrain, trees, water, seasons on the
island, location buildings and pins, the owl and its flight, the overview
camera. Lab: `labs/island`.

- Component: `IslandPart` (`index.tsx`). Props: `IslandPartProps`.
- Reads: `content.island` (`owlHome`, `overview`, `locations[]` with
  `anchor`, `owlPerch`, `arrivalView`, `status`, `building`), `season`,
  `view`, `locationId`, `prefs`.
- Emits: `location.select` (visitor picks an open place), `owl.arrived`
  (owl landed; the shell then opens the scene). Optional: `season.set` if the
  island offers its own season control.

## Must

- **Not a geographic map** (decision by Lukas, 2026-11-25). No real
  elevation data or Hokkaido outline. Shape the island around the locations
  in the pack. Units: island space (du), see `src/contracts/space.ts`.
- Stop at "owl lands, roof starts to lift". The interior belongs to
  `detail-scene` (separate scale).
- "soon" locations are visible but closed. Keep the HTML location list for
  keyboard and no-WebGL users.
- Follow camera by default; cut camera when `prefs.reducedMotion`.

## Port from `labs/island`

Keep: shader seasons (one uniform from `seasonWeights()`), instanced trees
(~8k at 1.5×, 2 draw calls), owl flight + landing, `CameraControls` rig,
tilt-shift, placement pads. Drop: `bake-terrain.mjs` and the real heightfield,
lon/lat `places.ts` (use `content.island.locations`), hex/terrace looks.
Port GLSL string patches to three-custom-shader-material when convenient.

## Acceptance

Owl flies to the lake house and emits `owl.arrived` once; closed places do not
emit `location.select`; season value 0–3.99 blends; ≤ 80 draw calls;
keyboard path works with WebGL off.

## Decisions

- 2026-11-25: purpose-built island, not a geographic map (Lukas).

* 2026-11-25: 3D island ported from labs/island into `World.tsx` + `world/`. Owl flight is the travel step; `owl.arrived` hands off to the detail scene (no roof lift on the island).
* 2026-11-25: spirit-like snow owl (`world/Owl.tsx`), trail off with reduced motion. See docs/STYLE.md § owl look.
* 2026-11-25: toon pass via `src/parts/shared/toon.ts` (two-tone light, cool shade, two-colour fog) with season tokens `shade`, `fogNear`, `ink`.
* 2026-11-25: `building: "house"` is drawn as a chise (`Chise` in `world/Places.tsx`), after Lukas's Hokkaido Museum photos (visual reference only): low reed walls on posts, steep thatched hip roof in bands with a ridge bundle, small entry porch at the west end. About 20 extra meshes.
* 2026-11-25: themed areas (`world/Areas.tsx`, positions `AREAS` in `world/island.ts`), after Lukas's photos of the Hokkaido Museum theme 2 and theme 4 dioramas (visual reference only): coast = herring work house, trays, racks, jetty, two bobbing boats; forest = 1890 land-survey camp (tents, pack horses, sawing, a straight stake line) beside a patch of forest plants; hills = sika deer, brown bear, hare; mountains = coal mine adit, rails, carts, coal heap, horse sleigh with logs. Each area is also a content-pack place (`herring-coast`, `survey-forest`, `animal-hills`, `coal-mountain`, building `area-*`, open since 2026-11-26) with its own outdoor scene; `area-*` buildings draw nothing because Areas.tsx draws the scene. One merged vertex-colour mesh per area + one for the boats (5 draw calls). Claims: knowledge `land-and-sea`.
* 2026-11-26: area props get snow on their top faces in winter (`shared/snowCap.ts`, driven by `U.uW.w`; no extra draw call). Added small cited details: mats under the herring and a carrier, a survey tripod, a raccoon dog, a hazel grouse and a set bow on the hills, a drilling miner and a log stack.
* 2026-11-26: each place has an invisible pick cylinder (`HitArea` in `world/Places.tsx`: pad radius, or the themed area's `r`, plus 0.5 du), so hover and click work on the whole area, not only on the pin or one mesh. Hover on the area lights the pin (`data-hover`) and shows a pointer. The place cards show "N activities" and their kinds, and "All activities" opens a sheet (`Guide.tsx`) grouped by place or by kind; an entry flies to its place. Activities per place = the `activityIds` of the scenes at that location.
* 2026-11-26: calmer, tighter island (Lukas chose it after a before and after). `LAYOUT = 0.75` in `world/island.ts`: elevation() samples the first design at (x, z) / LAYOUT, peak and ridge heights × LAYOUT, and LAKE, RIVER and AREAS are scaled. Content anchors, arrival views, owl home and the overview camera in `src/content/bark-to-cloth/island.ts` are the same 0.75 (keep both in step; a test checks AREAS against the anchors). 2,600 trees (was 9,000) with wider place clearings; no lavender rows, drift ice or snowfall on the island.
* 2026-11-26: place buildings take snow on their top faces in winter too (`Snowy` in `world/Places.tsx`); one shared `SNOW` uniform in `world/season.ts`, set by the season driver.
* 2026-11-26: small cited details at island scale, matching the scenes: a dugout canoe and a millet garden on the lake house pad (canoe-pole, crops) and a fish owl on the grove shelter roof (owl-kamuy). 6 extra meshes.
* 2026-11-25: first-load screen (`LoadScreen.tsx`). It is in the server HTML, so it shows before scripts run, then follows the real steps (page code, 3D assets via drei `useProgress`, first island frame) and fades out on the first frame (or after 20 s). Once per page; visual only (`pointer-events: none`).
