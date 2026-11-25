# Part: activities

One renderer per activity kind (`quiz`, `weave`, `sequence`, and `story`,
`words`, `trace` in `kinds/`, from `labs/activities-kinds`).

- Component: `ActivityPart`. Props: `ActivityPartProps` (`activity`, `claims`).
- Emits: `activity.complete` with an `ActivityResult`, or `activity.close`.

## Must

- Feedback text comes from the definition (`explanation`, `completion`) or
  from claims. The weave is a playful observation game, not a lesson in a real
  technique, while `illustrative` is true; say so in the UI.
- A new kind = additive contract change in `src/contracts/activity.ts`, a
  renderer here, and a test.
- Fully usable by keyboard. Emit `completed: true` only when the visitor
  really finished.

## Acceptance

Each kind completes by mouse and keyboard; cancel returns to the scene; the
journal stamp appears after completion.

## Decisions

- 2026-11-24: D2 weave chosen as the craft activity (Lukas).
- 2026-11-25: Weave v1 is a 2D SVG loom (`Weave.tsx`): per row, pass the
  shuttle (drag, ←/→ or button), then press the row down (↓, click the bar
  or button). Pure state in `logic.ts`, tested in `tests/activities.test.ts`.
  Colours from tokens via `theme.ts`; backdrop follows the season blend.
- 2026-11-25: `story`, `words`, `trace` ported from `labs/activities-kinds`
  into `kinds/` (one CSS module, `.root` scope). Story voice = captions +
  device voice.
- 2026-11-25: Lukas: unlock everything now, review later. `words` shows the
  cited Ainu words (attus, isitaykini) with a small "Draft" chip; no review
  gate in the UI. The device voice never reads Ainu; Listen waits for a
  recording. Every draft item is listed in docs/REVIEW.md.
- 2026-11-25: Kinds from the Hokkaido Museum visit live in `play/` (one CSS
  module, `.root` scope, pure state in `play/*Logic.ts`). `map`: stylised
  figure (sketch Hokkaido map or cise plan) with spot buttons; explore opens
  every spot, match puts each word on its spot.
  `board`: the stick game on a 田 grid (Q021) against a gentle owl
  (`play/boardLogic.ts`: takes a win, avoids handing one over, else steps
  closer, with a little chance) or two players on one device.
