# Rendering tasks for Shaw (optional pick-list)

> **Optional.** These tasks are a menu, not a plan. Shaw has a proper
> rendering rig (real GPU, Blender), and can do the more involved shader,
> geometry, lighting, profiling and render work that a container cannot do
> well. Pick any task, in any order, or none. The demo works without all of
> them. Each task also has a GitHub issue with the labels `for-shaw` and
> `optional`.

## How to work on a task

1. Read `AGENTS.md`, [PARTS.md](PARTS.md), [STYLE.md](STYLE.md) and the
   `AGENTS.md` of the part the task names.
2. Experiment in `labs/<part>-<topic>` (for example `labs/island-water`) and
   end with a `HANDBACK.md` ([template](HANDBACK.md)). Do not edit
   `src/shell` directly. A part change goes behind the existing part export,
   with the props in `src/contracts/parts.ts`.
3. Use `src/design/tokens.ts` (colours, `season.*`, `motion.*`, `budget`).
   Season effects read one value through `seasonWeights()`; they are effects
   on the same meshes, not new scenes.
4. Keep the fallback: reduced motion, the HTML path with WebGL off, and the
   performance budget (`budget` in `tokens.ts`). Measure on a real GPU with
   `renderer.info`.
5. GLB assets: meshopt, WebP textures ≤ 1024 px, keep node names, one line in
   `public/models/ATTRIBUTION.md` (source, licence, rights, representation).

**Cultural gate (all geometry tasks).** Do not model a real Ainu object,
house, pattern or tool from memory or from an image search. A real object
needs a source id, rights and an approved claim in the content pack, and a
human review (AGENTS.md, docs/REVIEW.md). Without that, a model stays
"Illustrative model" and generic. The owl stays our own fictional character
with no Ainu patterns (STYLE.md § owl look).

**Effort:** S = up to 2 h, M = about half a day, L = one day or more.
Deadline: 26 Nov 14:00 JST. Before the deadline, only S tasks or work that is
almost done are safe; the rest is for after the hackathon.

## Summary

