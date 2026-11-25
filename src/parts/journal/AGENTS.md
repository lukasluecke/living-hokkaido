# Part: journal

The Heritage Journal, E1 stamp book. Renders `JournalState` against
`content.stamps`. No lab yet; start `labs/journal` for the book design.

- Component: `JournalPart`. Props: `JournalPartProps` (`journal`).
- Emits: `journal.close`. Optional: `reveal.open` from a stamp's claims.

## Must

- Read-only: the shell records progress (`src/shell/progress.ts`) and
  persists it. Do not write localStorage here.
- Stamp artwork is mapped from `stamp.icon`. Locked stamps are visible but
  muted; earned stamps change icon _and_ colour.
- No personal data, no free-text entries in this version.

## Acceptance

Earned stamps survive reload; reset (if added) is a shell action through a new
event, proposed in docs/CONTRACTS.md first.

## Decisions

- 2026-11-24: E1 stamp book (Lukas).
