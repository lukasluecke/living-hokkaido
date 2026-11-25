# Review list (drafts shown now, review later)

Decision (Lukas, 2026-11-25): show everything now and do the review pass
later. The app no longer hides content behind review gates. Drafts show only
a small "Draft" label. This file lists every item that the later pass must
check. When an item is reviewed, set its data to the reviewed state and
remove its row here.

How to find drafts in the data:

- Knowledge entries with `presentation: "research-preview"` (shown as
  "Draft").
- Words terms whose `review` flags are not all `true` (`termReviewed()` in
  `src/contracts/content.ts`).
- Sources with `rights: "unknown"` or `consent: "pending"`.
- Media with `kind: "device-voice-placeholder"`.

## Language (Ainu words)

All in `src/content/bark-to-cloth/knowledge.ts` (claims) and
`activity-kinds.ts` (activity `words-objects`). Ainu is its own language
(`ain`), never a Japanese dialect.

| Term | Meaning shown | Claim | Sources (locator) | Needs |
|---|---|---|---|---|
| attus | cloth and clothes made from bark fiber | `term-attus` | Obihiro Centennial City Museum (Attus [Garments/Kimono]); Hokkaido Digital Museum (Bark clothes, spelled *attush*); National Ainu Museum 3D list (Garment (bark fiber) [Attus/Ahrus]); JTA/MLIT "Ainu Crafts" | Spelling choice (attus / attush / ahrus), region / variety, meaning, a recording of a consenting speaker |
| isitaykini | loom | `term-isitaykini` | Obihiro Centennial City Museum (isitaykini [Loom]) | Only one source. Wikipedia names the backstrap loom *attushi karape*; check which word fits the object. Region, meaning, recording |

Not used, because no source confirms it as Ainu: *ohyo* (Wikipedia calls the
bark fiber "ohyo"; it is also the Japanese name of the lobed elm). No Ainu
word for the fiber is shown yet.

The Listen button stays off for Ainu words until a recording exists. The
device voice never reads Ainu (`validateContentPack` rule).

## Knowledge and sources

| Item | File | Needs |
|---|---|---|
| Entry `bark-to-cloth` (`research-preview`) | `src/content/bark-to-cloth/knowledge.ts` | Cultural and editorial review; set `approved`, `reviewer`, `reviewedAt` |
| Claims `bark-fiber`, `variation` | `src/data/story.ts` | Check the paraphrases against Hokkaido Digital Museum |
| Sources `hdm`, `nam`, `obihiro-museum`, `mlit-ainu-crafts` | `knowledge.ts` | Rights scope (`unknown`) and consent (`pending`) |

## Hokkaido Museum panels (restored house)

Added 2026-11-25 from Lukas's photos of the Hokkaido Museum's restored house
(permanent exhibition, theme 2). Claims are in
`src/content/bark-to-cloth/over-time.ts` (entry `house-over-time`, all
`research-preview`). Sources `hm-panel-dwelling`, `hm-panel-house-change`,
`hm-panel-inside`, `hm-panel-skills`: `rights: "unknown"`,
`consent: "pending"`, no URL (read on site). The full transcription and
translation are in
[`docs/research/hokkaido-museum/transcriptions/house-panels.md`](research/hokkaido-museum/transcriptions/house-panels.md)
(panel text belongs to the museum, not MIT; see its `RIGHTS.md`). The photos
are not shipped.

