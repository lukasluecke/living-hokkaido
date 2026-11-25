# Island world lab

> Current state and porting notes: see `HANDBACK.md`. Places, units and
> events now come from `@/content` and `@/contracts`.

A standalone experiment for the **overworld island only**: terrain, vegetation,
seasons, owl flight and camera. It is separate from the main Next.js app so we
can try ideas fast. The code is React Three Fiber, the same stack as the app,
so the parts that work can move into `src/components/World` later.

Detail scenes (inside a location) and 3D objects are explored in other threads.

## Run it

```bash
cd labs/island
npm install
npm run dev          # http://localhost:5173
```

The panel on the right switches every option live. The line at the bottom of
the panel shows fps, frame time, draw calls and triangles.

URL parameters (for screenshots or a fixed demo):
`style=painted|terrace|hex`, `trees=9000`, `treeScale=2`,
`season=0..3.99` (fractions are blends), `play=1` (timelapse), `fx=none|tilt|full`,
`cam=follow|cut`, `dest=lake-house` (a location id from `@/content`), `instant` (no camera easing),
`shot` (hide the UI), `labels`, `dpr=1`, `flyT=0.5` (freeze the owl mid-flight).

## What each experiment tests

| Area | What is built | File |
| --- | --- | --- |
| Showcase island | Authored in code (`island.ts`), not a map. Each feature has a job: snowy peak (snow line), lake (lake house, freezes in winter), river valley (village, freezes), forest clearing (workshop), hill (lavender), north coast (drift ice). Flat pads under every site. | `island.ts`, `field.ts` |
| Inland water | Lake surface and river ribbon, season colours, frozen in winter. | `Water.tsx` |
| Terrain look | A: smooth painted heightfield. B: terraced topo layers. C: hex columns. | `Terrain.tsx`, `HexTerrain.tsx` |
| Vegetation | Two `InstancedMesh` (conifer, broadleaf), placed by real elevation, slope, tree line and a forest noise. Any count = 2 draw calls. | `Trees.tsx` |
| Seasons | One season number drives all materials through shared uniforms. Ground, leaves, snow line, sea, lavender, sky, sun and weather all blend in the shader. | `season.ts`, `Environment.tsx` |
| Season items | Cherry blossom, lavender rows, red and gold leaves, bare winter trees with snow, Okhotsk drift ice that drifts in from the coast, petals / leaves / snow particles. | `Environment.tsx`, `Trees.tsx` |
| Owl | Low-poly owl, flight curve that clears the real terrain, flapping, landing beside the house. | `Owl.tsx` |
| Camera | `CameraControls` (drei / camera-controls). "follow" chases the owl; "cut" glides straight to the place. Arrival zooms in, roof lifts (B3). | `App.tsx` (Rig) |
| Post FX | none / tilt-shift + vignette + SMAA / plus N8AO ambient occlusion. | `App.tsx` |

Screenshots: `shots/cmp-*.jpg`.

## Findings

1. **A purpose-built island fixes most of the scale problem.** The island is about
   26 × 22 units. The owl, houses and ~3.5k trees are now close to each other in
   size, the camera is closer, and every place is visible in one overview.
   (Version 1 used the real Hokkaido shape. It was removed: the scene must be a
   focused showcase, not a geographical map.)
2. **Authored features beat noise.** Each part of the island shows one thing
   (snow line, lake, river, ice coast, lavender). The island is a few functions
   with parameters, so designers can move a site or the peak in seconds.
3. **Painted terrain (A) is the best look.** Terrace (B) looks noisy on the peak.
   Hex (C) is cheap but trees and water do not fit on it.
4. **Shader seasons are the right tool for the timelapse.** A season change costs
   nothing on the CPU, every part blends at the same time, and a fraction like
   `season=2.75` is a valid in-between frame. Season items (ice, blossom, bare
   trees, frozen lake and river) are effects on the same meshes, not extra scenes.
