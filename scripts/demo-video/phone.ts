// THE PHONE SHOT LIST (`--phone`): the owl's tour in a 390×844 portrait
// viewport, for the presentation video (phone left, side panel right).
// The beats and their times follow demo/DEMO-SCRIPT.md (project files).
//
// Run:  npm run demo:video -- --phone --capture frames \
//         --ask-fixture scripts/demo-video/ask-live.json --media-dir <dir>
// <dir> holds owl-story.mp4 and omusha-mobile.sog (not in Git).
import { defaultPack as pack } from "@/content";
import {
  button,
  click,
  drag,
  goto,
  hold,
  mark,
  press,
  type Shot,
  type Step,
  typeInto,
  waitFor,
  waitForEvent,
  wheel,
} from "./dsl";

const highlight = (id: string) => {
  const h = pack.highlights.find((x) => x.id === id);
  if (!h) throw new Error(`Highlight ${id} not in pack`);
  return h;
};
const film = highlight("owl-film");
const tonkori = highlight("tonkori");
const overTime = highlight("over-time");
const omusha = highlight("omusha");
const slope = highlight("slope");
/** The recorded live reply (ask-live.json) answers exactly this question. */
const ASK = "How was cloth made from bark?";

/** Tap the owl bubble's highlight button, then wait for the flight. */
const go = (title: string, fly = true): Step[] => [
  click(button(`Highlight: ${title}`), {
    fallback: click(button(new RegExp(`^Next: ${title}`), false)),
    timeoutMs: 15000,
  }),
  ...(fly
    ? [
        waitForEvent("owl.arrived", {
          timeoutMs: 20000,
          fallbackMs: 4000,
          optional: true,
        }),
      ]
    : []),
];

/** Close whatever panel is open (activity, card, timeline). */
const closePanel: Step = click(button(/^Close/, false), {
  fallback: press("Escape"),
  optional: true,
  timeoutMs: 3000,
});

const pluck = (n: number): Step[] => [
  click(button(new RegExp(`^String ${n},`), false), {
    moveMs: 250,
    pauseMs: 60,
    optional: true,
  }),
  hold(380),
];

