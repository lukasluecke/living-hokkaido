// Knowledge for the four themed areas of the island (coast, forest, hills,
// mountains). From Lukas's photos at the Hokkaido Museum, 2026-11-25:
// theme 2 "1 食べる" (Ainu diet: hunting, fishing, gathering) and theme 4
// "自然の恵みとともに" (Meiji–Showa: land survey, sea, mountains).
// Research preview: every claim is a short paraphrase of one panel, with the
// photo id as the locator. Transcriptions:
// docs/research/hokkaido-museum/transcriptions/panels.md. The photos stay out
// of Git (museum rights).
//
// Two different histories meet here. Theme 2 is about Ainu ways of life;
// theme 4 is about the colonial development of Hokkaido from the Meiji era.
// Each claim says whose history it is. Do not merge them into one story.
// The island scenes for these areas are toy sketches after the museum
// dioramas (claim area-sketch), not reconstructions.
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
    "hm-panel-hunt-fish",
    "1 食べる: 狩猟 / 漁労 (hunting, fishing), bench panel",
    "theme 2 伝統を学ぶ (photo 7744)",
  ),
  onSite(
    "hm-panel-diet",
    "1 食べる (Diet), section panel, PC 232",
    "theme 2 伝統を学ぶ (photo 7750)",
  ),
  onSite(
    "hm-panel-salmon-film",
    "記録映像の中のサケ漁 (salmon fishing in a 1925 film), PC 234/235",
    "theme 2 伝統を学ぶ (photo 7748)",
  ),
  onSite(
    "hm-panel-beliefs-2",
    "いのる (Beliefs), panel 3, いろいろなカムイ",
    "theme 2 伝統を学ぶ (photo 7727)",
  ),
  onSite(
    "hm-qa-kamuy",
    "アイヌ文化Q&A, Q019 (are all animals kamuy?)",
    "theme 2, Q&A binder (photo 7806)",
  ),
  onSite(
    "hm-panel-survey",
    "殖民地区画の作業をしているところ (land survey diorama), PC 314",
    "theme 4 自然の恵みとともに (photos 7865–7872)",
  ),
  onSite(
    "hm-panel-sea",
    "3 海に生きる (Living off the Sea), PC 318",
    "theme 4 自然の恵みとともに (photo 7873; herring diorama 7874–7876)",
  ),
  onSite(
    "hm-panel-mountains",
    "4 山に生きる (Living off the Mountains), PC 325",
    "theme 4 自然の恵みとともに (photo 7877; mine diorama 7878–7883)",
  ),
  {
    id: "area-notes",
    title: "Living Hokkaido · notes on the island's themed areas",
    kind: "document",
    rights: "approved",
    consent: "granted",
    attribution:
      "Living Hokkaido team. The island scenes are sketches for this demo, after museum dioramas photographed by Lukas.",
    placeholder: false,
  },
];

const c = (id: string, text: string, ...cites: [string, string][]) => ({
  id,
  text,
  citations: cites.map(([sourceId, locator]) => ({ sourceId, locator })),
});

