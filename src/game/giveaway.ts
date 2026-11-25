// What gave the hider away? Pure analysis of Nuri's pixels against the scene
// behind each body part. Lines are about the game (paint, clay, colours), never
// historical claims: history on the card always comes from a cited claim.
import { blendScore, type RGB } from "../core/round";
import { PALETTE, type PaletteKey } from "../style/palette";

export type PartSample = {
  part: "head" | "body" | "armL" | "armR" | "legL" | "legR";
  hider: RGB[];
  background: RGB[];
  /** 0–1, how much of this part is still unpainted. */
  bare: number;
};

const PART_LABEL: Record<PartSample["part"], string> = {
  head: "Your head",
  body: "Your body",
  armL: "Your left arm",
  armR: "Your right arm",
  legL: "Your legs",
  legR: "Your legs",
};

/** Scene surfaces by palette colour, for "it didn't match the … behind it". */
const SURFACES: [PaletteKey, string][] = [
  ["tuff", "the stone wall"],
  ["tuffShade", "the stone wall"],
  ["tuffDark", "the stone wall"],
  ["earth", "the packed earth"],
  ["earthShade", "the packed earth"],
  ["straw", "the straw sacks"],
  ["strawShade", "the straw sacks"],
  ["woodLight", "the wooden crates"],
  ["bark", "the dark timber"],
  ["barkDark", "the dark timber"],
  ["tile", "the roof tiles"],
  ["tileLight", "the roof tiles"],
  ["sea", "the harbour water"],
  ["seaLight", "the harbour water"],
  ["herring", "the drying herring"],
  ["herringDark", "the drying herring"],
  ["pine", "the pine trees"],
  ["pineDark", "the pine trees"],
  ["moss", "the mossy edge"],
  ["cliff", "the cliff"],
  ["brick", "the brick wall"],
  ["brickShade", "the brick wall"],
  ["stucco", "the stucco wall"],
  ["stuccoShade", "the stucco wall"],
  ["road", "the gravel road"],
  ["roadShade", "the gravel road"],
  ["stoneLight", "the pavement"],
  ["indigo", "the indigo shop curtain"],
  ["wool", "a dark wool suit"],
  ["plum", "a plum kimono"],
  ["hair", "the dark doorways"],
  ["backdrop", "the night sky"],
];

const rgbOf = (k: PaletteKey): RGB => {
  const c = PALETTE[k];
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
};

export function nameSurface(color: RGB): string {
  let best = SURFACES[0][1];
  let bestD = Number.POSITIVE_INFINITY;
  for (const [key, name] of SURFACES) {
    const [r, g, b] = rgbOf(key);
    const d = (r - color[0]) ** 2 + (g - color[1]) ** 2 + (b - color[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return best;
}

const mean = (px: RGB[]): RGB => {
  const s = [0, 0, 0];
  for (const p of px) for (let i = 0; i < 3; i++) s[i] += p[i];
  const n = Math.max(1, px.length);
  return [s[0] / n, s[1] / n, s[2] / n];
};

export type Analysis = {
  blend: number;
  bare: number;
  /** The part that matched worst, with what was behind it. */
  worst: { label: string; score: number; behind: string } | null;
  /** What most of Nuri was in front of. */
  mostlyBehind: string;
};

export function analyse(parts: PartSample[]): Analysis {
  // Legs count as one part.
  const merged = new Map<string, { hider: RGB[]; background: RGB[] }>();
  for (const p of parts) {
    const label = PART_LABEL[p.part];
    const m = merged.get(label) ?? { hider: [], background: [] };
    m.hider.push(...p.hider);
    m.background.push(...p.background);
    merged.set(label, m);
  }
  const allHider = parts.flatMap((p) => p.hider);
  const allBg = parts.flatMap((p) => p.background);
  const bareCount = parts.reduce((n, p) => n + p.bare * p.hider.length, 0);
  let worst: Analysis["worst"] = null;
  for (const [label, m] of merged) {
    if (m.hider.length < 4) continue;
    const score = blendScore(m.hider, m.background);
    if (!worst || score < worst.score)
      worst = { label, score, behind: nameSurface(mean(m.background)) };
  }
  return {
    blend: blendScore(allHider, allBg),
    bare: allHider.length ? bareCount / allHider.length : 1,
    worst,
    mostlyBehind: nameSurface(mean(allBg)),
  };
}

/** The "what gave you away" line (found) or the "why it worked" line (survived). */
export function giveawayLine(found: boolean, a: Analysis): string {
  if (found) {
    if (a.bare >= 0.5)
      return "Bare clay! Nothing else in this scene is pale, unpainted clay.";
    // A badly matched part beats a good average: one red head is a giveaway.
    if (a.worst && a.worst.score < 80) {
      return `${a.worst.label} gave you away: it didn’t match ${a.worst.behind} behind it.`;
    }
    if (a.blend >= 85)
      return "Near-perfect paint. Your seeker just has hawk eyes!";
    return "Your colours stood out from what was behind you.";
  }
  if (a.bare >= 0.5)
    return "Hidden in plain clay?! Your seeker never even looked your way.";
  if (a.blend >= 75)
    return `Your paint matched ${a.mostlyBehind} so well that nobody looked twice.`;
  return `Not a perfect match for ${a.mostlyBehind}, but your seeker never looked your way.`;
}