| Claim | Panel (locator) | Needs |
|---|---|---|
| `panel-flat-ground` | 住まい, main text 1–2 | Check translation of 擦文文化の後期 / 平地住居. Flat-ground era now reads "Late Satsumon – about 13th century" (was "13th–14th century" from HDM; both claims stay) |
| `panel-kuril-sakhalin` | 住まい, main text 3 | Check |
| `panel-regional-materials` | 住まい, second text | Check names of grasses (kaya, yoshi, sasa) and regions |
| `panel-entry` | 家の中をよく見てみよう, photo 1 | Check. *ohyo* is used here as the Japanese name of the tree (オヒョウ), as on the panel, not as an Ainu word |
| `panel-hearth` | 家の中をよく見てみよう, photo 2 | Check |
| `panel-smoked-fish` | 家の中をよく見てみよう, photo 3 | Check |
| `panel-treasures` | 家の中をよく見てみよう, photo 4 | The panel says the treasures stand in front of the window through which the kamui come and go. We do not draw or name that window. Reviewer: may the upper seat and its treasures be shown at all? |
| `panel-unhygienic` | 家屋の移り変わり, column 1 | Check |
| `panel-sunazawa` | 家屋の移り変わり, columns 1–2 | Paraphrase of a quoted memoir (『ク スクップ オルシペ』). Check the paraphrase and her name and dates; we do not quote her |
| `panel-gradual` | 家屋の移り変わり, column 3 | Check |
| `panel-moritake` | 家屋の移り変わり, column 4 | Paraphrase of the panel's commentary on his 1937 poem. Check name reading (Moritake Takeichi) and title reading; the poem itself is not shown |
| `panel-homes-today` | 技術を受け継ぐ, paragraph 1 | Check. Panel says 和人; we wrote "other people in Japan" |
| `panel-rebuilt` | 技術を受け継ぐ, paragraph 1 | Check |
| `panel-2015-repair` | 技術を受け継ぐ, paragraph 2 | Check |

Left out on purpose (sacred or ceremonial, needs an Ainu cultural reviewer):
the window opposite the entrance, the outdoor altar and the cage for a bear
cub that the panel says stand outside the museum's house.

Lake house interior (`src/parts/detail-scene/room/House.tsx`), restyled
after the photos (visual reference only):

| Item | Needs |
|---|---|
| Layout: entry area with bark, cattail, mortar and pestle, rope, firewood; long hearth with pot on a hook; two-level rack with fish; upper seat with lacquerware on the north wall; hip roof | Confirm that the toy shapes read as illustration, not as a copy of the museum's house or of real objects |
| Upper-seat mats | Plain dark and red bands only, on purpose (no real motif). Reviewer: keep plain, or use a motif with a source |
| Lacquerware | Generic tubs, bowl, jar, box. No crests or motifs |

## Story narration

| Item | File | Needs |
|---|---|---|
| Story `story-bark-to-cloth`: fact lines m2, v1, v2, k2, k3 | `src/content/bark-to-cloth/activity-kinds.ts` | Check each line against its claim |
| Narrator voice (`device-voice-placeholder`) | same | Replace with a recorded voice of a consenting person (`voice.kind: "recording"`, an `audio` source) |

## Objects and activities

| Item | Needs |
|---|---|
| Three illustrative models (`fiber`, `cloth`, `garment`) | Confirm they read as illustrations, not museum objects |
| Weave `weave-rows` (`illustrative: true`) | Practitioner input before it shows a real technique |
| Quizzes `material`, `variation`, `care` | Learning quality and wording |

## Curator voice memories

- [ ] `src/content/bark-to-cloth/memories.ts`: the sample memory is team text
      with no real curator or recording (`placeholder: true`). Replace it with
      a real curator memory and a real consent record, or remove it.
- [ ] Ainu content: the schema and `translationGate` no longer block machine
      translation of Ainu (`lang: "ain"` or `containsAinu`). `needsReview`
      shows a "Draft" label instead. Decide with a qualified reviewer whether
      to restore the block (see git history of `src/contracts/memory.ts` and
      `src/domain/voice-memory.ts`).
- [ ] Check every machine translation (`mode: "machine"`) and set
      `mode: "human-checked"` with `checkedBy` only for a real, named person.
- [ ] Device voice placeholder ("Read aloud") on text-only memories: keep or
      remove. It never reads Ainu.
- [ ] Kept on purpose (not part of the open gates): voice-clone consent,
      translation consent for real speakers, withdrawal hides the memory.

## Hokkaido Museum: clothing claims and the robe activity

Added 2026-11-25 in `src/content/bark-to-cloth/knowledge.ts` (entry
`bark-to-cloth`, `research-preview`). Sources `hm-panel-bark-robe` (樹皮衣をつくる,
IMG_7717), `hm-panel-clothing` (2 衣服, PC 239, IMG_7720), `hm-qa-binder`
(アイヌ文化Q&A): `rights: "unknown"`, `consent: "pending"`, no URL.

