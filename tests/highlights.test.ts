import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_JOURNAL,
  type ExperienceState,
  highlightDone,
  validateContentPack,
} from "@/contracts";
import {
  barkToClothPack as pack,
  barkToClothRaw,
} from "@/content/bark-to-cloth";
import { tierActivities } from "@/parts/shared/activityGroups";
import { tourStep } from "@/shell/route";
import { initialState, reduce } from "@/shell/state";

const prefs = { reducedMotion: true, webgl: false };
const h = (id: string) => {
  const x = pack.highlights.find((y) => y.id === id);
  assert.ok(x, id);
  return x;
};
const clone = () =>
  structuredClone(barkToClothRaw) as never as Parameters<
    typeof validateContentPack
  >[0] & { highlights: { open: unknown; locationId: string }[] };

test("highlights: the pack has a few, each pointing at something real", () => {
  assert.ok(pack.highlights.length >= 4 && pack.highlights.length <= 7);
  assert.deepEqual(validateContentPack(barkToClothRaw), []);
});

test("highlights: a broken target fails validation", () => {
  const p = clone();
  p.highlights[1].open = { kind: "activity", activityId: "quiz-canoe" };
  assert.ok(validateContentPack(p).some((e) => e.includes("not offered at")));
  const q = clone();
  q.highlights[0].locationId = "lake-house";
  assert.ok(validateContentPack(q).some((e) => e.includes("no film")));
});

test("highlight.open flies to the place and opens the activity on landing", () => {
  const tonkori = h("tonkori");
  let st = initialState(prefs);
  st = reduce(pack, st, { type: "highlight.open", highlightId: tonkori.id });
  assert.equal(st.view, "travel");
  assert.equal(st.locationId, tonkori.locationId);
  assert.equal(st.pendingHighlightId, tonkori.id);
  st = reduce(pack, st, {
    type: "owl.arrived",
    locationId: tonkori.locationId,
  });
  assert.equal(st.view, "activity");
  assert.equal(st.activityId, "pluck-tonkori");
  assert.equal(st.pendingHighlightId, null);
  // Closing the activity leaves the visitor in the place.
  st = reduce(pack, st, {
    type: "activity.close",
    activityId: "pluck-tonkori",
  });
  assert.equal(st.view, "scene");
});

test("highlight.open: a timeline opens on landing; in the place it opens at once", () => {
  const ot = h("over-time");
  let st = initialState(prefs);
  st = reduce(pack, st, { type: "highlight.open", highlightId: ot.id });
  st = reduce(pack, st, { type: "owl.arrived", locationId: ot.locationId });
  assert.equal(st.view, "scene");
  assert.equal(st.overlay, "timeline");
  assert.equal(st.timelineId, "house-over-time");
  // Already in the herring coast: the slope game starts without a flight.
  let at: ExperienceState = initialState(prefs);
  at = reduce(pack, at, {
    type: "location.select",
    locationId: "herring-coast",
  });
  at = reduce(pack, at, { type: "owl.arrived", locationId: "herring-coast" });
  at = reduce(pack, at, { type: "highlight.open", highlightId: "slope" });
  assert.equal(at.view, "activity");
  assert.equal(at.activityId, "slope-run-otaru");
});

test("highlight.open: going back or picking a place drops the pending highlight", () => {
  let st = initialState(prefs);
  st = reduce(pack, st, { type: "highlight.open", highlightId: "slope" });
  st = reduce(pack, st, { type: "nav.back" });
  assert.equal(st.pendingHighlightId, null);
  st = reduce(pack, st, { type: "highlight.open", highlightId: "slope" });
  st = reduce(pack, st, { type: "location.select", locationId: "lake-house" });
  st = reduce(pack, st, { type: "owl.arrived", locationId: "lake-house" });
  assert.equal(st.view, "scene");
  assert.equal(st.activityId, null);
});

test("owl tour: walks the highlights in order, skipping what is done", () => {
  const island = initialState(prefs);
  assert.deepEqual(tourStep(pack, island, EMPTY_JOURNAL)?.event, {
    type: "highlight.open",
    highlightId: pack.highlights[0]?.id,
  });
  // In the grove the film is on screen, so the tour offers the tonkori.
  let st = reduce(pack, island, {
    type: "location.select",
    locationId: "listening-grove",
  });
  st = reduce(pack, st, { type: "owl.arrived", locationId: "listening-grove" });
  const j = { ...EMPTY_JOURNAL, visited: ["listening-grove"] };
  assert.deepEqual(tourStep(pack, st, j)?.event, {
    type: "highlight.open",
    highlightId: "tonkori",
  });
  // Every highlight done: no tour step, the normal route takes over.
  const all = {
    ...EMPTY_JOURNAL,
    visited: pack.highlights.map((x) => x.locationId),
    completed: pack.highlights.flatMap((x) =>
      x.open.kind === "activity" ? [x.open.activityId] : [],
    ),
  };
  assert.ok(pack.highlights.every((x) => highlightDone(x, all)));
  assert.equal(tourStep(pack, island, all), null);
});

test("tiers: highlights first, quiz and order questions apart", () => {
  const a = (id: string, kind: string) => ({ id, kind, title: id });
  const t = tierActivities(
    [a("q", "quiz"), a("w", "weave"), a("p", "pluck"), a("s", "sequence")],
    ["p"],
  );
  assert.deepEqual(
    t.highlights.map((x) => x.id),
    ["p"],
  );
  assert.deepEqual(
    t.groups.flatMap((g) => g.items.map((x) => x.id)),
    ["w"],
  );
  assert.deepEqual(
    t.quick.map((x) => x.id),
    ["q", "s"],
  );
});

test("owl tour: a place you pick yourself pauses the tour there", () => {
  const j = { ...EMPTY_JOURNAL, visited: ["listening-grove"] };
  let st = reduce(pack, initialState(prefs), {
    type: "location.select",
    locationId: "makers-clearing",
  });
  st = reduce(pack, st, { type: "owl.arrived", locationId: "makers-clearing" });
  assert.equal(st.touring, false);
  assert.equal(tourStep(pack, st, j), null);
  // Back on the island the owl offers the next highlight again.
  st = reduce(pack, st, { type: "scene.exit", sceneId: st.sceneId ?? "" });
  assert.equal(tourStep(pack, st, j)?.event.type, "highlight.open");
  // Through the tour, the owl keeps pointing on from the place.
  st = reduce(pack, st, { type: "highlight.open", highlightId: "tonkori" });
  st = reduce(pack, st, { type: "owl.arrived", locationId: "listening-grove" });
  st = reduce(pack, st, {
    type: "activity.close",
    activityId: "pluck-tonkori",
  });
  const done = { ...j, completed: ["pluck-tonkori"] };
  assert.deepEqual(tourStep(pack, st, done)?.event, {
    type: "highlight.open",
    highlightId: "over-time",
  });
});
