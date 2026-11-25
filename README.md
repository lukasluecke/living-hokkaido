# Omusha 1808: talk to the diorama

A phone web app that opens a Gaussian splat of the 1808 Omusha diorama in the
Hokkaido Museum (北海道博物館) and lets you tap figures to meet them. The scene is an
**Omusha** (オムシャ) held by Aizu clan officials at Kushun Kotan, Sakhalin, in 1808:
a greeting ritual turned political ceremony, where Sakhalin Ainu received rice,
sake and tobacco while Wajin officials read out edicts through an interpreter.

Each figure is a synthetic persona grounded in historical sources. Built at
Hack Hokkaido Build Week, November 2026.

> The voices are synthetic interpretations, not historical records. See [NOTICE.md](NOTICE.md).

## Status

| Part | State |
|---|---|
| Splat viewer with tappable figures (Spark) | Working |
| Hotspot placement tool (`?edit=1`) | Working |
| Close-up 3D model per figure, with AR on phones | Working (7 elder figures) |
| Character sheets (12 figures) | Drafts, not yet sourced |
| Retrieval corpus | Not started |
| Voice (ElevenLabs) and dialogue | Not started |
| Fine-tuned behaviour model (Adaption Labs) | Spec written ([training/SPEC.md](training/SPEC.md)) |

## Run it

```powershell
.\serve.ps1
```

Open `http://localhost:8081/src/`. The museum capture is not in this repository
(see [NOTICE.md](NOTICE.md)); load your own with **Open**, or with
`?src=../sample/sample.sog` once you've made one ([sample/README.md](sample/README.md)).

### Opening a figure directly

`?figure=<character id>` opens that figure's card on load, for QR codes next to
the display or demo links, e.g. `src/?figure=elder-star-flowers`. A figure whose
sheet has a `model` shows its 3D model in the card, with a "View in your room"
AR button on phones (AR needs the site served over HTTPS).

### Placing figures

Open `http://localhost:8081/src/?edit=1`, pick a figure, tap where it stands,
then **Copy JSON** and paste it into `src/hotspots.json`.

## Layout

```
src/                 viewer, hotspots
characters/schema/   character-sheet format (JSON Schema)
characters/1808/     one sheet per figure
sample/              your own capture, so the repo runs without museum assets
training/            fine-tune spec, datasets, curation log, eval
assets/              NOT committed: museum splat
```

## Figures from photos (Gemini + Hyper3D)

Figures you can only photograph (behind glass, too small to scan) become 3D
models in three steps. Everything stays in `assets/figures/`, which is not
committed.

1. **Photos in.** One folder per figure with one or more photos, plus an
   optional `notes.txt` naming what must not change (hair colour, garment
   pattern). Similar figures differ mainly in these details, so the notes keep
   each one distinct. Put a front/back pair you liked in `_style/` to keep
   framing consistent across figures.
2. **Clean views.** `npm run turnarounds` sends each new figure to Gemini
   (Nano Banana 2.1) and writes `front.png`, `back.png` and `turnaround.json`
   (provenance). Needs `GEMINI_API_KEY`.
3. **3D model.** Upload `front.png` and `back.png` together as reference images
   to Hyper3D Rodin (Gen-2.5 Medium, about 50,000 triangles, GLB). Then make the
   web version:
   ```powershell
   npm run web-model -- assets/figures/interpreter/model.glb
   # or, if Hyper3D only offers the PBR version as FBX:
   npm run web-model -- --rebuild-pbr base_basic_shaded.glb <unzipped texture folder>
   ```

If Rodin textures a back weakly (it happened on 2 of 7 figures; one rerun fixed
one), paint the back view onto the model in Blender (tested with 4.4), then make
the web version again:
```powershell
blender -b --factory-startup --python tools/paint-back.py -- <abs path>/model-pbr.glb <abs path>/back.png <abs path>/painted-pbr.glb
```
It projects the back view onto backward-facing surfaces, blends it out towards
the sides, and leaves the front untouched. Use absolute paths.

Generated models are labeled "AI reconstruction from photos; unseen sides
inferred". Garment patterns (especially Ainu robes) should be checked by a
curator before a model is shown.

## Capture notes

Moving camera, static subject; 3–4 height rings plus close passes; 70–80% overlap;
locked exposure, white balance and focus; no flash or tripod. Angle around museum
glass reflections and expect to crop. Compress for the web with
[splat-transform](https://github.com/playcanvas/splat-transform) to `.sog`.

## License

Code, prompts, schemas and character sheets: [MIT](LICENSE). Museum material is excluded; see [NOTICE.md](NOTICE.md).
