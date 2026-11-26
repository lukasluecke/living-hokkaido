# Data and interface contracts

Two layers:

* **Provenance layer** (contributor side): `src/domain/contracts.ts`, rules in `src/domain/review.ts`. Sources, claims, knowledge review, providers. Table below.
* **Experience layer** (visitor side): `src/contracts/` (import `@/contracts`). Built on the provenance layer. Parts, the shell and labs use only this. See [PARTS.md](PARTS.md).

## Experience contracts (`src/contracts`)

| File | Contract | Key rules |
|---|---|---|
| `ids.ts` | id rules, `PART_IDS` | kebab-case, stable; never rename a used id |
| `space.ts` | `Vec3`, `CameraView`, `ISLAND`, `SCENE`, `SCALE` | three spaces: island (du), scene (m), artifact (m); Y-up |
| `knowledge.ts` | `KnowledgeEntry`, `ResolvedClaim` | `presentation`: research-preview / approved / withdrawn; approved needs reviewer + date; citations resolve |
| `world.ts` | `Island`, `Location` | open locations need a `sceneId`; positions in island space; `placeholder` flag |
| `scene.ts` | `DetailScene`, `ArtifactPlacement` | views `outside` + `home`; `roofNode`; placements with `focusView` and key |
| `artifact.ts` | `Artifact`, `ModelAsset`, `Hotspot` | summary + hotspots cite linked claims; scans need approved rights + consent; withdrawn assets rejected |
| `activity.ts` | `ActivityDefinition` (quiz / weave / sequence / story / words / trace), `MediaRef`, `ActivityResult` | grounded in ≥ 1 claim; weave is `illustrative` by default; story fact lines cite claims; `words` terms cite a claim and show as drafts until their five review checks are done (docs/REVIEW.md); the device voice never reads a real term; recordings are consented `audio` sources |
| `journal.ts` | `Stamp`, `UnlockRule`, `JournalState` | progress holds only pack ids; storage key `lh-journal-v2` |
| `season.ts` | `SeasonState`, `seasonWeights`, `seasonAt` | one value 0–4; shell owns the clock |
| `memory.ts` | `VoiceMemory`, `MemoryTranslation`, `memoriesForArtifact`, `pickTranslation` | original audio stays playable; translations need translation consent; `cloned` voice needs voice-clone consent; translations are `machine` until `checkedBy`; Ainu content is flagged by `needsReview` (draft, prototype gate open); `placeholder` samples skip speaker consent but never use a cloned voice; withdrawn consent hides it; source must be an `audio` source |
| `guide.ts` | `GuideLine` | owl navigates; facts need `claimIds` |
| `events.ts` | `ExperienceEvent`, `createEventBus` | parts communicate only by events |
| `experience.ts` | `ExperienceState`, `View`, `Prefs` | written only by `src/shell/state.ts` |
| `timeline.ts` | `Timeline`, `TimelineEra`, `eraWeights`, `eraAt` | eras in time order; every era cites ≥ 1 claim of the timeline's knowledge entry; `stage` only picks illustrative shapes |
| `parts.ts` | props per part (`IslandPartProps` …, `TimelinePartProps`) | a part takes exactly these props |
| `content.ts` | `ContentPack`, `validateContentPack`, `resolveClaim`, `sanitizeJournal` | every cross-reference checked; `CONTRACT_VERSION` |

## Changing contracts

1. **Additive** (new optional field, new event, new activity kind, new unlock rule): allowed in any PR. Add a default so old content still parses, add a test in `tests/contracts.test.ts`, update the table above.
2. **Breaking** (rename/remove a field or event, change a payload or unit): ask Lukas first, bump `CONTRACT_VERSION`, migrate `src/content/*` and every part in the same PR, and add a line to the change log below.
3. Labs never edit `src/contracts` on their own branch without saying so in `HANDBACK.md`. Put the proposal in `labs/<lab>/contract-proposal.ts`.

### Change log

