# Vendored teammate games

Two games by Erina live here as **git subtrees**: full copies of the upstream
repos, squashed into one commit per sync. The upstream commit of each sync is
recorded in the squash commit (`git-subtree-split: <sha>`), so git knows
where the copy came from and can pull and push changes both ways.

| Folder | Upstream | Synced at | Our activity kind |
|---|---|---|---|
| `out-of-place/` | `erinalin/out-of-place` (private), branch `main` | `76ecbd8` (2026-11-25) | `hide-seek` |
| `dont-fall-on-the-slope/` | `erinalin/dont-fall-on-the-slope` (private), branch `main` | `4778ded` (2026-11-25) | `slope-run` |

Licence: neither repo has a `LICENSE` file yet. The Out of Place hand-back
says "MIT with the code". Ask Erina to add a `LICENSE` (MIT, like this repo)
to both repos; the next sync then brings it in.

## How it fits together

Keep the vendored folders as close to upstream as possible. All our glue is
outside them, in a thin adapter:

| Ours | What it does |
|---|---|
| `src/contracts/activity.ts` | `hide-seek` (same shape as `out-of-place/contract-proposal.ts`) and `slope-run` kinds |
| `src/content/bark-to-cloth/games.ts` | Imports the games' cited knowledge and activities as-is; says which place offers which game |
| `src/parts/activities/games/` | `GameStage` (Play button, cited claims, full-screen stage, Esc closes the stage), `HideSeek.tsx`, `SlopeRun.tsx` (call `mountOutOfPlace` / `mountSlope`) |
| `src/shims/phaser.ts`, `next.config.ts` | `import Phaser from "phaser"` gets a default export under Turbopack |
| `src/types/vendor-env.d.ts` | Types for `import.meta.env?.DEV` and the Phaser shim |
| `tests/games.test.ts` | Kinds, wiring, and the game's own boundary check (`checkProps`) with our claims |
| `tsconfig.json`, `biome.json` | `@vendor/*` path; the vendored folders keep their own Biome config and are not linted or tested by `npm run check` |

Our patches inside `vendor/` (send these upstream, then they disappear from
the diff):

1. `out-of-place/src/embed.ts`: `import.meta.env.DEV` → `import.meta.env?.DEV`
   (Next has no `import.meta.env`; Vite still replaces it).
2. Out of Place, Erina's playtest feedback (2026-11-25), one commit:
   disguise 60 → 80 s (seek unchanged; `round.ts`, `contract-proposal.ts`,
   tests); walking workers to hide among (`art/people.ts`, `game/crowd.ts`,
   optional `SceneArt.walkers`, five on the Otaru scene); a smaller, slower
   finder ring (`FINDER_R` 16, `FINDER_STEP` 6); the reveal card drops
   "Why it worked" and shows the fact in its own bright "★ Real history"
   panel (the clip drops "How I hid" too).
3. Out of Place polish, one commit: the eyedropper picks a small patch of
   the scene and paints with it as a pattern (`nuri.ts`, `GameScene.ts`),
   a row of recent paints, a brush preview with `[` / `]` sizes, and
   slightly uneven hand-drawn edges in `art/iso.ts` (`WOBBLE_PX`).
4. Don't Fall on the Slope polish, one commit: finds (floating labels on
   the clear lane, `core/finds.ts`, `render/finds.ts`, optional
   `SlopeProps.finds`) listed with their claims on the end card; snow
   piles slow you down instead of a crash (`SOFT` in `physics/world.ts`);
   lean eases in (`easeLean`).
5. Out of Place, Lukas's feedback, one commit: poses are stand, sit, kneel,
   lie (`core/round.ts` `POSES` / `POSE_HITBOX`, `game/nuri.ts`); an
   eyedropper loupe; workers fade while a hider paints (`Crowd.setFaded`);
   2× canvas on big or hi-DPI screens (`style/res.ts`, cameras zoom by
   `RES`, text `resolution`); the reveal zoom does not snap to pixels.
6. Don't Fall on the Slope, one commit: slow motion takes smaller steps
   (no judder); the HUD card is centred without `translate(-50%)` (sharp
   text).
7. Out of Place, Lukas's feedback, one commit: the pattern paint is pinned
   to the world (`WorldPattern` in `game/nuri.ts`), a 40 px patch, and
   Brush / Eyedrop zoom in close on Nuri (`ZOOM` 3.2); Move zooms out.
8. Don't Fall on the Slope, exhibits (Lukas's choice), one commit: the
   floating labels are gone (`core/finds.ts`, `render/finds.ts`); real
   street things instead (`core/exhibits.ts`, `render/exhibits.ts`, an
   `exhibit` obstacle kind). `SlopeProps.finds[].look`, `SlopeProps.seen`
   and `ActivityResult.found` are new (mirrored in
   `integration/contracts.ts`). The game now emits `activity.complete` at
   the end of every run (with `found`), not only once. The standalone page
   has placeholder exhibits (`?seen=all`).
9. Don't Fall on the Slope, Erina's open M5/M3 tasks, one commit: falling
   snow, side lights and lamp halos (`render/view.ts`), WebAudio sounds
   with a mute button and M key (`audio/sfx.ts`, vendor-only
   `SlopeProps.muted`), close calls on the stats line (`core/style.ts`).
10. Out of Place, Erina's open M7 task, one commit: Save card (I) saves
   the reveal history card as a 9:16 PNG (`cardImage` in `game/clip.ts`);
   long facts shrink to fit above the honesty footer.

## Pull new upstream changes

You need read access to the upstream repo (Lukas is a collaborator). From
the repo root, on a clean branch:

```bash
git subtree pull --prefix=vendor/out-of-place \
  git@github.com:erinalin/out-of-place.git main --squash
git subtree pull --prefix=vendor/dont-fall-on-the-slope \
  git@github.com:erinalin/dont-fall-on-the-slope.git main --squash
```

Without SSH, use the `https://github.com/...` URL, or a local clone or a
`git bundle` of the upstream repo as the source (that is how the first sync
was done from a clone on Lukas's Mac).

Then:

1. Update the "Synced at" column above.
2. Check the upstream `HANDBACK.md`, `contract-proposal.ts` and
   `src/integration/contracts.ts`. A new scene id or field means an additive
   change in `src/contracts/activity.ts` (see docs/CONTRACTS.md). A new
   scene's `knowledge.ts` / `activity.ts` must be imported in `games.ts`.
3. If upstream changed its dependencies (`package.json`), match them in ours
   (`phaser`, `@dimforge/rapier3d-compat`, `three` must stay one copy).
4. Run `npm run check` and play both games once in `npm run dev` (`/shell`,
   Herring coast).

## Send our improvements upstream

Make the change inside `vendor/<game>/` in its own commit (do not mix it with
adapter changes in the same commit; that keeps the split clean). Then:

```bash
git subtree push --prefix=vendor/out-of-place \
  git@github.com:erinalin/out-of-place.git living-hokkaido-changes
```

This pushes our vendor commits as a branch on the upstream repo; open a pull
request there for Erina. Without push access, run
`git subtree split --prefix=vendor/out-of-place -b oop-split` and send that
branch (or a `git format-patch` of it) instead.

## Rules

- History text in the games comes only from the cited claims in their
  `content/` folders; they stay `research-preview` (shown as "Draft") until
  a named reviewer approves them (docs/REVIEW.md).
- Both games are illustrative: the panel and the stage show it.
- Do not edit `vendor/` for our look or wiring. Change the adapter instead.
