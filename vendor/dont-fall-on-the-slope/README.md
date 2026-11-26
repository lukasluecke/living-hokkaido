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

Language: Japanese with `?lang=ja` (or automatically in a Japanese
browser), English with `?lang=en`. Strings live in `src/i18n/index.ts`.

Dev URL params: `?seed=N` picks a different street layout; `?at=N` starts N
metres down the street (dev only, inflates the score); `?seen=all` marks all
exhibits as seen.

Controls: ← → / A D lean, ↓ / Space brace, Enter start/restart. On phones,
drag sideways or use the on-screen buttons.

## Status (2026-11-26, synced from living-hokkaido main `db1bb2c`)

Lukas's team integrated the game into living-hokkaido and improved it; this
repo now holds that version. Changes are listed per milestone in CLAUDE.md.

| Stage | Status |
|---|---|
| M0 Skeleton | Done |
| M1 Smallest playable | Done |
| M2 The street: curves, steepness, detail, bikes, tourists, wobble | Done |
| M3 Exhibits from cited claims (`core/exhibits.ts`), close calls (`core/style.ts`) | Partly done: spins, streaks, score breakdown open |
| M4 Active ragdoll | Open |
| M5 Snow, side lights, lamp halos, sound + mute (`audio/sfx.ts`) | Mostly done: narrator lines open |
| M6 Phone tilt and perf | Open |
| M7 Canal ending and polish | Open |
| M8 Hand-back (`HANDBACK.md`) | Open |

## Next: steps 5–8 (from Lukas's hand-off)

Read `content/otaru-slope.md` first (12 building types with sources and
wall-label lines). One commit per step; `npm run check` passes and the game
is checked at desktop and 390×844 before each commit. Physics and colliders
stay exactly the same (`src/physics/bot.test.ts` must pass).

5. **Gallery captions (done):** `src/core/captions.ts` gives the 12
   researched types to 12 buildings in order down the street (preferring a
   matching mesh: the Glass Workshop lands on a glass-workshop building when
   one is near). Passing one cleanly slides in a wall-label card at the top
   right for 2 s (fade only with reduced motion): serif title, the research
   "Label" line, a dry game line, "Illustrative · research preview" and
   "n of 12". Announced in the aria-live region; "captions n/12" on the
   meter and the end card. Built on Lukas's optional patch.
6. **The real street (done):** `src/core/facades.ts` decides each
   building's look (tested); `src/world/street.ts` draws it. The 12 labelled
   buildings follow the research: fire walls and plastered shutters
   (merchant house), tuff walls, clock, band balcony, arched doors and 2 roof
   creatures (clock shop), brick (rice merchant), glowing glass wares on
   shelves (glass workshop), lamp-filled windows (lamp hall), columns and
   turrets (bank), 8 roof creatures (shipowner's warehouse), an extra storey
   (hotel), made-up painted marks (three designs, none a real family's).
   Other buildings get a seeded sprinkle of fire walls, marks and shutters.
   New gas-lamp design, footprint trails and polished ice patches on the
   road, slightly warmer ambient light. Meshes only: colliders unchanged
   (bot and physics tests pass). Roof creatures and turrets sit above the
   low chase camera, so they mostly show from a distance.
7. **Make it funny (done):** the figure has arms on shoulder pivots that
   swing wider and faster with the wobble and hard leans until they
   windmill (and flail in a crash). Close calls show a guide line in the
   wall-label card ("A daring interpretation.", "…, passed at 54 km/h.",
   footer "Style points") instead of a toast. Crashing into a glass
   workshop (found from the crash position with `core/where.ts`) plays a
   wind-chime shatter and shows "Do not touch the art." About 60 % of
   tourists raise a camera as you approach and flash at 2 m (no flash with
   reduced motion), with a soft shutter sound. Pure rules in
   `core/tourists.ts`, `core/where.ts`, `core/lines.ts` (tested). Not
   visually confirmed: the tourist camera raise and flash (too small to see
   in the throttled preview pane).
8. **Shareable score (done):** `core/score.ts` (daily seed, streaks, style
   points, run titles; tested) and `render/scorecard.ts` (1080×1920 PNG
   with a crash still; Share on phones, Download image elsewhere). The
   standalone page uses today's seed and keeps a local best per seed. New
   optional props: `best`, `shareUrl`, `onRunEnd`, `onScoreCard`.

Steps 5–8 are done; see [HANDBACK.md](HANDBACK.md) for what changed, what
was tested and what is open.

Rules that keep the game portable back into living-hokkaido:
`mountSlope` never reads the URL or localStorage (the standalone `main.ts`
reads `?seed=` and keeps the best score, passing `seed`/`best` as props);
new props are optional in `src/integration/contracts.ts`; share links carry
only the seed; `prefs.reducedMotion` means fades, no flashes or shake;
captions, crashes and scores are announced in the aria-live region; no new
dependencies without a note. Finish with `HANDBACK.md`, then push to `main`
and send Lukas the commit (he pulls with `git subtree pull`). Deadline from
Lukas: about 2 PM JST, 2026-11-26.

## Verified so far

- 49 tests (after the sync): run rules, path math, track generator (guaranteed followable
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
