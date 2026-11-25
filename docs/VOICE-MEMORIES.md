# Curator voice memories

An authorized curator records a memory or context about one object, in their
own language. Visitors play the original on the object card. With the
speaker's consent, visitors can also hear a machine translation in their
language, in a synthetic voice that is modelled on the speaker (a consented
voice clone) or in a stock voice.

Status: **offline mock by default.** The ElevenLabs adapter is written against
the official API reference (read 2026-11-25) but has **not been called live**:
no key exists yet. Nothing in this feature has been verified with real audio.

## Flow

1. `/contribute` → "Curator memories" (`src/components/CuratorMemory.tsx`).
2. Curator: name, role, authorization record, "I am an authorized curator".
   No sign-in in the demo. Production needs a curator role (for example Clerk).
3. Object and language. "Contains Ainu words" or language `ain` marks the
   memory as a draft for the later review pass (prototype: not blocked).
4. Consent, three separate choices: keep and play the recording; translate by
   machine; make a synthetic copy of the voice. The curator reads a consent
   statement aloud and records it. A voice copy stays off until that spoken
   consent exists (stock voice instead). A consent change discards
   translations made under the old one.
5. Record (browser microphone) or upload audio (25 MB maximum).
6. Transcribe (live: ElevenLabs Scribe; mock: type it). The curator checks
   every word.
7. Translate into visitor languages. The browser and the server both run
   `translationGate` (consent, different language; flags Ainu as `reviewNeeded`) before any
   provider call.
8. Preview, exactly as on the object card (`MemoryCard`).
9. "Export for review" downloads pack JSON (a `source` of kind `audio` plus the
   `memory`), and the audio files. A reviewer adds them to the content pack
   (`memories`, audio under `public/memories/`) only with a real consent
   record. "Withdraw" removes everything from the tab.

Visitor side: `src/parts/artifacts/Memories.tsx` on the object card. The
original is always first. "Listen in" picks a translation (default: browser
language). Labels: "Curator memory", review state, "Machine translated
(provider) · not checked" or "checked by …", and "Synthetic voice modelled on
X, with X's consent" / "Stock synthetic voice, not X". Mock text says
"Mock · not a real translation".

## Contract (`src/contracts/memory.ts`, additive)

`ContentPack.memories: VoiceMemory[]` (default `[]`). Rules in the schema and
`validateContentPack`:

- `consent.recording/translation/voiceClone`: pending | granted | declined |
  withdrawn, plus `recordId`, `recordedAt`, `method`.
- Any translation needs `translation: granted`. `voice: "cloned"` needs
  `voiceClone: granted`.
- `mode` is `machine` until a named person checks it (`checkedBy`).
- Ainu (`ain`, or `containsAinu`): prototype gate is open (Lukas,
  2026-11-25). `needsReview` shows a quiet "Draft" label until a reviewer
  approves the memory and checks the translation. See docs/REVIEW.md. Ainu is
  never tagged as a Japanese variety.
- `placeholder: true` = team sample with no real curator or recording. The
  card says "Sample · no real curator yet". It needs no speaker consent but
  can never use a cloned voice.
- `sourceId` must be an `audio` source in the knowledge entry; a real audio
  file needs approved rights and a non-placeholder source.
- Withdrawn recording consent or a withdrawn review hides the memory
  (`memoriesForArtifact`).

## Provider (`src/domain/voice-memory.ts`, `src/integrations/voice-memory/`)

`VoiceMemoryProvider`: `transcribe`, `startTranslation`, `checkTranslation`.
Server routes: `GET /api/voice-memory` (active provider),
`POST /api/voice-memory/transcribe`, `POST /api/voice-memory/translate`,
`GET /api/voice-memory/translate/[jobId]?lang=..&clone=0|1`.

Env (server only): `ELEVENLABS_API_KEY` (no key = mock),
`VOICE_MEMORY_PROVIDER=mock` to force the mock, optional
`ELEVENLABS_STT_MODEL` (default `scribe_v2`).

ElevenLabs endpoints used (auth header `xi-api-key`):

| Step | Endpoint | Doc |
|---|---|---|
| Transcribe | `POST /v1/speech-to-text` (`model_id`, `file`, `language_code`) → `text`, `language_code` | [speech-to-text/convert](https://elevenlabs.io/docs/api-reference/speech-to-text/convert) |
| Translate + voice | `POST /v1/dubbing` (`file`, `source_lang`, `target_lang`, `num_speakers=1`, `watermark=true`, `disable_voice_cloning`) → `dubbing_id` | [legacy/dubbing/create](https://elevenlabs.io/docs/api-reference/legacy/dubbing/create) |
| Poll | `GET /v1/dubbing/{id}` → `status` (`dubbed` = done), `error` | [legacy/dubbing/get](https://elevenlabs.io/docs/api-reference/legacy/dubbing/get) |
| Result | `GET /v1/dubbing/{id}/audio/{lang}`, `GET /v1/dubbing/{id}/transcript/{lang}?format_type=srt` | [legacy/dubbing/audio/get](https://elevenlabs.io/docs/api-reference/legacy/dubbing/audio/get) |

Dubbing clones the speaker automatically; `disable_voice_cloning=true` uses a
similar Voice Library voice instead (needs the `add_voice_from_voice_library`
permission on the key). The docs mark `/v1/dubbing` as legacy; the newer
project API (`/v1/dubbing/project`) is the follow-up once the live path works.
The get-project docs list a `voices_not_permitted` warning when a voice may not
be cloned.

Timeouts: 60 s transcribe, 30 s create/download, 15 s status; the browser
stops polling after 5 minutes. Responses are zod-checked; any failure returns
`mode: "unavailable"` with a notice, never fake output.

## Cost (third-party summaries, check elevenlabs.io/pricing)

From [Cartesia, 2026-10-02](https://www.cartesia.ai/learn/elevenlabs-pricing)
and [Flexprice, 2026-08](https://flexprice.io/blog/elevenlabs-pricing-breakdown):
Starter $6/month (30k credits, instant voice cloning, commercial licence),
Creator $22/month (121k credits). Speech-to-text about $0.22 per audio hour.
Dubbing 2,000 to 10,000 credits per minute (Cartesia) or $0.33 to $2.20 per
minute (Flexprice); the sources disagree. For a demo with a few one-minute
memories in two or three languages, Starter or Creator is enough.

## Limits and open items

- Not verified live. First live run: one short, non-sensitive test recording.
- Nothing is stored online. Export JSON + files go into the pack by hand.
- Dubbed audio comes back as a data URL; long recordings make large responses.
- Translation text comes from the dubbing transcript (SRT), not a separate
  translation model.
- Production needs: curator auth, private storage for audio and consent
  records, a withdrawal job that deletes provider-side voices and dubs, and a
  review step before anything reaches `memories`.
