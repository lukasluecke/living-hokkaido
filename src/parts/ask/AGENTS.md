# Part: ask ("Ask the owl")

A small text box, bottom-left of the stage. The visitor asks a question. The
owl answers only from claims in the content pack, shows each cited claim with
"How do we know?", and can offer one action ("Show me", "Fly to", "Open the
timeline"). Setup and modes: docs/ASK.md.

- Component: `AskPart`. Props: `AskPartProps` (`view`, `locationId`,
  `sceneId`, `artifactId`, `covered`).
- Emits: `location.select`, `artifact.focus` (after the owl arrives and the
  room is there), `timeline.open`, `reveal.open`.
- Logic lives in `src/domain/ask.ts` (pure, tested in `tests/ask.test.ts`).
  The part calls `POST /api/ask`; when there is no server (static demo link)
  or the reply fails the checks, it uses `scriptedAnswer()` in the browser.

## Must

- No answer without a cited claim. No claim fits = "I don't know yet".
- Every id in an answer is checked against the pack (`checkAnswer`), on the
  server and again in the browser.
- Label the mode on every answer: AI summary (live) or scripted (no AI).
  Show the `Draft` badge for research-preview claims.
- Esc closes the box only (top layer first). Focus goes to the input on open
  and back to the trigger on close. The box hides under overlays.
- Suggestions come from `pack.ask.suggestions` (questions only).

## Limits

- Phone: the trigger hides while the object sheet or an activity is open.
- No chat memory: each question is answered on its own.
- Keyword retrieval (no embeddings). Good for this small pack; replace with
  embeddings when the pack grows.
