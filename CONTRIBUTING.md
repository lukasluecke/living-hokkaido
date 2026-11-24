# Contributing

Use Node 20.9+ and `npm ci`. Start with `npm run dev`. Branch by bounded feature; preserve teammates’ changes. Discuss domain contract changes with Lukas before landing them. See docs/TEAM.md for ownership.

Run `npm run format`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. Tests should protect meaningful review, grounding, persistence or failure behavior, not mirror CSS. Describe what changed, why, how it was verified and remaining limitations in your PR. Add a screenshot for visible UX changes and a fallback test for provider changes.

Content contributions need source title/owner, link or private reference, exact page/section/timecode, evidence-to-claim mapping, rights holder, allowed uses and audience, consent status, withdrawal contact/process, reviewer and review date. These records are not permission themselves. Do not commit raw personal interviews, participant rosters, event PDFs or unapproved images/models/audio. Synthetic material must be labeled and cannot impersonate a practitioner.

For external integrations, keep keys out of `NEXT_PUBLIC_*` and Git. Document costs/limits, consent boundary, provider data retention, timeout/error behavior and reproducible fallback. Public code must run without keys. A mock integration is not a prize-eligibility claim.

MIT covers original contributions to code and explicitly original assets. Third-party materials keep their own licenses; record them separately. Do not infer cultural reuse permission from a website being public.
