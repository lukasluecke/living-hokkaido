// Knowledge for the "From bark to cloth" research preview. Text comes from
// src/data/story.ts (the existing seed). Do not add claims here without a
// source and locator; see docs/RESEARCH.md.
import type { KnowledgeEntry, Source } from "@/contracts";
import { researchClaims, story } from "@/data/story";

const museum = (id: string): Source => {
  const s = story.sources.find((x) => x.id === id);
  if (!s) throw Error(`Missing seed source ${id}`);
  return {
    id: s.id,
    title: s.title,
    url: s.url,
    kind: "museum",
    rights: "unknown",
    consent: "pending",
    attribution: s.title,
    placeholder: false,
  };
};

const policy: Source = {
  id: "living-hokkaido-policy",
  title: "Living Hokkaido · editorial policy and asset notes",
  kind: "document",
  rights: "approved",
  consent: "granted",
  attribution:
    "Living Hokkaido team (PROJECT.md, public/models/ATTRIBUTION.md)",
  placeholder: false,
};

// Public pages that name the Ainu words used in the words activity.
// Draft: listed in docs/REVIEW.md for the language review pass.
const obihiro: Source = {
  id: "obihiro-museum",
  title: "Obihiro Centennial City Museum · Ainu culture glossary (Attus)",
  url: "https://www.museum-obihiro.jp/mg/?p=386",
  kind: "museum",
  rights: "unknown",
  consent: "pending",
  attribution: "Obihiro Centennial City Museum",
  placeholder: false,
};
const mlit: Source = {
  id: "mlit-ainu-crafts",
  title: "Japan Tourism Agency multilingual database · Ainu Crafts",
  url: "https://www.mlit.go.jp/tagengo-db/common/001928281.pdf",
  kind: "document",
  rights: "unknown",
  consent: "pending",
  attribution: "Japan Tourism Agency (MLIT), multilingual commentary database",
  placeholder: false,
};

/** A Hokkaido Museum exhibit panel or Q&A card, read on site (no public
 *  URL). Full text: docs/research/hokkaido-museum/transcriptions/panels.md
 *  (museum text, not MIT). Claims below are short paraphrases. */
const hmPanel = (id: string, title: string, section: string): Source => ({
  id,
  title: `Hokkaido Museum exhibit panel: ${title}`,
  kind: "museum",
  rights: "unknown",
  consent: "pending",
  attribution: `Hokkaido Museum, permanent exhibition, ${section}. Photographed 2026-11-25.`,
  placeholder: false,
});
const hmBarkRobe = hmPanel(
  "hm-panel-bark-robe",
  "樹皮衣をつくる (Making a bark-fiber robe)",
  "theme 2, 2 衣服 Clothing",
);
const hmClothing = hmPanel(
  "hm-panel-clothing",
  "2 衣服 Clothing (Pocket Curator 239)",
  "theme 2, 2 衣服 Clothing",
);
const hmQa = hmPanel(
  "hm-qa-binder",
  "アイヌ文化Q&A (Ainu culture Q&A cards)",
  "theme 2, Q&A binder answered by museum staff",
);

/** Placeholder audio source for the sample curator memory (memories.ts).
 *  No recording exists. Replace with a real, consented recording. */
const sampleMemoryAudio: Source = {
  id: "sample-memory-audio",
  title: "Sample curator memory · placeholder, no recording",
  kind: "audio",
  rights: "unknown",
  consent: "pending",
  attribution: "Living Hokkaido team (sample text, not a curator)",
  placeholder: true,
};

