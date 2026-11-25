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
* 2026-11-25: `scene.setting` picks the set: `house` (lake house), `cabin` (house shell at 0.72 with plain shelves and a lantern), `grove` and `clearing` (outdoor, season ground and leaves, `entry: "fly-in"`). Objects and activities are reused from the lake house; the bar lists scene activities whose object is not placed here.
* 2026-11-25: lake house restyled after Lukas's photos of the Hokkaido Museum's restored house (visual reference only, no photo textures): entry area by a door at the west end of the south wall (bark, cattail, mortar, rope, firewood; earth floor behind a log sill), long hearth with logs fed lengthwise and a pot on a hook, two-level pole rack with smoked fish, upper seat with lacquerware and plain banded mats on the north wall, reed walls with a round-pole frame and rope ties, hip roof on a pole frame. Each element names its claim in `room/House.tsx`. The sacred window opposite the entrance is not drawn. Garment moved to x −1.0; focus eyes for cloth and garment avoid the rack.
* 2026-11-25: dollhouse walls. `Walls({ lift })` gives each side (and each corner post pair) its own materials; once the roof is up, sides whose outside faces the camera fade to 14 % opacity and come back as the camera orbits. Focus views are inside the room, so all walls are solid there. Used by the lake house and the memory cabin.
* 2026-11-25: lighting and flicker fix. A soft directional fill light follows the camera (`CameraFill` in `Room.tsx`) and the hemisphere light is stronger, so focused objects (the loom) are not in deep shade. Wall materials are transparent only while they fade (solid walls in the transparent pass flipped their sort order as the camera turned), and the round posts stand just inside the reed walls instead of grazing the wall faces.
