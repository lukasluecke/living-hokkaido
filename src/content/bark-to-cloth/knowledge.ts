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

export const barkToCloth: KnowledgeEntry = {
  id: "bark-to-cloth",
  title: story.title,
  subtitle: story.subtitle,
  presentation: "research-preview",
  narration: story.narration,
  sources: [museum("hdm"), museum("nam"), policy, obihiro, mlit],
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