export const barkToCloth: KnowledgeEntry = {
  id: "bark-to-cloth",
  title: story.title,
  subtitle: story.subtitle,
  presentation: "research-preview",
  narration: story.narration,
  sources: [
    museum("hdm"),
    museum("nam"),
    policy,
    obihiro,
    mlit,
    sampleMemoryAudio,
    hmBarkRobe,
    hmClothing,
    hmQa,
  ],
  claims: [
    ...researchClaims,
    {
      id: "term-attus",
      text: "In Ainu, cloth and clothes made from bark fiber are called attus (also written attush).",
      citations: [
        {
          sourceId: "obihiro-museum",
          locator: "Attus [Garments/Kimono (Clothes made from bark)]",
        },
        {
          sourceId: "hdm",
          locator: "Outline of Ainu clothing / Bark clothes (attush)",
        },
        {
          sourceId: "nam",
          locator: "3D exhibits list: Garment (bark fiber) [Attus/Ahrus]",
        },
        {
          sourceId: "mlit-ainu-crafts",
          locator: 'Ainu Crafts: "a durable fabric called attus"',
        },
      ],
    },
    {
      id: "term-isitaykini",
      text: "In Ainu, a loom is called isitaykini.",
      citations: [
        {
          sourceId: "obihiro-museum",
          locator: "Attus page: isitaykini [Loom]",
        },
      ],
    },
    {
      id: "robe-maker",
      text: "The museum records how Fujitani Rumiko of Nibutani (Biratori, Hidaka) made an ohyo bark robe for her husband, with the method she learned from her mother.",
      citations: [
        {
          sourceId: "hm-panel-bark-robe",
          locator: "Lead text, Photo IMG_7717",
        },
      ],
    },
    {
      id: "robe-step-peel",
      text: "Cut the bark at the base of the trunk and peel it, best from spring to summer when the tree holds more water. Separate the inner bark from the outer bark.",
      citations: [
        { sourceId: "hm-panel-bark-robe", locator: "Step 1, Photo IMG_7717" },
      ],
    },
    {
      id: "robe-step-soften",
      text: "Boil the inner bark in hot water until it is soft. Some makers soak it in a marsh for about ten days, or in a hot spring.",
      citations: [
        { sourceId: "hm-panel-bark-robe", locator: "Step 2, Photo IMG_7717" },
      ],
    },
    {
      id: "robe-step-layers",
      text: "Wash it well in water to remove the slime, and peel the fiber layers apart.",
      citations: [
        { sourceId: "hm-panel-bark-robe", locator: "Step 3, Photo IMG_7717" },
      ],
    },
    {
      id: "robe-step-thread",
      text: "Split the layers into thin strips and make them into thread.",
      citations: [
        { sourceId: "hm-panel-bark-robe", locator: "Step 4, Photo IMG_7717" },
      ],
    },
    {
      id: "robe-step-weave",
      text: "Weave the thread into cloth.",
      citations: [
        { sourceId: "hm-panel-bark-robe", locator: "Step 5, Photo IMG_7717" },
      ],
    },
    {
      id: "robe-step-sew",
      text: "Cut and sew the robe from the finished cloth, then add embroidery.",
      citations: [
        { sourceId: "hm-panel-bark-robe", locator: "Step 6, Photo IMG_7717" },
      ],
    },
    {
      id: "clothing-materials",
      text: "Older garments were made from animal hides, fish skins, or cloth woven from tree-bark or grass fibers. When cotton came through trade, people decorated clothes with cotton strips and thread, and made robes of cotton.",
      citations: [
        {
          sourceId: "hm-panel-clothing",
          locator: "Panel text (museum English), sentences 1–2, photo IMG_7720",
        },
      ],
    },
    {
      id: "clothing-today",
      text: "These clothes are not worn in daily life today, but people wear them more and more at ceremonies and at song and dance performances.",
      citations: [
        {
          sourceId: "hm-panel-clothing",
          locator: "Panel text (museum English), sentences 3–4, photo IMG_7720",
        },
      ],
    },
    {
      id: "pattern-techniques",
      text: "Patterns are embroidered directly on the cloth, made by sewing other cloth on top, or both. The placement differs on each garment, and regions have their own features.",
      citations: [
        { sourceId: "hm-qa-binder", locator: "Q&A no. 008, photo IMG_7794" },
      ],
    },
    {
      id: "pattern-asymmetry",
      text: "A pattern that looks mirrored along the back is often not perfectly symmetric. Each robe shows its maker's careful handwork.",
      citations: [
        { sourceId: "hm-qa-binder", locator: "Q&A no. 008, photo IMG_7794" },
      ],
    },
    {
      id: "illustrative",
      text: "Sketch geometry made for this demo. It is not a museum object, scan or reconstruction.",
      citations: [
        {
          sourceId: "living-hokkaido-policy",
          locator: "public/models/ATTRIBUTION.md",
        },
      ],
    },
    {
      id: "no-technique",
      text: "This grid invites close looking. It does not teach an authenticated weaving technique.",
      citations: [
        {
          sourceId: "living-hokkaido-policy",
          locator: "PROJECT.md / Principles",
        },
      ],
    },
  ],
};
