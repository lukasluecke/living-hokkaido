// Single source of truth for every color in the game. See "Visual style" in CLAUDE.md.
// Rules: no pure black or pure white; outlines are dark-tinted; flat 2–3 tones per material.

export const PALETTE = {
  // Backdrop that every scene island and UI floats on: the winter-dusk blue
  // of Don't Fall on the Slope, so the two games read as one set.
  backdropDeep: 0x141d31,
  backdrop: 0x1d2a44,
  backdropLight: 0x32466b,

  // Foliage
  pineDark: 0x2f5d3a,
  pine: 0x3f7a45,
  moss: 0x7fae4f,
  leafLight: 0xa9cc6a,

  // Wood and stone
  barkDark: 0x4a3324,
  bark: 0x6b4a33,
  woodLight: 0x9c7350,
  cliffDark: 0x4f4b46,
  cliff: 0x6f6a63,
  stoneLight: 0x9a948a,

  // Ground and water
  earth: 0xa88a62,
  earthShade: 0x8c714f,
  sea: 0x3d6f86,
  seaLight: 0x5a8da3,

  // Otaru warehouse: tuff stone walls, dark tile roof, straw cargo, herring
  tuff: 0xd2c4a0,
  tuffShade: 0xab9d7c,
  tuffDark: 0x857a60,
  tile: 0x3e434c,
  tileLight: 0x58606b,
  straw: 0xd9bb6c,
  strawShade: 0xb08f48,
  herring: 0xb3bfc4,
  herringDark: 0x7f8c93,

  // Meiji Sapporo street: brick and clapboard, gravel road, shop curtains, crowd clothing
  brick: 0x9a4a36,
  brickShade: 0x763729,
  stucco: 0xe4dac8,
  stuccoShade: 0xbfb29c,
  road: 0xb9a888,
  roadShade: 0x9c8c6e,
  indigo: 0x2f3f66,
  indigoLight: 0x4a5d8c,
  skin: 0xe0bf98,
  hair: 0x2e2622,
  wool: 0x3a3a46,
  woolLight: 0x55566a,

  // Roof accents
  persimmonDark: 0x8f3a2c,
  persimmon: 0xc8553d,
  slateBlueDark: 0x3b5168,
  slateBlue: 0x4f6b88,

  // Light and shadow (sunGlow is the slope game's warm lamp gold)
  sunGlow: 0xffc277,
  windowLit: 0xf2a85a,
  // Winter: snow on roofs, icicles on eaves (as in the slope game)
  snow: 0xe9edf2,
  snowShade: 0xbac6d6,
  icicle: 0xcfe3ee,
  coolShadow: 0x3a4e63,

  // Nuri (player character): unglazed clay
  clay: 0xefe6d8,
  clayShade: 0xd6c8b3,
  clayDeep: 0xb8a68d,
  nuriFace: 0x3b2f27,

  // UI
  cream: 0xf2e8d5,
  creamSoft: 0xc9bfae,
  outline: 0x2a2420, // dark-tinted warm brown, never black
  plum: 0xd8a7b1,
  sky: 0x9fb4c7,
} as const;

export type PaletteKey = keyof typeof PALETTE;

/** CSS hex string for Phaser text styles and HTML ("#1d2a44"). */
export function css(key: PaletteKey): string {
  return "#" + PALETTE[key].toString(16).padStart(6, "0");
}
