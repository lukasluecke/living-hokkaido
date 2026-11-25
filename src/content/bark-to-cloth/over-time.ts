// "Over time": how the house and its surroundings changed, in five eras.
// Research preview. Every era cites claims below; every claim cites a public
// page or a Hokkaido Museum exhibit panel with a locator. Checked 2026-11-25
// (JST).
// Claims are short paraphrases, not quotations. Do not add claims without a
// source and locator (docs/RESEARCH.md). Sacred places and objects (for
// example the altar outside the house or the window on the far side of the
// hearth) are left out on purpose: they need an Ainu cultural reviewer.
import type { KnowledgeEntry, Source, TimelineInput } from "@/contracts";

const web = (
  id: string,
  title: string,
  url: string,
  attribution: string,
  kind: Source["kind"] = "museum",
): Source => ({
  id,
  title,
  url,
  kind,
  rights: "unknown",
  consent: "pending",
  attribution,
  placeholder: false,
});

/** A Hokkaido Museum exhibit panel, read on site (no public URL). */
const panel = (id: string, title: string, section: string): Source => ({
  id,
  title: `Hokkaido Museum exhibit panel: ${title}`,
  kind: "museum",
  rights: "unknown",
  consent: "pending",
  attribution: `Hokkaido Museum, permanent exhibition, ${section} (The Traditional Culture and Ways of Life of the Ainu). Panel photographed 2026-11-25.`,
  placeholder: false,
});

const sources: Source[] = [
  web(
    "hdm-satsumon",
    "Encounter between Cultures from the North and the South – Okhotsk Culture and Satsumon Culture",
    "https://hokkaido-digital-museum.jp/en/hokkaido/jomon/j-05/",
    "Hokkaido Digital Museum",
  ),
  web(
    "jta-pit-to-cise",
    "Ainu Homes—From Pit Dwellings to Cise (R6-00260)",
    "https://www.mlit.go.jp/tagengo-db/en/R6-00260.html",
    "Japan Tourism Agency, multilingual commentary database (FY2024)",
    "document",
  ),
  web(
    "jta-bounty",
    "Living Off the Bounty of the Land (R2-00529)",
    "https://www.mlit.go.jp/tagengo-db/en/R2-00529.html",
    "Japan Tourism Agency, multilingual commentary database (FY2020), Kussharo Kotan Ainu Museum",
    "document",
  ),
  web(
    "jta-apeso",
    "Apeso (Open Hearth) (R1-01904)",
    "https://www.mlit.go.jp/tagengo-db/en/R1-01904.html",
    "Japan Tourism Agency, multilingual commentary database (FY2019)",
    "document",
  ),
  web(
    "hm-guide",
    "The Traditional Culture and Ways of Life of the Ainu (exhibit guide, theme 2)",
    "https://www.hm.pref.hokkaido.lg.jp/wp-content/uploads/2025/03/ENG-2-2.pdf",
    "Hokkaido Museum",
  ),
  web(
    "bccampus-housing",
    "Ainu Traditional Housing and Villages (chapter 4)",
    "https://pressbooks.bccampus.ca/ainuinjapaneselanguage/?p=46",
    "Nina Langton, Indigenizing the Japanese Language Curriculum (BCcampus Pressbooks, 2023)",
    "document",
  ),
  web(
    "jta-19th-century",
    "Hokkaido: Nineteenth Century to Now (R6-00297)",
    "https://www.mlit.go.jp/tagengo-db/en/R6-00297.html",
    "Japan Tourism Agency, multilingual commentary database (FY2024)",
    "document",
  ),
  web(
    "hokkaido-digest",
    "Disintegration of Ainu society and movement for restoration",
    "https://www.pref.hokkaido.lg.jp/ks/bns/digest/chapter_1_2.html",
    "Hokkaido Government",
    "document",
  ),
  web(
    "cas-policy",
    "Overview of Ainu Policy in Japan",
    "https://www.cas.go.jp/jp/seisakukaigi/ainusuishin/index_e.html",
    "Cabinet Secretariat, Government of Japan",
    "document",
  ),
  web(
    "hlj-upopoy",
    "Upopoy: A Symbolic Space for Ethnic Harmony (Highlighting Japan, December 2020)",
    "https://www.gov-online.go.jp/eng/publicity/book/hlj/html/202012/202012_02_en.html",
    "Government of Japan, Public Relations Office",
    "document",
  ),
  // Hokkaido Museum exhibit panels at the restored house (permanent
  // exhibition, theme 2). Photographed by Lukas at the museum on 2026-11-25
  // and read as data. The photos and the full panel text stay out of Git
  // (museum rights); claims below are short paraphrases with locators.
  panel(
    "hm-panel-dwelling",
    "住まい (Dwelling)",
    "Theme 2 伝統を学ぶ, panel 4",
  ),
  panel(
    "hm-panel-house-change",
    "家屋の移り変わり (How houses changed)",
    "Theme 2 伝統を学ぶ, panel 4",
  ),
  panel(
    "hm-panel-inside",
    "家の中をよく見てみよう (Look closely inside the house)",
    "Theme 2 伝統を学ぶ, restored house",
  ),
  panel(
    "hm-panel-skills",
    "技術を受け継ぐ (Passing on the skills)",
    "Theme 2 伝統を学ぶ, restored house",
  ),
  {
    id: "living-hokkaido-policy",
    title: "Living Hokkaido · editorial policy and asset notes",
    kind: "document",
    rights: "approved",
    consent: "granted",
    attribution: "Living Hokkaido team (PROJECT.md, docs/STYLE.md)",
    placeholder: false,
  },
];

