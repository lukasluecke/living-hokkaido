// Knowledge entry for the Otaru herring warehouse scene, in living-hokkaido's
// KnowledgeEntry shape. Every line the game shows about history is one of
// these claims. Research notes and open questions: facts.md (same folder).
import type {
  KnowledgeEntry,
  Source,
} from "../../../src/integration/contracts";

const web = (
  s: Pick<Source, "id" | "title" | "url" | "attribution">,
): Source => ({
  ...s,
  kind: "document",
  // Public web pages: we paraphrase, we do not reuse their text or images.
  rights: "unknown",
  consent: "pending",
  placeholder: false,
});

const mlitOtaruWarehouse = web({
  id: "mlit-former-otaru-warehouse",
  title: "Japan Tourism Agency multilingual database · Former Otaru Warehouse",
  url: "https://www.mlit.go.jp/tagengo-db/en/R5-00015.html",
  attribution: "Japan Tourism Agency / MLIT",
});
const mlitKitahama = web({
  id: "mlit-kitahama-warehouses",
  title:
    "Japan Tourism Agency multilingual database · Warehouses in the Kitahama Area",
  url: "https://www.mlit.go.jp/tagengo-db/en/R5-00011.html",
  attribution: "Japan Tourism Agency / MLIT",
});
const mlitCanal = web({
  id: "mlit-otaru-canal",
  title: "Japan Tourism Agency multilingual database · Otaru Canal",
  url: "https://www.mlit.go.jp/tagengo-db/en/R5-00045.html",
  attribution: "Japan Tourism Agency / MLIT",
});
const mlitCanalWarehouses = web({
  id: "mlit-canal-warehouses",
  title:
    "Japan Tourism Agency multilingual database · Warehouses along Otaru Canal",
  url: "https://www.mlit.go.jp/tagengo-db/common/001780312.docx",
  attribution: "Japan Tourism Agency / MLIT",
});
const visitHokkaido = web({
  id: "visit-hokkaido-otaru-history",
  title:
    "Visit Hokkaido · Unassuming Otaru's big role in Japan's modern history",
  url: "https://www.visit-hokkaido.jp/en/feature/otaru-history",
  attribution: "Hokkaido Tourism Organization",
});
const hroHerring = web({
  id: "hro-herring-assessment-2020",
  title: "Hokkaido Research Organization · Herring stock assessment (2020)",
  url: "https://www.hro.or.jp/upload/41977/21_nishin_hcjps-okh_2020.pdf",
  attribution: "Hokkaido Research Organization, Fisheries Research Department",
});

export const otaruWarehouseKnowledge: KnowledgeEntry = {
  id: "otaru-herring-warehouse",
  title: "Otaru herring warehouse, late Meiji",
  subtitle: "Out of Place · illustrated scene",
  presentation: "research-preview",
  sources: [
    mlitOtaruWarehouse,
    mlitKitahama,
    mlitCanal,
    mlitCanalWarehouses,
    visitHokkaido,
    hroHerring,
  ],
  claims: [
    {
      id: "otaru-warehouse-1890",
      text: "The Otaru Warehouse was built in 1890 on newly reclaimed land by two ship-owning merchants from Kaga.",
      citations: [
        {
          sourceId: mlitOtaruWarehouse.id,
          locator: "Former Otaru Warehouse (R5-00015), page text",
        },
      ],
    },
    {
      id: "otaru-warehouse-shachihoko",
      text: "Each roof ridge of the Otaru Warehouse carries a pair of ceramic shachihoko: fish-shaped ornaments believed to protect against fire, and a sign of wealth.",
      citations: [
        {
          sourceId: mlitOtaruWarehouse.id,
          locator: "Former Otaru Warehouse (R5-00015), page text",
        },
      ],
    },
    {
      id: "kitahama-tuff-on-timber",
      text: "Warehouses in Otaru's Kitahama area were built from tuff stone quarried around Otaru and Sapporo, fixed to wooden frames.",
      citations: [
        {
          sourceId: mlitKitahama.id,
          locator: "Warehouses in the Kitahama Area (R5-00011), page text",
        },
      ],
    },
    {
      id: "herring-fertilizer",
      text: "Most of the herring was ground into fertilizer for cotton and indigo fields.",
      citations: [
        {
          sourceId: visitHokkaido.id,
          locator:
            "Otaru history feature, page text (herring used as fertilizer)",
        },
      ],
    },
    {
      id: "kimura-warehouse-1894",
      text: "The Kimura family built their warehouse in 1894 to store fertilizer made from herring caught off Otaru.",
      citations: [
        {
          sourceId: mlitCanalWarehouses.id,
          locator: "Warehouses along Otaru Canal (001780312), Kimura Warehouse",
        },
      ],
    },
    {
      id: "herring-peak-1897",
      text: "Hokkaido's herring catch peaked in 1897 and then declined.",
      citations: [
        {
          sourceId: hroHerring.id,
          locator:
            'Herring stock assessment (2020): "1897年には 97万トンに達した"',
        },
      ],
    },
    {
      id: "otaru-canal-1914-1923",
      text: "Otaru Canal was built from 1914 to 1923, to ease moving goods between ships in the bay and the warehouses on shore.",
      citations: [
        {
          sourceId: mlitCanal.id,
          locator: "Otaru Canal (R5-00045), page text",
        },
      ],
    },
  ],
};
