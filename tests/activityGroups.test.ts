import assert from "node:assert/strict";
import test from "node:test";
import { groupActivities, kindCaption } from "@/parts/shared/activityGroups";

const a = (id: string, kind: string) => ({ id, kind, title: id });

test("activities group by kind in fixed order; empty groups are left out", () => {
  const groups = groupActivities([
    a("q1", "quiz"),
    a("w", "weave"),
    a("t", "trace"),
    a("s", "story"),
    a("m", "map"),
    a("q2", "quiz"),
  ]);
  assert.deepEqual(
    groups.map((g) => [g.label, g.items.map((x) => x.id)]),
    [
      ["Hands-on", ["w", "m"]],
      ["Listen and learn", ["s"]],
      ["Think about it", ["q1", "q2"]],
      ["Behind the content", ["t"]],
    ],
  );
});

test("unknown kinds go to a final More group", () => {
  const groups = groupActivities([a("b", "board"), a("x", "words")]);
  assert.deepEqual(
    groups.map((g) => g.id),
    ["listen", "more"],
  );
  assert.equal(groups[1].label, "More");
  assert.deepEqual(groupActivities([]), []);
});

test("kind captions", () => {
  assert.equal(kindCaption("quiz"), "Think");
  assert.equal(kindCaption("sequence"), "Put in order");
  assert.equal(kindCaption("trace"), "Sources");
  assert.equal(kindCaption("unknown-kind"), "Try");
});
