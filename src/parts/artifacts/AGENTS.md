# Part: artifacts

The C2 pick-up-and-turn viewer for one artifact: model, info card, hotspots,
"How do we know?" (opens the reveal), activity entry. Lab: `labs/artifacts`.

- Component: `ArtifactViewer`. Props: `ArtifactViewerProps` (`artifact`,
  `claims` resolved by id, `read` hotspot ids).
- Reads: `artifact.model` (`source` glb or procedural builder, `nodes`,
  `representation`), `display` (`restRotation`, `inspectScale`,
  `pitchLimit`), `hotspots[]`, `summaryClaimId`, `activityIds`.
- Emits: `artifact.inspected` (once per open), `hotspot.open`,
  `reveal.open`, `activity.start`, `artifact.blur`.

## Must

- Card body = `claims[summaryClaimId].claim.text`; hotspot body = its claim.
  No other facts. Show `RepresentationBadge` and `PresentationBadge`.
- Artifact space: metres, origin at base centre, front +Z.
- Procedural builders are keyed by `model.source.builder` (`fiber`, `cloth`,
  `garment`). A GLB replaces a builder by changing the pack, not the part.
- Keep node names in GLBs (hotspots target them).

## Port from `labs/artifacts`

Keep: `models.ts` builders (ids now `fiber`, `cloth`, `garment`), toon look +
ink outline, gold hull hover, inspect view (inertia yaw, clamped pitch,
back-face hotspot fade), gltf-transform pipeline. The lab's `schema.ts` is now
`src/contracts/artifact.ts` (`url` → `source`, `journal` → stamps in the pack,
added `summaryClaimId`).

## Acceptance

Turn with mouse, touch and arrow keys; every hotspot reachable by keyboard;
"How do we know?" opens the reveal for the summary claim.

## Decisions

- Open: final models by code (Claude) or Blender (Yuling, Shaw)?
- Open: toon for objects only, or also the island?

* 2026-11-25: viewer ported as `Viewer3D.tsx` (toon + ink hull, PresentationControls turn, projected hotspots with back-face fade) inside the card. Objects are shown alone on a neutral backdrop, not in the room.
* 2026-11-25: code models stay until real models exist (Lukas). A GLB replaces one by setting `model.source` to `{ kind: "glb", url }` in the pack; the viewer and the room both load it (`src/parts/shared/Glb.tsx`). Toon is used on the island and in the room too.