5. **Fewer, bigger trees look like a diorama.** ~3.5k trees at 1.3× read best;
   8k small trees start to look like a carpet. Any count is 2 draw calls.
6. **The overworld should still stop at "owl lands, roof lifts".** Even on the
   small island, a close-up of a house is too coarse. The detail scene takes over
   from there.
7. **The chase camera is the most charming moment.** "Follow" as default, "cut"
   for `prefers-reduced-motion`.
8. **Tilt-shift helps the miniature feeling a lot**; N8AO adds depth but is the
   most expensive effect. Make AO optional by device.

### Performance

This container has no GPU (software WebGL), so fps numbers here are not real.
Scene cost, measured from `renderer.info`:

| Setting | Draw calls | Triangles / frame (incl. shadow pass) |
| --- | --- | --- |
| painted, 3.5k trees, tilt-shift (default) | 65 | 0.65 M |
| painted, 8k trees | 65 | 1.0 M |
| hex, no trees | 59 | 0.09 M |

Under 1 M triangles and ~65 draw calls is a light load for a laptop GPU, but
**this must be checked on the demo laptop**: open the lab and read the perf line.
Easy savings if needed: fewer cells in `island.ts`, shadow map 1024, `fx=tilt` without AO, DPR 1.
Most draw calls are the small owl and house parts; merging them into one GLB each
brings the scene to about 15 draw calls.

Bundle: about 500 KB gzip JS (three + R3F + drei + postprocessing). The island is generated at load (no data file).

## Library research

| Option | Verdict |
| --- | --- |
| **React Three Fiber v9 + three r180 (WebGL)** | **Use it.** Already in the app, React state drives UI and scene, best ecosystem (drei, postprocessing). |
| R3F v10 / three WebGPU + TSL | Promising (node materials, compute), but R3F v10 is still alpha. Not for Thursday. TSL would replace our GLSL string patches later. |
| Plain three.js | Same renderer, more glue code for UI state. No gain over R3F here. |
| Babylon.js | Strong engine (inspector, physics, GUI), but a second stack and no reuse of the app's R3F code. |
| Threlte | Svelte. Does not fit a React/Next app. |
| Cesium / MapLibre 3D terrain | Real-world map engines. Too "map", not "diorama"; heavy. |
| drei `CameraControls` (camera-controls) | Use it: smooth `setLookAt` transitions, limits, good for scripted fly-to. |
| `@react-three/postprocessing` | Use it: TiltShift2, Vignette, SMAA, N8AO. |
| three-custom-shader-material (CSM) | Use it when we merge: a clean way to extend `MeshStandardMaterial`; replaces the `onBeforeCompile` string replaces used in this lab. |
| Real elevation data (AWS Terrain Tiles) | Tried in version 1 and dropped: we want a showcase scene, not a map. |
| Theatre.js or GSAP | Optional, to author the intro camera path by hand for the video. |

## Recommended path to the real app

1. Move `island.ts`, `field.ts`, `season.ts`, `Water.tsx`, `Terrain.tsx`, `Trees.tsx`, `Environment.tsx`,
   `Owl.tsx` into `src/components/World/` and port the shader patches to CSM.
2. Defaults: style A, 320-cell island, ~3.5k trees at 1.3×,
   tilt-shift on, AO off by default, follow camera (cut when `prefers-reduced-motion`).
3. Replace the placeholder owl and houses with the GLB models from the 3D objects
   thread; keep the house roof as a separate node so it can lift.
4. Arrival hands off to the detail scene from the detail scenes thread.
5. Keep the HTML location buttons as the keyboard and screen-reader path.

## Open questions

- The four places in `places.ts` have working titles only. They are not cultural
  claims. The content team must choose the stories and approve the names.
- Known gaps: the drei `Html` labels log a harmless React unmount warning; the
  owl and houses are placeholders for the 3D objects thread.
