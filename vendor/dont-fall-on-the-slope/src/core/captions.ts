// Gallery captions (step 5): a museum wall label for each of the 12
// researched building types, in order down the street, shown when the
// player passes that building cleanly. Pure data and rules; the HUD draws
// the card.
//
// Titles and label lines come from content/otaru-slope.md (research
// preview, not reviewed). Each keeps its source so the line stays
// traceable. The street is illustrative: these are building *types*, not
// copies of real buildings. The quips are the deadpan guide's game lines
// and must never state history.
import type { Building, BuildingKind } from "./track";

/** Labelled buildings per street (the "captions collected" total). */
export const CAPTION_COUNT = 12;
/** A caption pops up this far past the building's downhill end (m). */
export const PASS_MARGIN = 0.5;
/** How long a caption stays on screen (s). */
export const CAPTION_SECONDS = 2;

export type GalleryType = {
  /** Generic name for the game (no real shop names). */
  title: string;
  /** The wall-label line from the research file. */
  label: string;
  /** Source(s) for the label, from content/otaru-slope.md. */
  sources: string[];
  /** The street mesh that suits it best (step 6 replaces the meshes). */
  prefer: BuildingKind;
};

const MLIT = (id: string) => `https://www.mlit.go.jp/tagengo-db/en/${id}.html`;

/** The 12 types, top of the slope to the canal (content/otaru-slope.md). */
export const GALLERY: readonly GalleryType[] = [
  {
    title: "Merchant House with Fire Walls",
    label: "Merchant house, c. 1895. Stone, roof tiles, fire walls.",
    sources: [MLIT("R5-00032")],
    prefer: "stone-warehouse",
  },
  {
    title: "Clock Shop with a Band Balcony",
    label:
      "Clock shop, early 20th century. Tuff stone, arched doors, a balcony for the band.",
    sources: [MLIT("R5-00031")],
    prefer: "stone-warehouse",
  },
  {
    title: "Rice Merchant",
    label: "Rice merchant, 1912. Brick, two storeys.",
    sources: [
      MLIT("R5-00029"),
      "https://studio-sakyo.jp/popup/01hokkaido/03douou/kyosei/kyosei-company_en.html",
    ],
    prefer: "wooden-shop",
  },
  {
    title: "Wholesale Store",
    label: "Wholesale store. Sugar, cotton, rice. Snow, free of charge.",
    sources: [MLIT("R5-00029"), MLIT("R5-00045")],
    prefer: "wooden-shop",
  },
  {
    title: "Glass Workshop",
    label:
      "Glass workshop, from 1901. Oil lamps, net floats, a great deal of heat.",
    sources: [MLIT("R5-00017"), "https://domingo.ne.jp/en/article/12444"],
    prefer: "glass-workshop",
  },
  {
    title: "Herring Fertilizer Warehouse",
    label:
      "Stone warehouse, 1890s. Volcanic stone on a timber frame. Cart rails inside.",
    sources: [MLIT("R5-00017")],
    prefer: "stone-warehouse",
  },
  {
    title: "Lamp-Lit Hall",
    label: "Lamp hall. 167 oil lamps, lit by hand. Not by you.",
    sources: [
      MLIT("R5-00017"),
      "https://www.atlasobscura.com/places/kitaichi-hall-japan",
    ],
    prefer: "glass-workshop",
  },
  {
    title: "Bank",
    label: "Bank, 1910s. Stone columns. Your deposit was not accepted.",
    sources: [MLIT("R5-00029"), MLIT("R5-00027")],
    prefer: "stone-warehouse",
  },
  {
    title: "Shipowner's Warehouse with Roof Creatures",
    label: "Shipowner's warehouse, 1890. Eight roof creatures, all watching.",
    sources: [MLIT("R5-00015")],
    prefer: "stone-warehouse",
  },
  {
    title: "Shipping House with a Painted Mark",
    label: "Shipping house, 1890s. Two black lines. Not a warning.",
    sources: [MLIT("R5-00013")],
    prefer: "wooden-shop",
  },
  {
    title: "Hotel",
    label: "Hotel, 1931. Rooms available. Brakes not included.",
    sources: [MLIT("R5-00029")],
    prefer: "wooden-shop",
  },
  {
    title: "Canal Warehouse",
    label: "Canal warehouse, 1925. Stone and timber. The end of the line.",
    sources: [
      "https://www.mlit.go.jp/tagengo-db/R5-00047.html",
      MLIT("R5-00045"),
    ],
    prefer: "stone-warehouse",
  },
];