| # | Task | Area | Plugs in at | Effort |
|---|---|---|---|---|
| 1 | [Stylised water with freeze](#1-stylised-water-with-freeze) | shader | `island/world/Water.tsx`, `Environment.tsx` | M |
| 2 | [Snow accumulation and ice](#2-snow-accumulation-and-ice) | shader | `island/world/season.ts`, `Terrain.tsx`, `Trees.tsx`, `Places.tsx` | M |
| 3 | [Wind in trees, grass and lavender](#3-wind-in-trees-grass-and-lavender) | shader | `island/world/Trees.tsx`, `Environment.tsx` | S–M |
| 4 | [Owl spirit glow and trail](#4-owl-spirit-glow-and-trail) | shader | `island/world/Owl.tsx`, `World.tsx` | M |
| 5 | [Outline quality](#5-outline-quality) | post-process | `shared/InkEdges.ts`, `artifacts/model/looks.ts` | M |
| 6 | [Hearth fire and smoke](#6-hearth-fire-and-smoke) | shader | `detail-scene/room/Hearth.tsx` | S–M |
| 7 | [Artifact GLB models](#7-artifact-glb-models) | geometry | `model.source` in `content/bark-to-cloth/artifacts.ts` | M each |
| 8 | [Building and room GLBs](#8-building-and-room-glbs) | geometry | `public/models/building-*.glb`, `scene-*.glb` | L |
| 9 | [Owl GLB](#9-owl-glb) | geometry | `public/models/owl.glb`, `island/world/Owl.tsx` | M |
| 10 | [Hand-sculpted island terrain](#10-hand-sculpted-island-terrain) | geometry | `island/world/field.ts`, `island.ts` | L |
| 11 | [Baked lighting and AO](#11-baked-lighting-and-ao) | lighting | `detail-scene/room/*`, `over-time/Diorama.tsx` | M–L |
| 12 | [Real-GPU performance profile](#12-real-gpu-performance-profile) | profiling | all 3D parts, `budget` | S–M |
| 13 | [High-quality backup video](#13-high-quality-backup-video) | render | `scripts/demo-video`, docs/DEMO.md | S–M |

All paths under `src/parts/` unless written in full.

## Shaders

### 1. Stylised water with freeze

- **Why.** Lake, river and sea are flat `MeshStandardMaterial`s that only
  change colour and roughness with the season. Water is a big part of the
  island view and of the winter story (frozen lake, drift ice).
- **Plugs in at.** `src/parts/island/world/Water.tsx` (`useWaterMaterial`,
  `Lake`, `River`), sea in `world/Environment.tsx`. Season value: `U.uW`
  in `world/season.ts`. Chain with the toon patch (`shared/toon.ts`
  chains `onBeforeCompile`).
- **Ideas.** Toon-banded specular, soft shoreline foam from the depth
  difference, a slow flow direction on the river, ripples near the lake
  house, a freeze transition (cracks, white rim first) driven by the winter
  weight.
- **Acceptance.** Season 0–3.99 blends without pops; winter reads as frozen;
  no extra draw calls (same meshes); no animation with reduced motion
  (static frame is fine); toon look and ink outlines still match.

### 2. Snow accumulation and ice

- **Why.** Snow is only a snow line on the terrain and a tint on tree tops.
  Snow that settles on up-facing surfaces (roofs, branches, ground, rocks)
  sells the winter season and the "warm windows" mood.
- **Plugs in at.** Shared uniforms in `island/world/season.ts`
  (`uSnowLine`, `uW`); `Terrain.tsx` (snow mask), `Trees.tsx` (leaf snow),
  `Places.tsx` (roofs). In the room: window view in
  `detail-scene/room/House.tsx`. Drift ice: `DriftIce` in
  `Environment.tsx`.
- **Ideas.** Normal-up mask × noise × winter weight; a small vertex push for
  thickness on roofs; soft edges; optional icicles as one instanced mesh.
  Better drift-ice floes (shape, edge foam).
- **Acceptance.** One season value drives all snow; no new scene and no new
  meshes per season; ≤ 80 island draw calls; looks the same in the
  over-time diorama if it is used there.

### 3. Wind in trees, grass and lavender

- **Why.** `Trees.tsx` already has a gentle sway. A shared wind field with
  gusts that travel across the island makes the diorama feel alive.
- **Plugs in at.** Vertex shader in `island/world/Trees.tsx` (instanced, 2
  draw calls); lavender rows and particles in `world/Environment.tsx`.
  Put the wind uniforms (direction, strength, time) next to `U` in
  `world/season.ts` so all meshes share them.
- **Acceptance.** Same instancing and draw calls; wind direction is the same
  for trees, lavender and falling petals/leaves/snow; stronger in winter
  storms is optional; off (static) with `prefs.reducedMotion`.

### 4. Owl spirit glow and trail

- **Why.** The owl is the main navigation. STYLE.md asks for "a snow-white,
  round, softly glowing spirit-like owl with a pale blue light trail". Today
  the glow is a sprite halo and the trail is a set of instanced puffs.
- **Plugs in at.** `island/world/Owl.tsx` (`Trail`, `glowTexture`, owl
  materials); post-processing in `island/World.tsx` (`EffectComposer`).
- **Ideas.** Selective bloom only on the owl (layer or emissive threshold),
  a fresnel rim, a trail ribbon shader with soft fade and small sparkles,
  a short "settle" pulse when the owl lands.
- **Acceptance.** Matches the owl-look decision (no Ainu patterns, not
  Kotan-kor-kamuy); trail off with reduced motion; `owl.arrived` still
  fires once and does not wait for an effect; no budget overrun.

### 5. Outline quality

- **Why.** `InkEdgesEffect` finds edges from depth only. It misses creases
  and object-to-object edges at the same depth, and the line width does not
  follow the device pixel ratio. Artifacts use a separate inverted hull.
- **Plugs in at.** `src/parts/shared/InkEdges.ts` (used by the island and
  over-time parts; `island/InkEdges.ts` only re-exports it). Inverted
  hull: `artifacts/model/looks.ts`.
- **Ideas.** Depth + normal edges (normal pass), DPR-aware width,
  distance fade, optional per-object id edges; one consistent ink colour
  and width between island, room and artifact viewer (`season.*` `ink`
  token).
- **Acceptance.** Cleaner lines on the island, room and objects in a
  side-by-side screenshot set; one full-screen pass at most for the
  island; no shimmer while the camera moves.

### 6. Hearth fire and smoke

- **Why.** The hearth is the warm centre of the room. Today it is a
  flickering point light, embers and sparks.
- **Plugs in at.** `src/parts/detail-scene/room/Hearth.tsx`; bloom in
  `detail-scene/Room.tsx`.
- **Ideas.** A small toon flame (billboard or mesh with a noise shader),
  soft smoke column through the roof opening, ember glow that matches the
  bloom threshold.
- **Acceptance.** Keep one live warm light (STYLE.md § light); no real-time
  point-light shadows; static with reduced motion; ≤ 150 room draw calls.
  The fire is generic, not a claim about a specific hearth.

## Geometry

### 7. Artifact GLB models

- **Why.** The three artifacts (`fiber`, `cloth`, `garment`) are code
  sketches (`artifacts/model/models.ts`). Better models make the focus
  view and the turn viewer much stronger.
- **Plugs in at.** Content only: set `model.source` to
  `{ kind: "glb", url: "/models/<artifact-id>.glb" }` in
  `src/content/bark-to-cloth/artifacts.ts`. The viewer and the room both
  load it (`src/parts/shared/Glb.tsx`). No part change is needed.
- **Rules.** Metres, origin at the base centre, +Y up, front +Z. Keep the
  node names in `model.nodes` (hotspots target them). ≤ 50 k triangles,
  ≤ 1 MB, textures ≤ 1024 px (`budget.artifact`). Toon look and ink hull
  still apply.
- **Cultural gate.** An original illustrative model is fine and keeps the
  "Illustrative model" label. A model of a real object (for example a
  museum piece or a scan) needs rights, a source id and an approved claim
  first. A loom or weaving tool for the weave activity is in scope only
  when an approved claim supports it. Scans are shown alone in the viewer,
  never loose in the low-poly room.
- **Acceptance.** `npm run check` passes with the new `model.source`;
  hotspots land on the right nodes; budget met; `ATTRIBUTION.md` line.

### 8. Building and room GLBs

- **Why.** Island buildings, the lake-house room and the new place scenes
  are code-built. Authored models give a more hand-made, consistent look.
- **Plugs in at.** `public/models/building-<style>.glb` (island,
  `location.building` in `src/contracts/world.ts`, drawn in
  `island/world/Places.tsx`), `public/models/scene-<scene-id>.glb`
  (detail scene). Node `roof` lifts on entry; placement positions come
  from `scene.placements[]`. A loader for these GLBs in the parts is a
  small part change (see `shared/Glb.tsx`); propose it in the HANDBACK.
- **Cultural gate.** The room is "illustrative, not a reconstruction of an
  Ainu house". A traditional house model (for example a chise) needs
  sources, an approved claim and a reviewer before it ships. Until then,
  keep buildings generic.
- **Acceptance.** Same footprint and anchor as today (island 1.3 du
  footprint; room 7 × 5 × 3 m, origin floor centre, +Z open side); roof
  lift works; ≤ 150 room draw calls (`MergeStatic`); WebGL-off path
  unchanged.

### 9. Owl GLB

- **Why.** The owl is the most-seen character. A rigged model gives better
  wing motion and a landing pose.
- **Plugs in at.** `public/models/owl.glb` with nodes `wing-l`, `wing-r`,
  `body` (STYLE.md § assets); `island/world/Owl.tsx` drives the wings.
- **Acceptance.** Same size (wingspan 0.6 du) and look (round, snow-white,
  soft glow, no Ainu patterns); flight and landing still work; small file
  (target ≤ 300 KB).

### 10. Hand-sculpted island terrain

- **Why.** The terrain comes from a noise field (`island/world/field.ts`).
  A sculpted island gives clearer valleys, a nicer coast and better space
  around each place.
- **Plugs in at.** `island/world/field.ts` (`elevAt`) and
  `island/world/island.ts` (lake, river, peaks). Bake the sculpt to a
  small heightmap (for example 256² 16-bit PNG) that `field.ts` samples.
- **Rules.** Purpose-built, not a map: no real elevation data and no real
  Hokkaido outline (decision by Lukas). Location anchors in
  `content.island.locations` stay valid (buildings on flat pads, owl
  perches reachable).
- **Acceptance.** Same island radius (30 du) and peak height (≤ 8 du);
  snow line, lake and river still read; download ≤ 300 KB; draw calls
  unchanged.

## Lighting

### 11. Baked lighting and AO

- **Why.** STYLE.md asks to bake AO and hearth light in the interior and
  keep one live light. Today the room uses live lights and
  `ContactShadows`.
- **Plugs in at.** `detail-scene/room/House.tsx`, `room/MergeStatic.tsx`,
  `room/textures.ts`; the over-time tile in `over-time/Diorama.tsx`.
- **Ideas.** Bake AO (and optionally the warm hearth bounce) in Blender to
  a lightmap on a second UV set, or to vertex colours for the low-poly
  look. Keep season changes possible (bake neutral light, tint live).
- **Acceptance.** Softer contact and corners; fewer live lights; same or
  fewer draw calls; total extra download ≤ 1 MB; window glow still
  follows the season.

## Performance and output

### 12. Real-GPU performance profile

- **Why.** Container numbers (SwiftShader) do not count for fps
  (STYLE.md § performance). Nobody has measured the demo on a real GPU
  and a phone.
- **Plugs in at.** `budget` in `src/design/tokens.ts`; island, room,
  artifact viewer and `/over-time`.
- **Do.** Run `npm run build && npm start`, walk the `/shell` happy path
  and `/over-time` on the demo laptop and one phone. Record fps, frame
  time, `renderer.info` draw calls and triangles, and initial download.
  Find the top three costs (Chrome performance panel, Spector.js).
- **Acceptance.** A table in docs/VALIDATION.md (or a lab HANDBACK) with
  device, browser, numbers per view and the top fixes. Only measured
  numbers; say which device.

### 13. High-quality backup video

- **Why.** The submission needs a backup video. On a real GPU the
  recording is smooth and full quality.
- **Plugs in at.** `npm run demo:video` (`scripts/demo-video`, shot list
  in `steps.ts`); see docs/DEMO.md § backup video.
- **Do.** Record the happy path at 1920×1080 (or 4K) with the real app.
  Optional: a few cinematic island fly-throughs from the real app
  (camera path in the lab), not a separate Blender film.
- **Acceptance.** The video shows the real app, not a mock-up; research
  preview and illustrative labels stay visible; file in the shared
  project folder, not in Git.
