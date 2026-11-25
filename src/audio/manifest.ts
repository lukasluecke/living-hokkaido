// THE place to tune sound. Swap files, change volumes, remap events and
// season mixes here; no other file needs to change.
//
// Files live in public/audio/. Every file needs a row in
// public/audio/ATTRIBUTION.md, and `credit` names that row.
// Current files are original placeholders from scripts/audio/generate.ts
// (`npm run audio:generate`). Replace one by dropping a new file with the
// same name, or point `src` at a new file.
import type { SoundManifest } from "./types";

const ORIGINAL = "original-synth";
const files = (path: string) => [`/audio/${path}.ogg`, `/audio/${path}.m4a`];
const amb = (name: string, volume = 1) => ({
  src: files(`ambient/${name}`),
  volume,
  credit: ORIGINAL,
});
const ui = (name: string, volume = 1, detuneJitter = 0) => ({
  src: files(`ui/${name}`),
  volume,
  detuneJitter,
  credit: ORIGINAL,
});

export const soundManifest = {
  buses: { master: 1, ambient: 0.55, ui: 0.7 },
  zoneFadeSec: 1.6,
  seasonFadeSec: 0.8,
  overlayDuck: 0.45,

  sounds: {
    // Ambient loops (seamless, about 24 s each).
    "island-wind": amb("island-wind"),
    "island-winter-wind": amb("island-winter-wind"),
    "island-birds": amb("island-birds"),
    "island-insects": amb("island-insects"),
    "island-leaves": amb("island-leaves"),
    "island-water": amb("island-water"),
    "interior-hearth": amb("interior-hearth"),
    "interior-wind": amb("interior-wind"),
    // Interface and moment sounds.
    hover: ui("hover", 0.35, 200),
    select: ui("select", 0.8, 120),
    back: ui("back", 0.7, 80),
    "card-flip": ui("card-flip", 0.9, 150),
    page: ui("page", 0.8, 150),
    "book-close": ui("book-close", 0.8),
    stamp: ui("stamp", 1),
    "weave-step": ui("weave-step", 0.7, 300),
    hotspot: ui("hotspot", 0.6, 100),
    "pick-up": ui("pick-up", 0.7, 100),
    "put-down": ui("put-down", 0.7, 100),
    complete: ui("complete", 0.8),
    season: ui("season", 0.6),
    "owl-hoot": ui("owl-hoot", 0.8),
    "owl-takeoff": ui("owl-takeoff", 0.8),
    "scene-enter": ui("scene-enter", 0.7),
  },

  // Gains per season: spring, summer, autumn, winter.
  zones: {
    island: {
      views: ["island", "travel"],
      layers: [
        {
          sound: "island-wind",
          seasons: { spring: 0.6, summer: 0.45, autumn: 0.75, winter: 0.3 },
        },
        { sound: "island-winter-wind", seasons: { autumn: 0.15, winter: 0.9 } },
        {
          sound: "island-birds",
          seasons: { spring: 0.8, summer: 0.5, autumn: 0.2 },
        },
        { sound: "island-insects", seasons: { summer: 0.55, autumn: 0.15 } },
        { sound: "island-leaves", seasons: { summer: 0.15, autumn: 0.8 } },
        {
          sound: "island-water",
          seasons: { spring: 0.6, summer: 0.5, autumn: 0.45, winter: 0.1 },
        },
      ],
    },
    interior: {
      views: ["scene", "focus", "activity"],
      layers: [
        {
          sound: "interior-hearth",
          seasons: { spring: 0.6, summer: 0.45, autumn: 0.7, winter: 0.9 },
        },
        {
          sound: "interior-wind",
          seasons: { spring: 0.25, summer: 0.15, autumn: 0.35, winter: 0.7 },
        },
      ],
    },
  },

  cues: {
    hover: { sound: "hover", minIntervalMs: 70 },
    select: { sound: "select", minIntervalMs: 40 },
    back: { sound: "back", minIntervalMs: 80 },
    "card-flip": { sound: "card-flip" },
    "card-flip-back": { sound: "card-flip", volume: 0.6 },
    "book-open": { sound: "page" },
    "book-close": { sound: "book-close" },
    "activity-open": { sound: "page", volume: 0.7 },
    stamp: { sound: "stamp", delayMs: 120 },
    "weave-step": { sound: "weave-step", minIntervalMs: 30 },
    hotspot: { sound: "hotspot" },
    "pick-up": { sound: "pick-up" },
    "put-down": { sound: "put-down" },
    complete: { sound: "complete", delayMs: 80 },
    season: { sound: "season", minIntervalMs: 1500 },
    "owl-hoot": { sound: "owl-hoot", delayMs: 150, minIntervalMs: 1000 },
    "owl-takeoff": { sound: "owl-takeoff" },
    "scene-enter": { sound: "scene-enter" },
  },

  // Shared events (src/contracts/events.ts) -> cue. season.set plays only
  // when the main season changes (see mix.ts), so the timelapse is calm.
  events: {
    "location.select": "owl-takeoff",
    "owl.arrived": "owl-hoot",
    "scene.ready": "scene-enter",
    "artifact.focus": "pick-up",
    "artifact.blur": "put-down",
    "hotspot.open": "hotspot",
    "activity.start": "activity-open",
    "activity.complete": "complete",
    "journal.open": "book-open",
    "journal.close": "book-close",
    "stamp.earned": "stamp",
    "season.set": "season",
    "reveal.open": "card-flip",
    "reveal.close": "card-flip-back",
    "nav.back": "back",
  },

  dom: {
    hover: [
      { selector: "button:disabled, [aria-disabled='true']", cue: null },
      { selector: "button, a[href], [role='button'], summary", cue: "hover" },
    ],
    click: [
      { selector: "button:disabled, [aria-disabled='true']", cue: null },
      // Weave grid cells in the activities stub ("Row 1, column 2").
      { selector: "button[aria-label^='Row ']", cue: "weave-step" },
      { selector: "button, a[href], [role='button'], summary", cue: "select" },
    ],
  },
} satisfies SoundManifest;
