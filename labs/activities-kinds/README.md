# Activity kinds lab

Prototypes of three proposed activity kinds for the activities part:
**story** (owl-read chapters, synced captions, pause choices), **words**
(listen, repeat, match; English stand-ins behind a review gate) and
**trace** (follow each sentence to its source). Design: DESIGN.md.
Integrator notes: HANDBACK.md. Schemas: `src/contracts/activity.ts`; data:
`src/content/bark-to-cloth/activity-kinds.ts`.

```sh
npm ci            # once, at the repo root (zod for src/)
cd labs/activities-kinds && npm ci
npm run dev       # http://localhost:5201/?a=story | words | trace  (?still = no motion)
npm run build
node scripts/shots.mjs shots   # with dev running
```
