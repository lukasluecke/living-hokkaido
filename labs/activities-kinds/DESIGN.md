# Design: more activity kinds

Part: activities. Lab: `labs/activities-kinds`. Date: 2026-11-25.
Status: design + three working prototypes (story, words, trace).

## Shared rules for every kind

These come from PROJECT.md, AGENTS.md, docs/RESEARCH.md and
docs/INTEGRATIONS.md. Each kind below must follow all of them.

1. **Claims only.** Every visible cultural sentence restates a claim of the
   knowledge entry and shows its citation. Lines that only guide ("Look
   closely…") are typed `frame` and state no fact.
2. **Honesty labels.** `research-preview` shows "Research preview · review
   pending". Illustrative shapes say so. Stand-ins say so.
3. **No invented words, voices or recordings.** No Ainu word is shown,
   spoken or matched until a qualified person checks spelling, region /
   variety, meaning and pronunciation, and a consenting speaker's recording
   exists as an `audio` source with approved rights and granted consent.
   docs/RESEARCH.md explicitly omits the vocabulary exercise until then;
   catalogue spellings are not enough. Ainu is its own language (`ain`),
   never a Japanese dialect; the check rejects `ja-*` tags for Ainu terms.
4. **Voice and avatar.** The owl is a fictional guide. It may *read* cited
   text in reported speech ("The museum describes…"); it never speaks as a
   cultural authority or in the first person for a community. No realistic
   human AI avatar of an Ainu person, no cloned or "authentic-sounding"
   synthetic voice. Device text-to-speech is only a labelled placeholder and
   may never read an Ainu term. A future ElevenLabs narration is acceptable
   only as a consented, labelled English narrator voice (INTEGRATIONS.md).
   The target is a recorded human voice (curator or practitioner) with
   consent on file, added as a source so withdrawal removes it.
5. **Withdrawal path.** Sounds and words point to sources, never to bare
   URLs. Withdrawing a source or entry blocks every activity that uses it.
6. **Fallback.** Everything works by keyboard, without WebGL and without
   sound (captions and transcript always exist).

## Kinds

| Kind | What the visitor does | Data it needs | Can we build it now? |
|---|---|---|---|
| **story** (built) | Listens to a short retold story in chapters. Captions follow the voice word by word. At a pause, picks a small choice: keep listening, "How do we know?" (opens the reveal), or jump to a chapter. | `chapters[].lines[]` with `role: fact` (cites claims) or `frame`; `narrator.voice` as a media reference | Yes, with the existing narration and claims. Voice = captions only or device voice placeholder. |
| **words** (built, gated) | Listens to a word, says it aloud, then matches words to objects in the room. | `terms[]` with text, `lang`, gloss, object, backing claim, recording, five review checks | Mechanic only, with English stand-ins. Real Ainu terms are blocked by the check until reviewed and recorded. |
| **trace** (built) | "Follow the thread": links each sentence to the source that backs it, sees the locator, rights, consent and review state, then turns the card (reveal). | Only the knowledge entry | Yes. It teaches the project's core idea and cannot invent anything. |
| listen (place sounds) | In the listening grove, picks a sound and hears it with a caption about where and when it was recorded. | Consented field recordings as `audio` sources | No. No recordings yet (location teaser says so). Design the slot, show "no recordings yet". |
| practitioner clip | Watches a short clip where a practitioner shows one step, with chapters and captions. Replaces the weave as the "real technique" path. | Consented video + transcript, practitioner credit and their own words | No. Needs a practitioner and consent. Same player as `story` with `narrator.character: "practitioner"` and `voice.kind: "recording"`. |
| compare (variation) | Puts two or three garments side by side and sorts them by what the source says differs (material, region, occasion). | Several objects with claims per object | Not with one entry. Needs more cited objects. |
| seasons | Scrubs the island season and sees which cited activities a source links to each season. | Claims with a season field | No cited seasonal claims yet. Do not infer from the visual seasons. |
| reflect | Writes or picks a short reflection; stays local, goes to the journal. | Prompt only (no fact) | Yes, easy; low novelty. Covered by quiz `care`. |

## Why these three first

* **story** answers "listen to a story retold by an avatar" in a safe form:
  the owl reads cited text, every fact line shows its source, and the voice
  slot is ready for a consented recording.
* **words** answers "learn language snippets": the full listen → repeat →
  match loop works, and the review gate is part of the product, not a
  missing feature. Showing the gate in the demo is honest and shows the
  human authority over publication.
* **trace** is the most "Living Hokkaido" activity: it makes provenance into
  play, and it needs no new content.

## Open questions for the team

1. Who is the reviewer for language content (name / role), and which
   variety do they speak for? Without this, `words` stays a stand-in demo.
2. Is a recorded English narration by a team member (with consent) wanted
   for the demo instead of device voice?
3. Should `trace` award a stamp ("Followed the thread")? The journal pack
   already has `behind-the-card` for the reveal.