export const landAndSea: KnowledgeEntry = {
  id: "land-and-sea",
  title: "Living from the sea, forest and mountains",
  subtitle: "Coast, forest, hills and mountains of the island",
  presentation: "research-preview",
  sources,
  claims: [
    // ------------------------------------------------ all areas
    c(
      "diet-ways",
      "Ainu people got their food by hunting in the hills, fishing in the rivers and the sea, gathering plants and nuts in fields and forests, and farming.",
      ["hm-panel-diet", "Panel text, sentence 1 (photo 7750)"],
    ),
    c(
      "area-sketch",
      "The coast, forest, hills and mountain scenes on this island are toy sketches after museum dioramas. They are not reconstructions of real places.",
      ["area-notes", "src/content/bark-to-cloth/land-and-sea.ts, header"],
    ),
    // ------------------------------------------------ coast
    c(
      "sea-catch-ainu",
      "In the sea, Ainu people caught fish such as cod, flounder, herring and swordfish, sea mammals such as fur seals, shellfish such as scallops and surf clams, and seaweeds such as kombu and wakame.",
      ["hm-panel-hunt-fish", "漁労, sentence 2 (photo 7744)"],
    ),
    c(
      "river-catch-ainu",
      "In the rivers, Ainu people caught salmon, trout, itou and shishamo.",
      ["hm-panel-hunt-fish", "漁労, sentence 1 (photo 7744)"],
    ),
    c(
      "salmon-ban",
      "In 1878 the Kaitakushi (the colonial development office) banned salmon fishing on the Chitose River. Some people who had always fished there went on, because it was how they lived; it was then called 'poaching'.",
      [
        "hm-panel-salmon-film",
        "記録映像の中のサケ漁, sentences 3–5 (photo 7748)",
      ],
    ),
    c(
      "sea-bounty",
      "Herring, salmon, trout, kelp, squid, crab, cod, scallop, Okhotsk Atka mackerel, sea urchin, abalone and sea cucumber all stand for Hokkaido seafood.",
      ["hm-panel-sea", "Panel text, sentences 1–2 (photo 7873)"],
    ),
    c(
      "sea-nets",
      "Fishers cast large nets in bays not far from land, and many boats went out to the distant northern seas.",
      ["hm-panel-sea", "Panel text, sentence 3 (photo 7873)"],
    ),
    c(
      "sea-products",
      "The catch was made into dried and canned foods that keep for a long time, and even into fertiliser for fields and rice paddies.",
      ["hm-panel-sea", "Panel text, sentence 4 (photo 7873)"],
    ),
    // ------------------------------------------------ forest
    c(
      "survey-1890",
      "One museum diorama shows a scene from 1890 in Naie village, Sorachi district (today Naie town): a survey team sent by the Hokkaido government studies the climate, soil, plants and animals and divides the land into plots with straight lines.",
      ["hm-panel-survey", "Panel text, sentences 1–2 (photo 7865)"],
    ),
    c(
      "survey-purpose",
      "Land fit for farming was chosen in advance and cut into plots, so that clearing could go by plan. The Hokkaido government did this from about 1890.",
      ["hm-panel-survey", "Panel text, sentences 3–4 (photo 7865)"],
    ),
    c(
      "survey-ainu",
      "Among the people hired to guide the survey and to carry its loads were Ainu people.",
      ["hm-panel-survey", "Panel text, last sentence (photo 7865)"],
    ),
    c(
      "survey-tasks",
      "The panel's drawing of the survey diorama names four tasks: surveying, carrying the things the survey needs, cutting trees that are in the way of the survey, and putting up tents to stay the night.",
      ["hm-panel-survey", "Panel drawing, four callouts (photo 7865)"],
    ),
    c(
      "winter-logging",
      "Hokkaido had many forests of thick trees. In winter, many people worked in the woods, felling trees with large saws and hauling the wood on horse-drawn sleighs.",
      ["hm-panel-mountains", "Panel text, sentences 4–5 (photo 7877)"],
    ),
    c(
      "sea-diorama-tasks",
      "In the museum's herring diorama, workers carry the catch from the boats up to the yard, and fish lie spread on mats on the ground. This is what the diorama shows; the panel text does not name these tasks.",
      [
        "hm-panel-sea",
        "Herring diorama, observed in photos 7874–7875 (not panel text)",
      ],
    ),
    // ------------------------------------------------ hills (animals)
    c(
      "hunt-animals",
      "Large animals that Ainu people hunted for food included Hokkaido sika deer and brown bears; smaller ones included raccoon dogs and hares, and birds such as hazel grouse and jays.",
      ["hm-panel-hunt-fish", "狩猟, sentence 1 (photo 7744)"],
    ),
    c(
      "set-bow",
      "A set bow was placed on an animal path. When an animal touched its string, an arrow was released. The tip was often poisoned, for example with aconite root, and capped against rain and dew.",
      ["hm-panel-hunt-fish", "仕掛け弓 diagram text (photo 7744)"],
    ),
    c(
      "bear-use",
      "Nothing was wasted: the meat and fat of a brown bear became food, and the pelt became household goods or trade goods.",
      ["hm-panel-diet", "Panel text, last sentence (photo 7750)"],
    ),
    c(
      "bear-wolf-kamuy",
      "Among animals, the brown bear and the wolf, which is now extinct, were important kamuy in many regions.",
      [
        "hm-panel-beliefs-2",
        "いろいろなカムイ, bear photo caption (photo 7727)",
      ],
    ),
    c(
      "deer-not-kamuy",
      "Not every animal is a kamuy: traditions in which the deer is not a kamuy are known in many parts of Hokkaido.",
      ["hm-qa-kamuy", "Q019 (photo 7806), answer, sentence 3"],
    ),
    // ------------------------------------------------ mountains
    c(
      "coal-deposits",
      "Hokkaido held large untapped coal deposits. Around the end of the 19th century, coal mining began in earnest; it employed many people and several towns were built.",
      ["hm-panel-mountains", "Panel text, sentences 1–2 (photo 7877)"],
    ),
    c(
      "coal-producer",
      "Hokkaido became, with Kitakyushu, one of Japan's top coal producers. Coal had become essential for industry and daily life across the country.",
      ["hm-panel-mountains", "Panel text, sentence 3 (photo 7877)"],
    ),
    c(
      "mine-diorama-tasks",
      "In the museum's coal mine figures, one miner drills the coal face with a machine and another shovels the loose coal. This is what the figures show; the panel text does not name these tasks.",
      [
        "hm-panel-mountains",
        "Mine figures, observed in photos 7878–7880 (not panel text)",
      ],
    ),
  ],
};
