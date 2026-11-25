// Turns the eras of a timeline into feature weights for the renderer.
// Each feature (pit house, forest density, farmland …) gets one value per
// era from the era's `stage`; the scrub position blends them. No React here.
import { eraWeights, type TimelineEra } from "@/contracts";

export type Features = {
  pit: number;
  flat: number;
  thatched: number;
  /** Fresh, rebuilt look of the thatched house (museum park). */
  rebuilt: number;
  /** Extra houses around the main house (a small settlement). */
  village: number;
  storehouse: number;
  estuary: number;
  /** Share of the trees that stand (0–1). */
  forest: number;
  /** Stumps of cleared forest. */
  stumps: number;
  farmland: number;
  road: number;
  park: number;
  /** Hearth smoke from a lived-in house. */
  smoke: number;
};

const FOREST = {
  estuary: 0.55,
  "forest-river": 1,
  "cleared-farmland": 0.12,
  "museum-park": 0.45,
} as const;

function eraFeatures(e: TimelineEra): Features {
  const { house, land, storehouse } = e.stage;
  const settled = land === "estuary" || land === "forest-river";
  return {
    pit: house === "pit-dwelling" ? 1 : 0,
    flat: house === "flat-ground" ? 1 : 0,
    thatched: house === "thatched" || house === "reconstructed" ? 1 : 0,
    rebuilt: house === "reconstructed" ? 1 : 0,
    village: settled ? 1 : 0,
    storehouse: storehouse ? 1 : 0,
    estuary: land === "estuary" ? 1 : 0,
    forest: FOREST[land],
    stumps: land === "cleared-farmland" ? 1 : 0,
    farmland: land === "cleared-farmland" ? 1 : 0,
    road: land === "cleared-farmland" || land === "museum-park" ? 1 : 0,
    park: land === "museum-park" ? 1 : 0,
    smoke: house === "reconstructed" ? 0 : 1,
  };
}

/** Blend era features at scrub position `t` (0 … eras - 1). */
export function featuresAt(eras: TimelineEra[], t: number): Features {
  const w = eraWeights(eras.length, t);
  const out = eraFeatures(eras[0]);
  for (const k of Object.keys(out) as (keyof Features)[]) out[k] = 0;
  eras.forEach((e, i) => {
    if (!w[i]) return;
    const f = eraFeatures(e);
    for (const k of Object.keys(f) as (keyof Features)[]) out[k] += f[k] * w[i];
  });
  return out;
}

/** Ease a 0–1 weight so shapes pop less linearly. */
export const ease = (x: number) => {
  const c = Math.min(Math.max(x, 0), 1);
  return c * c * (3 - 2 * c);
};
