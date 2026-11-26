// THE SHOT LIST. Edit this file when the /shell flow changes.
//
// Each shot is a list of steps (see dsl.ts). Names come from the content pack,
// so a renamed location or hotspot does not break the recording. Steps marked
// `optional` log a warning and continue when the UI is different. A
// `fallback` step runs when the main step fails (for example a key press
// when a 3D part has no visible button).
//
// Run one shot:   npm run demo:video -- --shots island --rehearse
// List shots:     npm run demo:video -- --list
import { defaultPack as pack } from "@/content";
import {
  button,
  caption,
  captionClear,
  click,
  drag,
  goto,
  hold,
  mark,
  press,
  region,
  type Shot,
  type Step,
  typeInto,
  waitFor,
  waitForEvent,
} from "./dsl";

const location = pack.island.locations.find((l) => l.status === "open");
if (!location?.sceneId) throw new Error("No open location with a scene");
const scene = pack.scenes.find((s) => s.id === location.sceneId);
if (!scene) throw new Error(`Scene ${location.sceneId} not in pack`);
const art = (id: string) => {
  const a = pack.artifacts.find((x) => x.id === id);
  if (!a) throw new Error(`Artifact ${id} not in pack`);
  return a;
};
const placement = (id: string) =>
  scene.placements.find((p) => p.artifactId === id);

/** Focus an artifact: click its button, else press its number key. */
function focusArtifact(id: string): Step[] {
  const a = art(id);
  const key = placement(id)?.key;
  return [
    click(button(new RegExp(`${a.label}$`), false), {
      fallback: key ? press(String(key)) : undefined,
      timeoutMs: 3000,
    }),
    waitFor({ role: "article", name: a.title }, { optional: true }),
  ];
}

/** Open each hotspot of an artifact, with a short hold to read it. */
function readHotspots(id: string, holdMs = 1600): Step[] {
  return art(id).hotspots.flatMap((h) => [
    click(button(new RegExp(`${h.title}›?$`), false), {
      optional: true,
      timeoutMs: 3000,
    }),
    hold(holdMs),
  ]);
}

const fiber = art("fiber");
const herring = pack.island.locations.find((l) => l.id === "herring-coast");
const yard = pack.activities.find((a) => a.id === "place-herring-yard");
const slope = pack.activities.find((a) => a.kind === "slope-run");
const hideSeek = pack.activities.find((a) => a.kind === "hide-seek");
/** The recorded live reply (ask-live.json) answers exactly this question. */
const ASK = "How was cloth made from bark?";

/** Back to the island from any view: close what is open, then Esc. */
const toIsland: Step[] = [
  click(button("Back to the island"), { fallback: press("Escape") }),
  waitFor(button(location.title), { optional: true }),
  hold(1500),
];