const c = (id: string, text: string, ...cites: [string, string][]) => ({
  id,
  text,
  citations: cites.map(([sourceId, locator]) => ({ sourceId, locator })),
});

export const houseOverTime: KnowledgeEntry = {
  id: "house-over-time",
  title: "The house over time",
  subtitle: "From pit dwellings to cise, and what came after",
  presentation: "research-preview",
  sources,
  claims: [
    // Pit dwellings (Satsumon culture)
    c(
      "satsumon-pit",
      "From the 7th to the 12th century, people of the Satsumon culture lived in square pit dwellings with a cooking stove.",
      ["hdm-satsumon", "§ Satsumon culture"],
    ),
    c(
      "satsumon-estuary",
      "From the 8th century, Satsumon people settled near river mouths. They grew millet and barley, fished for salmon and trout, and gathered wild plants.",
      ["hdm-satsumon", "§ Satsumon culture"],
    ),
    c(
      "pit-build",
      "Pit dwellings were square or rectangular and dug about 1 m deep. Poles held a thatched roof that sloped down to the ground.",
      ["jta-pit-to-cise", "English text, paragraph 1"],
    ),
    c(
      "pit-dark",
      "Pit dwellings were dark, with light only from the entrance, and the air was smoky and humid. But they kept out the cold well.",
      ["jta-pit-to-cise", "English text, paragraphs 1–2"],
    ),
    // Flat-ground houses
    c(
      "flat-shift",
      "In the 13th to 14th centuries, houses on flat ground replaced pit dwellings, and open fireplaces replaced cooking stoves. Satsumon culture then changed into Ainu culture.",
      [
        "hdm-satsumon",
        "§ Meeting between northern and southern cultures, which led to the Ainu culture",
      ],
    ),
    c(
      "iron-pots",
      "In the same period, iron pots and Chinese ware spread, and Japanese people began to live in southern Hokkaido.",
      [
        "hdm-satsumon",
        "§ Meeting between northern and southern cultures, which led to the Ainu culture",
      ],
    ),
    c(
      "panel-flat-ground",
      "In the late Satsumon period, the people from whom today's Ainu descend began to use houses on flat ground as well as pit dwellings. By about the 13th century, flat-ground houses are thought to have become common in Hokkaido.",
      ["hm-panel-dwelling", "Main text, sentences 1–2"],
    ),
    c(
      "panel-kuril-sakhalin",
      "On the Kuril Islands and Sakhalin, pit dwellings were used mainly as winter homes until the 19th century.",
      ["hm-panel-dwelling", "Main text, sentence 3"],
    ),
    c(
      "flat-why",
      "People are believed to have moved to the new houses for better living conditions. The new houses were similar to houses on Honshu, with a hearth in the centre.",
      ["jta-pit-to-cise", "English text, paragraph 2"],
    ),
    c(
      "sakhalin",
      "In colder areas such as Sakhalin, some Ainu kept pit dwellings for winter and moved to houses near their fishing grounds in warmer months.",
      ["jta-pit-to-cise", "English text, paragraph 2"],
    ),
    // Cise and kotan
    c(
      "cise-materials",
      "The main house, the cise, had a thatched roof and was built from natural materials such as wood, grasses and bark.",
      ["jta-bounty", "English text, § Ainu homes"],
    ),
    c(
      "cise-hearth",
      "The cise is built around an open hearth, the apeso. A pot hung over the fire for cooking, and fish was smoked above it.",
      ["jta-apeso", "English text, paragraphs 1–2"],
    ),
    c(
      "hearth-warm",
      "The hearth coals were never allowed to go cold. Over time the fire warmed the earth, and the reed walls and roof kept the house warm in winter.",
      ["hm-guide", "§ An Old Ainu Home Restored, Dwelling paragraph"],
    ),
    c(
      "panel-regional-materials",
      "House building differed by region. On the Pacific side (Iburi and Hidaka), walls and roofs were made of kaya or yoshi grass and reed. On the Sea of Japan side, from near Otaru to Ishikari, people used sasa (bamboo grass). In Kushiro and Nemuro in the east, there are records of bark in the early 19th century.",
      ["hm-panel-dwelling", "Second text block, paragraph 1"],
    ),
    c(
      "panel-entry",
      "Between the house door and the room door, people kept cattail (for mats), ohyo bark (for clothing cloth), and a mortar and pestle to pound grain.",
      ["hm-panel-inside", "Photo 1 caption (entry area)"],
    ),
    c(
      "panel-hearth",
      "The family usually spent their time around the hearth. A pot hung over it, and around it were things for weaving, sewing, wood carving, cooking and meals.",
      ["hm-panel-inside", "Photo 2 caption (hearth)"],
    ),
    c(
      "panel-smoked-fish",
      "Fish such as salmon and cod were hung high above the hearth. The smoke made them into food that kept.",
      ["hm-panel-inside", "Photo 3 caption (rack and roof frame)"],
    ),
    c(
      "panel-treasures",
      "Lacquerware used in ceremonies and other important treasures were kept along the wall opposite the entrance. This place was respected as the upper seat, and mats with patterns were used on its wall.",
      ["hm-panel-inside", "Photo 4 caption (upper seat)"],
    ),
    c(
      "kotan-river",
      "Kotan (villages) were built near the sea or rivers, where food and water were easy to get.",
      ["bccampus-housing", "§ 本文を読みましょう (main text), paragraph 1"],
    ),
    c(
      "storehouse",
      "Next to the house were other buildings, such as a storehouse for food on raised posts, made of logs.",
      ["bccampus-housing", "Last paragraph and storehouse image caption"],
    ),
    c(
      "kuca",
      "Separate huts, kuca, were bases for fishing in summer and hunting in winter.",
      ["jta-bounty", "English text, § Ainu homes"],
    ),
    c(
      "museum-age",
      "Most objects in the Hokkaido Museum's Ainu display are from about 100 to 200 years ago.",
      ["hm-guide", "Guide text naming objects from 100 and 200 years ago"],
    ),
    // Meiji era
    c(
      "hokkaido-1869",
      "In 1869 the Meiji government made Ezo an official part of Japan and renamed it Hokkaido.",
      ["jta-19th-century", "English text, paragraph 1"],
      ["hokkaido-digest", "Paragraph 2"],
    ),
    c(
      "land-loss",
      "Ainu lost their hunting and fishing grounds, and children had to speak only Japanese at school.",
      ["jta-19th-century", "English text, paragraph 1"],
    ),
    c(
      "tondenhei",
      "Farmer-soldiers (tondenhei) cleared forest for farming. For the Ainu, this meant the loss of ancestral land and of their autonomy.",
      ["jta-19th-century", "English text, paragraph 2"],
    ),
    c(
      "act-1899",
      "The 1899 Hokkaido Former Aborigines Protection Act pushed farming and limited hunting and fishing. Many Ainu lost their basis for living and became poor.",
      ["hokkaido-digest", "Paragraph 3"],
      ["jta-19th-century", "English text, paragraph 3"],
    ),
    c(
      "panel-unhygienic",
      "Traditional Ainu houses were at times called 'unhygienic', and people were urged to 'improve' them or to move to Japanese-style houses.",
      ["hm-panel-house-change", "Column 1, paragraph 1"],
    ),
    c(
      "panel-sunazawa",
      "Kura Sunazawa (1897–1990), born in Asahikawa, remembered the Japanese-style house that was provided as small, cold and hard to live in. Wind and snow came in, and in winter many people in the village became ill and died.",
      ["hm-panel-house-change", "Columns 1–2 (her recollection, paraphrased)"],
    ),
    c(
      "panel-gradual",
      "Houses did not change all at once. A 1934 photo from today's Biratori shows houses with board walls and with glass windows: people took in new things, and life changed little by little.",
      ["hm-panel-house-change", "Column 3"],
    ),
    c(
      "panel-moritake",
      "In 1937, Takeichi Moritake (1902–1976), born and raised in Shiraoi, published the poem 'Jūka' (The house). It shows anger that traditional houses were mocked, and a strong wish to leave a good house for children and grandchildren.",
      ["hm-panel-house-change", "Column 4 (poem and commentary, paraphrased)"],
    ),
    c(
      "roads",
      "A road between Sapporo and Hakodate opened in 1873, and the first railway was built in 1882.",
      ["hokkaido-digest", "§ Transport"],
    ),
    // Today
    c(
      "rights-movement",
      "Ainu protested and campaigned for their rights. The Hokkaido Ainu Association was founded in 1946, and the 1899 Act was abolished in 1997.",
      ["hokkaido-digest", "Paragraph 4"],
      ["jta-19th-century", "English text, paragraph 3"],
    ),
    c(
      "recognition",
      "In 2008 both houses of the Diet recognized the Ainu as an indigenous people. A 2019 law also recognizes them as an indigenous people.",
      ["cas-policy", "§ Recent History of Ainu Policy"],
      ["cas-policy", "§ Promotion of comprehensive Ainu measures"],
    ),
    c(
      "upopoy",
      "Upopoy, the National Ainu Museum and Park, opened in Shiraoi in July 2020. Its park has recreated cise and offers dance, food and crafts.",
      ["hlj-upopoy", "Paragraphs 1–3 and park photo caption"],
    ),
    c(
      "restored-house",
      "The Hokkaido Museum shows a restored former house, rebuilt under the guidance of Yaichiro Hama (1916–91) of Shiraoi.",
      ["hm-guide", "§ An Old Ainu Home Restored"],
    ),
    c(
      "panel-homes-today",
      "Today, the everyday homes of Ainu people are the same as those of other people in Japan.",
      ["hm-panel-skills", "Paragraph 1, sentence 1"],
    ),
    c(
      "panel-rebuilt",
      "Traditional houses are still built as places that welcome visitors, in Shiraoi, Asahikawa and Biratori, and as museum exhibits. In such places, people who had lived in traditional houses passed the building skills on to younger people.",
      ["hm-panel-skills", "Paragraph 1, sentences 2–3"],
    ),
    c(
      "panel-2015-repair",
      "The house in the Hokkaido Museum was restored under the guidance of Yaichiro Hama (1916–91), born and raised in Shiraoi. When the museum reopened in 2015, young Ainu people from Shiraoi repaired it.",
      ["hm-panel-skills", "Paragraph 2"],
    ),
    c(
      "living-culture",
      "Today, crafts, rituals and oral traditions carry Ainu history and culture forward.",
      ["jta-19th-century", "English text, paragraph 3"],
    ),
    // Editorial notes (our own policy, not museum facts)
    c(
      "not-frozen",
      "These houses show history. They do not show how Ainu people live today, and Ainu culture is not frozen in the past.",
      ["living-hokkaido-policy", "PROJECT.md / Principles"],
    ),
    c(
      "illustrative-time",
      "The houses and land in this view are sketch shapes made for this demo, not a reconstruction of one real place. Years on the bar are approximate.",
      ["living-hokkaido-policy", "PROJECT.md / Principles; docs/STYLE.md"],
    ),
  ],
};

