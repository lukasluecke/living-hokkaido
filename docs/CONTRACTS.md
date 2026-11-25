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
| `parts.ts` | props per part (`IslandPartProps` …) | a part takes exactly these props |
| `content.ts` | `ContentPack`, `validateContentPack`, `resolveClaim`, `sanitizeJournal` | every cross-reference checked; `CONTRACT_VERSION` |

## Changing contracts

1. **Additive** (new optional field, new event, new activity kind, new unlock rule): allowed in any PR. Add a default so old content still parses, add a test in `tests/contracts.test.ts`, update the table above.
2. **Breaking** (rename/remove a field or event, change a payload or unit): ask Lukas first, bump `CONTRACT_VERSION`, migrate `src/content/*` and every part in the same PR, and add a line to the change log below.
3. Labs never edit `src/contracts` on their own branch without saying so in `HANDBACK.md`. Put the proposal in `labs/<lab>/contract-proposal.ts`.

### Change log

| Version | Change |
|---|---|
| 1 (additive) | `ContentPack.memories` (default `[]`) and `memory.ts`: curator voice memories with consent and labelled translations. |
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
