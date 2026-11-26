# Don't Fall on the Slope (working title)

A physics-based browser game. It's January in Otaru, Hokkaido. The player slides
down a steep, frozen, snowy shopping street, steering past old stone warehouses,
wooden shopfronts and a glass workshop. Each building you pass gets a small
museum-style caption, like a gallery wall label. The tone is a deadpan museum
guide narrating total chaos.

Inspired by the "fall through the gallery without touching the art" idea, but
set outdoors.

## Core loop (one run ≈ 30–90 s)
1. Start at the top of the slope, standing on ice.
2. The player slips and starts sliding. Gravity does the work. The player only
   leans left/right (arrow keys, or tilt/swipe on phone) and can **brace** to
   slow down a little.
3. Shopfronts, snow piles, lamp posts, parked bicycles and a few tourists line
   the route. Touching anything means you crash and the run is over.
4. Every shopfront you pass cleanly pops up a gallery caption.
5. Score = distance + captions collected + style points (near misses, spins,
   long clean streaks).

## Win / lose
- You lose the moment your body touches a building, object or person.
- You "win" by reaching the canal at the bottom. Reaching it is very hard and
  gives a special ending.

## Physics
- The player is an **active ragdoll**: a simple jointed body that tries to stay
  upright (motorised joints driving toward a target pose) but flops
  realistically when it loses balance.
- Ice has very low friction. The slope gets steeper in sections. The longer you
  slide, the faster and less stable you get.
- Crashes are funny (slow motion, limbs flailing), never gory. No blood, no
  injury language; the narrator stays deadpan.

## Look
- Realistic but stylised: low-poly 3D, warm winter evening, gas-lamp style
  lighting, falling snow, snow piled on roofs and signs.
- Camera follows from behind and slightly above.
- All art is built in code for now (simple models, procedural textures), so
  real art can be swapped in later. Keep geometry and materials behind small
  factory functions so a GLB can replace each one.
- Buildings are generic and original: no real shop names, logos or brands.

## Tech decisions
- **Rendering: Three.js** (pin to the same major as living-hokkaido, currently
  `three@0.180`, so the host app shares one copy).
- **Physics: Rapier** (`@dimforge/rapier3d-compat`). Why: joints with motors
  (needed for the active ragdoll), continuous collision detection (needed at
  high speed so the body never tunnels through a lamp post), contact/sensor
  events for crash and near-miss detection, good performance from WASM, and
  an optional deterministic mode for replays. cannon-es is smaller but its
  joints are less stable; Jolt is strong but heavier to ship.
- **Build: Vite + TypeScript**, Vitest for pure logic, Biome for formatting
  (same config as living-hokkaido: double quotes, 2 spaces, 80 columns), no
  ESLint/Prettier.
- **Fixed-timestep simulation** (e.g. 60 Hz) decoupled from rendering. Input
  becomes per-step actions (lean −1..1, brace on/off).
- **Rules are separate from rendering and physics.** Run state, scoring,
  captions, streaks and win/lose live in a pure module (`src/core/`) that
  receives events from the physics layer (contact, near-miss, gate passed,
  distance). That keeps scoring testable without WASM or WebGL.
- **Lazy loading:** three, Rapier and the game load inside the mount call,
  never at import time, so importing the game is safe in Next.js server code.
- **Platforms:** desktop and mobile browsers (iOS Safari, Android Chrome).
  Target 60 fps on a mid-range phone: instanced props, few dynamic lights
  (gas lamps mostly emissive + a few real lights near the player), a tight
  shadow budget, pooled track chunks.
- **Phone input:** swipe/drag to lean, on-screen brace button. Tilt is
  optional and opt-in (iOS needs a permission prompt from a user gesture).
- Don't add dependencies without saying why.

## Integration with living-hokkaido (read before changing the game's API)
The game is meant to be integrated into github.com/lukasluecke/living-hokkaido
(private) as a new activity kind. Follow the same pattern as `../out-of-place`:
- **Props in, events out.** Mount with `mountSlope(el, props)`; props mirror
  living-hokkaido's `ActivityPartProps` (`activity`, `claims`, `prefs`,
  `emit`). Output is only `emit(event)`: `activity.complete` (once, score
  0–1) and `reveal.open` ("How do we know?"). No globals, no URL reading, no
  localStorage, no page-wide key capture. Esc stays with the host
  (`nav.back`).
- **History text comes only from claims.** Every caption that states a fact
  about Otaru, a building type or an era is a claim in a knowledge entry with
  a source and an honest locator. The deadpan narrator's jokes are game lines
  and must not state history. Content stays `research-preview` until a named
  reviewer approves it; show that label on captions. The Otaru knowledge in
  `../out-of-place/content/scenes/otaru-herring-warehouse/` can be reused.
- Watch era labels: Meiji is 1868–1912; Otaru Canal was finished in 1923
  (Taishō). Don't present the street as a historical reconstruction; label
  the scene as illustrative.
- **Host slot:** living-hokkaido currently renders activities in a 420 px side
  panel (a bottom sheet on phones). A 3D game needs a full-stage slot; that is
  a host change to propose in the hand-back, not something to work around.
