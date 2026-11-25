// Knowledge from Lukas's visit to the Hokkaido Museum (permanent exhibition,
// theme 2, photographed 2026-11-25): the "アイヌ文化Q&A" cards and some
// panels and hands-on stations. Research preview: every claim is a short
// paraphrase of one card or panel, with the photo id and Q number as the
// locator. Full transcriptions: docs/research/hokkaido-museum/transcriptions/
// panels.md. Romanisations of katakana are ours (drafts; docs/REVIEW.md).
// The photos stay out of Git (museum rights).
import type { KnowledgeEntry, Source } from "@/contracts";

const onSite = (id: string, title: string, section: string): Source => ({
  id,
  title: `Hokkaido Museum: ${title}`,
  kind: "museum",
  rights: "unknown",
  consent: "pending",
  attribution: `Hokkaido Museum, permanent exhibition, ${section}. Photographed 2026-11-25.`,
  placeholder: false,
});

const sources: Source[] = [
  onSite(
    "hm-qa-binder",
    "アイヌ文化Q&A (visitor questions, answered by museum staff)",
    "theme 2, Q&A binder and wall (photos 7787–7811)",
  ),
  onSite(
    "hm-panel-beliefs",
    "いのる (Beliefs), panel 3",
    "theme 2 伝統を学ぶ (photo 7727)",
  ),
  onSite(
    "hm-panel-food",
    "食べる (Diet), panel 1",
    "theme 2 伝統を学ぶ (photo 7745)",
  ),
  onSite(
    "hm-station-ukouk",
    "ウコウク (Ukouk) listening station",
    "theme 2 (photos 7771, 7772)",
  ),
  onSite(
    "hm-station-tonkori",
    "トンコリを弾いてみよう (Play the tonkori) hands-on station",
    "theme 2 (photos 7781–7783)",
  ),
  {
    id: "kayano-1978",
    title: "Kayano Shigeru (1978), アイヌの民具 (Ainu folk tools): cise plan",
    kind: "document",
    rights: "unknown",
    consent: "pending",
    attribution:
      "Kayano Shigeru, アイヌの民具 (1978), elevation and floor plan 1/90, as printed on the Hokkaido Museum Q&A card (photo 7810).",
    placeholder: false,
  },
  {
    id: "museum-visit-notes",
    title: "Living Hokkaido · museum visit notes and romanisation",
    kind: "document",
    rights: "approved",
    consent: "granted",
    attribution:
      "Living Hokkaido team (docs/research/hokkaido-museum). Romanisations of the museum's katakana are ours and wait for a language review.",
    placeholder: false,
  },
];

const c = (id: string, text: string, ...cites: [string, string][]) => ({
  id,
  text,
  citations: cites.map(([sourceId, locator]) => ({ sourceId, locator })),
});

