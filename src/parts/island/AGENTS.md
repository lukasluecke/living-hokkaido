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
* 2026-11-25: themed areas (`world/Areas.tsx`, positions `AREAS` in `world/island.ts`), after Lukas's photos of the Hokkaido Museum theme 2 and theme 4 dioramas (visual reference only): coast = herring work house, trays, racks, jetty, two bobbing boats; forest = 1890 land-survey camp (tents, pack horses, sawing, a straight stake line) beside a patch of forest plants; hills = sika deer, brown bear, hare; mountains = coal mine adit, rails, carts, coal heap, horse sleigh with logs. Island scenery, not content-pack places (no pins, not selectable). One merged vertex-colour mesh per area + one for the boats (5 draw calls). Claims: knowledge `land-and-sea`. Not yet seasonal (no snow on the props).
