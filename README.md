# Don't Fall on the Slope

A physics browser game: slide down a frozen, snowy shopping street in
January in Otaru, Hokkaido, without touching anything. A deadpan museum guide
narrates. Built to be integrated into
[living-hokkaido](https://github.com/lukasluecke/living-hokkaido) (private)
as a new activity kind.

Full brief, rules, tech decisions and integration rules: [CLAUDE.md](CLAUDE.md).

## Run

```bash
npm install
npm run dev      # http://localhost:5174
npm run check    # typecheck, Biome, oxlint, tests, build
```

Dev URL params: `?seed=N` picks a different street layout; `?at=N` starts N
metres down the street (dev only, inflates the score).

Controls: ← → / A D lean, ↓ / Space brace, Enter start/restart. On phones,
drag sideways or use the on-screen buttons.

## Status (2026-11-26)

| Stage | Status |
|---|---|
| M0 Skeleton: Vite, TS, three 0.180, Rapier, lazy `mountSlope`, fixed 60 Hz loop | Done |
| M1 Smallest playable: capsule player, lean/brace, obstacles, crash, distance score, restart, canal finish | Done |
| M2 The street: steepness sections and curves, building detail, bikes, tourists, speed wobble, merged draw calls | Done |
| M3 Captions and score: gallery captions from cited claims, near misses, spins, streaks, score breakdown | Open |
| M4 Active ragdoll: jointed body with motors replaces the capsule; crash slow-mo and flailing | Open |
| M5 Atmosphere: falling snow, gas-lamp lighting, darker facades fixed, sound, narrator lines | Open |
| M6 Phone: opt-in tilt (iOS permission), perf on a mid-range phone | Open |
| M7 Canal ending and polish: special ending, accessibility pass, no-WebGL captions list | Open |
| M8 Hand-back: `HANDBACK.md` + `contract-proposal.ts` (activity kind `slope-run`) for living-hokkaido | Open |

Details per stage: CLAUDE.md § Build milestones.

## Verified so far

- 37 tests: run rules, path math, track generator (guaranteed followable
  lane), balance/wobble, and headless Rapier runs (slide speed, brace, wall
  and obstacle crashes, curves without flying off, reset).
- A bot using only lean/brace reaches the canal on 8 seeds
  (`src/physics/bot.test.ts`).
- Browser checks in desktop and phone viewports. **Not yet judged at real
  speed**: the desktop app's preview pane throttles to ~2 fps, so feel and
  fps still need a playtest in a real browser.

## Open issues and decisions

- **Bundle size:** `@dimforge/rapier3d-compat` inlines its WASM as base64,
  4.3 MB (1.67 MB gzip, lazy). Try `@dimforge/rapier3d` with a separate
  `.wasm` before integration.
- **Tuning:** speed and steering in `TUNING` (`src/physics/world.ts`), wobble
  in `WOBBLE` (`src/core/balance.ts`). Needs a real playtest.
- **History text:** captions (M3) must come from cited claims in a knowledge
  entry (`research-preview` until reviewed). The Otaru claims in the sibling
  Out of Place project can be reused. Narrator jokes never state history.

## Integration notes for living-hokkaido

Found while checking the host repo (shared with the Out of Place game):

- **Host slot too small:** activities render in a 420 px side panel (a
  62 %-height bottom sheet on phones). A 3D game needs a full-stage slot,
  like the "Over time" timeline overlay. This is a shell change to propose to
  Lukas.
- **Remount bug in wrapper pattern:** the shell rebuilds the `claims` object
  on every render (`claimsFor` in `src/shell/Shell.tsx`), so a React wrapper
  whose effect depends on `claims` would destroy and remount the game on each
  render (every 100 ms while the season clock plays). Mount once per
  `activity.id` and keep the latest props in refs.
- **Contracts:** the local mirror (`src/integration/contracts.ts`) matches the
  host's `Prefs`, `ActivityResult` and events. The host tests with
  `tsx --test`; our Vitest tests port with `node:test` asserts.
- **Timing:** living-hokkaido's PLAN.md set code freeze at 2026-11-26 14:00
  JST, and PROJECT.md lists "a sprawling game" as a non-goal before freeze.
