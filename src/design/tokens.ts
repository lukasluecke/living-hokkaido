// Visual tokens shared by every part. See docs/STYLE.md for how to use them.
// Values come from the three labs (island seasons, objects palette, room).
// Change a token here, not in a part, so all parts stay in one style.
import type { SeasonId } from "@/contracts";

/** UI (DOM overlay) colours. Warm paper and ink, gold for focus. */
export const ui = {
  paper: "#fbf4e6",
  paperEdge: "#efe1c2",
  ink: "#2b2118",
  inkSoft: "#5a4a3c",
  gold: "#e8c27a",
  goldDeep: "#c99a3b",
  night: "#1f2d46",
  danger: "#9c4f2e",
} as const;

/** Material palette for 3D objects and buildings (per part name). */
export const material = {
  cloth: "#c9a46a",
  band: "#2f4b6e",
  wood: "#8a5a35",
  woodDark: "#6e4b32",
  thread: "#eadcb8",
  fiber: "#d9bb86",
  bark: "#6e4b32",
  tie: "#9c4f2e",
  roof: "#8f4f34",
  wall: "#c99a63",
  stone: "#a7a090",
  windowGlow: "#ffb347",
} as const;

/** Season colours: [spring, summer, autumn, winter]. Blend with seasonWeights(). */
export type Season4 = readonly [string, string, string, string];
export const season = {
  sky: ["#bcd6e2", "#8fc3e0", "#c9cbb8", "#1f2d46"],
  sun: ["#fff1df", "#fff6e0", "#ffd2a0", "#ffe2c4"],
  sea: ["#2f7f9c", "#1f78a8", "#2f6f82", "#2a4a68"],
  ground: ["#8fb06a", "#6f9a4e", "#b08a4a", "#eef3f7"],
  foliage: ["#f2b8c6", "#4f7f45", "#c8562e", "#dfe7ee"],
  accent: ["#7d9a52", "#8a63c8", "#b08a4a", "#eef3f7"],
} as const satisfies Record<string, Season4>;

/** The season item each season shows (visual only, no cultural claim). */
export const seasonItem: Record<SeasonId, string> = {
  spring: "cherry blossom, snow on peaks",
  summer: "lavender rows, long green days",
  autumn: "red and gold leaves",
  winter: "deep snow, drift ice, warm windows",
};

/** Motion. Halve or cut when prefs.reducedMotion is true. */
export const motion = {
  /** camera-controls smoothTime (s) for focus moves. */
  cameraSmooth: 0.45,
  /** camera-controls smoothTime (s) for the scene entry. */
  entrySmooth: 0.9,
  /** Roof lift duration (s). */
  roofLift: 1.1,
  /** Card / overlay fade (ms). */
  overlayMs: 220,
  /** Hover glow damping factor (per second). */
  hoverDamp: 8,
} as const;

export const type = {
  /** Body text in overlays. Local system fonts only (no network fonts). */
  body: 'ui-rounded, "Hiragino Maru Gothic ProN", system-ui, sans-serif',
  heading: 'ui-serif, "Hiragino Mincho ProN", Georgia, serif',
  /** Minimum overlay text size (px). */
  minSize: 14,
} as const;

/** Performance budget per part on the demo laptop. Measure, do not guess. */
export const budget = {
  island: { drawCalls: 80, triangles: 1_500_000 },
  detailScene: { drawCalls: 150, triangles: 500_000 },
  artifact: { triangles: 50_000, glbBytes: 1_000_000, texture: 1024 },
  /** Total initial download for the visitor app. */
  initialBytes: 10_000_000,
} as const;
