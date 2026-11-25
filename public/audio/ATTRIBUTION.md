# Sound attribution

Every file in `public/audio/` needs a row here. `credit` in
`src/audio/manifest.ts` names the row.

| credit | Files | Source | Licence |
|---|---|---|---|
| `original-synth` | all files in `ambient/` and `ui/` | Original, synthesised for Living Hokkaido by `scripts/audio/generate.ts` (fixed seed, no samples, no recordings, no third-party material) | MIT (this repository) |

The placeholder sounds are generic nature and interface sounds. They are not
recordings of any place, person, ceremony or music, and they do not represent
Ainu sound or music.

## Adding a third-party file

Use CC0 or another licence that allows use and change without a fee (CC BY
is fine with credit). Before you commit a file, add a row with: a new
`credit` id, the file names, the source page URL, the author and the exact
licence. Do not add recordings of people, cultural performances or music
without documented consent and rights (see AGENTS.md).