/** The key fact of each type in a few words, readable in 2 s, in GALLERY
 *  order. Taken from the label lines (dates and materials only). */
export const SHORTS: readonly string[] = [
  "c. 1895 · Stone, tiles, fire walls",
  "Early 1900s · Band balcony",
  "1912 · Brick, two storeys",
  "Sugar, cotton, rice",
  "From 1901 · Oil lamps, net floats",
  "1890s · Volcanic stone, cart rails",
  "Today · 167 oil lamps, hand-lit",
  "1910s · Stone columns",
  "1890 · Eight roof creatures",
  "1890s · A painted family mark",
  "1931 · Rooms available",
  "1925 · Stone and timber",
];

export type Caption = {
  id: string;
  buildingId: string;
  /** Position in GALLERY (0–11). */
  index: number;
  /** The player must get past this point (m downhill). */
  at: number;
  /** Building length along the street (m), for the dwell-time quip. */
  length: number;
  title: string;
  label: string;
  /** The key fact, readable in 2 s (shown on the card). */
  short: string;
  sources: string[];
};

/** The guide's line about the visitor. {t} becomes the viewing time.
 *  Game lines only: no dates, eras or facts. */
const QUIPS = [
  "The visitor did not stop to appreciate it.",
  "Viewed for {t} seconds. A record, possibly.",
  "The visitor passed with admirable restraint.",
  "Appreciated briefly, and sideways.",
  "The visitor's interpretation was mostly downhill.",
  "Viewed for {t} seconds, which the artist will not be told.",
  "The visitor kept a respectful distance, by luck.",
  "A fleeting encounter. The building remains unmoved.",
];

/**
 * Give the 12 gallery types to 12 buildings, in order down the street. The
 * street (only buildings ending before `before`) is cut into 12 equal
 * stretches; each type takes a building from its stretch, preferring the
 * mesh kind that suits it. Deterministic for a track.
 */
export function placeCaptions(
  buildings: Building[],
  before: number,
): Caption[] {
  const pool = buildings
    .filter((b) => b.s0 >= 0 && b.s1 + PASS_MARGIN < before)
    .sort((a, b) => a.s0 - b.s0 || a.side - b.side);
  if (!pool.length) return [];
  const n = Math.min(GALLERY.length, pool.length);
  const used = new Set<string>();
  const out: Caption[] = [];
  for (let i = 0; i < n; i++) {
    const type = GALLERY[i] as GalleryType;
    const lo = Math.floor((i * pool.length) / n);
    const hi = Math.max(lo + 1, Math.floor(((i + 1) * pool.length) / n));
    const stretch = pool.slice(lo, hi).filter((b) => !used.has(b.id));
    const b =
      stretch.find((x) => x.kind === type.prefer) ??
      stretch[0] ??
      (pool.find((x) => !used.has(x.id)) as Building);
    used.add(b.id);
    out.push({
      id: `caption-${i + 1}`,
      buildingId: b.id,
      index: i,
      at: b.s1 + PASS_MARGIN,
      length: b.s1 - b.s0,
      title: type.title,
      label: type.label,
      short: SHORTS[i] ?? type.label,
      sources: type.sources,
    });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** Captions just earned at `s`: passed and not collected yet. */
export function passedCaptions(
  captions: Caption[],
  collected: ReadonlySet<string>,
  s: number,
): Caption[] {
  return captions.filter((c) => s >= c.at && !collected.has(c.id));
}

/** The guide's line for the nth caption earned this run. */
export function quipFor(n: number, length: number, speed: number): string {
  const q = QUIPS[n % QUIPS.length] ?? QUIPS[0] ?? "";
  const t = (length / Math.max(speed, 0.5)).toFixed(1);
  return q.replace("{t}", t);
}
