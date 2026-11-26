// What each building looks like (step 6). Pure: decides the features; the
// street builder (src/world/street.ts) turns them into meshes. Meshes only:
// nothing here may change a building's footprint or height, because the
// collider boxes come from the track (physics/world.ts buildingBox).
//
// The 12 labelled buildings follow content/otaru-slope.md ("Street details
// for the art"): fire walls on merchant fronts, roof creatures on a few
// richer buildings, made-up painted marks (never a real family's mark), no
// real names or logos. Other buildings get a seeded mix of the same parts.
import type { Caption } from "./captions";
import { rng } from "./random";
import type { Building } from "./track";

export type Wall = "stone" | "tuff" | "brick" | "wood" | "plaster";
/** Made-up painted marks. None copies a real family's mark. */
export const MARKS = ["ring-bar", "diamond-dot", "three-dots"] as const;
export type Mark = (typeof MARKS)[number];

/** The building's overall shape, after the real Otaru building types in
 *  content/otaru-slope.md (generic forms for the rest of the street). */
export type Form =
  | "kura-shop" // 1 stone storehouse-style shop: fire walls, plaster shutters
  | "clock-shop" // 2 tuff, arched ground floor, band balcony
  | "brick-merchant" // 3 red brick, white stone bands, arched windows
  | "machiya" // 4 timber shop: lattice front, tiled eave, curtain
  | "glass-shop" // 5 stone warehouse with glass displays
  | "gable-warehouse" // 6, 10 stone warehouse, gable end to the street
  | "lamp-hall" // 7 stone warehouse, lamp-filled windows
  | "bank" // 8 stucco, pilasters, copper domes
  | "gate-warehouse" // 9 tiled warehouse with a gated entrance
  | "hotel" // 11 early-Showa block, flat roof
  | "canal-warehouse" // 12 long stone warehouse, rows of shutters
  | "stone-warehouse" // generic
  | "wooden-shop" // generic
  | "clapboard-house"; // generic: western-style wooden house, gable front

export type Facade = {
  form: Form;
  wall: Wall;
  roof: "slate" | "tile" | "red";
  /** Udatsu fire walls at both ends of the front. */
  fireWalls: boolean;
  /** Roof creatures (shachihoko) along the ridge. */
  creatures: number;
  mark: Mark | null;
  /** Shop window at street level: lit, glass wares, or none (doors). */
  ground: "shop" | "glass-display" | "doors" | "arched-doors";
  /** Plastered fireproof shutters on the upper floor. */
  shutters: boolean;
  balcony: boolean;
  clock: boolean;
  columns: boolean;
  turrets: boolean;
  /** Rows of small warm lamps in every window. */
  lamps: boolean;
  /** An extra storey drawn above the roofline (no collider change). */
  extraStorey: boolean;
  canopy: boolean;
  curtain: boolean;
  chimney: boolean;
};

const plain = (b: Building): Facade => ({
  form:
    b.kind === "stone-warehouse"
      ? "stone-warehouse"
      : b.kind === "wooden-shop"
        ? "wooden-shop"
        : "glass-shop",
  wall:
    b.kind === "stone-warehouse"
      ? "stone"
      : b.kind === "wooden-shop"
        ? "wood"
        : "plaster",
  roof: b.kind === "wooden-shop" ? "red" : "slate",
  fireWalls: false,
  creatures: 0,
  mark: null,
  ground:
    b.kind === "stone-warehouse"
      ? "doors"
      : b.kind === "glass-workshop"
        ? "glass-display"
        : "shop",
  shutters: false,
  balcony: false,
  clock: false,
  columns: false,
  turrets: false,
  lamps: false,
  extraStorey: false,
  canopy: b.kind === "wooden-shop",
  curtain: b.kind === "wooden-shop",
  chimney: b.kind === "glass-workshop",
});

