# Hand-back: activities-scene ("Rebuild the scene")

Part: activities
Author: Lukas (+ agent)   Date: 2026-11-25
Status: exploring, version 2 (design phase; Lukas picks a direction before any app code)

## Recommendation
Version 2 (after Lukas's feedback, 2026-11-26): every scene is a guided,
step-by-step story with voice and captions. Each step gives one cited fact,
then hands over ONE person (named by hat and colour) or thing, with a clue to
reason from, 2-3 rings and 4 poses. The cited point is shown after the action.
No "read, cover, recall" (it felt like a memory game). Ship the engine as one
additive activity kind `place` with two strong-source scenes first: C (chise,
things only) and A (survey camp, people). Herring and mine need a second
source for their tasks.

## Keep
| What | Files | Notes for porting |
|---|---|---|
| Place engine (drag, tap-tap, keyboard, pose sheet, check) | index.html (script) | Port to `src/parts/activities/kinds/Place.tsx`; pure state to `placeLogic.ts` |
| Pose sheet as SVG figures | index.html `POSES`, `person()` | Replace with original sprite art; keep pose ids |
| Four scene data sets | index.html `D` | Move text to claims in a content pack with locators |
| Contract sketch | contract-proposal.ts | Additive kind `place` |

## Drop
- v1 "read the label, cover it, rebuild": felt like a memory game.
- v1 tray of identical "Worker" figures: hard to tell apart.
- Personal names for figures: a name could suggest who is Ainu. Name by look.
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
