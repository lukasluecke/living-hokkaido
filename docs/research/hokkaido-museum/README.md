# Hokkaido Museum visit (2026-11-25): research catalog

**Status: research preview.** Not reviewed. Catalog and summaries by Claude
from Lukas's photos of the Hokkaido Museum (北海道博物館), Sapporo,
permanent exhibition, 2026-11-25, 11:46–13:25 JST (151 photos, 1 video).
Grouping is by EXIF time and content.

What is here, and what is not:

- [`catalog.json`](catalog.json): one row per photo (time, sequence,
  section, theme, kind, category, relevance, `ritualContext`, Pocket Curator
  number, Q&A number, title, use-for, notes, related collection records).
  GPS is removed. The two staff-wall photos (S15, personal data) are not
  listed.
- [`collection-db-links.json`](collection-db-links.json): related records in
  the museum's public collection database.
- [`transcriptions/`](transcriptions/): the full panel transcriptions and
  draft translations (`panels.md` for all sections, `house-panels.md` for the
  restored house). **The panel text belongs to the museum and is not under
  the MIT license**: read [`transcriptions/RIGHTS.md`](transcriptions/RIGHTS.md).
  The app still shows short cited paraphrases, not panel text.
- Not in Git: the photos, the video and the contact sheets (private project
  files, `museum/`).
- `ritualContext: true` describes the context (ceremonial or sacred use). It
  does not exclude an item (decision Lukas, 2026-11-25). The review pass in
  REVIEW.md still applies before content counts as approved.

## How to cite

Use one source id for each panel (see `hm-panel-*` in
`src/content/bark-to-cloth`). Locator format:

`Hokkaido Museum, permanent exhibition, <section>, "<panel title>", photo IMG_xxxx (2026-11-25)`

For a Q&A card add `Q&A no. NNN`. For a Pocket Curator entry add `PC NNN`.
Do not invent text for a panel that this catalog does not cover.

## Sequences (time order)

| Seq | Time (JST) | Photos | Section | Relevance |
|---|---|---|---|---|
| S00 | 11:46–11:47 | 7705–7711 | Museum shop (owl tote, books) | drop |
| S01 | 11:59–12:02 | 7717, 7720, 7722, 7728 | Theme 2 · 2 衣服 Clothing, adornment | high |
| S02 | 12:01–12:02 | 7724–7730 | Theme 2 · 3 いのる Beliefs, ritual cases | high |
| S03 | 12:03–12:04 | 7734–7742 | Theme 2 · restored house | high (see house panels in REVIEW.md) |
| S04 | 12:04–12:05 | 7744–7750 | Theme 2 · 1 食べる Diet, canoe, fishing | high |
| S05 | 12:06–12:07 | 7754–7765 | Theme 2 · today: family manga, population | high |
| S06 | 12:19 | 7767–7769 | Theme 2 · story animations, black cotton robe | medium |
| S07 | 12:24–12:27 | 7770 (MOV), 7771–7783 | Theme 2 · ukouk + tonkori stations | high |
| S08 | 12:31–12:34 | 7785–7811 | Theme 2 · アイヌ文化Q&A (Q001–Q024) | high |
| S09 | 12:34–12:35 | 7812–7817 | Theme 2 · modern history wall | high |
| S10 | 12:40–12:42 | 7821–7827 | Theme 1 · map, Kaitakushi model, fort | medium/low |
| S11 | 12:43–12:46 | 7828–7842 | Theme 1 · furs, bark robe, Omusha diorama | medium (robe: high) |
| S12 | 12:56–13:03 | 7843–7858 | Theme 1 · trade goods, armour, Jomon objects | medium/low |
| S13 | 13:08 | 7859–7862 | Theme 3 · bird's-eye folding screen 1936 | high (art direction) |
| S14 | 13:09–13:13 | 7863–7890 | Theme 4 · settlers, herring, coal, starch, roads | medium/low |
| S15 | 13:24–13:25 | (2 photos) | Staff wall | drop (personal data, not listed) |
| S16 | 13:25 | 7908–7909 | Painted forest/logging mural | unclear |

Notes on grouping: Lukas visited theme 2 (Ainu culture) first, then went
back to theme 1, then themes 3 and 4. The gap 13:13–13:24 (no photos) is
before S15/S16. The MOV (12:24:48, 27 s) sits just before the ukouk
station photos: it is probably a recording of that listening station. I did
not verify the sound.

## Most useful for the demo (by place)

**Listening grove (owl, words)**

- Greeting: Q024 (7811). "irankarapte" is the western Hokkaido form; other
  regions say "iankarapte" (east Hidaka), "inankarapte" (eastern Hokkaido),
  "irankarahte" (Sakhalin), "ikatay", "issorore". A small map with one
  greeting and many places is a strong demo moment.