/** Features for the 12 researched types, by gallery index (0–11). */
const TYPES: ((f: Facade) => Partial<Facade>)[] = [
  // 1 Merchant house with fire walls: stone, tiles, udatsu, shutters.
  () => ({
    form: "kura-shop",
    wall: "stone",
    roof: "tile",
    fireWalls: true,
    shutters: true,
    ground: "doors",
    canopy: false,
    curtain: false,
  }),
  // 2 Clock shop: tuff stone, arched doors, band balcony, roof creatures.
  () => ({
    form: "clock-shop",
    wall: "tuff",
    roof: "tile",
    ground: "arched-doors",
    balcony: true,
    clock: true,
    creatures: 2,
    canopy: false,
    curtain: false,
  }),
  // 3 Rice merchant: brick, two storeys.
  () => ({
    form: "brick-merchant",
    wall: "brick",
    roof: "slate",
    ground: "shop",
    canopy: false,
    curtain: false,
  }),
  // 4 Wholesale store: timber shopfront, curtain, a made-up mark.
  () => ({
    form: "machiya",
    wall: "wood",
    roof: "red",
    ground: "shop",
    canopy: true,
    curtain: true,
    mark: "three-dots",
  }),
  // 5 Glass workshop: glowing glass in the window, chimney.
  () => ({
    form: "glass-shop",
    wall: "plaster",
    roof: "slate",
    ground: "glass-display",
    chimney: true,
    canopy: false,
    curtain: false,
  }),
  // 6 Herring fertilizer warehouse: volcanic stone, big doors, a mark.
  () => ({
    form: "gable-warehouse",
    wall: "stone",
    roof: "slate",
    ground: "doors",
    mark: "ring-bar",
    canopy: false,
    curtain: false,
  }),
  // 7 Lamp-lit hall: stone, every window full of small lamps.
  () => ({
    form: "lamp-hall",
    wall: "stone",
    roof: "slate",
    ground: "glass-display",
    lamps: true,
    canopy: false,
    curtain: false,
    chimney: false,
  }),
  // 8 Bank: stone columns, turrets.
  () => ({
    form: "bank",
    wall: "tuff",
    roof: "slate",
    ground: "arched-doors",
    columns: true,
    turrets: true,
    canopy: false,
    curtain: false,
  }),
  // 9 Shipowner's warehouse: eight roof creatures.
  () => ({
    form: "gate-warehouse",
    wall: "stone",
    roof: "tile",
    ground: "doors",
    creatures: 8,
    canopy: false,
    curtain: false,
  }),
  // 10 Shipping house: a painted (made-up) mark on the front.
  () => ({
    form: "gable-warehouse",
    wall: "plaster",
    roof: "tile",
    ground: "shop",
    mark: "diamond-dot",
    curtain: true,
    canopy: false,
  }),
  // 11 Hotel: an extra storey of lit rooms.
  () => ({
    form: "hotel",
    wall: "plaster",
    roof: "slate",
    ground: "shop",
    extraStorey: true,
    canopy: true,
    curtain: false,
  }),
  // 12 Canal warehouse: stone and timber, big doors, a mark.
  () => ({
    form: "canal-warehouse",
    wall: "stone",
    roof: "slate",
    ground: "doors",
    mark: "ring-bar",
    canopy: false,
    curtain: false,
  }),
];

/** The look of one building. `caption` is its gallery label, if any. */
export function facadeFor(b: Building, caption?: Caption): Facade {
  const base = plain(b);
  if (caption) {
    const type = TYPES[caption.index];
    return type ? { ...base, ...type(base) } : base;
  }
  // Unlabelled: a seeded sprinkle of the same parts, never the rich ones.
  const r = rng(b.look + 101);
  const f = { ...base };
  if (b.kind !== "glass-workshop" && r() < 0.18) {
    f.fireWalls = true;
    f.roof = "tile";
  }
  if (b.kind === "stone-warehouse" && r() < 0.3)
    f.mark = MARKS[Math.floor(r() * MARKS.length)] ?? null;
  if (b.kind === "stone-warehouse" && r() < 0.2) f.shutters = true;
  // Variety in the shapes: some warehouses turn their gable to the street,
  // some wooden shops are lattice-fronted machiya.
  if (b.kind === "stone-warehouse" && r() < 0.35) f.form = "gable-warehouse";
  if (b.kind === "wooden-shop") {
    const v = r();
    if (v < 0.35) f.form = "machiya";
    else if (v < 0.7) f.form = "clapboard-house";
  }
  // Many warehouses now hold shops under a long tiled eave.
  if (b.kind === "stone-warehouse" && r() < 0.45) f.canopy = true;
  return f;
}

/** Facades for a whole street, keyed by building id. */
export function facadesFor(
  buildings: Building[],
  captions: Caption[],
): Map<string, Facade> {
  const byBuilding = new Map(captions.map((c) => [c.buildingId, c]));
  return new Map(
    buildings.map((b) => [b.id, facadeFor(b, byBuilding.get(b.id))]),
  );
}
