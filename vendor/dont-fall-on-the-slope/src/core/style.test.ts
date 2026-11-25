import { describe, expect, it } from "vitest";
import { CLOSE_GAP, closeCalls } from "./style";
import type { Obstacle } from "./track";

const post: Obstacle = {
  id: "p",
  kind: "lamp-post",
  x: 2,
  s: 50,
  w: 0.3,
  d: 0.3,
  h: 3.6,
  turn: 0,
  look: 0,
};
const pile: Obstacle = { ...post, id: "s", kind: "snow-pile", w: 1.6, d: 1.4 };

describe("closeCalls", () => {
  it("counts a small gap beside an obstacle, once", () => {
    const x = 2 - 0.15 - 0.3 - CLOSE_GAP / 2;
    expect(closeCalls([post], new Set(), 50, x, 0.3)).toEqual(["p"]);
    expect(closeCalls([post], new Set(["p"]), 50, x, 0.3)).toEqual([]);
  });
  it("not a wide gap, not a touch, not a snow pile, not out of reach", () => {
    expect(closeCalls([post], new Set(), 50, 0, 0.3)).toEqual([]);
    expect(closeCalls([post], new Set(), 50, 1.7, 0.3)).toEqual([]);
    expect(closeCalls([post], new Set(), 52, 1.3, 0.3)).toEqual([]);
    expect(closeCalls([pile], new Set(), 50, 0.6, 0.3)).toEqual([]);
  });
});
