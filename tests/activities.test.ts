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

import {
  mapFinished,
  mapScore,
  startMap,
  stepMap,
} from "@/parts/activities/play/mapLogic";

test("map explore opens each spot once; match needs the held word", () => {
  let e = startMap();
  e = stepMap(e, "explore", { type: "open", spotId: "a" });
  e = stepMap(e, "explore", { type: "open", spotId: "a" });
  assert.deepEqual(e.done, ["a"]);
  assert.equal(mapFinished(e, 2), false);
  e = stepMap(e, "explore", { type: "open", spotId: "b" });
  assert.equal(mapFinished(e, 2), true);

  let m = startMap();
  m = stepMap(m, "match", { type: "place", spotId: "a" }); // nothing held
  assert.equal(m.misses, 0);
  m = stepMap(m, "match", { type: "hold", spotId: "a" });
  m = stepMap(m, "match", { type: "place", spotId: "b" });
  assert.equal(m.misses, 1);
  assert.equal(m.held, "a");
  m = stepMap(m, "match", { type: "place", spotId: "a" });
  assert.deepEqual(m.done, ["a"]);
  assert.equal(m.held, null);
  assert.equal(mapScore(m, 2), 2 / 3);
});

import {
  movesFor,
  owlMove,
  play,
  startGame,
  winner,
} from "@/parts/activities/play/boardLogic";

test("stick game: one step to a free point; a full far edge wins", () => {
  let g = startGame();
  assert.equal(g.turn, "you");
  // Bottom-left stick can only go up (sides are taken).
  assert.deepEqual(
    movesFor(g.board, "you").map((m) => `${m.from}>${m.to}`),
    ["6>3", "7>4", "8>5"],
  );
  assert.deepEqual(play(g, { from: 6, to: 0 }), g); // not one step
  g = play(g, { from: 6, to: 3 });
  assert.equal(g.turn, "owl");
  assert.equal(
    winner(["you", "you", "you", null, null, null, "owl", "owl", "owl"]),
    "you",
  );
});

test("the owl takes a win and every game ends", () => {
  const b = [
    null,
    "you",
    "you",
    null,
    "you",
    "owl",
    "owl",
    "owl",
    null,
  ] as const;
  const m = owlMove([...b], () => 0);
  assert.deepEqual(m, { from: 5, to: 8 });
  // Seeded random player against the owl: games end.
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let t = 0; t < 50; t++) {
    let g = startGame();
    while (!g.winner && g.moves < 600) {
      const ms = movesFor(g.board, g.turn);
      const next =
        g.turn === "owl"
          ? owlMove(g.board, rand)
          : ms[Math.floor(rand() * ms.length)];
      if (!next) break;
      g = play(g, next);
    }
    assert.ok(g.winner, "game ended");
  }
});

import {
  canonOffBy,
  pluckPhase,
  pluckString,
  startPluck,
} from "@/parts/activities/play/musicLogic";

test("canon: each voice enters on its own mark, in any loop", () => {
  assert.equal(canonOffBy(1, 1, 1, 8), 0);
  assert.equal(canonOffBy(9.2, 1, 1, 8).toFixed(1), "0.2");
  assert.equal(canonOffBy(1.7, 2, 1, 8).toFixed(1), "-0.3");
  assert.equal(canonOffBy(5, 2, 1, 8), 3);
});

test("pluck: explore every string, then play the tab in order", () => {
  const tune = [3, 1];
  let s = startPluck();
  for (const n of [1, 2, 3]) s = pluckString(s, n, 3, tune);
  assert.equal(pluckPhase(s, 3, tune), "tune");
  assert.equal(s.next, 0);
  s = pluckString(s, 2, 3, tune);
  assert.equal(s.misses, 1);
  s = pluckString(s, 3, 3, tune);
  s = pluckString(s, 1, 3, tune);
  assert.equal(pluckPhase(s, 3, tune), "done");
  assert.equal(
    pluckPhase(pluckString(startPluck(), 1, 1, null), 1, null),
    "done",
  );
});
