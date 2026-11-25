# Detail scene lab

Small, separate prototypes for the **interior detail scene** (the lake house
"From bark to cloth"). This folder is not part of the Next.js app and is not
built by `npm run check`. It shares the same three / R3F / drei versions, so
code can move into the app later.

```bash
cd labs/detail-scene
npm install
npm run dev        # http://localhost:5180
```

URL parameters (also used for screenshots): `v=lowpoly|splat|scan`,
`fx=0|1`, `merge=0|1`, `roof=close|open`, `entry=1` (play the roof-lift
entry), `focus=fiber|cloth|garment`, `splats=<max>`.

Keyboard: `1`–`3` focus an object, `Esc` puts it back.

## What each variant tests

| Variant | How it is made | Tests |
| --- | --- | --- |
| A · Hand-built low-poly | Procedural boxes/cylinders, textures drawn on a canvas at runtime, real-time hearth + window light, N8AO + bloom + AgX tone mapping | Look, draw calls, merge cost, roof-lift entry, camera focus, hotspots |
| B · Gaussian splat | Room A sampled into ~150–400k splats with light baked into colour, rendered by **Spark 2.4**; the three objects stay meshes | Splat renderer, memory, mixing splats and interactive meshes, baked-light look |
| C · Scan mesh | Room A plus a real photogrammetry scan (Khronos "Corset", CC0) in place of the garment | File size after optimisation, style clash between scan and low-poly |

The synthetic splat in B is **not** a capture. We do not have a licensed
capture of a real interior. It exercises the same renderer path that a real
`.spz` file from Scaniverse, Postshot or World Labs Marble would use.

## Shared interaction pieces (keep these for the app)

- `drei <CameraControls>` (camera-controls 3) for every camera move: entry,
  focus, return. One `setLookAt(eye, target, true)` per view. Inside the room
  the polar angle and distance are clamped, truck is off.
- `Director` runs the B3 entry as an async sequence: hover outside → roof
  lifts and fades → camera dives in → roof closes again (or stays open).
- Hover glow by damping `emissiveIntensity` on the object's own materials.
- **One DOM overlay for labels and hotspots** (`Projector`), not one
  `drei <Html>` per label. With several `<Html>` mounting in the same render
  one of them was dropped (React "synchronously unmount a root" warning).
  The overlay is also cheaper and easy to make keyboard accessible.
- `MergeStatic` merges static meshes per material.

## Measurements (headless Chromium, SwiftShader CPU renderer)

FPS here is meaningless (CPU rendering, 1–6 fps). Draw calls, triangles,
memory and file sizes are real.

See `NOTES.md` for the numbers and the recommendation.

## Assets

- `public/assets/corset-opt.glb`: Khronos glTF Sample Assets "Corset",
  © 2017 UX3D, CC0 1.0. Optimised with
  `npx @gltf-transform/cli optimize --compress meshopt --texture-compress webp --texture-size 1024`
  (13.5 MB → 394 KB). Used only as a technical stand-in for "a scanned
  object"; it is a European garment and must never appear in the demo.
- Everything else is original procedural geometry, MIT. The room is
  illustrative and is not a reconstruction of an Ainu house.
