# Part: over-time

"Over time" scrub: one place shown in a few dated eras. The first timeline
shows how the house and its land changed: pit dwellings (Satsumon culture),
flat-ground houses (13th–14th century), cise and kotan, Meiji-era land
clearing, and rebuilt cise today. Route for now: `/over-time`
(`src/app/over-time`, a small host; the shell does not mount it yet).

- Component: `TimelinePart` (`index.tsx`). Props: `TimelinePartProps`
  (`src/contracts/parts.ts`): `PartContext` + `timeline`, resolved `claims`,
  optional `initialEra`.
- Reads: `timeline.eras[]` (`label`, `period`, `title`, `summary`,
  `claimIds`, `stage`), `timeline.claimIds` (notes shown on every era),
  `season.value` (land, foliage and sky tint), `prefs`.
- Emits: `timeline.open` (mount), `timeline.era` (visitor settles on an era
  for 0.4 s; not every scrub frame, not while playing), `timeline.close`
  (unmount), `reveal.open` (per claim, "How this was made").

## Files

| File                  | What                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `index.tsx`           | Card, sources list, scrub bar (range + era buttons), play, events, HTML path                 |
| `Diorama.tsx`         | R3F tile: river, trees, fields, road, houses, storehouse, museum, smoke                      |
| `features.ts`         | Era `stage` → feature weights (pit, flat, thatched, forest …), blended at the scrub position |
| `OverTime.module.css` | Paper card and bar (tokens from `src/design/tokens.ts`)                                      |

## Must

- Every visible fact comes from a claim. `summary` only restates the era's
  claims; the card lists them with source and locator ("How do we know?").
- Show "Research preview · review pending" and "Illustrative model".
- Leave out sacred places and objects (outdoor altar, the window on the far
  side of the hearth, bear ceremony items) unless an Ainu cultural reviewer
  approves them. The sources mention them; we do not draw them.
- Do not show the past as the present: the `not-frozen` note is on every era.
- Keyboard: range slider (arrow keys jump one era, Home/End), era buttons,
  Play. Play is off with `prefs.reducedMotion` (no timelapse autoplay);
  scrub moves cut instead of easing. `prefs.webgl === false`: no canvas, the
  card and bar still carry all content.

## Limits

- The tile layout (positions of houses, fields, river) is renderer-internal
  sketch geometry, not content. It is the same for every timeline. A second
  timeline with other places needs layout data in the contract first.
- Shapes are generic. They are not a reconstruction of one real house or
  village. The storehouse and house forms follow the cited descriptions only
  at the level "raised log storehouse", "thatched roof of grass and bark".
- Measured only in the container (SwiftShader, so no real fps): about 40–75
  WebGL draw calls per frame, shadow pass and effects included (budget:
  150). Trees, furrows, crops, stumps and fence posts are instanced; hidden
  era groups do not draw.

## Shell integration (proposal for the shell owner)

1. Registry: add `"over-time": TimelinePart` (lazy is fine). Optionally add
   `"over-time"` to `PART_IDS` and `PartPropsMap` (additive).
2. State: a new view `"timeline"` (or an overlay `"timeline"`) with
   `timelineId`. `timeline.open` → open it; `nav.back`/`Esc` and
   `timeline.close` → back to the previous view.
3. Entry points: a HUD button "Over time" in the lake house scene (the
   timeline has `locationId: "lake-house"`), and an owl line. Owl lines only
   navigate.
4. Props: `claims` = resolve `timeline.claimIds` + every era's `claimIds`
   against `timeline.knowledgeId` (same helper as `claimsFor` in
   `Shell.tsx`). Pass the shell's `season`.
5. Journal (optional): a stamp for `timeline.era` on all eras needs a new
   unlock rule (`timeline-eras-seen`), additive.
6. Add reducer tests in `tests/contracts.test.ts` for the new events.

## Decisions

- 2026-11-25: new part instead of a lab, so it builds and type-checks with
  `npm run check` and can be mounted by the shell without porting.
- 2026-11-25: ink outline moved to `src/parts/shared/InkEdges.ts` (island
  re-exports it), so both parts share one effect.