- **Accessibility and fallbacks:** full keyboard path; `prefs.reducedMotion`
  turns off slow-motion zooms, camera shake and flailing close-ups;
  `prefs.webgl: false` shows an HTML fallback (the route's captions as a
  readable list, plus a short explanation) instead of a blank canvas.
  Announce run start, crash and captions in an aria-live region.
- Contract changes go in `contract-proposal.ts` and `HANDBACK.md`
  (living-hokkaido's docs/HANDBACK.md format). Don't edit the
  living-hokkaido repo from here unless the user asks.

## Project layout (target)
- `src/embed.ts`: mount API for host apps; `src/main.ts`: standalone page
- `src/core/`: pure rules and geometry (path, track, run state, balance,
  score), no three/Rapier
- `src/physics/`: Rapier world, ragdoll, track colliders, contact/near-miss
- `src/world/`: procedural street, buildings, props, snow, lighting
- `src/render/`: camera rig, post effects, slow-motion
- `src/input/`: keyboard, swipe, tilt → lean/brace actions
- `src/style/`: palette and shared UI (single source of truth for colours)
- `content/`: knowledge (cited claims) and the activity definition

## Build milestones (in order)
- **M0 Skeleton (done 2026-11-26):** Vite + TS + three 0.180 + Rapier,
  lazy-loaded `mountSlope`, fixed 60 Hz loop, chase camera, Vitest, Biome,
  oxlint, `.claude/launch.json` (port 5174).
- **M1 Smallest playable (done 2026-11-26):** upright capsule slides down a
  12° icy street; lean (keys, touch buttons, drag) and brace; procedural
  shopfronts and obstacles (snow piles, lamp posts, crates); any contact =
  crash with a short tumble and slow motion; distance score, best score,
  restart; reaching the canal ends the run. The generator guarantees a clear
  lane that drifts slowly enough to follow; `src/physics/bot.test.ts` proves a
  bot using only lean/brace reaches the canal on 8 seeds.
- **M2 The street (done 2026-11-26):** the street is a path
  (`src/core/path.ts`) with sections from 9° to 18° (steeper further down,
  5° at the canal) and gentle curves (≤ 1/200 rad/m), blended smoothly.
  Physics ground is a trimesh following the path (`FIX_INTERNAL_EDGES`, or
  the capsule snags on triangle seams); each shopfront is one box collider
  matching its mesh, plus a backstop wall. Buildings got plinths, iron
  doors, canopies, curtains, lattices, chimneys and icicles; parked bicycles
  and pairs of tourists line the street. Above 9 m/s a smooth seeded wobble
  pushes you sideways, full strength at 23 m/s; bracing cuts it to 35 %
  (`src/core/balance.ts`). The figure faces down the street and sways with
  lean and wobble. Static geometry is merged by material (~25 draw calls).
  Dev: `?at=N` starts N metres down the street.
- **Step 5 gallery captions (done 2026-11-26):** `core/captions.ts`, the 12
  types from content/otaru-slope.md with their sources; wall-label card in
  `render/hud.ts`.
- **Step 6 real street (done 2026-11-26):** `core/facades.ts` (pure, tested)
  picks per-building features; `world/street.ts` draws them, plus gas lamps,
  footprints and ice patches. Meshes only, never colliders.
- **Step 7 make it funny (done 2026-11-26):** windmilling arms (view),
  close-call guide lines in the caption card, glass-workshop crash chime and
  "Do not touch the art.", tourists photographing the slider. Physics
  unchanged.
- **Step 8 shareable score (done 2026-11-26):** `core/score.ts`,
  `render/scorecard.ts`; daily seed and local best live in `main.ts` only.
  Details and open points: HANDBACK.md.
- **M3 Captions and score (partly done in living-hokkaido):** exhibits from
  cited claims replace captions (`core/exhibits.ts`); close calls within
  0.45 m count on the stats line (`core/style.ts`). Still to do: spins,
  streaks, a score breakdown.
- **M4 Active ragdoll:** jointed body with motors replaces the capsule
  (keep the capsule behind a flag); crash slow motion and flailing.
- **M5 Atmosphere (mostly done in living-hokkaido):** falling snow (off
  with reduced motion), side lights on both facades, lamp halos, WebAudio
  sounds (`audio/sfx.ts`: wind, crash, notice, close call, finish) with a
  mute button and M key. Still to do: narrator lines.
- **M6 Phone:** opt-in tilt, perf on a mid-range phone.
- **M7 Canal ending and polish:** special ending, accessibility pass, the
  no-WebGL captions list.
- **M8 Hand-back:** `HANDBACK.md` and `contract-proposal.ts`.

## Known issues
- **Bundle size:** `@dimforge/rapier3d-compat` inlines its WASM as base64:
  4.3 MB (1.67 MB gzip), lazy. Before integration, try `@dimforge/rapier3d`
  with a separate `.wasm` file (smaller, streams and compiles while
  downloading) and measure.
- The desktop app's browser pane throttles hidden tabs to ~2 fps, so it can't
  judge feel or fps; use a real browser for that.

## Working rules for Claude sessions
- Ship the smallest playable thing first; keep the game playable after every
  milestone.
- Verify in the browser preview (desktop and mobile viewport) before calling
  work done. `npm run check` (typecheck, Biome, tests, build) must pass.
- Placeholder art is fine early, but it already follows the Look section.
