# Part: activities

One renderer per activity kind (`quiz`, `weave`, `sequence`). No lab yet;
start `labs/activities` (or `labs/activities-weave`) to explore the D2 loom.

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
