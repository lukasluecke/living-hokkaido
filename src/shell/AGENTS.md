# src/shell: composition shell

Owns `ExperienceState` (`state.ts`), journal progress and stamps
(`progress.ts`), the season clock and journal persistence (`Shell.tsx`), and
which component renders each part (`registry.ts`). Route: `/shell`.

- Parts are mounted with props from `src/contracts/parts.ts`; the shell is the
  only place that reads `localStorage` or holds state.
- `state.ts` and `progress.ts` stay pure functions with tests in
  `tests/contracts.test.ts`. Add a case there for every new event.
- To integrate a part, change code inside `src/parts/<part>/` and keep its
  export name. Only edit `registry.ts` to swap a whole implementation (for
  example a lazy-loaded 3D version with the HTML stub as fallback).
- Canvas layout (one shared canvas vs one per part) is an integration
  decision; record it here under "Decisions" when made.

## Decisions

- 2026-11-25: one canvas per 3D part (island, detail-scene, artifact viewer). The shell gives a full-screen stage, a HUD, a side slot (viewer, activity) and an overlay slot (journal, reveal).
- 2026-11-25: demo/e2e hook in `Shell.tsx`: every event is mirrored as a `lh:event` DOM event, `window.__livingHokkaido.emit` sends events, `<main>` has `data-view` and `data-overlay` (for `scripts/demo-video`, PR #8). Sound hook-up from PR #7 (`src/audio/AGENTS.md`) is kept when that PR merges.
- 2026-11-25: "Ask the owl" (`src/parts/ask`, docs/ASK.md) is mounted in `Shell.tsx` next to the guide line, with `view`, `locationId`, `sceneId`, `artifactId` and `covered` (an overlay is open). It sends only existing events.
