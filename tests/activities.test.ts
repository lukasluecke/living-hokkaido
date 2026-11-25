import assert from "node:assert/strict";
import test from "node:test";
import {
  isOver,
  passDirection,
  quizScore,
  startLoom,
  stepLoom,
} from "@/parts/activities/logic";

test("loom completes only after every row is passed and pressed", () => {
  let s = startLoom(3);
  assert.equal(s.phase, "pass");
  s = stepLoom(s, "beat"); // ignored before a pass
  assert.equal(s.woven, 0);
  for (let r = 0; r < 3; r++) {
    assert.notEqual(s.phase, "done");
    s = stepLoom(s, "pass");
    s = stepLoom(s, "pass"); // double pass ignored
    assert.equal(s.phase, "beat");
    s = stepLoom(s, "beat");
  }
  assert.equal(s.woven, 3);
  assert.equal(s.phase, "done");
  assert.deepEqual(stepLoom(s, "pass"), s);
  assert.deepEqual(stepLoom(s, "reset"), startLoom(3));
});

test("over-under alternates by row and column; passes alternate sides", () => {
  assert.equal(isOver(0, 0), true);
  assert.equal(isOver(0, 1), false);
  assert.equal(isOver(1, 0), false);
  assert.equal(passDirection(0), "ltr");
  assert.equal(passDirection(1), "rtl");
});

test("quiz score drops with wrong tries", () => {
  assert.equal(quizScore(0, 3), 1);
  assert.equal(quizScore(1, 3), 0.5);
  assert.equal(quizScore(2, 3), 0);
});
