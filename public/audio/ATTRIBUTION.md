# Sound attribution

Every file in `public/audio/` needs a row here. `credit` in
`src/audio/manifest.ts` names the row.

| credit | Files | Source | Licence |
|---|---|---|---|
| `original-synth` | the files in `ui/` except `owl-hoot`, `owl-takeoff` and `pick-up` | Original, synthesised for Living Hokkaido by `scripts/audio/generate.ts` (fixed seed, no samples, no recordings, no third-party material) | MIT (this repository) |
| `elevenlabs-sfx` | all files in `ambient/` (`island-wind`, `island-winter-wind`, `island-birds`, `island-water`, `island-leaves`, `island-insects`, `interior-hearth`, `interior-wind`) and `ui/owl-hoot`, `ui/owl-takeoff`, `ui/pick-up` | AI sound effects made with the ElevenLabs Sound Effects API (`eleven_text_to_sound_v2`) from our own short English text prompts describing generic nature and interface sounds. No recordings, no samples, no voices or music. Loudness matched to the earlier placeholders; ambient loops crossfaded to 22 s seamless loops. | Generated under the ElevenLabs terms of the account that made them (commercial use needs a paid plan) |
| `elevenlabs-ai-voice` | all files in `voice/` | AI voice (text to speech) made with ElevenLabs by `scripts/audio/voices.ts` from our own English owl lines and story captions (and their Japanese machine-translated drafts, in `voice/ja/`), plus an AI imitation of the owl-story refrain from the museum's katakana text. Voice designed from a text prompt (ElevenLabs Voice Design); no cloned voice of any person. Labelled "AI voice" in the UI. | Generated under the ElevenLabs terms of the account that ran the script (commercial use needs a paid plan) |

The placeholder and AI sound effects (`original-synth`, `elevenlabs-sfx`) are generic nature and interface sounds. They are not
recordings of any place, person, ceremony or music, and they do not represent
Ainu sound or music.

The owl's AI voice (`voice/`) is illustrative, for the hackathon demo. It reads
the owl's own English lines (a fictional guide) and story captions, and one
AI imitation of the sakehe refrain (labelled; not a real recitation). In the finished product these
lines go through the curator approval flow before they are shown as fact.

## Adding a third-party file

Use CC0 or another licence that allows use and change without a fee (CC BY
is fine with credit). Before you commit a file, add a row with: a new
`credit` id, the file names, the source page URL, the author and the exact
licence. Do not add recordings of people, cultural performances or music
without documented consent and rights (see AGENTS.md).
