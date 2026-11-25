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
translation are in the private project files
(`museum/house-panels.md`), not in Git, because the panel text belongs to
the museum. The photos are not shipped.

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
