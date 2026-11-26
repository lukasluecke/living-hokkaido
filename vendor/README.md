# Vendored teammate games

Two games by Erina and one splat app by Shaw live here as **git subtrees**: full copies of the upstream
repos, squashed into one commit per sync. The upstream commit of each sync is
recorded in the squash commit (`git-subtree-split: <sha>`), so git knows
where the copy came from and can pull and push changes both ways.

| Folder | Upstream | Synced at | Our activity kind |
|---|---|---|---|
| `out-of-place/` | `erinalin/out-of-place` (private), branch `main` | `76ecbd8` (2026-11-25) | `hide-seek` |
| `dont-fall-on-the-slope/` | `erinalin/dont-fall-on-the-slope` (private), branch `main` | `4778ded` (2026-11-25) | `slope-run` |
| `sapporo-omusha/` | `xjets/sapporo-omusha` (private, MIT, Shaw), branch `main` | `2012845` (2026-11-25) | `splat-look` |

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
11. Out of Place, Lukas's feedback, one commit: no contact shadow under
   Nuri (the brush could not paint it, so it gave Nuri away); Move keeps
   the grab point under the finger, and a blocked target (a wall, the
   water) slides Nuri along the edge instead of freezing (`tryMove`,
   `game/nuri.ts`); a missed release ends the drag.
12. Out of Place, Lukas's request, one commit: Play with the AI. While the
   scene is shown, pick 2 players, AI hides or AI seeks (buttons, or M).
   The AI hider tries 12 open spots and poses, paints Nuri with the scene
   pattern at each, and takes one of the best blends. The AI seeker
   guesses every ~2.7 s; a guess lands on Nuri more often when the blend
   score is low, clay is bare, or time runs on. A local heuristic, no
   server or model. One-player modes skip the handoff cover.
13. Out of Place, Lukas's request, one commit: a first step toward the
   slope game's look. Backdrop and UI in its winter-dusk blue, its lamp
   gold and roof red (`style/palette.ts`, `index.html`); on the Otaru
   warehouse, warm-lit windows, snow on the ridge and eave, icicles.
14. Out of Place, Lukas's requests, one commit: slope-style house fronts
   (Otaru warehouse: plinth, lit lattice windows with open plaster fire
   shutters, a tiled pent eave with snow and icicles, plaster fire walls,
   a made-up painted mark; Sapporo wooden shop: lit lattice and shop floor,
   snow, icicles), and a game control panel: Tools, Paint and Pose trays
   with icon buttons (`makeIconButton`, `drawIcon` in `style/ui.ts`), brush
   sizes as dots, recent paints in the Paint tray, a gold "I'm hidden".

## Sapporo Omusha (Shaw)

A phone web app around a Gaussian splat of the Hokkaido Museum's Omusha
diorama. We use only its **data**; its viewer page, Node server, Gemini
Talk and Gather are not built or served here.

| Ours | What it does |
|---|---|
| `src/contracts/activity.ts` | `splat-look` kind: asset key, start view, spots in splat-local coordinates |
| `src/content/bark-to-cloth/omusha.ts` | Imports `src/hotspots.json` and the names in `characters/1808/*.json`; claims are our paraphrases of museum panels 7835/7836, not Shaw's drafts |
| `src/parts/activities/captures/` | `SplatLook.tsx` (panel, stage, spot list, password form), `splatViewer.ts` (three + Spark 2.4, the same loader and settings as Shaw), `splatLogic.ts` |
| `worker.ts`, `src/integrations/museum-assets/edge.ts` | Custom Worker entry: public media (`PUBLIC_MEDIA`: the splat, the intro video) straight from R2 with ranges, before OpenNext (the Next route streamed ~40 KB/s) |
| `src/integrations/museum-assets/`, `src/app/api/museum-assets/` | The splat from the R2 bucket (`MUSEUM_ASSETS`). Public while `asset.gated` is false (Lukas, 2026-11-26); a gated key needs the demo password (`MUSEUM_ASSET_PASSWORD`) |

**The splat is not in Git** (here or upstream: museum material, NOTICE.md).
Get `omusha.sog` from Shaw, then:

`wrangler.jsonc` binds the bucket `living-hokkaido-museum` (it exists since
2026-11-26; a deploy fails without it). Without the object the diorama shows
the spot list with "Splat not available". The password is needed only for
gated keys. Setup on a new account:

```bash
npx wrangler r2 bucket create living-hokkaido-museum   # once
npx wrangler r2 object put living-hokkaido-museum/omusha.sog --file omusha.sog --remote
npx wrangler secret put MUSEUM_ASSET_PASSWORD
```

For `npm run dev`, put the file in `.museum-assets/omusha.sog` (git-ignored)
and set `MUSEUM_ASSET_PASSWORD` in `.env.local`. Withdrawal: `npx wrangler r2
object delete living-hokkaido-museum/omusha.sog --remote`; the viewer then
shows the spot list only. A new `hotspots.json` from upstream moves the spots
with the next subtree pull; a new character id needs a line in `omusha.ts`.

Pull:

```bash
git subtree pull --prefix=vendor/sapporo-omusha \
  https://github.com/xjets/sapporo-omusha.git main --squash
```

Synced back: Erina pulled patches 1–10 into her repo (`194f4bf`), added
steps 5–8, Japanese text, Otaru obstacles and a canal ending, and we pulled
her `b794383` back (her tree as is). See her `HANDBACK.md`. The adapter
passes the app's language as `lang` (no in-game language button).
Patch 11 (vendor, one commit): optional `honesty` prop (default true) hides
the score card's "Illustrative · research preview" line; the adapter passes
`SHOW_DISCLAIMERS`.

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
