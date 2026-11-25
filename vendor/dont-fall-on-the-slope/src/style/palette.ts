// Single source of truth for colours. Warm winter evening in a snowy street:
// deep blue dusk around warm gas-lamp light. No pure black or pure white.

export const PALETTE = {
  // Sky and fog
  dusk: 0x1d2a44,
  duskHigh: 0x32466b,
  // Snow and ice
  snow: 0xe9edf2,
  snowShade: 0xbac6d6,
  ice: 0xb9cfdd,
  iceStreak: 0xdbe7ef,
  // Buildings
  stone: 0x7d8189,
  stoneDark: 0x5c6068,
  wood: 0x6b4a33,
  woodDark: 0x4a3324,
  plaster: 0xcfc3ad,
  roofSlate: 0x3f4a5c,
  roofRed: 0x8f3a2c,
  // Light
  lamp: 0xffc277,
  window: 0xf2a85a,
  glassGlow: 0x8fd0c8,
  iron: 0x2d3038,
  brick: 0x8a4e3a,
  icicle: 0xcfe3ee,
  noren: 0x2b3f5c,
  // Player
  coat: 0xc8553d,
  scarf: 0x2f5d7c,
  skin: 0xf0d2b4,
  // Fellow visitors' coats and hats
  touristMustard: 0xc99a3b,
  touristMoss: 0x5d7a4a,
  touristPlum: 0x7a4a6b,
  touristSky: 0x5c86a8,
  trousers: 0x343846,
  // Canal
  water: 0x22364f,
  // Exhibits
  straw: 0xc9a86a,
  strawShade: 0x9c7f4c,
  herring: 0xa9b8c6,
  ceramic: 0x3b4352,
  // UI
  ink: 0x1a2236,
  cream: 0xf6ecd9,
  accent: 0xffc277,
} as const;

export type PaletteName = keyof typeof PALETTE;

/** CSS colour string for a palette entry. */
export function css(name: PaletteName, alpha = 1): string {
  const n = PALETTE[name];
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return alpha === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;
}
