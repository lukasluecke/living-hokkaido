# Style and scale guide

One look across all parts: **a cozy hand-made miniature**. Somewhere between an
immersive storybook, an interactive museum and a cozy exploration game. Tokens
live in `src/design/tokens.ts`; use them instead of new hex values.

## Art direction

* **Low-poly, hand-made, warm.** Simple shapes with small irregularities
  (jitter), flat or softly smooth shading, warm light. No photo-real textures
  in the scene. Reference shots: project files `island-tech/`, `detail-scene/`,
  `objects-lab/`.
* **Miniature feeling.** High three-quarter cameras, tilt-shift on the island,
  soft vignette. Buildings and the owl are larger than "real" on the island so
  they read from above.
* **The island is purpose-built, not a map.** Do not use real elevation data
  or the real Hokkaido outline. Shape it around the places we show: a lake
  with the lake house, a forest, a river, a coast, and the three "soon" places.
* **Seasons are one value.** Spring (cherry blossom, snow on the peaks),
  summer (lavender, green), autumn (red and gold leaves), winter (snow, drift
  ice, warm windows). Blend through `seasonWeights()` and the `season.*`
  token arrays. Season items are effects on the same meshes, not new scenes.
* **Objects** may use a slightly stronger style than the room (the objects lab
  favours toon shading + ink outline + gold hover hull). *Open decision:* the
  island stays flat low-poly or moves to toon as well. Record the decision in
  `src/parts/artifacts/AGENTS.md` and here.
* **Scans are shown alone.** A real scan sits in the focus viewer on a neutral
  backdrop, never loose in the low-poly room (style clash, see
  `labs/detail-scene/NOTES.md`).

## Colour

| Use | Tokens |
|---|---|
| Overlay paper and text | `ui.paper`, `ui.paperEdge`, `ui.ink`, `ui.inkSoft` |
| Focus, hover, selection | `ui.gold` (outline, glow), `ui.goldDeep` (pressed) |
| Night UI / winter sky | `ui.night` |
| Object and building parts | `material.*` (cloth, band, wood, fiber, bark, roof …) |
| Season colours | `season.sky / sun / sea / ground / foliage / accent` (4 values each) |

Contrast: overlay text ≥ 4.5:1 on paper. Do not use colour as the only signal
(earned stamps also change icon, focus also shows an outline).

## Light

* Island: one sun (direction and colour from `season.sun`), hemisphere fill,
  soft shadows. AO optional by device.
* Interior: bake AO and hearth light where possible; keep **one** live warm
  light (hearth flicker) plus emissive embers and window glow. No real-time
  point-light shadows (6 extra passes).

## Scale and coordinates

All 3D is Y-up, right-handed (three.js). Constants: `src/contracts/space.ts`.

| Space | Unit | Origin | Typical sizes |
|---|---|---|---|
| Island | diorama unit (du) | island centre, sea level | island radius 30 du, peaks ≤ 8 du, building footprint 1.3 du, owl wingspan 0.6 du, trees 0.4–1.2 du |
| Scene | metre | centre of the floor; +Z = open side facing the dollhouse camera | room 7 × 5 × 3 m, eye height 1.6 m |
| Artifact | metre | centre of the base; front faces +Z | real size, 0.2–2 m; the viewer scales with `display.inspectScale` |

Hand-off between spaces happens at events, never by sharing coordinates: the
island stops when the owl lands (`owl.arrived`) and the detail scene starts
from its own `views.outside`.

## Cameras

* Overview FOV 32°, DPR ≤ 1.5.
* Use drei `CameraControls` for every move; one `setLookAt(eye, target,
  true)` per view. Camera targets come from the pack (`overview`,
  `arrivalView`, `views.outside/home`, `focusView`).
* Island: "follow the owl" by default, "cut" when `prefs.reducedMotion`.
* Scene: roof-lift entry → dollhouse home → focus move-in → `Esc` back.

## Motion

Durations in `motion.*`. With `prefs.reducedMotion`: no camera chases, cut
instead of fly, no timelapse autoplay, no particle storms. Nothing important
may depend on an animation finishing (always emit the event).

## Overlay UI

* **One DOM overlay** for labels and hotspots (projected each frame), not one
  drei `<Html>` per label. It is cheaper, robust, and keyboard-accessible.
* Cards are paper panels (`ui.paper`), rounded 14 px, soft shadow, body text ≥
  14 px, local fonts only (`type.*`).
* Every interactive 3D thing has an HTML equivalent (button with the same
  label) for keyboard and no-WebGL use. Keys: `1`–`9` focus artifacts
  (placement `key`), `Esc` goes back.

## Honesty labels (required)

* `research-preview` content shows "Research preview · review pending".
* Illustrative models show "Illustrative model". Scans and reconstructions say
  what they are and who holds the rights.
* The weave activity says it is a playful illustration, not a real technique,
  unless an approved claim supports the steps.
* The owl is a fictional guide. Its lines navigate; they do not state cultural
  facts.
* Owl look (Lukas, 2026-11-25): a snow-white, round, softly glowing spirit-like
  owl with a pale blue light trail. It is our own character. Do not name it or
  style it as Kotan-kor-kamuy (the Ainu name for Blakiston's fish owl, a highly
  revered kamuy; JTA/MLIT R1-01865, R6-00291) and use no Ainu patterns on it,
  unless an Ainu cultural reviewer approves.

## Assets

* Format: GLB, meshopt compression, WebP textures ≤ 1024 px.
  `npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt
  --texture-compress webp --texture-size 1024 --join false --flatten false`
  (keep node names).
* File names: `public/models/<artifact-id>.glb`, `public/models/scene-<scene-id>.glb`,
  `public/models/building-<style>.glb`, `public/models/owl.glb`.
* Node names: the roof node is `roof` (lifts on entry); hotspot nodes match
  `hotspots[].node`; the owl has `wing-l`, `wing-r`, `body`.
* Every asset gets a line in `public/models/ATTRIBUTION.md` (source, licence,
  rights, representation).

## Performance budget (demo laptop)

From `budget` in `tokens.ts`: island ≤ 80 draw calls / 1.5 M triangles;
detail scene ≤ 150 draw calls / 0.5 M triangles; one artifact ≤ 50 k
triangles, ≤ 1 MB GLB; initial download ≤ 10 MB. Measure with
`renderer.info` on a real GPU; container numbers (SwiftShader) do not count
for fps.

`npm run perf` (after `npm run build`) reports first-load bytes, time to the
first island frame and fps per place (`scripts/perf/measure.ts`;
`--headed` for a real GPU, `--query quality=low` for one quality step).

### Quality step-down on slow GPUs

Every canvas puts a `<QualityGovernor />` inside and takes `dpr` (and
`shadows`) from `useQuality()` (`src/parts/shared/Quality.tsx`). When a
canvas stays under 40 fps for two 1.5 s windows (after a 2.5 s warm-up),
the shared tier goes down one step (two steps when a window is under
20 fps; the next check waits 1 s). Fast machines stay on `full`, so their
look does not change. The tier lasts for the browser session and never goes
up by itself. `?quality=full|high|mid|low` fixes the tier (no automatic
steps).

| Tier | DPR | Tilt-shift, SMAA, bloom | Shadow maps |
|---|---|---|---|
| full | 1 to 1.5 | on | on |
| high | 1 | on | on |
| mid | 1 | off | on |
| low | 0.75 | off | off |

Ink lines, toon shading and vignette stay on every tier: they are the look.
A new canvas must use the same two pieces, and gate any new costly pass
on `extraFx`.
