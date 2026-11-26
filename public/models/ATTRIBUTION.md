# Original placeholder assets

room.glb: original abstract gallery geometry, created for Living Hokkaido, MIT. Not a scan, historic building, museum interior or cultural reconstruction. Artifact primitives and owl are also original illustrative geometry. No third-party assets bundled.

# Generated models (Hyper3D Rodin)

`<artifact-id>.glb` files other than room.glb were generated on 2026-11-26 with
Hyper3D Rodin Gen-2.5 (Medium, Raw mesh, about 30k faces, PBR) from short text
prompts only. No museum photos or scans were used as input. They are not museum
objects, scans or reconstructions; the Ainu objects (tonkori, canoe,
lacquer-vessel, set-bow, garment) have not been checked by a curator. The card
says so ("About this model", claims area-generated / object-generated /
garment-generated) and visitors can switch back to the code sketch.

Web version: normal, roughness, metalness, occlusion and emissive maps removed,
scaled to the sketch's size (metres, origin on the base), then
`gltf-transform optimize --compress meshopt --texture-compress webp
--texture-size 512 --simplify true --simplify-ratio 0.75`.

| File | Hyper3D generation id | Prompt (style suffix: "Stylised hand-made diorama prop, simple clean shapes, soft matte painted colours, no text, no logos, no base plate, single object, centred") |
|---|---|---|
| herring.glb | 2e94e3d6-0a4f-4aed-a4de-06c4e77194d4 | A shallow round woven straw basket full of silver herring fish. |
| saw.glb | be2700d9-b0ae-496d-975d-affc54fabde8 | A two-person crosscut timber saw with a long steel blade and a wooden handle at each end, lying on a short cut log. |
| shovel.glb | 1f899bf5-bb62-4e2b-8e8c-f8ceb38f0f6f | A plain old iron coal shovel with a wooden shaft, a few lumps of black coal in the blade, lying flat. |
| deer.glb | e50c932f-0958-4da6-9a3b-a9c716cf2d04 | One single sika deer stag standing on four legs, one head only, small antlers, brown summer coat with pale spots. |
| tonkori.glb | 3f3427f3-9d41-463c-90aa-9259e034a6c7 | A long thin flat wooden plucked string instrument lying flat: straight narrow plank-shaped body, no round bowl, no frets, five strings, plain wood, no carvings. |
| garment.glb | fde27cfa-9f1e-4810-bac1-9d8340138822 | A plain long-sleeved robe made of undecorated light brown woven plant-fibre cloth, hung on a simple wooden pole, no embroidery, no patterns, no motifs. |
| canoe.glb | b4a03e89-168c-4897-8dd2-7430d99adfc8 | A narrow dugout canoe made from one single hollowed-out tree log, no seats, no ribs, no planks, a single wooden pole inside. |
| set-bow.glb | 8f2ad0ab-5afd-43ce-af99-a111f9ee4cfa | A simple plain wooden hunting bow set low on two short wooden stakes beside a path, with a thin cord stretched across the path, no decoration. |
| lacquer-vessel.glb | 5efd8b26-48c2-4bc3-a9cf-ffedf4d935b2 | A round lidded lacquered wooden vessel, glossy black body with plain red bands, no motifs. |

Rejected first tries (not shipped): deer 2d83d342… (two heads), tonkori
1d31bd50… (lute-like bowl body), canoe 54d05ac8… (plank rowboat with seats).

# Generated clips (PixVerse)

Stored in the R2 bucket `living-hokkaido-museum` (not in Git) and streamed by
`/api/media/<key>` only after the visitor taps "Watch". Made on 2026-11-26 with
PixVerse V6, text-to-video, 5 s, 720p, from text prompts only (no museum photos,
no renders as input). No people on purpose. They are AI-imagined, not historical
footage; each card says so and says that a finished product would send the clip
through curator approval. Web version: `ffmpeg` H.264, 960 px wide, no audio
track for eras, ambient audio kept for places.

Every prompt ends with: "Cinematic film look, natural colours, soft light, slow
steady camera. No people, no animals unless named, no text, no logos." Era
prompts start with: "Slow aerial drift towards a river mouth where a river
meets a cold sea, forested hills behind, Hokkaido."

| Key | Shown for | PixVerse video id | Prompt |
|---|---|---|---|
| era-1-pit.mp4 | era "pit-dwellings" | 437314918395453 | A small settlement of square pit dwellings near the river mouth, thatched roofs that slope down to the ground, thin smoke from the roofs, small fields of millet and barley. |
| era-4-meiji.mp4 | era "today" (asked for Meiji, came out present-day) | 437313765093302 | The forest is cleared into straight farm fields, a new dirt road runs along the river, wooden houses with board walls and glass windows. |
| place-coast.mp4 | scene "herring-coast" | 437313766289650 | Wide shot of a cold northern sea coast in early spring, grey-green waves rolling onto a pebble beach, wooden fishing boats pulled up on the shore, fishing nets drying on wooden racks, gulls overhead, slow dolly along the shore. Sound of waves and gulls. |
| place-forest.mp4 | scene "survey-forest" | 437313767445343 | A dense Hokkaido forest of spruce and birch in winter, snow falling between the trunks, a straight line of wooden survey stakes running into the woods, slow forward dolly. Sound of wind and soft snowfall. |
| place-hills.mp4 | scene "animal-hills" | 437314919223177 | Rolling grassy hills at dawn with low mist, a few sika deer grazing at the forest edge, slow pan. Sound of birds and wind in the grass. |
| place-mine.mp4 | scene "coal-mountain" | 437313768639710 | A coal mining town in snowy mountains in the mid 20th century, a tall wooden mine headframe, heaps of coal, smoke from chimneys, slow aerial drift. Sound of distant wind and machinery. |

Known flaws: place-hills shows deer that look European and a wire fence;
place-mine has letterbox bars. Not shipped: era-2-flat 437313758878851 (modern
shed, utility pole), era-3-cise 437313764144673 (stilt houses, modern houses).

## Round 3 (owl-film look)

PixVerse V6 text-to-video, 5 s, 720p, ambient audio, from text prompts only.
The owl film's frames were looked at as a style guide, not used as input. Every
prompt ends with: "Blue-hour moonlight and warm hearth glow, ground-level slow
push-in, shallow depth of field, soft film grain, cinematic, calm. No modern
buildings, no utility poles, no wires, no fences, no vehicles, no text, no
logos, no music." People wear plain robes or work clothes; no motifs were asked
for. Full prompts: project file generated-assets/PROMPTS-3.md.

| Key | Shown for | PixVerse video id | Prompt (start) |
|---|---|---|---|
| era-2-flat-v2.mp4 | era "flat-ground" | 437320674821999 | Evening at a river mouth in Hokkaido, a few thatched houses built on flat ground with walls of grass and bark … two people in plain long robes of light brown woven plant-fibre cloth walk slowly between the houses. |
| place-forest-night.mp4 | scene "survey-forest" (replaces place-forest.mp4) | 437320700238999 | Night in a dense Hokkaido forest of spruce and birch in winter … a straight line of wooden survey stakes … a single lantern hanging on a stake. |

Not shipped: era-3-cise-v2 437320679580883 (overhead wires, fences, metal
chimneys), era-4-meiji-v2 437320686122909 (utility poles), era-1-pit-night
437320693628848 (rail fences, looks like a 3D render).
