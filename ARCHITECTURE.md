# Architecture

## Implemented

Next.js App Router + strict modular TypeScript + React 19. React Three Fiber/Three.js render the landscape and room. Drei provides camera controls and the local GLB loader. The app has no network-dependent fonts or content API. Client components own the interactive session; the page/layout remain simple server-rendered entry points.

```
src/app                 page shell, metadata, responsive styles; /shell = parts composition
src/contracts           shared experience contracts (Zod + types): ids, units, events, part props
src/content/<story>     content packs as data, validated against the contracts
src/design              visual tokens (palette, seasons, motion, budgets)
src/shell               ExperienceState reducer, journal progress, season clock, part registry
src/parts/<part>        island, detail-scene, artifacts, activities, journal, reveal
src/components/World    current 3D diorama, room, clickable objects (to be replaced by parts)
src/components/Experience navigation, narration, journal, visitor preview
src/components/Contributor source staging and explicit human review
src/data/story          research candidate, objects, source links, activities
src/domain/contracts    Zod schema + provider contracts (provenance layer)
src/domain/review       approval, grounding and withdrawal rules
src/integrations/mock   deterministic AI and no-op external services
labs/<part>             standalone Vite experiments per part (not in npm run check)
tests                   state/grounding/failure/contract tests
```

Parallel work model: [docs/PARTS.md](docs/PARTS.md). Look and scale: [docs/STYLE.md](docs/STYLE.md). Lab hand-back: [docs/HANDBACK.md](docs/HANDBACK.md).

The contributor flow uses `Knowledge`, shared by extraction, generation, validation and visitor display. Only `publishable()` objects enter the contributor visitor panel. Approval records reviewer and timestamp, and requires all human checks. This is an interaction prototype, not a security boundary: browsers can be modified and reviewer names are unauthenticated. Production must repeat every validation server-side.

Seed research content is deliberately separate from approved contribution records and has an explicit preview banner. It must never be silently migrated as approved production content. The geometry and editorial policy exercise are original; museum paraphrases remain research pending editorial approval.

## State and persistence

Journal: localStorage `lh-journal-v1`, validated against known activity IDs, deduplicated on completion. Storage denial/corruption cannot stop exploration. Contributions: in-memory per tab, no upload endpoint or durable storage. Source text is untrusted data and React escapes it. No raw HTML or instructions from source text are executed. No external URL fetching occurs in the contributor flow.

The approved contribution is lifted into the root component so it survives switching visitor/studio tabs; the editor must also remain mounted to preserve withdrawal controls. Source files are limited to 10 MB at intake. Text extraction uses only `.txt`/`.md`; other media needs an explicit transcript/description. No claim is made that file metadata is a completed upload.

## Next backend: Convex is reasonable, but not a prerequisite

Use Convex when shared drafts, durable storage and concurrent reviewers are needed. Proposed tables and access boundaries are in docs/CONTRACTS.md. Integrate Clerk only if it is the fastest verified way to authenticate the team; Convex-compatible auth is otherwise sufficient. Never add a cosmetic login and call review secure.

Server actions/mutations must validate schemas, authorize roles, atomically record review and audit events, check source visibility/consent on every read, and remove withdrawn material from public queries, media URLs and derived caches. Store binaries in private storage with short-lived URLs; only export approved derivatives. Keep original files out of Git. Put provider secrets only on the server.

## Assets and graceful degradation

Original local room GLB → geometric fallback if loading fails → equivalent HTML object controls if WebGL fails. A Gaussian splat is optional and requires an approved scan, rights manifest and tested renderer. No scanner output is currently supplied. Keep assets under a measured mobile performance budget (initial target ≤10 MB, DPR ≤1.5). Avoid blocking visitor navigation on any provider.

ElevenLabs unavailable → optional device speech + full transcript. No speech engine → transcript only. Rodin unavailable → original local shapes. PixVerse unavailable → ordinary scene change. Adaption unavailable → deterministic mock drafts, explicitly unverified. OrcaRouter unavailable → no external processing; local demo remains functional. No fake “live” success.

## Deployment

Ordinary Next.js build/start deploy target. Hosting is intentionally not created during repository bootstrap. Before any public visitor release, perform actual content review, asset rights review, authenticated server review enforcement and deletion/withdrawal checks. Public GitHub source can contain labeled research scaffolding and original mock assets; it must not contain unapproved source files or participant data.
