# Part: detail-scene

The interior of an open location (lake house: "From bark to cloth"): roof-lift
entry, dollhouse home view, artifacts in place, hover glow, focus camera.
Lab: `labs/detail-scene`.

- Component: `DetailScenePart`. Props: `DetailScenePartProps` (`scene`,
  `artifacts` placed in it, `focusedArtifactId`).
- Reads: `scene.views.outside/home`, `scene.entry`, `scene.roofNode`,
  `scene.placements[]` (`position`, `rotationY`, `focusView`, `key`),
  `scene.activityIds`, `season` (window light / snow outside), `prefs`.
- Emits: `scene.ready` (entry finished, home view reached), `artifact.focus`,
  `activity.start`, `scene.exit`.

## Must

- Scene space in metres, origin at floor centre, +Z toward the camera.
- Room is illustrative, not a reconstruction of an Ainu house. No invented
  cultural detail (patterns, objects) without a claim.
- When an artifact is focused, move the camera to its `focusView`; the card
  and turn viewer belong to `artifacts`. `Esc` is handled by the shell.
- `entry: "cut"` or `prefs.reducedMotion` → no roof-lift animation.

## Port from `labs/detail-scene`

Keep: variant A (hand-built low-poly), `Director` async entry, emissive hover
glow, one projected DOM overlay (`Projector`) instead of many `<Html>`,
`MergeStatic`, keys `1–3` / `Esc`. Bake light; one live hearth light. Drop for
Thursday: splat and scan variants (roadmap), real-time point-light shadows.
Never ship `corset-opt.glb` (European garment, technical stand-in only).

## Acceptance

Entry → home → focus each artifact by click and by key → back; ≤ 150 draw
calls; HTML path works with WebGL off.

## Decisions

- 2026-11-25: low-poly room + dollhouse home view (detail-scene research).

* 2026-11-25: variant A ported into `Room.tsx` + `room/`. Home view is the high dollhouse view with the roof lifted; no real-time shadows (ContactShadows instead); keys 1–3 handled in the part.
* 2026-11-25: room uses the same toon patch with a cool shade; reed, mat and basket colours vary so the room is not one brown.
