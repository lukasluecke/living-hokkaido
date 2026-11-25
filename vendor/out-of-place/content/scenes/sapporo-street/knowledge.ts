// Knowledge entry for the Meiji Sapporo street scene (around 1889), in
// living-hokkaido's KnowledgeEntry shape. Research notes: scenes/sapporo-street.md.
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

const tokeidai = web({
  id: "sapporo-city-tokeidai",
  title:
    "Sapporo City · Important Cultural Property: Former Sapporo Agricultural College Drill Hall (Clock Tower)",
  url: "https://www.city.sapporo.jp/ncms/shimin/bunkazai/pdf/TOKEIDAI.pdf",
  attribution: "Sapporo City",
});
const akarenga = web({
  id: "sapporo-travel-akarenga",
  title: "Sapporo Travel · Former Hokkaido Government Office",
  url: "https://www.sapporo.travel/spot/facility/former_hokkaido_government_office/",
  attribution: "Sapporo Tourism and Convention Bureau",
});
const kaitakushi = web({
  id: "sapporo-travel-kaitakushi",
  title:
    "Sapporo Travel · Kaitakushi story: the legacy of the Kaitakushi in Sapporo",
  url: "https://www.sapporo.travel/?p=57661",
  attribution: "Sapporo Tourism and Convention Bureau",
});
const toyohira = web({
  id: "sapporo-toyohira-transport",
  title: "Sapporo City, Toyohira Ward · ward history: transport",
  url: "https://www.city.sapporo.jp/toyohira/gaiyou/documents/5koutsuukikan.pdf",
  attribution: "Sapporo City, Toyohira Ward",
});
const ndlDress = web({
  id: "ndl-ceremonial-dress",
  title:
    "National Diet Library · Japan and France, column on Western ceremonial dress",
  url: "https://www.ndl.go.jp/france/jp/column/s2_2.html",
  attribution: "National Diet Library",
});
const chronology = web({
  id: "sapporo-chuo-chronology",
  title: "Sapporo City, Chuo Ward · ward chronology",
  url: "https://www.city.sapporo.jp/chuo/gaiyo/nenpyo.html",
  attribution: "Sapporo City, Chuo Ward",
});
const tram = web({
  id: "sapporo-travel-tram",
  title: "Sapporo Travel · Sapporo streetcar story",
  url: "https://www.sapporo.travel/bunkazaisanpo/sapporotram/",
  attribution: "Sapporo Tourism and Convention Bureau",
});
const tvTower = web({
  id: "sapporo-travel-tv-tower",
  title: "Sapporo Travel · Sapporo TV Tower, cultural property feature",
  url: "https://www.sapporo.travel/spot/feature/sapporo-tvtower-cultural-property/",
  attribution: "Sapporo Tourism and Convention Bureau",
});

export const sapporoStreetKnowledge: KnowledgeEntry = {
  id: "meiji-sapporo-street",
  title: "A Meiji street in Sapporo, around 1889",
  subtitle: "Out of Place · illustrated scene",
  presentation: "research-preview",
  sources: [
    tokeidai,
    akarenga,
    kaitakushi,
    toyohira,
    ndlDress,
    chronology,
    tram,
    tvTower,
  ],
  claims: [
    {
      id: "sapporo-clock-tower-1878",
      text: "The Sapporo Clock Tower was built in 1878 as the drill hall of Sapporo Agricultural College; the clock tower was added in 1881.",
      citations: [
        {
          sourceId: tokeidai.id,
          locator:
            "Cultural property sheet: completed October 1878 (Meiji 11), clock tower added 1881 (Meiji 14)",
        },
      ],
    },
    {
      id: "hokkaido-government-office-1888",
      text: "The Hokkaido Government Office, a red-brick building in the American neo-baroque style, was completed in 1888.",
      citations: [{ sourceId: akarenga.id, locator: "Facility page text" }],
    },
    {
      id: "sapporo-rickshaws",
      text: "Until passenger horse carriages started in the early Taishō era, the rickshaw was the only transport between Tsukisamu and Sapporo.",
      citations: [
        {
          sourceId: toyohira.id,
          locator: "Transport section: rickshaws before horse carriages",
        },
      ],
    },
    {
      id: "western-ceremonial-dress-1872",
      text: "In November 1872 the government set Western-style ceremonial dress for officials, modelled partly on British and French court dress.",
      citations: [
        {
          sourceId: ndlDress.id,
          locator: "Column text: ceremonial dress set 12 November 1872",
        },
      ],
    },
    {
      id: "sapporo-grid-1871",
      text: "In 1871 the Kaitakushi laid out Sapporo as a grid of blocks, divided north–south by Ōdōri and east–west by the Sōsei River.",
      citations: [
        { sourceId: kaitakushi.id, locator: "Story text: 1871 street plan" },
      ],
    },
    {
      id: "sapporo-gas-lamps-1912",
      text: "Sapporo's first gas lamps were lit in 1912.",
      citations: [
        {
          sourceId: chronology.id,
          locator: "Chronology: Taishō 1, first gas lamps",
        },
      ],
    },
    {
      id: "sapporo-electric-light-1891",
      text: "Electric lights first came on in Sapporo in 1891.",
      citations: [
        {
          sourceId: chronology.id,
          locator: "Chronology: Meiji 24, first electric lights",
        },
      ],
    },
    {
      id: "sapporo-streetcar-1918",
      text: "Sapporo's first electric streetcar ran in August 1918; a horse-drawn railway had started in 1909.",
      citations: [
        {
          sourceId: tram.id,
          locator:
            "Story text: 1909 horse railway, August 1918 first streetcar",
        },
      ],
    },
    {
      id: "sapporo-tv-tower-1957",
      text: "Sapporo TV Tower opened as a tourist facility in August 1957.",
      citations: [
        {
          sourceId: tvTower.id,
          locator: "Feature page text: opened August 1957",
        },
      ],
    },
  ],
};