export const houseTimeline: TimelineInput = {
  id: "house-over-time",
  title: "The house over time",
  subtitle: "Scrub through the centuries",
  knowledgeId: "house-over-time",
  locationId: "lake-house",
  claimIds: ["illustrative-time", "not-frozen"],
  eras: [
    {
      id: "pit-dwellings",
      label: "Pit dwellings",
      period: "7th–12th century",
      year: 650,
      title: "Houses dug into the ground",
      summary:
        "People of the Satsumon culture lived in square pit dwellings, dug about 1 m deep, under a thatched roof that reached the ground. Settlements were near river mouths, with small fields and salmon fishing.",
      claimIds: ["satsumon-pit", "pit-build", "pit-dark", "satsumon-estuary"],
      stage: { house: "pit-dwelling", land: "estuary" },
    },
    {
      id: "flat-ground",
      label: "Flat ground",
      period: "Late Satsumon – about 13th century",
      year: 1200,
      title: "Out of the pit, onto flat ground",
      summary:
        "From late Satsumon times, people also built houses on flat ground, and by about the 13th century these were common in Hokkaido. An open fireplace replaced the cooking stove and iron pots spread. On the Kuril Islands and Sakhalin, pit dwellings stayed in use as winter homes until the 19th century.",
      claimIds: [
        "panel-flat-ground",
        "panel-kuril-sakhalin",
        "flat-shift",
        "iron-pots",
        "flat-why",
        "sakhalin",
      ],
      stage: { house: "flat-ground", land: "forest-river" },
    },
    {
      id: "cise-and-kotan",
      label: "Cise and kotan",
      period: "Up to the 19th century",
      year: 1700,
      title: "The cise in its village",
      summary:
        "The cise was built of wood, grasses and bark around an open hearth that never went cold. Walls and roofs used the grass, bamboo grass or bark of each region. Fish smoked above the hearth, treasures stood at the upper seat, and bark, cattail and a mortar waited by the door. Kotan stood near rivers or the sea, with a raised storehouse beside the house.",
      claimIds: [
        "cise-materials",
        "panel-regional-materials",
        "cise-hearth",
        "hearth-warm",
        "panel-hearth",
        "panel-smoked-fish",
        "panel-treasures",
        "panel-entry",
        "kotan-river",
        "storehouse",
        "kuca",
        "museum-age",
      ],
      stage: { house: "thatched", land: "forest-river", storehouse: true },
    },
    {
      id: "meiji",
      label: "Meiji era and after",
      period: "1869 – 1930s",
      year: 1869,
      title: "Forest becomes farmland",
      summary:
        "Ezo became Hokkaido. Farmer-soldiers cleared forest for fields and roads came. Ainu lost hunting and fishing grounds and ancestral land, and the 1899 Act pushed farming and left many poor. Traditional houses were called 'unhygienic' and people were urged to move to Japanese-style houses, which could be cold and harmful. Houses changed little by little, with board walls and glass windows.",
      claimIds: [
        "hokkaido-1869",
        "tondenhei",
        "land-loss",
        "act-1899",
        "roads",
        "panel-unhygienic",
        "panel-sunazawa",
        "panel-gradual",
        "panel-moritake",
      ],
      stage: { house: "thatched", land: "cleared-farmland", storehouse: true },
    },
    {
      id: "today",
      label: "Today",
      period: "1946 – now",
      year: 1946,
      title: "Rights, recognition and rebuilt houses",
      summary:
        "Ainu campaigned for their rights, and Japan now recognizes the Ainu as an indigenous people. Everyday homes are like any other in Japan. Cise are rebuilt as cultural places and museum exhibits, such as at Upopoy, and the building skills pass to younger people, while crafts and oral traditions continue.",
      claimIds: [
        "rights-movement",
        "recognition",
        "panel-homes-today",
        "panel-rebuilt",
        "upopoy",
        "restored-house",
        "panel-2015-repair",
        "living-culture",
        "not-frozen",
      ],
      stage: { house: "reconstructed", land: "museum-park", storehouse: true },
    },
  ],
};