// The order follows docs/DEMO-SCRIPT.md.
export const shots: Shot[] = [
  {
    id: "island",
    title: "Island and owl flight",
    steps: [
      mark("Island"),
      caption("Explore the island"),
      hold(3500),
      drag([-140, 0], { ms: 3000, optional: true }),
      hold(1200),
      click(button(location.title)),
      captionClear(),
      waitForEvent("owl.arrived", { timeoutMs: 15000, fallbackMs: 1500 }),
    ],
  },
  {
    id: "scene",
    title: "Roof-lift entry into the lake house",
    steps: [
      mark(scene.title),
      waitForEvent("scene.ready", {
        timeoutMs: 15000,
        fallbackMs: 500,
        optional: true,
      }),
      hold(3000),
      // A slow look around the room before picking an object.
      drag([-200, 0], { ms: 3000, optional: true }),
      hold(1500),
    ],
  },
  {
    id: "artifact",
    title: "Object card, hotspots and How do we know?",
    steps: [
      mark(fiber.label),
      ...focusArtifact(fiber.id),
      hold(2000),
      drag([260, 0], { ms: 2200, optional: true }),
      hold(600),
      ...readHotspots(fiber.id, 2200).slice(0, 2),
      mark("How do we know?"),
      click(button("How do we know?")),
      hold(5500),
      click(button("Close"), { fallback: press("Escape") }),
      hold(900),
    ],
  },
  {
    id: "ask",
    title: "Ask the owl (live AI, cited claims)",
    steps: [
      mark("Ask the owl"),
      ...toIsland,
      click(button("Ask the owl")),
      hold(1200),
      typeInto({ label: "Your question" }, ASK),
      hold(400),
      press("Enter"),
      waitFor(
        { label: "From the sources" },
        {
          optional: true,
          timeoutMs: 30000,
        },
      ),
      hold(7000),
      click(button("Close Ask the owl"), { optional: true }),
      hold(800),
    ],
  },
  {
    id: "build",
    title: "Herring coast: Build the scene",
    enabled: !!herring && !!yard,
    steps: [
      mark("Build the scene"),
      click(button(herring?.title ?? "Herring coast")),
      waitForEvent("scene.ready", { timeoutMs: 20000, fallbackMs: 6000 }),
      hold(2500),
      click(button(/^Try here/, false)),
      hold(1200),
      click(button(new RegExp(yard?.title ?? "Build the"), false)),
      hold(3000),
      click(button("Next step")),
      hold(2500),
      click(button(/^Put Straw hat at ring 1/, false), { optional: true }),
      hold(1200),
      click(button(/Haul a net$/, false), { optional: true }),
      hold(3500),
      click(button("Close activity"), { fallback: press("Escape") }),
      hold(800),
    ],
  },
  {
    id: "games",
    title: "Erina's games: Out of Place and Don't Fall on the Slope",
    enabled: !!slope,
    steps: [
      mark("Erina's games"),
      click(button(/^Try here/, false)),
      hold(1000),
      click(button(new RegExp(hideSeek?.title ?? "Out of Place"), false), {
        optional: true,
      }),
      hold(1500),
      click({ text: /^What the game is based on/ }, { optional: true }),
      hold(3000),
      click(button("Back"), { fallback: press("Escape"), optional: true }),
      hold(800),
      click(button(/^Try here/, false), { optional: true }),
      hold(1000),
      click(button(new RegExp(slope?.title ?? "Slope"), false)),
      hold(2000),
      // Synthetic clicks: a real click (user activation) on Play crashed
      // headless Chromium in the Linux container. The video looks the same.
      click(button("Play"), { synthetic: true }),
      hold(3000),
      click(button("Slip"), { synthetic: true, fallback: press("Enter") }),
      hold(1500),
      press("ArrowLeft"),
      hold(1200),
      press("ArrowRight"),
      hold(1500),
      press("ArrowLeft"),
      hold(2500),
      press("ArrowRight"),
      hold(2500),
      press("Escape"),
      hold(1500),
      click(button("Close activity"), { optional: true }),
      hold(800),
    ],
  },
  {
    id: "seasons",
    title: "Season timelapse on the island",
    steps: [
      mark("Seasons"),
      ...toIsland,
      click(button(/^Menu: seasons/, false)),
      hold(800),
      click(button("Timelapse")),
      hold(9000),
      click(button("Pause"), { optional: true }),
      hold(1000),
      press("Escape"),
      hold(600),
    ],
  },
  {
    id: "journal",
    title: "Heritage Journal with the earned stamps",
    steps: [
      mark("Journal"),
      click(button(/^Journal \(/, false), { fallback: press("j") }),
      waitFor(
        { role: "dialog", name: "Heritage Journal" },
        { optional: true, timeoutMs: 4000 },
      ),
      hold(5000),
      click(button("Close"), { fallback: press("Escape") }),
      hold(2500),
    ],
  },
];

/** The page the recording starts on. */
export const startPath = "/shell";
/** Steps before the recording starts (warm-up). Not in the video. */
export const preroll: Step[] = [
  goto(startPath),
  waitFor(button(new RegExp(`^${location.title}`), false), {
    timeoutMs: 30000,
  }),
];
