# Part: reveal

F2 studio reveal: the card turns over and shows how the knowledge was made:
source and locator → claim → human review. This is where the visitor sees that
content comes from the curated knowledge platform. No lab yet.

- Component: `RevealPart`. Props: `RevealPartProps` (`knowledgeId`,
  `claim`, `artifact`).
- Emits: `reveal.close`.

## Must

- Show only what is true: `presentation` decides the review line. Show an AI
  extraction step only when a real extraction produced the claim; a mocked
  step is labelled as a mock.
- Link sources with their locators. A link is not permission to reuse media.
- No new claims. Do not show reviewer names that are not real.

## Acceptance

Opens from the artifact card for its summary claim; keyboard focus moves into
the reveal and back; works without WebGL.

## Decisions

- 2026-11-24: F2 card turn (Lukas).