| Claim | Locator | Needs |
|---|---|---|
| `robe-maker` | 樹皮衣をつくる, lead | Check the names (Fujitani Rumiko, Noriyuki) and if the family wants them shown |
| `robe-step-peel` … `robe-step-sew` | 樹皮衣をつくる, steps 1–6 | Check the paraphrase. The panel cites 『アイヌ生活文化再現マニュアル 織る 樹皮衣』 and, for step 6, Kodama Mari (1991) |
| `clothing-materials`, `clothing-today` | 2 衣服, museum English | Check |
| `pattern-techniques`, `pattern-asymmetry` | Q&A no. 008 | Check the translation |

The sequence activity `make-bark-robe` ("From tree to robe", on the `fiber`
artifact) and the hotspot `patterns` on the `garment` artifact use these
claims.

## Hokkaido Museum catalog (whole visit)

Added 2026-11-25: [`docs/research/hokkaido-museum/`](research/hokkaido-museum/)
holds the catalog of all 150 relevant and dropped photos (S00–S16), the full
transcriptions (`transcriptions/`, not MIT) and links to related records in
the museum's public collection database.

- [ ] Rights: ask the Hokkaido Museum about the transcriptions in Git. Until
      then the folder is research notes only (`transcriptions/RIGHTS.md`).
- [ ] Check every "EN (mine)" translation before it backs a claim.
- [ ] Collection database records are the same type of object, not the
      photographed object. Do not present them as the exhibit.
- [ ] Items with `ritualContext: true` are included in full (decision Lukas,
      2026-11-25). A cultural reviewer still checks them before approval.
- [ ] Cross-check claims with Pocket Curator (numbers in the catalog). The app
      text stays out of Git.

## Hokkaido Museum activities (Q&A cards, panels, stations)

Added 2026-11-25. Knowledge entry `hokkaido-museum`
(`src/content/bark-to-cloth/museum.ts`, `research-preview`) and new claims in
`house-over-time` (`over-time.ts`, sources `hm-panel-today`,
`hm-panel-population`). Sources: `rights: "unknown"`, `consent: "pending"`,
read on site, no URL. Locators name the Q number and the photo id.

| Item | Claims | Needs |
|---|---|---|
| Latin spellings of katakana (greetings, cise words, sap/sat/sak) | `romanised-by-us`, `greet-*`, `cise-plan` | Language review: spelling, region, recordings |
| Quizzes `quiz-small-kana`, `quiz-full-adult`, `quiz-canoe`, `quiz-garden`, `quiz-ainu-today` | `small-kana`, `full-adult`, `canoe-pole`, `crops`, `panel-population` … | Check the paraphrases; distractor options state no fact |
| Sequence `sequence-postwar` | `panel-association-1946`, `panel-tourism-1961`, `panel-reclaiming`, `rights-movement`, `recognition`, `upopoy` | Check the 1961 caption (small print) and the late-1960s wording |
| Owl story and sakehe | `owl-kamuy`, `sakehe`, `owl-sakehe`, `telling-varies` | Ritual and oral-literature content, included in full (Lukas). Ask about crediting Suteno Orita and the museum; no recording is used |
| Ukouk syllables, tonkori tune and tab | `ukouk-words`, `tonkori-tune` | Recordings belong to the preservation societies and to Ume Nishihira / Tomita Tomoko; the app plays only synthetic tones |
| Canoe as a kamuy | `canoe-kamuy` | Ritual context, included in full |
| Map `map-greetings` (Listening grove) | `greet-*` | Spot positions on the sketch map are our guesses for each named region |
| Map `map-cise-plan` (Lake house) | `cise-plan`, `cise-size` | The sketch plan and spot positions are our guesses after the Kayano plan (photo 7810); check against the photo. The window of the kamuy seat is shown (ritual context, included in full) |
| Game `game-sticks` (Makers' clearing) | `stick-game` | The rules follow one sentence of Q021; details (who starts, a side with no move passes) are our choices. Check with 更科源蔵『アイヌの童戯』(1983) |
