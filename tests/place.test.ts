import assert from "node:assert/strict";
import test from "node:test";
import { defaultPack as barkToClothPack } from "@/content";
import { type ActivityOf, activitySchema } from "@/contracts";
import {
  placeScore,
  startPlace,
  stepPlace,
} from "@/parts/activities/play/placeLogic";

const place = (id: string) => {
  const a = barkToClothPack.activities.find((x) => x.id === id);
  assert.ok(a && a.kind === "place", `${id} is a place activity`);
  return a as ActivityOf<"place">;
};

test("place: survey camp runs step by step and finishes", () => {
  const a = place("place-survey-camp");
  let s = startPlace(a);
  assert.equal(s.phase, "done"); // intro step has no figure
  s = stepPlace(a, s, { type: "next" });
  assert.equal(s.phase, "place");
  const right = a.steps[1].options.findIndex((o) => o.right);
  const wrong = a.steps[1].options.findIndex((o) => !o.right);
  s = stepPlace(a, s, { type: "ring", index: wrong });
  assert.equal(s.phase, "place");
  assert.equal(s.tries, 1);
  assert.ok(s.hint);
  s = stepPlace(a, s, { type: "ring", index: right });
  assert.equal(s.phase, "pose");
  s = stepPlace(a, s, { type: "pose", pose: "watch" });
  assert.equal(s.phase, "pose");
  s = stepPlace(a, s, { type: "pose", pose: "survey" });
  assert.equal(s.phase, "done");
  // the rest with "Show me"
  for (let i = 2; i < a.steps.length; i++) {
    s = stepPlace(a, s, { type: "next" });
    s = stepPlace(a, s, { type: "show" });
    assert.equal(s.phase, "done");
  }
  assert.equal(s.finished, false);
  s = stepPlace(a, s, { type: "finish" });
  assert.equal(s.finished, true);
  assert.equal(s.placed.length, a.steps.filter((x) => x.figure).length);
});

test("place: objects scene has no pose step; season switches at its step", () => {
  const c = place("place-cise");
  let s = stepPlace(c, startPlace(c), { type: "next" });
  const k = c.steps[1].options.findIndex((o) => o.right);
  s = stepPlace(c, s, { type: "ring", index: k });
  assert.equal(s.phase, "done");

  const m = place("place-mine-forest");
  let t = startPlace(m);
  assert.equal(t.season, "summer");
  const saw = m.steps.findIndex((x) => x.season === "winter");
  for (let i = 1; i <= saw; i++) {
    t = stepPlace(m, stepPlace(m, t, { type: "show" }), { type: "next" });
  }
  assert.equal(t.season, "winter");
});

test("place: Ainu home scene places things only; figures have no personal names", () => {
  assert.equal(place("place-cise").subject, "objects");
  for (const a of barkToClothPack.activities)
    if (a.kind === "place")
      for (const s of a.steps)
        if (s.figure && a.subject === "people")
          assert.ok(s.figure.hat, `${a.id}/${s.id} has a distinct look`);
  assert.equal(placeScore(0, 5), 1);
  assert.ok(placeScore(3, 5) < 1);
});

test("place schema needs exactly one right ring and the pose on the sheet", () => {
  const base = {
    id: "x",
    knowledgeId: "k",
    title: "T",
    claimIds: ["c"],
    kind: "place",
    stage: "cise",
    subject: "people",
    completion: "Done.",
  };
  const step = (over: object) => ({
    id: "s",
    say: "Fact.",
    claimIds: ["c"],
    ask: "Where?",
    figure: { label: "Cap", hat: "cap" },
    options: [
      { x: 0.1, y: 0.1, right: true },
      { x: 0.5, y: 0.5 },
    ],
    pose: "saw",
    poses: ["saw", "watch"],
    ...over,
  });
  const ok = activitySchema.safeParse({
    ...base,
    steps: [step({}), step({ id: "t" })],
  });
  assert.ok(ok.success);
  const twoRight = activitySchema.safeParse({
    ...base,
    steps: [
      step({
        options: [
          { x: 0, y: 0, right: true },
          { x: 1, y: 1, right: true },
        ],
      }),
      step({ id: "t" }),
    ],
  });
  assert.equal(twoRight.success, false);
  const poseMissing = activitySchema.safeParse({
    ...base,
    steps: [step({ poses: ["watch"] }), step({ id: "t" })],
  });
  assert.equal(poseMissing.success, false);
});

test("place: animal hills shows hunting with things only, ends on kamuy nuance", () => {
  const h = place("place-hills");
  assert.equal(h.stage, "hills");
  assert.equal(h.subject, "objects");
  for (const s of h.steps) {
    if (s.figure)
      assert.ok(s.figure.thing && !s.figure.hat, `${s.id} is a thing`);
    assert.equal(s.pose, undefined, `${s.id} has no pose`);
  }
  const last = h.steps[h.steps.length - 1];
  assert.ok(last.claimIds.includes("deer-not-kamuy"));
  const scene = barkToClothPack.scenes.find((x) => x.id === "animal-hills");
  assert.ok(scene?.activityIds.includes("place-hills"));
  let s = startPlace(h);
  for (let i = 0; i < h.steps.length; i++) {
    if (h.steps[i].figure) {
      const k = h.steps[i].options.findIndex((o) => o.right);
      s = stepPlace(h, s, { type: "ring", index: k });
    }
    assert.equal(s.phase, "done");
    s = stepPlace(h, s, { type: i < h.steps.length - 1 ? "next" : "finish" });
  }
  assert.ok(s.finished);
});
