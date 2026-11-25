# Hand-back: activity kinds (story, words, trace)

Part: activities
Author: Lukas (+ agent)   Date: 2026-11-25
Status: ready to integrate (contracts + content merged in this PR; renderers wait in the lab)

## Recommendation (3–5 lines)
Add three additive activity kinds: `story` (owl-read chapters with synced
captions and pause choices), `trace` (match sentences to their sources) and
`words` (listen, repeat, match). Ship `story` and `trace` in the demo: they
use only existing claims. Show `words` only as a labelled stand-in demo: real
Ainu terms stay blocked until a qualified reviewer and a consenting speaker
exist. See DESIGN.md for the rules and the other kinds we considered.

## Keep
| What | Files | Notes for porting |
|---|---|---|
| Schemas (done) | src/contracts/activity.ts, src/contracts/content.ts | Already in the union and in `validateContentPack` |
| Content (done) | src/content/bark-to-cloth/activity-kinds.ts | Ids `story-bark-to-cloth`, `words-objects`, `trace-sources`; not yet in `scene.activityIds` |
| Story player | src/Story.tsx | Timer captions; device-voice word boundaries when enabled; Space = play/pause; chapters nav; transcript toggle |
| Words (listen / repeat / match) | src/Words.tsx | Two-step tabs; click word then object; review checklist per term |
| Trace board | src/Trace.tsx | SVG threads drawn from DOM rects; redraw on resize |
| Owl + object icons | src/Owl.tsx, src/icons.tsx | Original SVG, MIT; colours from tokens |
| Sample data | src/data.ts | Lines reuse the existing narration and claim texts |
| Props shape | src/shared.tsx `KindProps` | Same as `ActivityPartProps`; emits `activity.complete`, `activity.close`, `reveal.open` |

## Drop
- An "AI draft" step in the trace review strip: the seed claims were written
  by hand, so the strip shows only Source → Claim → Human review.
- Any Ainu word, even catalogue spellings from the sources (docs/RESEARCH.md).
- Microphone recording for "repeat": skipped (permissions, privacy). "I said
  it aloud" is a self-check only.

## Contract impact
- Uses as-is: `ResolvedClaim`, `resolveClaim`, `ActivityResult`,
  `ExperienceEvent` (`activity.complete`, `activity.close`, `reveal.open`),
  `Prefs`, `createEventBus`, design tokens, the bark-to-cloth pack.
- Added in this PR (additive, CONTRACT_VERSION stays 1; tests in
  `tests/contracts.test.ts`):
  - `mediaRefSchema`: `none | device-voice-placeholder | recording(sourceId)`.
    A recording must be an `audio` source with approved rights, granted
    consent and not a placeholder.
  - `storyActivitySchema` (`kind: "story"`): narrator (character, credit,
    voice), chapters of `fact` (≥ 1 claim) or `frame` lines, optional pause
    with 1–3 choices (`continue | chapter | reveal`), completion.
  - `wordsActivitySchema` (`kind: "words"`): `lang`, `standIn`, steps,
    terms (text, lang, gloss, artifactId, claimId, audio, five review flags).
  - `traceActivitySchema` (`kind: "trace"`): prompt, completion; pairs come
    from the knowledge entry.
  - `validateContentPack` rules: real terms need an approved entry, all five
    checks and a recording; device voice never reads a real term; Ainu tagged
    `ja-*` is rejected; stand-ins must not claim the target language;
    fact-line and choice claims must be in `claimIds`; term artifacts exist.
- No new events.

## How to make them playable in /shell
1. Copy `src/Story.tsx`, `src/Words.tsx`, `src/Trace.tsx`, `src/Owl.tsx`,
   `src/icons.tsx`, `src/shared.tsx` into `src/parts/activities/kinds/`. Add
   `"use client"` at the top of the three renderers.
2. Turn `src/ui.css` into `kinds.module.css` (Next allows global CSS only
   in the layout) and swap `className="x"` for `className={s.x}`; or import
   `ui.css` once in `src/app/layout.tsx`.
3. In `ActivityPart`, add
   `{activity.kind === "story" && <Story activity={activity} claims={claims} prefs={prefs} emit={emit} />}`
   and the same for `words` and `trace`.
4. Add `"story-bark-to-cloth"`, `"words-objects"`, `"trace-sources"` to
   `scene.activityIds` in `src/content/bark-to-cloth/scene.ts` (optionally to
   an artifact's `activityIds`, e.g. story on `garment`).
5. `npm run check`, then walk /shell: scene → activity → complete → Esc.

## Assets
| File | Source | Licence / rights | Size | Triangles |
|---|---|---|---|---|
| Owl SVG (src/Owl.tsx) | Original, Living Hokkaido team | MIT | inline | n/a |
| Object icons (src/icons.tsx) | Original plain shapes, not museum objects or patterns | MIT | inline | n/a |

No audio, images or third-party media.

## Measurements
DOM only, no WebGL. Production bundle 453 kB JS (137 kB gzip), mostly React
and zod; the content pack is included. No fps numbers (container only).

## Fallback and accessibility
- All controls are buttons; full keyboard path. Space plays / pauses the
  story. Captions use `aria-live="polite"`; transcript toggle lists every line
  with its claim ids.
- Without a speech engine (as in the container) the story runs captions only
  and says "Captions only · no recording yet"; Listen buttons are disabled
  with "No voice on this device · read it aloud".
- `prefers-reduced-motion` (or `?still`) stops owl bob and blink.
- Phone width (390 px) checked: story stacks, match grid wraps.
- Known gap: trace threads are decorative; the linked state is also shown by
  colour + locator text, so colour is not the only signal.

## Screenshots
`shots/story-captions.jpg`, `shots/story-pause.jpg`, `shots/words-listen.jpg`,
`shots/words-match.jpg`, `shots/trace-progress.jpg`, `shots/trace-done.jpg`,
`shots/story-mobile.jpg` (made by `scripts/shots.mjs`).

## Open questions
1. Language reviewer (name / role / variety) for `words`. Assumed for the
   demo: review pending, stand-ins with the label.
2. Voice: assumed for the demo: captions + device voice as a labelled English
   placeholder. Later a consented human recording (`voice.kind: "recording"`).
3. Stamp for `trace`?
4. Should story choices also let the visitor pick the next object in the
   room (emit `artifact.focus`)? That needs the shell to allow it from the
   activity view.
