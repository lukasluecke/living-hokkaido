# Lab: island

Experiments for the **island** part. Read `../AGENTS.md` (lab rules) and
`src/parts/island/AGENTS.md` (what the real part must do, what to port).
Record results in `HANDBACK.md`. Run with `npm install && npm run dev`.

Important: the current lab uses the real Hokkaido outline and elevation
(`scripts/bake-terrain.mjs`, `public/data/`, lon/lat places). Lukas decided on
2026-11-25 that the island is a **purpose-built scene, not a geographic map**.
New work should replace the heightfield with a designed island around
`content.island.locations` (import `@/content`). The season, tree, owl and
camera work stays.
