# Data and interface contracts

Executable schemas: `src/domain/contracts.ts`. State rules: `src/domain/review.ts`.

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

Meters, Y-up, centered room, stable artifact IDs `fiber`, `cloth`, `garment`. Put original/approved assets in public/models with attribution manifest. Original room GLB is explicitly an abstract gallery. Keep clickable object semantics in data, independent of rendering. Splat adoption must preserve the same controls and HTML fallback.
