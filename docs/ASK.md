# Ask the owl

The visitor asks a free-text question. The owl answers **only from cited
claims in the content pack**, shows the claims with "How do we know?" (the
reveal), and can take the visitor to the place or object (`location.select`,
then `artifact.focus`) or open the timeline. When no claim fits, the owl says
"I don't know yet".

## How it works

1. **Retrieve** (`src/domain/ask.ts`, `retrieve`): keyword match with simple
   idf over every visible claim. Labels of the artifacts, hotspots and eras
   that cite a claim count as weaker keywords. Withdrawn knowledge is skipped.
2. **Answer**:
   - **Live** (server with a key): the route sends the question and the top
     6 claims to the model, with short refs (`c1`, `a1`) so the model cannot
     invent ids. The model returns JSON. `parseLiveReply` keeps only offered
     refs; a "known" reply with no valid citation becomes "I don't know yet".
     No fitting claim = no model call.
   - **Scripted** (no key, no server, timeout, or a reply that fails the
     checks): the best 1–2 claims are shown as they are. Labelled "Scripted
     answer … no AI".
3. **Check** (`checkAnswer`): every claim and navigation id must exist in the
   pack. Runs on the server and again in the browser.

The cited claim text is always shown under the answer, so the visitor can
compare the AI summary with the source claim.

## Run it live on your laptop

Put the key in `.env.local` (ignored by Git; never commit it):

```sh
LLM_PROVIDER=zai
LLM_API_KEY=<your Z.ai key>
# Optional:
# LLM_MODEL=glm-5.3-flash
# LLM_BASE_URL=https://api.z.ai/api/paas/v4
# LLM_TIMEOUT_MS=15000
```

Then `npm run dev` and open http://localhost:3000. Check the mode with
`curl localhost:3000/api/ask` (it never returns the key). Each answer shows
"AI summary (glm-5.3-flash)" in live mode.

**CarbonForge (Hack Hokkaido access, active until Fri 27 Nov 23:59 JST).**
Use the key from the organiser's "all your perks in one place" email:

```sh
LLM_PROVIDER=carbonforge
LLM_API_KEY=<CarbonForge key from the perks email>
# preset: LLM_BASE_URL=https://endpoint.carbonforge.ai/v1, LLM_MODEL=carbonforge-flash
```

After 27 Nov, switch back to `zai` or another provider; no code change.

Other providers: `LLM_PROVIDER=openai-compatible` with `LLM_BASE_URL` and
`LLM_MODEL` works for any OpenAI-compatible chat-completions API. A Claude
adapter can be added in `src/integrations/llm/` with the same `ChatModel`
shape.

## Static demo link

The published demo has no server, so `POST /api/ask` fails and the browser
uses the scripted answer. The key is never in the client bundle.

## Z.ai notes (docs read 2026-11-25)

- Endpoint `POST https://api.z.ai/api/paas/v4/chat/completions`,
  `Authorization: Bearer <key>`, OpenAI-compatible body and reply.
  https://docs.z.ai/api-reference/llm/chat-completion
- `glm-5.3-flash` cannot turn thinking off. We send `reasoning_effort: "low"`
  to keep it fast. It has no `response_format`, so the prompt asks for JSON
  and the server parses and validates it.

## Limits

- Keyword retrieval only. Fine for one small pack.
- The AI summary can still word things badly. The cited claims under it are
  the source of truth, and the whole pack is a research preview.
- No chat history; each question stands alone.

## Voice questions (2026-11-26)

A mic button next to the text box records a spoken question (MediaRecorder,
max 30 s) and sends it to `POST /api/ask/listen`, which calls ElevenLabs
speech to text (Scribe) with the server secret `ELEVENLABS_API_KEY`. The
transcript is asked like a typed question. `GET /api/ask/listen` says whether
the key is set; without it, or without recording support, the mic is hidden.
The recording is not stored. Set the key: `npx wrangler secret put
ELEVENLABS_API_KEY` (the key needs the "Speech to Text" permission).
