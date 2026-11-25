// Backup demo video: the script the recorder follows. Edit freely: steps run
// top to bottom. Names come from the content pack, so they follow content
// changes. Times are in ms and scale with --pace.
import { defaultPack as pack } from "@/content";

export type Step =
  /** Open a path on the base URL. */
  | { do: "goto"; path: string }
  /** Move the cursor to a button or link with this accessible name, click. */
  | { do: "click"; name: string | RegExp; role?: "button" | "link" }
  /** Move the cursor over an element (shows hover glow and sound). */
  | { do: "hover"; name: string | RegExp; role?: "button" | "link" }
  /** Click every match of a CSS selector in order (e.g. weave cells). */
  | { do: "clickEach"; selector: string; gapMs: number }
  | { do: "key"; key: string }
  | { do: "wait"; ms: number }
  /** Subtitle on screen (only with --captions). Stays for `ms`. */
  | { do: "caption"; text: string; ms?: number }
  /** Chapter mark in <video>.chapters.txt, for editing. Not shown. */
  | { do: "chapter"; title: string };

const lake = pack.island.locations.find((l) => l.status === "open");
const scene = pack.scenes.find((s) => s.id === lake?.sceneId) ?? pack.scenes[0];
const first = pack.artifacts.find(
  (a) => a.id === scene.placements[0]?.artifactId,
);
const second = pack.artifacts.find(
  (a) => a.id === scene.placements[1]?.artifactId,
);
const hotspot = first?.hotspots[0];
const weave = pack.activities.find((a) => a.kind === "weave");
const name = (s: string | undefined, fallback: string) => s ?? fallback;
const contains = (s: string) =>
  new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

export const scenarios: Record<string, Step[]> = {
  /** Visitor happy path, about 70 s at pace 1. */
  visitor: [
    { do: "goto", path: "/shell" },
    { do: "chapter", title: "Island" },
    { do: "wait", ms: 2500 },
    { do: "caption", text: "Follow the owl across the island." },
    { do: "click", name: "summer" },
    { do: "wait", ms: 1200 },
    { do: "click", name: "autumn" },
    { do: "wait", ms: 1200 },
    { do: "click", name: "winter" },
    { do: "wait", ms: 1200 },
    { do: "click", name: "spring" },
    { do: "wait", ms: 1500 },
    { do: "chapter", title: "Lake house" },
    { do: "click", name: contains(name(lake?.title, "Lake house")) },
    { do: "wait", ms: 3000 },
    { do: "caption", text: "Inside, objects carry their sources." },
    { do: "chapter", title: "Object" },
    { do: "click", name: contains(name(first?.label, "fiber")) },
    { do: "wait", ms: 2500 },
    ...(hotspot
      ? ([
          { do: "click", name: contains(hotspot.title) },
          { do: "wait", ms: 2500 },
        ] satisfies Step[])
      : []),
    { do: "chapter", title: "How do we know?" },
    { do: "click", name: "How do we know?" },
    { do: "caption", text: "Every card shows source, claim and review." },
    { do: "wait", ms: 4000 },
    { do: "click", name: "Turn back" },
    { do: "wait", ms: 1200 },
    { do: "click", name: "Put it back" },
    { do: "wait", ms: 1500 },
    ...(second
      ? ([
          { do: "click", name: contains(name(second.label, "cloth")) },
          { do: "wait", ms: 2500 },
          { do: "click", name: "Put it back" },
          { do: "wait", ms: 1200 },
        ] satisfies Step[])
      : []),
    ...(weave
      ? ([
          { do: "chapter", title: "Activity" },
          { do: "click", name: weave.title },
          { do: "wait", ms: 1500 },
          {
            do: "clickEach",
            selector: "button[aria-label^='Row ']",
            gapMs: 120,
          },
          { do: "wait", ms: 2500 },
          { do: "click", name: "Close" },
          { do: "wait", ms: 1200 },
        ] satisfies Step[])
      : []),
    { do: "chapter", title: "Journal" },
    { do: "click", name: /^Journal/ },
    { do: "caption", text: "The Heritage Journal keeps what you found." },
    { do: "wait", ms: 4000 },
    { do: "key", key: "Escape" },
    { do: "wait", ms: 1000 },
    { do: "click", name: "Back to the island" },
    { do: "wait", ms: 3000 },
  ],
};
