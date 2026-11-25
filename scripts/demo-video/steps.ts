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
  text,
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
    click(button(h.title), { optional: true, timeoutMs: 3000 }),
    hold(holdMs),
  ]);
}

/** Weave stub: click every cell in order. The D2 weave will replace this. */
function weaveAll(activityId: string): Step[] {
  const a = pack.activities.find((x) => x.id === activityId);
  if (a?.kind !== "weave") return [];
  const steps: Step[] = [];
  for (let r = 1; r <= a.rows; r++)
    for (let c = 1; c <= a.columns; c++)
      steps.push(
        click(
          { label: `Row ${r}, column ${c}` },
          { moveMs: 25, pauseMs: 0, timeoutMs: 2000, optional: true },
        ),
      );
  return steps;
}

const cloth = art("cloth");
const weaveId = cloth.activityIds[0] ?? "weave-rows";

export const shots: Shot[] = [
  {
    id: "island",
    title: "Island and owl flight",
    steps: [
      mark("Island"),
      caption("Explore the island"),
      hold(3000),
      // A slow orbit if the island is 3D. Harmless on the HTML stub.
      drag([-240, 0], { ms: 2500, optional: true }),
      hold(800),
      click(button(new RegExp(`^${location.title}`), false)),
      captionClear(),
      waitForEvent("owl.arrived", { timeoutMs: 15000, fallbackMs: 1500 }),
    ],
  },
  {
    id: "scene",
    title: "Roof-lift entry into the house",
    steps: [
      mark(scene.title),
      waitFor(region(scene.title), { optional: true, timeoutMs: 15000 }),
      waitForEvent("scene.ready", {
        timeoutMs: 15000,
        fallbackMs: 500,
        optional: true,
      }),
      hold(3500),
    ],
  },
  {
    id: "artifact",
    title: "Inspect an object and its hotspots",
    steps: [
      mark(cloth.label),
      ...focusArtifact(cloth.id),
      hold(1500),
      // Pick up and turn (3D viewer). Harmless on the HTML stub.
      drag([300, 0], { ms: 2000, optional: true }),
      ...readHotspots(cloth.id),
    ],
  },
  {
    id: "reveal",
    title: "How do we know? (source, claim, review)",
    steps: [
      mark("How do we know?"),
      click(button("How do we know?")),
      waitFor(region("How this was made"), { optional: true }),
      hold(4500),
      click(button("Turn back"), { fallback: press("Escape") }),
      hold(800),
    ],
  },
  {
    id: "activity",
    title: "Weave activity",
    steps: [
      mark("Activity"),
      click(button(/^Weave: /, false), { optional: true }),
      hold(1500),
      ...weaveAll(weaveId),
      hold(3000),
      click(button("Close"), { fallback: press("Escape"), optional: true }),
      hold(800),
    ],
  },
  {
    id: "journal",
    title: "Heritage Journal with stamps",
    steps: [
      mark("Journal"),
      click(button(/^Journal/, false), { fallback: press("j") }),
      waitFor(region("Heritage Journal"), { optional: true }),
      hold(4000),
      press("Escape"),
      hold(600),
    ],
  },
  {
    id: "outro",
    title: "Back out to the island",
    steps: [
      mark("Outro"),
      press("Escape"), // focus -> scene
      hold(1200),
      press("Escape"), // scene -> island
      waitFor(text(location.title), { optional: true }),
      hold(3000),
    ],
  },
  {
    id: "timelapse",
    title: "Season timelapse on the island (optional)",
    enabled: false,
    steps: [
      mark("Seasons"),
      click(button("Timelapse"), { optional: true }),
      hold(12000),
      click(button("Pause"), { optional: true }),
      hold(1000),
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