- Owl: 7727 (panel 3 いのる): シマフクロウ (Blakiston's fish owl) is a kamuy
  with the role of watching over the village, very respected in many regions.
  Q020 (7807): the museum shows an owl kamuy yukar from Shizunai, told by
  Suteno Orita, with the longest known sakehe (refrain), ending "hum hum".
  Q004 (7790): a kamuy yukar is a named teller's performance and changes with
  each telling. The sakehe is transcribed in `transcriptions/panels.md` (7807). If the app uses
  it, credit Suteno Orita (Shizunai) and the museum; do not invent a new one.
- Pronunciation: Q005 (7791). Small katakana mean "no vowel" (sap, sat, sak);
  this gives a simple pronunciation hint for word cards.
- Dialects: Q007 (7793). Four dialect areas, with differences in each one.
  Every word needs region and source fields.
- Reliable word sources: Q011 (7797): 『アイヌ語千歳方言辞典』(Nakagawa),
  『アイヌ語沙流方言辞典』(Tamura), Ainu Foundation textbooks, the National
  Ainu Museum "Ainu and nature digital encyclopedia".
- Words in everyday Japanese and place names: Q009, Q014, Q016. For example,
  nonno = flower, rakko, tonakay, ruibe, pet / nay = river / stream,
  Noboribetsu = nupurpet.
- Writing: Q018. Do not say that Ainu "has no writing". Show katakana and
  romanisation.
- Music: ukouk canon structure (7771/7772, Q015) and tonkori mechanics
  (7781–7783, Q017) are good mechanics for a small listening or plucking
  activity. The lyrics and tunes are transcribed in `transcriptions/panels.md` (S07).

**Makers' clearing (bark to cloth)**

- 7717: six-step bark-fiber robe process (Fujitani Rumiko, Nibutani).
- 7720 (PC 239): materials and cotton through trade (official English).
- Q008 (7794): embroidery, appliqué, and appliqué plus embroidery. A pattern
  is never perfectly symmetric. Use this as a rule for the procedural
  pattern: add a small asymmetry for each maker.
- Visual references: 7830 (bark-fiber robe with dark appliqué), 7769 (black
  cotton robe).
- Q012 (7798): someone who could make a mortar, pestle and winnow was seen
  as a full adult.
- Q021 (7808): documented children's games. One is a stick game on a 田
  grid: each player has 3 sticks and moves 1 stick one step per turn. Another
  is a ring and stick game. These are a non-sacred, playable mini-game with a
  citation.

**Lake house**

- 7810: chise elevation and floor plan, 1/90 (Kayano 1978), with named zones
  (Saru usage). The size is about 9.6 m including the entrance room.
- Q022: the toilet stands outside, opposite the altar side.
- Q023: a dugout canoe is steered with a 3–4 m pole while standing.
- 7745: food plants for the garden.

**Memory cabin / Over time**

- Manga (7754–7762): a fictional present-day Ainu family, written by the
  museum. It is not a real memory. Theme: "now and in the past, people with
  many ways of thinking and living are everywhere".
- 7765: population today.
- 7812–7814: postwar history and tourism.
- 7748: the 1878 ban on salmon fishing.
- 7849: the akinaiba trade system.
- 7835/7836: the Omusha.
- 7865: the 1890 land-survey grid.
- 7890: roads built by forced labour.

**Island art direction:** 7859–7862, Yoshida Hatsusaburo's 1936 bird's-eye
folding screen of Hokkaido.

## Pocket Curator cross-check

The museum's exhibit guide app Pocket Curator (ポケット学芸員, I.B.MUSEUM SaaS,
Waseda System Development) shows a short text and a photo for each exhibit
number. Its terms allow personal use only, so its texts are not copied here.
The public collection database (below) uses the same platform and is open.

Numbers seen on panels: 135, 153, 201, 202, 232, 234, 235, 239, 242, 243, 244, 245, 247, 248, 256, 271, 272, 301, 302, 314, 318, 325, 330.

To cross-check a claim: open the number in Pocket Curator, compare the text
with the claim and the panel row in `catalog.json` (`pocketCuratorId`), and
note any difference in REVIEW.md. Do not paste the app text into Git.

## Public collection database links (related records)

Source: Hokkaido Museum collection database, https://jmapps.ne.jp/hmcollection1/ (accessed 2026-11-25). The records list only the reading, accession number, category and a short description. They have no fields for place, date or size. **These records show the same type of object. They are not confirmed to be the object in the photo.** Full list: [`collection-db-links.json`](collection-db-links.json). Search by katakana reading: `list.html?f3=<reading>`.

