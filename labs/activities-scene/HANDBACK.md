# Hand-back: activities-scene ("Rebuild the scene")

Part: activities
Author: Lukas (+ agent)   Date: 2026-11-25
Status: exploring (design phase; Lukas picks a direction before any app code)

## Recommendation
Build direction A (1890 land survey camp) first as one new, additive activity
kind `place`. Its museum panel (PC 314) has four numbered callouts, so each
spot has a cited answer. Add B's Listen mode as a `learn` option on the same
data. Use C's rule for any Ainu scene: place objects and tasks, never posed
Ainu figures. Keep D (mine and winter forest, season switch) for later.

## Keep
| What | Files | Notes for porting |
|---|---|---|
| Place engine (drag, tap-tap, keyboard, pose sheet, check) | index.html (script) | Port to `src/parts/activities/kinds/Place.tsx`; pure state to `placeLogic.ts` |
| Pose sheet as SVG figures | index.html `POSES`, `person()` | Replace with original sprite art; keep pose ids |
| Four scene data sets | index.html `D` | Move text to claims in a content pack with locators |
| Contract sketch | contract-proposal.ts | Additive kind `place` |

## Drop
- Character choice where the source does not say who did what (herring,
  mine): there only place and action count.
- Any dress-up or costume colour to show who is Ainu.

## Contract impact
- Proposed: activity kind `place` (contract-proposal.ts). Emits the existing
  `activity.complete` / `activity.close`.

## Sources (research preview, not reviewed)
Hokkaido Museum permanent exhibition, photos by Lukas 2026-11-25:
PC 314 「殖民地区画の作業をしているところ」 IMG_7865; PC 318 「海に生きる」
IMG_7873; PC 325 「山に生きる」 IMG_7877; diorama photos IMG_7866–7880;
restored house 「家の中をよく見てみよう」 IMG_7739. Tasks marked "seen in the
diorama" (herring carry and dry, mine drill and shovel) have no panel text;
list them in docs/REVIEW.md until a second source supports them.

## Assets
None. All drawings are inline SVG, our own, illustrative.

## Measurements
Static HTML, no WebGL. Checked in headless Chromium at 1280 px and 390 px:
no script errors, no sideways scroll; A completes by click, B by drag.

## Fallback and accessibility
Every figure and ring is a button: tap a figure, then tap a ring, or Tab and
Enter. Keys 1–9 pick a pose. Listen mode always shows captions.

## Open questions
- Phone: the 16:9 stage is small at 390 px. Needs a taller crop or zoom.
- Who reviews the survey scene text about Ainu guides and porters?
- C needs an Ainu cultural reviewer before it ships.
