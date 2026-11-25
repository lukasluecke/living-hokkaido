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
