# Hand-back: backup demo video recorder

Part: tooling (no part; drives `/shell`)
Author: Lukas (+ agent) Date: 2026-11-25
Status: ready to use; shell hook proposed below

## Recommendation

Keep the recorder in `scripts/demo-video`. Update `steps.ts` when a part
changes its controls. Add the small shell hook below, so the recorder can
wait for real events (`owl.arrived`, `scene.ready`) instead of fixed delays.
This matters when the 3D island and the roof-lift entry have real animation
times.

## For the shell owner: proposed hook (additive, about 10 lines)

The recorder does not edit `src/shell`. It already works without the hook
(fixed delays). With the hook, waits are exact and `emit(...)` steps work.

In `src/shell/Shell.tsx`, inside `emit` (after `setState`), and one effect:

```ts
// Demo recorder and e2e hook: mirror every event as a DOM event.
window.dispatchEvent(new CustomEvent("lh:event", { detail: e }));
```

```ts
// Demo recorder and e2e hook: let scripts send the same events the UI sends.
useEffect(() => {
  const w = window as Window & { __livingHokkaido?: { emit: Emit } };
  w.__livingHokkaido = { emit };
  return () => {
    delete w.__livingHokkaido;
  };
}, [emit]);
```

(`Emit` is exported by `@/contracts`.) The hook adds no new power: it sends
the same events that the HUD and the part buttons send, through the same
reducer. Gate it behind `?demo` if you prefer; then set
`startPath = "/shell?demo"` in `steps.ts`.

Optional extra: `data-view={state.view}` and `data-overlay` on the shell
`<main>`, so steps can wait on `{ css: 'main[data-view="scene"]' }`.

## For part owners

The recorder finds controls by role and accessible name (from the content
pack), for example the button named after the open location, `How do we
know?`, `Turn back`, `Try the activity`, `Close`, `Journal (…)`, the region
named after the scene title and `Heritage Journal`. If a 3D part replaces
these, keep accessible names (the a11y rule asks for that anyway) or tell
whoever edits `steps.ts`. Key fallbacks already in the steps: `1`–`3` for
artifact focus, `Escape` for back, `j` for the journal (only if a part adds
it).

## Contract impact

- Uses as-is: `ExperienceEvent`, `EventType` (for `emit` and
  `waitForEvent` steps), the default content pack for names.
- Proposed changes: none to contracts. Only the shell hook above.

## Measurements

Linux cloud container, headless Chromium (software rendering), HTML stub
parts: full flow 77 s, 1920×1080, 30 fps H.264, about 4 MB. No GPU or macOS
measurement yet.

## Open questions

- Does Playwright capture stay smooth with the 3D island on Lukas's laptop?
  If not, use `--headed --capture none` with an OS screen recorder.
- Sound: Playwright video has no audio track. Record audio with the OS path,
  or add it in the edit.