export const hokkaidoMuseum: KnowledgeEntry = {
  id: "hokkaido-museum",
  title: "What the Hokkaido Museum shows",
  subtitle: "Q&A cards, panels and hands-on stations, theme 2",
  presentation: "research-preview",
  sources,
  claims: [
    // ------------------------------------------------ greetings (Q024, Q007)
    c(
      "greet-regions",
      "Ainu greetings differ from region to region, even just for meeting someone.",
      ["hm-qa-binder", "Q024 (photo 7811), answer, sentence 1"],
    ),
    c(
      "greet-irankarapte",
      "irankarapte (イランカラプテ) is the form used in western Hokkaido.",
      ["hm-qa-binder", "Q024 (photo 7811), answer, sentence 5"],
    ),
    c(
      "greet-iankarapte",
      "iankarapte (イアンカラプテ) is used in eastern Hidaka, for example by adults who meet on the road.",
      ["hm-qa-binder", "Q024 (photo 7811), answer, sentence 4"],
    ),
    c(
      "greet-inankarapte",
      "inankarapte (イナンカラプテ) is a similar form in eastern Hokkaido.",
      ["hm-qa-binder", "Q024 (photo 7811), answer, sentence 5"],
    ),
    c(
      "greet-irankarahte",
      "irankarahte (イランカラハテ) is a similar form in Sakhalin.",
      ["hm-qa-binder", "Q024 (photo 7811), answer, sentence 5"],
    ),
    c(
      "greet-ikatay",
      "ikatay (イカタイ) is used from eastern Hidaka (Shin-hidaka, Urakawa) to eastern Hokkaido. It is said to mean 'long time no see', but close friends also use it like 'hello'.",
      ["hm-qa-binder", "Q024 (photo 7811), answer, sentences 2–3"],
    ),
    c(
      "greet-issorore",
      "issorore (イッソロレ) also means 'hello' from eastern Hidaka to eastern Hokkaido.",
      ["hm-qa-binder", "Q024 (photo 7811), answer, sentence 6"],
    ),
    c(
      "dialect-areas",
      "Ainu has dialects: roughly four areas (Hokkaido, Sakhalin, the northern Kurils and northern Tohoku), and words and grammar also differ within one dialect.",
      ["hm-qa-binder", "Q007 (photo 7793), answer, sentences 1–3"],
    ),
    c(
      "romanised-by-us",
      "The museum prints these words in katakana. The Latin spellings here are ours and wait for a language review.",
      ["museum-visit-notes", "transcriptions/panels.md, Q024 and 7810 notes"],
    ),
    c(
      "map-sketch",
      "The map and the plan are sketches made for this demo. Places on them are approximate.",
      ["museum-visit-notes", "README.md, Most useful for the demo"],
    ),
    // ------------------------------------------------ owl and kamuy yukar
    c(
      "owl-kamuy",
      "Blakiston's fish owl is a kamuy with the role of watching over the village, and it is highly respected in many regions.",
      ["hm-panel-beliefs", "いろいろなカムイ, owl photo caption (photo 7727)"],
    ),
    c(
      "kamuy-differ",
      "Which beings are kamuy, and which kamuy matter most, differs by region and by person.",
      ["hm-panel-beliefs", "いろいろなカムイ, bear photo caption (photo 7727)"],
    ),
    c(
      "kamuy-visit",
      "Kamuy are thought to live in their own world in a human-like form, and to come to the human world as animals, plants, tools, rain or wind.",
      ["hm-panel-beliefs", "いろいろなカムイ, paragraph 1 (photo 7727)"],
    ),
    c(
      "sakehe",
      "In a kamuy yukar (a song of the kamuy), a fixed word comes back again and again: the sakehe. Each kamuy yukar has its own; some catch a kamuy's call or movement, and many have no clear meaning.",
      ["hm-qa-binder", "Q020 (photo 7807), answer, sentences 1–4"],
    ),
    c(
      "owl-sakehe",
      "The longest known sakehe is said to be in the owl story of Shizunai told by Suteno Orita: トゥノヤケ レノヤケ クントゥムケ カムイムイケ カムイチカッポ フム フム.",
      ["hm-qa-binder", "Q020 (photo 7807), answer, last sentences"],
    ),
    c(
      "telling-varies",
      "Oral literature changes a little each time it is told, even by the same teller.",
      ["hm-qa-binder", "Q004 (photo 7790), answer, paragraph 2"],
    ),
    c(
      "green-pigeon",
      "The museum once played 'The story of the green pigeon', a kamuy yukar told by Nabe Shirasawa of Chitose (1905–93). Its library keeps the recording.",
      ["hm-qa-binder", "Q004 (photo 7790), answer, paragraph 1"],
    ),
    // ------------------------------------------------ pronunciation (Q005)
    c(
      "small-kana",
      "Small katakana mark a syllable that ends with no vowel. sap (サプ) said as 'sapu' is not correct.",
      ["hm-qa-binder", "Q005 (photo 7791), answer, paragraph 1"],
    ),
    c(
      "sap-sat-sak",
      "The museum's examples: sap = come out (plural), sat = dry, sak = to lack, or summer. To say sap, stop with your lips closed, as just before 'po' in 'Sapporo'.",
      ["hm-qa-binder", "Q005 (photo 7791), table and paragraph 2"],
    ),
    // ------------------------------------------------ ukouk (7771, 7772, Q015)
    c(
      "ukouk",
      "Ukouk is a way of singing in which singers follow one melody one after another, so that the voices overlap. It is known as one feature of Ainu music.",
      ["hm-station-ukouk", "Panel text (photo 7772)"],
    ),
    c(
      "ukouk-asahikawa",
      "At the station, a song from the Asahikawa area is sung by four people in three parts. The parts start one after another, one beat apart.",
      ["hm-station-ukouk", "Song 1 text and timing diagram (photo 7771)"],
    ),
    c(
      "ukouk-mukawa",
      "A second song, by the Mukawa Ainu culture preservation society, is sung by two groups; the second group starts later.",
      ["hm-station-ukouk", "Song 2 text and timing diagram (photo 7771)"],
    ),
    c(
      "ukouk-words",
      "The Asahikawa songs are sung as フッサナ サンケナ ホーイヤ ホイ / フッサナ ハオ ホーイヤ ホイ and アリ アンペタ トノト ハウ ネ ネ / エー ホーイヤー オホイヤーホー.",
      ["hm-qa-binder", "Q015 (photo 7802), answer, sentence 1"],
    ),
    c(
      "ukouk-meaning",
      "Some words in the songs have a meaning, such as sanke 'to put out', tonoto 'sake' and chikap 'bird', but the meaning of the whole is not known. Ukouk is about enjoying how the voices overlap and change.",
      ["hm-qa-binder", "Q015 (photo 7802), answer, sentences 2–4"],
    ),
    // ------------------------------------------------ tonkori (7781–7783, Q017)
    c(
      "tonkori-strings",
      "The tonkori at the hands-on station has five strings, from the left: thick, fairly thick, thin, fairly thick, thin, after the instrument Ume Nishihira played.",
      ["hm-qa-binder", "Q017 (photo 7804), answer"],
      ["hm-station-tonkori", "入門1 (photo 7781)"],
    ),
    c(
      "tonkori-open",
      "The strings are played open, without pressing them. The left hand plays strings 1 and 2, the right hand strings 2 to 5.",
      ["hm-station-tonkori", "初級 基本的な弾きかた (photo 7782)"],
    ),
    c(
      "tonkori-order",
      "The strings are not in order of pitch. That is one feature of the tonkori.",
      ["hm-station-tonkori", "音の高さを整える, speech bubbles (photo 7783)"],
    ),
    c(
      "tonkori-heart",
      "The body is hollow, and a small ball inside is said to be its heart or soul.",
      ["hm-station-tonkori", "入門1, body label (photo 7781)"],
    ),
    c(
      "tonkori-tune",
      "The station invites visitors to try the opening of a traditional tune, ケヘ ケヘ ヘタニ パイエアン, with the strings 3 3 · 3 1 · 3 · 4 5. Played by Ume Nishihira, recorded and written down by Tomita Tomoko (1959–63).",
      [
        "hm-station-tonkori",
        "中級 伝統曲にトライ!, tab and credit (photo 7783)",
      ],
    ),
    // ------------------------------------------------ games (Q021)
    c(
      "stick-game",
      "In one children's game, lines are drawn like the character 田. Two players each stand three sticks on their side, and in turn move one stick one step forward, back, left or right. Whoever first lines up their sticks on the other side wins.",
      ["hm-qa-binder", "Q021 (photo 7808), answer, sentence 2"],
    ),
    c(
      "ring-game",
      "In another game, rings woven from wild grape vine lie on the ground, and players pick them up with a stick and count them. Sarashina Genzo's アイヌの童戯 (1983) describes more games.",
      ["hm-qa-binder", "Q021 (photo 7808), answer, sentences 2 and 5"],
    ),
    c(
      "games-adults",
      "Some games were also for adults: one record tells of two teams, one throwing a ring about 15 cm wide high in the air and the other catching it on a long pole.",
      ["hm-qa-binder", "Q021 (photo 7808), answer, sentences 3–4"],
    ),
    // ------------------------------------------------ makers (Q012)
    c(
      "full-adult",
      "It is said that only someone who could make the everyday tools, such as the mortar, pestle and winnow, was seen as a full adult.",
      ["hm-qa-binder", "Q012 (photo 7798), answer, sentence 1"],
    ),
    c(
      "tools-mixed",
      "Not every tool was self-made: a person's tools mixed things passed down the generations and things newly made or got. Treasures from trade, such as swords and lacquerware, were often passed down.",
      ["hm-qa-binder", "Q012 (photo 7798), answer, sentences 2–4"],
    ),
    // ------------------------------------------------ lake house (Q023, 7745, 7810)
    c(
      "canoe-pole",
      "A dugout canoe on a river is steered with a pole about 3–4 m long, by someone standing at the bow or stern. In deep water or on lakes, people paddle, sitting down.",
      ["hm-qa-binder", "Q023 (photo 7811), answer, sentences 1–4"],
    ),
    c(
      "canoe-kamuy",
      "A canoe carries people and goods and is an important kamuy; before boarding, people prayed to it for a safe trip.",
      ["hm-qa-binder", "Q023 (photo 7811), answer, last sentence"],
    ),
    c(
      "crops",
      "Japanese millet and foxtail millet were grown from very early times. From the mid-Edo period, potatoes, other grains, soybeans, daikon and a root vegetable called atane are also recorded.",
      ["hm-panel-food", "農耕, paragraph 1 (photo 7745)"],
    ),
    c(
      "wild-plants",
      "People also gathered wild plants and nuts: wild garlic (gyoja-ninniku), nirinso, acorns, sarunashi berries, and starch from katakuri and the giant lily (oubayuri).",
      ["hm-panel-food", "山菜、木の実など, photo labels (photo 7745)"],
    ),
    c(
      "grain-shell-tool",
      "To harvest grain, people used tools such as sickles, and also a tool made from a freshwater pearl mussel shell, from the Saru area of Hidaka. A finger goes through its string, and the edge of the shell picks off the ears.",
      ["hm-panel-food", "穂をつむための道具と使い方, caption (photo 7745)"],
    ),
    c(
      "cise-plan",
      "Kayano Shigeru's plan of a cise (1978) names its parts in Ainu, with Japanese glosses: アペオイ hearth, シソ true seat, ハラキソ left seat, アペエトク head seat, ロルンプヤラ window of the kamuy seat, イトムンプヤラ window that takes in light, ヌプキクタプヤラ window to throw out dirty water, セマパ entrance, シントコ lacquer vessel, チセコロカムイ guardian kamuy of the house. The words are Saru usage.",
      ["kayano-1978", "Floor plan labels (Q&A card, photo 7810)"],
    ),
    c(
      "cise-size",
      "On the plan the house is about 9.6 m long, including the entrance room.",
      ["kayano-1978", "Plan dimensions (Q&A card, photo 7810)"],
    ),
    c(
      "cise-toilet",
      "The toilet stood outside the house, on the side opposite the altar.",
      ["hm-qa-binder", "Q022 (photo 7809), answer, sentence 1"],
    ),
  ],
};
