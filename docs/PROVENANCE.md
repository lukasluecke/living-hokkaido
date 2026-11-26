# Content provenance and limitations

Living Hokkaido is a hackathon demo. For the demo we show some content that
is AI-generated, AI-assisted, illustrative or not yet reviewed. Decision
(Lukas, 2026-11-26): the visitor product does not show a label on each of
these items. This document lists all of them in one place for the judges.

**In the finished product, every item below goes through the full curator
approval flow (source, claim, human review; docs/REVIEW.md, docs/INGEST.md)
before a visitor sees it as fact. Ainu content also needs Ainu advisers.**

## How the labels work

- All in-app honesty labels are behind one switch: `SHOW_DISCLAIMERS` in
  `src/design/disclaimers.ts`. It is off by default.
- To show the labels again, build with `NEXT_PUBLIC_SHOW_DISCLAIMERS=1`
  (for example `NEXT_PUBLIC_SHOW_DISCLAIMERS=1 npm run cf:deploy`). No code
  change is necessary. The "Model labels" switch on the object card also
  comes back.
- One short global note stays visible at all times, at the bottom of the
  HUD menu (☰): "Hackathon demo. Some models, films, voices and texts are
  AI-assisted or illustrative, and a curator has not checked all of them
  yet." (`DEMO_NOTE`).
- Not hidden, because they are content and not disclaimers: sources and
  evidence locators, "How do we know?", the reveal card (source → claim →
  human review, which also says "Draft" for unreviewed claims), the owl's
  answer mode ("AI summary" or "Scripted answer"), mode names such as
  "Device voice", "AI voice" or "Sketch", the cited Ainu refrain credit, and
  the over-time notes (claims `illustrative-time`, `not-frozen`).
- A new label must check `SHOW_DISCLAIMERS` and get a row in the table below.

## Hidden labels and what they cover

| Item (where in the app) | Label that is now hidden | What it covers | Source / tool |
|---|---|---|---|
| 3D objects on the object cards (herring, saw, shovel, set-bow, deer, tonkori, canoe, garment, lacquer vessel) | "AI-generated model" chip and the "About this model" note (claims `area-generated`, `object-generated`, `garment-generated`, `set-bow-generated`); the "Model labels" switch | Models made by Hyper3D Rodin Gen-2.5 from short text prompts. No museum photos or scans were used. They are not museum objects, scans or reconstructions. No curator has checked the Ainu objects (tonkori, canoe, lacquer vessel, set-bow, garment); the garment has no pattern on purpose. | public/models/ATTRIBUTION.md (prompts, generation ids) |
| Code-sketch objects and dioramas (all other objects, over-time diorama) | "Illustrative model", "Reconstruction", "3D scan" chips and the sketch notes | Simple original geometry made by the team. Not a scan or a reconstruction. | public/models/ATTRIBUTION.md |
| Clips: "Watch" in the four places and in the over-time eras | "AI-imagined clip (PixVerse) for this demo, not historical footage. In the finished product a curator would check and approve it." | 5-second clips made by PixVerse V6 from text prompts. The prompts can go beyond the cited claims. | src/content/bark-to-cloth/clips.ts; public/models/ATTRIBUTION.md, "Generated clips" |
| Story film "The owl tells a folktale" (Listening grove, story hall) | "A folklore retelling for this demo, not a museum source. In the finished product, a curator and Ainu advisers would check and approve it first." (The credit "Made by our team (Yuling) with AI tools" stays visible.) | A team-made film made with AI tools. It is a retelling, not a museum source, and Ainu advisers have not checked it. | src/content/bark-to-cloth/films.ts |
| Owl guide voice and the owl stories | "AI voice · ElevenLabs" under the owl bubble; the narrator credit "AI voice (ElevenLabs) · illustrative" | Text-to-speech by ElevenLabs (model eleven_multilingual_v2) with a voice we designed from a text prompt ("an older woman in her seventies, a gentle storyteller…", see scripts/audio/voices.ts). Not a real person's voice and not cloned. English lines with Ainu loan words (kamuy, sakehe) may be pronounced imperfectly. | public/audio/ATTRIBUTION.md |
| Ainu refrain (sakehe) in "The owl and its refrain" | "AI imitation, not a real recitation" next to the refrain | The AI voice reads the museum's katakana transcription of the sakehe told by Suteno Orita (Hokkaido Museum, Q020). It is a machine imitation: pronunciation, rhythm and melody are not those of the real telling, and it is not sung. Lukas chose to voice it for the demo (2026-11-26); the finished product would replace it with an approved recording or leave it silent. | public/audio/ATTRIBUTION.md, src/content/bark-to-cloth/museum-activities.ts |
| Story activities | Narrator credit "Read by the owl guide · a fictional character" | The owl is a fictional guide. The device voice is a placeholder. | src/content/bark-to-cloth/activity-kinds.ts, museum-activities.ts |
| Claims with `presentation: "research-preview"` (object summaries, activities, owl answers, journal) | "Draft" chip | AI-assisted research text with sources and locators, but no human review yet. | docs/REVIEW.md |
| Ainu words (Words activity, Map activity) | "Draft" chip; "Draft · spelling not yet reviewed" | The spelling, region and meaning of the cited Ainu words are not reviewed yet. No recording of a consenting speaker yet. | docs/REVIEW.md, "Language (Ainu words)" |
| Words activity, end | "Illustrative shapes, not museum objects." | The object icons are drawings, not museum objects. | — |
| Activities "Build the scene" (place) | "Illustrative sketch"; "Device voice · placeholder. Figures and scenes are illustrative sketches after museum dioramas." | Team drawings after museum dioramas, not copies of them. | docs/REVIEW.md |
| Weave activity | "Playful illustration · not a real technique" | The loom game is an observation game, not a lesson in the real weaving technique. | src/parts/activities/AGENTS.md |
| Ukouk (canon) and tonkori (pluck) activities | "Synthetic tones …" notes | Synthetic tones only. They show the structure. They are not the song or the real tuning, and no recording is used. | src/parts/activities/play/synth.ts |
| Games "Out of Place" and "Don't Fall on the Slope" | "Illustrative scene", "Illustrative street" | The game scenes are illustrations by the team. | vendor/README.md |
| "Look closer" (Omusha diorama capture) | "Draft" | The spot notes are not reviewed yet. | museum catalog note |
| Curator memories (object card) | "Sample · no real curator yet", "Review pending", translation mode ("Machine translated … · not checked"), voice ("Stock synthetic voice …"), "Draft" | The memory in the demo is a sample by the team, not a real curator. Translations are machine translations that nobody has checked. | src/content/bark-to-cloth/memories.ts; docs/VOICE-MEMORIES.md |
| Japanese interface (日本語) | "Draft translation" chip next to the title | All Japanese text is machine translation and a person has not reviewed it yet. | src/i18n/AGENTS.md |

## Other limitations

- The owl answers only from the claims in the content pack, with keyword
  search (no embeddings). Without a server it uses scripted answers.
- No trained model and no measured improvement are claimed.
- Reviewer names are never invented. No claim in the demo shows a fake
  reviewer.
