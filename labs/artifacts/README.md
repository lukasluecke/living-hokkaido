# Objects lab

Small, separate prototypes for the 3D artifact objects. Not part of the Next.js app.
Same stack as the app: three 0.180, @react-three/fiber 9, drei 10, zod 4.

## Run

    npm install
    cp node_modules/three/examples/jsm/libs/draco/gltf/* public/draco/   # mkdir -p public/draco first
    npx vite --port 5199

Views (top-right nav):

- `?view=look` five looks on the same geometry (PBR, flat, toon + ink line, matcap, baked vertex colour)
- `?view=hover&look=toon` four hover/select styles (lift, gold hull, post outline, rim + ring + label)
- `?view=inspect&look=toon` C2 pick-up-and-turn: click an object, it flies to the camera, the room dims, drag to turn (inertia yaw, clamped pitch that springs back), hotspots fade when facing away, note card cites the claim source. Toggle to drei `PresentationControls`.
- `?view=model` loads pipeline output (Meshopt / Draco GLB) with `useGLTF`.

URL params for screenshots: `pick=garment`, `note=g1`, `yaw=0.4`, `mode=presentation`, `force=none`.

## Scripts

- `npx tsx scripts/export.mjs` builds the procedural objects in Node and writes `public/gen/*.raw.glb`
- `npx gltf-transform optimize in.glb out.glb --compress meshopt --join false --flatten false` (keep node names for hotspots)
- `npx tsx scripts/schema-check.ts` validates sample records and the rights/claim rules
- `node scripts/shot.mjs "<query>" out/x.png` screenshot; `node scripts/flow.mjs` click/drag/hotspot test

## Files

- `src/models.ts` procedural sketch geometry, each mesh tagged with `userData.part`
- `src/looks.ts` material sets and the inverted-hull outline
- `src/hover.ts` hull, fresnel rim and emissive highlight helpers
- `src/schema.ts` draft `ArtifactObject` contract (model asset + rights, hotspots that must cite claims)
- `src/data.ts` sample records; texts copied from the existing research-preview story, nothing new claimed

All geometry is original sketch geometry. It is not a scan or reconstruction.
