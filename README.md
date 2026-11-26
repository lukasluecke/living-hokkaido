# Living Hokkaido

**Live demo: https://living-hokkaido.luecke.workers.dev**

An owl-guided island of eight places where anyone can learn Hokkaido's history and culture by exploring it: picking up objects, playing games, watching short films and asking the owl questions. Every fact on the island is a short claim linked to its source, and visitors can open "How do we know?" to see exactly where it came from. Built for Hack Hokkaido 2026.

## What is in it

- **🦉 Wander.** Fly with the owl between eight places, from the Lake house to Coal mountain. The diorama and the owl are the main navigation; HTML controls give the same access for keyboard users and devices without WebGL.
- **🔍 Look.** 16 objects with hotspots, a Gaussian-splat capture of the Hokkaido Museum's Omusha diorama, and "How do we know?" (source → claim → review status) on every card.
- **🎮 Play.** 51 activities: quizzes, ordering tasks, Ainu words, a loom, a tonkori, a children's board game, "Build the scene", and the teammate games *Out of Place* and *Don't Fall on the Slope*. Every activity is built only from cited claims.
- **🎬 Watch & listen.** The owl's folktale film, 5-second era and place clips, a house that changes from pit dwellings to today, and the owl's voice in English and Japanese.
- **💬 Ask the owl.** Type or speak a question. The owl answers only from cited claims and says "I don't know yet" when nothing fits.
- **📖 Heritage Journal.** 13 stamps, saved on the device, with hints where to find the missing ones.
- **✍️ Curator studio** (`/contribute`). Paste a source, let the AI draft claims with word-for-word quotes, review the risk flags, then export the result to the content pack or withdraw it.
- **🌏 English and Japanese** (日本語). The Japanese text is a machine-translated draft for now.

## How it works

- **Stack.** Next.js 16, React 19, strict TypeScript, React Three Fiber / Three.js, Phaser (teammate games, with Rapier physics), Spark (Gaussian splats), Zod. Deployed to Cloudflare Workers with OpenNext. The custom [`worker.ts`](worker.ts) streams large media (the splat, the films) straight from the R2 bucket `living-hokkaido-museum` with range requests, before OpenNext.
- **Sources → claims → activities.** All content is data in one content pack ([`src/content/bark-to-cloth`](src/content/bark-to-cloth)), validated against the contracts in [`src/contracts`](src/contracts): 59 sources, 175 claims (115 cite Hokkaido Museum panels), 8 places, 16 objects, 51 activities, 13 stamps. Each claim cites a source with an exact locator. A pack is rejected if an activity, hotspot, timeline era or owl line points to a claim that does not exist.
- **Museum research.** Claude catalogued 151 photos from our visit to the Hokkaido Museum and transcribed the panels ([`docs/research/hokkaido-museum`](docs/research/hokkaido-museum)). The app shows short cited paraphrases, not the panel text.
- **Ask the owl** ([docs/ASK.md](docs/ASK.md)). Keyword retrieval over the claims, then CarbonForge (`carbonforge-flash`, any OpenAI-compatible API works) summarises only the offered claims. Citations are checked on the server and in the browser; without a key, or on a timeout, the owl shows the cited claims directly. ElevenLabs Scribe turns speech into text. Optional Linkup "read more" links come only from heritage sites and never become citations.
- **Ingestion** ([docs/INGEST.md](docs/INGEST.md)). Consent tick before text leaves the browser, model drafts at most six claims, the server drops every claim whose quote is not in the source, fixed rules flag Ainu words, sacred context, named people, translations and hidden instructions, and a human review checklist comes before export. OrcaRouter (guard) and Linkup (source suggestions) are optional and switch on with a key.
- **Media.** 3D models by Hyper3D Rodin Gen-2.5 from text prompts ([public/models/ATTRIBUTION.md](public/models/ATTRIBUTION.md)); clips by PixVerse V6; owl voice (ElevenLabs Voice Design + text-to-speech) and ambient sounds (ElevenLabs Sound Effects) in [public/audio](public/audio/ATTRIBUTION.md). The Omusha splat is a compact `.sog`; phones and tablets load a lighter file.
- **Performance.** A quality governor measures the frame rate and steps down resolution, effects and shadows on slow devices (`?quality=full|high|mid|low` fixes a tier).
- **Teammate games.** Vendored as git subtrees in [`vendor/`](vendor/README.md), with a thin adapter that hands them their cited claims.
- **Parts and agents.** The visitor experience is split into parts (island, detail scene, artifacts, activities, journal, reveal) with shared contracts, so teammates and Claude Code agents could build them in parallel. Start with [AGENTS.md](AGENTS.md), [docs/PARTS.md](docs/PARTS.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

## Run locally

Node 20.9+ (Node 22 LTS recommended), npm.

```sh
npm ci
npm run dev
# http://localhost:3000
```

No accounts, API keys or paid services are required. Without keys every provider falls back: the owl gives scripted answers from the claims, ingestion makes a mock draft, the mic button is hidden. The Omusha splat and the films live in R2, not in Git; without them the Omusha view shows its spot list only. Optional keys are listed in [`.env.example`](.env.example) (server only, never `NEXT_PUBLIC_`).

Checks: `npm run typecheck`, `npm run lint` (Biome + Oxlint), `npm test`, `npm run build`, or all of them with `npm run check`.

## Deploy (Cloudflare Workers)

```sh
npm run cf:preview   # build and run the Worker locally
npm run cf:deploy    # build and deploy
```

The R2 bucket `living-hokkaido-museum` must exist ([wrangler.jsonc](wrangler.jsonc)). Secrets are set with `npx wrangler secret put <NAME>`: `LLM_API_KEY`, and optionally `ELEVENLABS_API_KEY`, `LINKUP_API_KEY`, `ORCAROUTER_API_KEY`, `MUSEUM_ASSET_PASSWORD`.

## Content provenance and limitations

This is a hackathon demo. Some content is AI-generated, AI-assisted, illustrative or not yet reviewed by a curator (3D models, clips, voices, sounds, Japanese translations, draft claims). Every such item is listed in [docs/PROVENANCE.md](docs/PROVENANCE.md). The in-app labels for them are behind one switch, `SHOW_DISCLAIMERS` (build with `NEXT_PUBLIC_SHOW_DISCLAIMERS=1` to show them). In the finished product, every item goes through the curator approval flow ([docs/REVIEW.md](docs/REVIEW.md)) before it is shown as fact, and Ainu content also needs Ainu advisers. Ainu is a distinct language, not a Japanese dialect.

The curator studio stores nothing on a server, and reviewer names are not authenticated. No trained model or measured improvement is claimed.

## License

Original code and original placeholder geometry: MIT, see LICENSE. External cultural sources retain their own rights; a link is not permission to redistribute them. The Hokkaido Museum panel transcriptions in `docs/research/hokkaido-museum/transcriptions/` belong to the museum and are not MIT (see its RIGHTS.md). AI-generated assets follow the terms listed in their ATTRIBUTION.md files. Uploaded material is not automatically MIT-licensed. The original event PDFs and participant roster are intentionally excluded from this repository.
