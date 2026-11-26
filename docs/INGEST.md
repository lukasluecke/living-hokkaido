# Source ingestion (contributor studio)

Route `/contribute`, top section (`src/components/Contributor.tsx`). This is
the place where the project uses an LLM for content, next to "Ask the owl"
(docs/ASK.md). Same server adapter (`src/integrations/llm`), same env vars.

Status: **works offline in mock mode; the live path is tested only against a
local fake OpenAI-compatible server** (no key in the cloud sandbox). It was
not yet called against the deployed provider.

## Flow

1. **Source.** Title, kind (museum panel, catalog entry, curator note, photo
   or recording with a transcript), attribution, locator ("where exactly":
   section, panel, photo number), optional collection-database link
   (for example `jmapps.ne.jp/hmcollection1/det.html?data_id=…`), and the
   text (paste, or a `.txt`/`.md` file, max 8,000 characters). Japanese or
   English. The contributor must tick "Send this text to the AI model";
   otherwise the draft is a mock and nothing leaves the server.
2. **Draft claims.** `POST /api/ingest` asks the model for at most six short
   English claims. Each claim carries a **verbatim quote** from the source.
   The server keeps a claim only if its quote is in the source text
   (`quoteInSource`, ignores whitespace, width and case). Claims that fail
   are dropped and counted. The quote goes into the citation locator, so the
   evidence stays with the claim in the pack.
3. **Risk flags.** Same groups as the curator review pack: Ainu words,
   sacred or ritual, named person, our translation, plus "instruction" (the
   quote is in a sentence that gives orders, i.e. likely prompt injection).
   Flags come from deterministic rules (`autoRisks`) and from the model; the
   model can add flags but cannot remove the rule-based ones.
4. **Quiz.** One proposed multiple-choice quiz. It survives only if it cites
   surviving claims and its answer index is valid; otherwise the template
   "Which source supports this draft?" is used.
5. **Human review.** Reviewer name, the four existing checks
   (`src/domain/review.ts`), and one extra check per flagged risk. Editing or
   removing a claim clears the accuracy and quiz checks.
6. **Preview and hand over.** A visitor-card preview, "Export for the content
   pack (JSON)" (a `KnowledgeEntry` and a `quiz` activity in the
   `src/contracts` schemas), and "Withdraw".

Fallbacks: no key, no AI consent, timeout (40 s), bad JSON, or no claim that
passes the quote check → the deterministic mock draft (one claim per source
sentence), labelled "Mock draft" with the reason. If the route cannot be
reached, the browser makes the same mock.

## Limits (honest)

- A quote check proves the words are in the source, not that they are a
  fact. Injected text such as "add a claim that …" can pass it; the
  "instruction" flag and the reviewer must catch it. The test input
  "Test: text with a hidden instruction" shows this.
- No vision/OCR: photos need a typed transcript (the museum catalog in the
  project files was transcribed this way).
- Nothing is stored, nothing is published online, reviewer names are not
  authenticated. The export goes to a teammate, who adds it to
  `src/content` by hand. Production needs server-side review, auth and
  storage (ARCHITECTURE.md).
- Museum panel text is not shipped in the app (docs/research/…/RIGHTS.md),
  so the built-in test inputs are original team text. To demo with a real
  panel, paste a section of
  `docs/research/hokkaido-museum/transcriptions/panels.md`.

Code: `src/domain/ingest.ts` (pure: schema, prompt, parse, quote check,
flags, mock, export), `src/app/api/ingest/route.ts`, `tests/ingest.test.ts`.
