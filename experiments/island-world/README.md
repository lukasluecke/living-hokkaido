# Island world lab

A standalone experiment for the **overworld island only**: terrain, vegetation,
seasons, owl flight and camera. It is separate from the main Next.js app so we
can try ideas fast. The code is React Three Fiber, the same stack as the app,
so the parts that work can move into `src/components/World` later.

Detail scenes (inside a location) and 3D objects are explored in other threads.

## Run it

```bash
cd experiments/island-world
npm install
npm run dev          # http://localhost:5173
npm run bake         # optional: rebuild public/data/hokkaido-512.* from elevation tiles
node scripts/bake-terrain.mjs 256   # other resolutions
```

The panel on the right switches every option live. The line at the bottom of
the panel shows fps, frame time, draw calls and triangles.

URL parameters (for screenshots or a fixed demo):
`style=painted|terrace|hex`, `res=256|512`, `trees=8000`, `treeScale=1.5`,
`season=0..3.99` (fractions are blends), `play=1` (timelapse), `fx=none|tilt|full`,
`cam=follow|cut`, `dest=lake|forest|river|coast`, `instant` (no camera easing),
`shot` (hide the UI), `labels`, `dpr=1`, `flyT=0.5` (freeze the owl mid-flight).

## What each experiment tests

| Area | What is built | File |
| --- | --- | --- |
| Real island shape | Bakes AWS Terrain Tiles (Terrarium, zoom 8) into a 512×456 Int16 heightfield (456 KB). Honshu and islands that cross the crop edge are masked out. | `scripts/bake-terrain.mjs`, `src/world/field.ts` |
| Terrain look | A: smooth painted heightfield. B: terraced topo layers. C: hex columns. | `Terrain.tsx`, `HexTerrain.tsx` |
| Vegetation | Two `InstancedMesh` (conifer, broadleaf), placed by real elevation, slope, tree line and a forest noise. Any count = 2 draw calls. | `Trees.tsx` |
| Seasons | One season number drives all materials through shared uniforms. Ground, leaves, snow line, sea, lavender, sky, sun and weather all blend in the shader. | `season.ts`, `Environment.tsx` |
| Season items | Cherry blossom, lavender rows, red and gold leaves, bare winter trees with snow, Okhotsk drift ice that drifts in from the coast, petals / leaves / snow particles. | `Environment.tsx`, `Trees.tsx` |
| Owl | Low-poly owl, flight curve that clears the real terrain, flapping, landing beside the house. | `Owl.tsx` |
| Camera | `CameraControls` (drei / camera-controls). "follow" chases the owl; "cut" glides straight to the place. Arrival zooms in, roof lifts (B3). | `App.tsx` (Rig) |
| Post FX | none / tilt-shift + vignette + SMAA / plus N8AO ambient occlusion. | `App.tsx` |
| Placement pads | The terrain is flattened a little around each place so a house sits level. | `field.ts` (`flattenPads`) |

Screenshots: `shots/cmp-*.jpg`.

## Findings

1. **The real Hokkaido shape works and is cheap.** The baked 512 px field gives a
   shape people recognize at a glance, with real mountains (Daisetsuzan, Hidaka)
   in the right places. 256 px still reads well and halves the triangles.
2. **Painted heightfield (A) is the best overview look.** Terrace (B) gives nice
   cardboard cliffs at the coast but the risers look noisy on mountains. Hex (C)
   is cheap and cute, but it hides the coastline and trees do not fit on it.
   Recommendation: A, plus the raised coast slab (already in A).
3. **Shader seasons are the right tool for the timelapse.** A season change costs
   nothing on the CPU, every part blends at the same time, and a fraction like
   `season=2.75` is a valid in-between frame. Season items (ice, blossom, bare
   trees) are shader effects on the same meshes, not extra scenes.
4. **Trees: fewer and bigger reads better.** 40k small trees become a green carpet.
   About 8k trees at 1.5× scale look like the diorama reference and cost 2 draw calls.
5. **Scale is the main design problem.** The owl, houses and trees must be about
   10–50× larger than real scale to be seen from the overview. That works for the
   overview and the chase camera, but in a close-up the terrain is too coarse.
   So the overworld should stop at "owl lands, roof starts to lift", then hand off
   to the detail scene (a separate scene with its own scale). The pads help.
6. **The chase camera is the most charming moment.** Following the owl over the
   forest looks like a cozy game. The "cut" camera is calmer and better for
   motion-sensitive visitors. Keep both (follow as default, cut for reduced motion).
7. **Tilt-shift helps the miniature feeling a lot**; N8AO adds depth to forests but
   is the most expensive effect. Make AO optional by device.

### Performance

This container has no GPU (software WebGL), so fps numbers here are not real.
Scene cost, measured from `renderer.info`:

| Setting | Draw calls | Triangles / frame (incl. shadow pass) |
| --- | --- | --- |
| 512 px field, 8k trees, tilt-shift | 63 | 1.6 M |
| 256 px field, 8k trees | 63 | 0.9 M |
| 512 px field, 40k trees | 63 | 4.3 M |
| hex, no trees | 59 | 0.19 M |

1–2 M triangles and ~60 draw calls is a normal load for a laptop GPU, but
**this must be checked on the demo laptop**: open the lab and read the perf line.
Easy savings if needed: `res=256`, shadow map 1024, `fx=tilt` without AO, DPR 1.
Most draw calls are the small owl and house parts; merging them into one GLB each
brings the scene to about 15 draw calls.

Bundle: about 500 KB gzip JS (three + R3F + drei + postprocessing) and 456 KB terrain.

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
| AWS Terrain Tiles (Terrarium) | Use it: open data, no key, baked offline into a small file. Attribution in the meta JSON. |
| Theatre.js or GSAP | Optional, to author the intro camera path by hand for the video. |

## Recommended path to the real app

1. Move `field.ts`, `season.ts`, `Terrain.tsx`, `Trees.tsx`, `Environment.tsx`,
   `Owl.tsx` into `src/components/World/` and port the shader patches to CSM.
2. Defaults: style A, 512 px field (256 on weak devices), ~8k trees at 1.5×,
   tilt-shift on, AO off by default, follow camera (cut when `prefers-reduced-motion`).
3. Replace the placeholder owl and houses with the GLB models from the 3D objects
   thread; keep the house roof as a separate node so it can lift.
4. Arrival hands off to the detail scene from the detail scenes thread.
5. Keep the HTML location buttons as the keyboard and screen-reader path.

## Open questions

- PROJECT.md says the scene is "not a geographical map". This lab uses the real
  island shape (requested in the project chat). The docs should be updated if we keep it.
- The four places in `places.ts` are placeholders at real coordinates. They are
  not cultural claims. The content team must choose and approve real sites.
