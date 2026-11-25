// "Over time": how the house and its surroundings changed, in five eras.
// Research preview. Every era cites claims below; every claim cites a public
// page with a section or paragraph locator. Checked 2026-11-25 (JST).
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
      period: "13th–14th century",
      year: 1250,
      title: "Out of the pit, onto flat ground",
      summary:
        "Houses on flat ground replaced pit dwellings, and an open fireplace replaced the cooking stove. Iron pots spread. Satsumon culture changed into Ainu culture. Some families in colder areas kept pit dwellings for winter.",
      claimIds: ["flat-shift", "iron-pots", "flat-why", "sakhalin"],
      stage: { house: "flat-ground", land: "forest-river" },
    },
    {
      id: "cise-and-kotan",
      label: "Cise and kotan",
      period: "Up to the 19th century",
      year: 1700,
      title: "The cise in its village",
      summary:
        "The cise was built of wood, grasses and bark around an open hearth that never went cold. Kotan stood near rivers or the sea, with a raised storehouse beside the house.",
      claimIds: [
        "cise-materials",
        "cise-hearth",
        "hearth-warm",
        "kotan-river",
        "storehouse",
        "kuca",
        "museum-age",
      ],
      stage: { house: "thatched", land: "forest-river", storehouse: true },
    },
    {
      id: "meiji",
      label: "Meiji era",
      period: "1869 – early 1900s",
      year: 1869,
      title: "Forest becomes farmland",
      summary:
        "Ezo became Hokkaido. Farmer-soldiers cleared forest for fields and roads came. Ainu lost hunting and fishing grounds and ancestral land, and the 1899 Act pushed farming and left many poor.",
      claimIds: [
        "hokkaido-1869",
        "tondenhei",
        "land-loss",
        "act-1899",
        "roads",
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
        "Ainu campaigned for their rights, and Japan now recognizes the Ainu as an indigenous people. Cise are rebuilt in museums and parks such as Upopoy, while crafts and oral traditions continue.",
      claimIds: [
        "rights-movement",
        "recognition",
        "upopoy",
        "restored-house",
        "living-culture",
        "not-frozen",
      ],
      stage: { house: "reconstructed", land: "museum-park", storehouse: true },
    },
  ],
};
