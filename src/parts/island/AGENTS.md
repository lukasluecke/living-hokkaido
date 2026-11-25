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