| Record | Title | Accession | Related photos | Gloss |
|---|---|---|---|---|
| [53510](https://jmapps.ne.jp/hmcollection1/det.html?data_id=53510) | アツシ織の順序 | 011462 | 7717, 7720, 7830 | Attush weaving step specimens (Biratori school; 1913/1918 exhibitions) |
| [53354](https://jmapps.ne.jp/hmcollection1/det.html?data_id=53354) | オヒョウ樹皮 | 011302 | 7717 | Ohyo elm bark, raw fiber |
| [53411](https://jmapps.ne.jp/hmcollection1/det.html?data_id=53411) | オヒョウ樹皮 | 011360 | 7717 | Ohyo elm bark (list only) |
| [1365](https://jmapps.ne.jp/hmcollection1/det.html?data_id=1365) | 樹皮布織り機 | 022328 | 7717 | Loom for bark-fiber cloth |
| [9698](https://jmapps.ne.jp/hmcollection1/det.html?data_id=9698) | 木綿衣 | 145828 | 7720, 7769 | Cotton robe, cotton appliqué + cut-out hem (revival technique) |
| [9699](https://jmapps.ne.jp/hmcollection1/det.html?data_id=9699) | 木綿衣 | 145829 | 7769 | Cotton robe (list only) |
| [9700](https://jmapps.ne.jp/hmcollection1/det.html?data_id=9700) | 木綿衣 | 145830 | 7769 | Cotton robe (list only) |
| [2242](https://jmapps.ne.jp/hmcollection1/det.html?data_id=2242) | 首飾り (ritual) | 032810 | 7722, 7800 | Women's ceremonial glass-bead necklace, central metal disc |
| [2243](https://jmapps.ne.jp/hmcollection1/det.html?data_id=2243) | 首飾り (ritual) | 032814 | 7722, 7800 | Necklace (list only) |
| [6616](https://jmapps.ne.jp/hmcollection1/det.html?data_id=6616) | 首飾 (ritual) | 124662 | 7722, 7800 | Women's ceremonial necklace |
| [6617](https://jmapps.ne.jp/hmcollection1/det.html?data_id=6617) | 耳飾 | 124663 | 7728 | Women's ceremonial earrings (7 records 6617–6623) |
| [470](https://jmapps.ne.jp/hmcollection1/det.html?data_id=470) | 捧酒箆（イクパスイ） (ritual) | 008155 | 7729 | Carved ikupasuy with mark (129 hits for ホウシュ) |
| [9649](https://jmapps.ne.jp/hmcollection1/det.html?data_id=9649) | 捧酒箆 (ritual) | 145779 | 7729 | Ikupasuy: carries prayers to the kamuy |
| [1452](https://jmapps.ne.jp/hmcollection1/det.html?data_id=1452) | 木幣の頭部 (ritual) | 027070 | 7730 | Model of an inaw head with lineage mark |
| [708](https://jmapps.ne.jp/hmcollection1/det.html?data_id=708) | 狩猟用矢筒 | 011308 | 7730, 7744 | Wooden hunting quiver |
| [1381](https://jmapps.ne.jp/hmcollection1/det.html?data_id=1381) | 儀礼用矢筒 (ritual) | 023216 | 7730 | Ritual quiver (list only) |
| [6612](https://jmapps.ne.jp/hmcollection1/det.html?data_id=6612) | 儀式用矢筒 (ritual) | 124658 | 7730 | Ceremonial quiver (list only) |
| [9673](https://jmapps.ne.jp/hmcollection1/det.html?data_id=9673) | 花矢 (ritual) | 145803 | 7730 | Decorated arrow for the bear spirit-sending ceremony (also 9674, 9675) |
| [1397](https://jmapps.ne.jp/hmcollection1/det.html?data_id=1397) | 五弦琴（サハリンアイヌ） | 023445 | 7781, 7782, 7783, 7804 | Tonkori (Sakhalin Ainu), five strings |
| [4739](https://jmapps.ne.jp/hmcollection1/det.html?data_id=4739) | 銛先 | 089586 | 7746, 7748 | Toggling harpoon head (kite type) |
| [4740](https://jmapps.ne.jp/hmcollection1/det.html?data_id=4740) | 銛先 | 089589 | 7746, 7748 | Harpoon head (list only) |
| [1349](https://jmapps.ne.jp/hmcollection1/det.html?data_id=1349) | 臼・杵 | 022173 | 7742, 7798 | Mortar and pestle for grain |
| [1359](https://jmapps.ne.jp/hmcollection1/det.html?data_id=1359) | 臼・杵 | 022226 | 7742, 7798 | Mortar and pestle (list only) |
| [1366](https://jmapps.ne.jp/hmcollection1/det.html?data_id=1366) | ござ (ritual) | 022603 | 7734, 7740 | Patterned mat behind the treasure altar (also 1369–1375) |
| [52970](https://jmapps.ne.jp/hmcollection1/det.html?data_id=52970) | 北海道鳥瞰図屏風 | 041915 | 7859, 7860, 7862 | Bird's-eye folding screen, 8 panels, silk, 1936 (分類 美術) |

I found no records for a bark robe as an object, a mukkuri, a dugout canoe or a shell grain picker.

## Open points

- S16 (7908, 7909): place of the painted forest mural is unknown. Not used.
- 7843 (armour), 7769 and 7830 (robes): no label photos exist. Use as visual
  reference only, with no object claims.
- The video (IMG_7770, 27 s) is probably the ukouk listening station. Not
  verified. It is not in Git and is not used as a recording.

