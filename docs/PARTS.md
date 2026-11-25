# Parts, boundaries and integration

The visitor experience is split into **six parts** (plus `over-time`, a
seventh part that the shell does not mount yet). Each teammate (and each
teammate's coding agent) can experiment with any part on its own. Results come
back together through **shared contracts**, not through shared code.

```
          content pack (data)                 src/content/<story>/
                 │  validated by src/contracts
                 ▼
 ┌──────────────── shell (src/shell) ─────────────────┐
 │ ExperienceState · season clock · journal progress  │
 │ props ▼                              ▲ events      │
 │ island │ detail-scene │ artifacts │ activities │   │
 │ journal │ reveal                     (src/parts/*) │
 └────────────────────────────────────────────────────┘
```

* **Contracts** (`src/contracts`): Zod schemas and TypeScript types for all
  data, the events between parts, the props of each part, units and ids.
  Framework-free (no React, no three). Labs and parts import them.
* **Content** (`src/content/<story>`): one content pack per story, as data.
  `validateContentPack()` checks every cross-reference.
* **Parts** (`src/parts/<part>`): one React component each, with exactly the
  props in `src/contracts/parts.ts`. A part renders and emits events. It never
  imports another part, the shell or content directly.
* **Shell** (`src/shell`): the only owner of state. It reduces events
  (`state.ts`), records journal progress and awards stamps (`progress.ts`),
  runs the season clock, persists the journal, and mounts parts
  (`registry.ts`). Try it at `/shell` (`npm run dev`).
* **Labs** (`labs/<part>`): standalone Vite apps for free experiments. Not
  built by `npm run check`. They hand results back through `HANDBACK.md`.
* **Design tokens** (`src/design/tokens.ts`) and the style guide
  ([STYLE.md](STYLE.md)) keep the look and scale consistent.

## The six parts

| Part | Folder | Lab | Shows | Emits |
|---|---|---|---|---|
| island | `src/parts/island` | `labs/island` | Purpose-built island diorama, owl flight, seasons on the island, location pins | `location.select`, `owl.arrived` |
| detail-scene | `src/parts/detail-scene` | `labs/detail-scene` | Interior of an open location: roof-lift entry, dollhouse home view, artifact placement, focus camera | `scene.ready`, `scene.exit`, `artifact.focus`, `activity.start` |
| artifacts | `src/parts/artifacts` | `labs/artifacts` | C2 pick-up-and-turn viewer, info card, hotspots, "How do we know?" | `artifact.inspected`, `hotspot.open`, `artifact.blur`, `reveal.open`, `activity.start` |
| activities | `src/parts/activities` | (none yet) | One renderer per activity kind: quiz, weave (D2), sequence | `activity.complete`, `activity.close` |
| journal | `src/parts/journal` | (none yet) | E1 stamp book from `JournalState` | `journal.close` |
| reveal | `src/parts/reveal` | (none yet) | F2 card turn: source → claim → human review | `reveal.close` |
| ask | `src/parts/ask` | (none) | "Ask the owl" box: answers only from cited claims, "How do we know?", navigation offers ([ASK.md](ASK.md)) | `location.select`, `artifact.focus`, `timeline.open`, `reveal.open` |
| over-time | `src/parts/over-time` | (none; route `/over-time`) | Time scrub: the house and its land through five eras, each era with cited claims | `timeline.open`, `timeline.era`, `timeline.close`, `reveal.open` |

The owl is drawn by the island part. Its words are content (`guide` in the
pack) and the shell shows them, so every part can trigger a line by event.

Global events from the shell HUD or any part: `season.set`, `season.play`,
`journal.open`, `nav.back` (`Esc`).

## Flow (happy path)

1. `island` shows the locations from `content.island`. Visitor picks the lake
   house → `location.select`. Shell: view `travel`.
2. `island` flies the owl, then `owl.arrived`. Shell: view `scene`, records the
   visit (stamp `lake-house-visit`).
3. `detail-scene` plays the roof-lift entry, settles at `views.home`, emits
   `scene.ready`. Keys `1`–`3` or a click → `artifact.focus`. Shell: view
   `focus`.
4. `detail-scene` moves the camera to the placement's `focusView`;
   `artifacts` shows the turn viewer and card, emits `artifact.inspected`,
   `hotspot.open`, and on "How do we know?" `reveal.open`.
5. `activities` runs the weave or a quiz → `activity.complete`. Shell awards
   stamps; the journal shows them.
6. `Esc` (`nav.back`) steps back one level: overlay → activity → focus →
   scene → island.

## Rules that keep parts compatible

1. **Data in, events out.** Props come from the contracts. Output is only
   `emit(event)`. No global stores, no cross-part imports, no direct
   localStorage (the shell persists the journal).
2. **Ids are the glue.** Stable kebab-case ids from the content pack
   (`lake-house`, `fiber`, `cloth`, `garment`, `weave-rows` …). Never hard-code
   text or positions in a part that the pack already holds.
3. **Units are fixed.** Island space in diorama units, scene and artifact
   space in metres, Y-up. See `src/contracts/space.ts` and STYLE.md.
4. **Every fact cites a claim.** Card text, hotspot text, activity feedback and
   reveal content come from claims in the knowledge entry. A part never writes
   its own cultural statement.
5. **Fallback first.** Each part keeps a working HTML path (keyboard and no
   WebGL). The current stubs are that path. A 3D version adds to it; it does
   not remove it.
6. **Contracts change by PR only**, following
   [CONTRACTS.md § Changing contracts](CONTRACTS.md#changing-contracts).

## Optional rendering tasks

[TASKS-SHAW.md](TASKS-SHAW.md) lists optional, more involved tasks per part
(shaders, GLB geometry, baked light, profiling, video) for Shaw to pick from
later. They follow the same rules: lab first, HANDBACK, contracts unchanged
unless proposed.

## Integrating a teammate's experiment

The goal is to keep the *ideas* and the good code, not to merge a lab
verbatim.

1. Read the lab's `HANDBACK.md` ([template](HANDBACK.md)).
2. Port the kept code into `src/parts/<part>/` behind the existing component
   export (`IslandPart`, `DetailScenePart`, `ArtifactViewer`, …). Replace lab
   data with props from the content pack.
3. Apply proposed contract changes as their own small commit, with tests.
4. Add assets to `public/models/` with an entry in `ATTRIBUTION.md`.
5. Run `npm run check`, then walk the `/shell` happy path with mouse, keyboard
   and with WebGL off.
6. When two teammates explored the same part, compare their HANDBACK
   findings, pick per topic (look, camera, interaction), and record the choice
   in the part's `AGENTS.md` under "Decisions".