| Version | Change |
|---|---|
| 1 (additive) | Highlights (Lukas, 2026-11-26): `ContentPack.highlights` (default `[]`): `{ id, title, teaser, icon, locationId, open, owl? }`, `open` = `activity` (offered at that place), `timeline` or `film` (the place's scene has one); checked in `validateContentPack`. `highlightDone(h, journal)`. Event `highlight.open { highlightId }`. `ExperienceState.pendingHighlightId` (optional; opened on `owl.arrived`). `IslandPartProps.doneHighlightIds` (optional). |
| 1 (additive) | `place`: stage `hills` (Animal hills) and things `deer`, `bear`, `hare`, `salmon`, `set-bow`, `pelt`, `fish-owl`. New enum values only, so old content still parses. |
| 1 (additive) | `factHotspots(artifact)` and `modelNotes(artifact)` helpers in `artifact.ts`: hotspots of kind `disclaimer` ("About this model") are a footnote on the card, not a Look closer row, a viewer dot or a journal count (Lukas, 2026-11-26). |
| 1 (additive) | Exhibits for `slope-run` (Lukas, 2026-11-25): each find gets `look` (`warehouse-wall`, `shachihoko`, `straw-sacks`, `sack-cart`, `herring-boxes`, `canal`; default `straw-sacks`). `ActivityResult.found` (optional ids found in the run). `JournalState.found` (`"<activityId>/<id>"`, default `[]`, so saved journals still parse). `ActivityPartProps.found` (optional, from the journal). |
| 1 (additive) | `slope-run` gets `finds` (default `[]`, max 12): `{ id, label, claimId }` labels on the street; each `claimId` must be in `claimIds` (`checkActivityKind`). |
| 1 (default) | `hide-seek` default `durations.disguise` 60 → 80 s (Erina's playtest; seek stays 90 s). Same in `vendor/out-of-place/contract-proposal.ts`. |
| 1 (additive) | Activity kind `place` (Build the scene, labs/activities-scene): `stage`, `subject` (`people` or `objects`), `season` default `"summer"`, `steps` with `say`, `claimIds`, `observed` default `false`, optional `season`, `ask`, `figure` (label, hat, colour or thing), `options` (one `right`), `pose`, `poses`, hints and `why`; `illustrative` default `true`. Step claims must be in the activity's `claimIds`. |
| 1 (additive) | Activity kinds `hide-seek` (Out of Place: `scene`, `prompt`, `captionClaimIds`, `accurateClaimIds`, `anachronismClaimIds` default `[]`, `durations`, `wrongTapPenalty`, `players`, `illustrative` default `true`) and `slope-run` (Don't Fall on the Slope: `prompt`, `completion`, optional `seed`, `illustrative` default `true`). Both games are vendored, see vendor/README.md. |
| 1 (additive) | `ArtifactViewerProps.doneActivityIds?` (completed activity ids, e.g. `journal.completed`): the object card marks those rows "Done" and starts the first one not done. |
| 1 (additive) | `DetailScenePartProps.inspectedArtifactIds` (optional): placed artifacts already inspected, for the object tray's progress. |
| 1 (additive) | Activity kinds `canon` (voices, `offset`, `beats`, `structureClaimId`, `lyrics` default `[]`) and `pluck` (strings with gauge and hands, `stringsClaimId`, optional `tune`). Sound is synthetic and illustrative. |
| 1 (additive) | `ContentPack.ask.byLocation` and `ask.byArtifact` (default `{}`): example questions per place and object; `askSuggestionsFor()`. |
| 1 (additive) | `ask.ts`: `AskRequest`, `AskAnswer`, `AskAction`; `ContentPack.ask.suggestions` (default `[]`); `AskPartProps` (src/parts/ask, docs/ASK.md). |
| 1 (additive) | Activity kind `board` (game `stick-grid`, `rulesClaimId`, opponent `owl` by default or `two-players`). |
| 1 (additive) | Story line role `refrain` and optional `StoryActivity.refrain` (text, romanised, lang, credit, claim). The device voice never reads a refrain. |
| 1 (additive) | Activity kind `map` (figure `hokkaido` or `cise-plan`, mode `explore` or `match`, spots with word, gloss, region and claim; `placeholder` default `true`). |
| 1 (additive) | `DetailScene.setting` (default `"house"`), `DetailScene.timelineIds` (default `[]`), entry `"fly-in"`. Sound zones can be limited to `scenes`. The three other places open with their own scenes. |
| 1 (additive) | `ContentPack.memories` (default `[]`) and `memory.ts`: curator voice memories with consent and labelled translations. |
| 1 (additive) | `timelines` in the content pack (default `[]`), `timeline.ts`, events `timeline.open` / `timeline.era` / `timeline.close`, `TimelinePartProps` (src/parts/over-time). |
| 1 (additive) | Activity kinds `story`, `words`, `trace` and `MediaRef` (labs/activities-kinds). |
| 1 | First experience contracts (this file). Artifact id `loom` in the objects lab unified to `cloth`. Places from the island lab replaced by purpose-built `Location`s (no lon/lat). |

## Provenance contracts (`src/domain`)

| Entity | Minimum fields | Rules |
|---|---|---|
| Source | id, title, kind, optional URL, attribution, rights, consent, placeholder | URL is not reuse permission; production adds owner, allowed uses, expiry, private storage reference and withdrawal record |
| Claim | id, text, citations[{sourceId, locator}] | At least one citation; every source must resolve; locator is page, timecode or section |
| Knowledge/story | id, title, status, sources[], claims[], activities[], reviewer?, reviewedAt? | Draft → review → approved; any state may withdraw. Content edits require re-review in production |
| Activity | id, storyId, question, options[], answer, explanation, claimIds[] | Answer index in range, source-linked claims in same story; human reviews cultural/learning quality |
| Asset | id, kind, url/null, rights, attribution, placeholder | Null is a real absence; never invent model/recording URLs |
| Progress | activity IDs, local version | Only known IDs persisted; no identity or personal data |
| ProviderResult | mode mock/live/unavailable, value, notice | A fallback cannot masquerade as live output |

`CulturalAI.extract(text, source)` returns an unapproved Knowledge object. `generate(knowledge)` returns proposed activities and does not approve anything. `MediaProvider.create(prompt)` returns a real asset or null. `InterviewProvider.start()` returns a transcript or an explicit unavailable notice; a production version needs consent, recording state and stop controls. `GuardrailProvider.inspect(text)` cannot replace source review or consent.

## Proposed Convex mapping (not installed)

Tables: sources (ownerId, storageId, rights scope, consent); stories (ownerId, state, revision); claims (storyId, source references); activities (storyId, claim references, revision); reviews (storyId, reviewedRevision, reviewerId, checks, timestamp); assets (sourceId, storageId, rights); progress (userId/sessionId, activityId); auditEvents (actor, action, target, timestamp).

Indexes: stories.by_status, sources.by_owner, claims.by_story, activities.by_story, reviews.by_story_revision, progress.by_user_activity. Atomic approve mutation checks authenticated curator role, source rights/consent and exact revision. Public query returns only approved revisions with valid sources. A source withdrawal transaction invalidates dependent stories/activities and revokes media access. Do not create a public “approve” endpoint accepting a reviewer string.

Version external payloads, validate with Zod at the boundary, reject unresolved citations/unknown IDs, bound sizes and escape text. Test prompt injection as data: uploaded instructions cannot alter review policy or invoke tools.

## Asset interchange

Meters, Y-up, centered room, stable artifact IDs `fiber`, `cloth`, `garment` (full rules: [STYLE.md](STYLE.md) § Scale). Put original/approved assets in public/models with attribution manifest. Original room GLB is explicitly an abstract gallery. Keep clickable object semantics in data, independent of rendering. Splat adoption must preserve the same controls and HTML fallback.