export const phoneShots: Shot[] = [
  {
    id: "start",
    title: "The owl starts the tour",
    steps: [
      mark("Start"),
      waitFor(button(`Highlight: ${film.title}`), { timeoutMs: 20000 }),
      hold(6500),
    ],
  },
  {
    id: "film",
    title: "The owl's film in the listening grove",
    steps: [
      mark(film.title),
      ...go(film.title),
      waitFor(button("Close the film"), { optional: true, timeoutMs: 15000 }),
      hold(7000),
      click(button("Close the film"), { optional: true }),
      hold(2500),
    ],
  },
  {
    id: "tonkori",
    title: "Play the tonkori",
    steps: [
      mark(tonkori.title),
      ...go(tonkori.title, false),
      hold(1500),
      ...[3, 3, 3, 1, 3, 4, 5].flatMap(pluck),
      hold(800),
      waitFor({ text: /トンコリを弾いてみよう/ }, { optional: true }),
      hold(3500),
    ],
  },
  {
    id: "object",
    title: "Object card and How do we know?",
    steps: [
      mark("Inner bark fibers"),
      click(button("Close activity"), { optional: true }),
      hold(1200),
      click(button("Inner bark fibers"), { timeoutMs: 8000 }),
      waitFor(
        { role: "article", name: /Inner bark fibers/ },
        { optional: true },
      ),
      hold(2500),
      drag([150, 0], { ms: 2000, optional: true }),
      hold(1000),
      click(button("How do we know?"), { timeoutMs: 8000 }),
      hold(7000),
      click(button("Close"), { optional: true, timeoutMs: 3000 }),
      hold(800),
      click(button("Close (put it back)"), { optional: true, timeoutMs: 3000 }),
      hold(1500),
    ],
  },
  {
    id: "ask",
    title: "Ask the owl (recorded live reply)",
    steps: [
      mark("Ask the owl"),
      click(button("Ask me a question"), {
        fallback: click(button("Ask the owl")),
      }),
      hold(1200),
      typeInto({ label: "Your question" }, ASK, { charMs: 45 }),
      hold(400),
      press("Enter"),
      waitFor(
        { label: "From the sources" },
        { optional: true, timeoutMs: 30000 },
      ),
      hold(5000),
      wheel(500, { ms: 1500 }),
      hold(4000),
      click(button("Back to the tour"), {
        fallback: click(button("Close Ask the owl")),
        optional: true,
      }),
      hold(1500),
    ],
  },
  {
    id: "overtime",
    title: "The house over time",
    steps: [
      mark(overTime.title),
      ...go(overTime.title),
      waitFor({ text: /Houses dug into the ground/ }, { optional: true }),
      hold(3000),
      click(button(/^▶?\s*Watch:/, false), { optional: true }),
      hold(6000),
      click(button("Close the clip"), { optional: true, timeoutMs: 3000 }),
      hold(800),
      click(button(/^Next: /, false), { optional: true }),
      hold(2500),
      click(button(/^Next: /, false), { optional: true }),
      hold(3000),
      click(button("Close"), { optional: true, timeoutMs: 3000 }),
      hold(1500),
    ],
  },
  {
    id: "omusha",
    title: "The Omusha diorama (Gaussian splat)",
    steps: [
      mark(omusha.title),
      ...go(omusha.title),
      hold(2000),
      click(button(/^Look closer/, false), {
        optional: true,
        timeoutMs: 8000,
      }),
      hold(6000),
      drag([120, 0], { ms: 2500, optional: true }),
      hold(1500),
      click(button(/^Sakhalin Ainu elder/, false), { optional: true }),
      hold(3500),
      click(button("Close"), { optional: true, timeoutMs: 3000 }),
      hold(1500),
    ],
  },
  {
    id: "slope",
    title: "Don't Fall on the Slope",
    steps: [
      mark(slope.title),
      ...go(slope.title),
      hold(1500),
      // Synthetic clicks: a real click on Play crashed headless Chromium in
      // the Linux container (see steps.ts).
      click(button("Play"), { synthetic: true }),
      hold(3000),
      click(button("Slip"), {
        synthetic: true,
        fallback: press("Enter"),
        optional: true,
      }),
      hold(1200),
      press("ArrowLeft"),
      hold(1200),
      press("ArrowRight"),
      hold(1500),
      press("ArrowLeft"),
      hold(2000),
      press("ArrowRight"),
      hold(2000),
      press("Escape"),
      hold(1500),
      click(button("Close activity"), { optional: true }),
      hold(800),
    ],
  },
  {
    id: "journal",
    title: "Heritage Journal",
    steps: [
      mark("Journal"),
      click(button(/^Journal \(/, false), { fallback: press("j") }),
      waitFor(
        { role: "dialog", name: "Heritage Journal" },
        { optional: true, timeoutMs: 4000 },
      ),
      hold(5000),
      click(button("Close"), { fallback: press("Escape") }),
      hold(1000),
      click(button("Back to the island"), { optional: true }),
      hold(5000),
    ],
  },
];

/** Warm-up: load, then start the video while the tour countdown shows. */
export const phonePreroll: Step[] = [
  goto("/"),
  waitFor({ text: /Starting the tour in/ }, { timeoutMs: 60000 }),
];

/** Warm-up that skips the tour to the Omusha step (`--phone-omusha`): for a
 *  separate take on a machine with a real GPU. Record with
 *  `--shots omusha`. */
export const phoneOmushaPreroll: Step[] = [
  goto("/"),
  waitFor(button(`Highlight: ${film.title}`), { timeoutMs: 60000 }),
  ...[1, 2, 3].flatMap(() => [
    click(button("Skip this step"), { synthetic: true }),
    hold(800),
  ]),
  waitFor(button(`Highlight: ${omusha.title}`), { timeoutMs: 10000 }),
];
