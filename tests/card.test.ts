import assert from "node:assert/strict";
import test from "node:test";
import { activitySchema } from "@/contracts";
import {
  activitySize,
  KIND_LABEL,
  kindLabel,
  primaryActivityId,
} from "@/parts/artifacts/kinds";

test("object card labels the activity kinds in visitor words", () => {
  assert.equal(KIND_LABEL.quiz, "Think");
  assert.equal(KIND_LABEL.sequence, "Put in order");
  assert.equal(KIND_LABEL.weave, "Hands-on");
  assert.equal(KIND_LABEL.story, "Listen");
  assert.equal(KIND_LABEL.words, "Words");
  assert.equal(KIND_LABEL.trace, "Sources");
  assert.equal(KIND_LABEL.map, "Explore");
  assert.equal(kindLabel("not-a-kind"), "Try");
});

test("object card starts the first activity not done", () => {
  assert.equal(primaryActivityId(["a", "b"]), "a");
  assert.equal(primaryActivityId(["a", "b"], ["a"]), "b");
  assert.equal(primaryActivityId(["a", "b"], ["a", "b"]), "a");
  assert.equal(primaryActivityId([]), undefined);
});

test("activity size comes only from the activity data", () => {
  const seq = activitySchema.parse({
    id: "s",
    kind: "sequence",
    title: "Order",
    knowledgeId: "k",
    claimIds: ["c"],
    prompt: "Put them in order",
    steps: [
      { id: "x", label: "X", claimId: "c" },
      { id: "y", label: "Y", claimId: "c" },
    ],
    order: ["x", "y"],
    explanation: "Done",
  });
  assert.equal(activitySize(seq), "2 steps");
});
