# src/parts: the six visitor parts

Each folder is one part: `island`, `detail-scene`, `artifacts`, `activities`,
`journal`, `reveal`. Each exports one React component that takes exactly the
props in `src/contracts/parts.ts`. The current code is the **HTML fallback
stub**: it works with keyboard and without WebGL, and it shows the event flow.

Rules for every part:

1. Input = props. Output = `emit(event)`. No imports from other parts, the
   shell or `src/content`. Shared helpers go in `src/parts/shared/`.
2. All text and positions come from props (the content pack). Facts come from
   resolved claims. Show the honesty labels (`shared/Badges.tsx`).
3. Keep the HTML path working when you add 3D. Respect `prefs.reducedMotion`
   and `prefs.webgl`.
4. Use `src/design/tokens.ts` and docs/STYLE.md for look, scale and motion.
5. Read the `AGENTS.md` in your part folder: it lists the events, what to port
   from the lab, and the acceptance checks.
