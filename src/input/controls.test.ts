import { describe, expect, it } from "vitest";
import {
  controlsFrom,
  DRAG_FULL,
  easeLean,
  LEAN_MAX_RATE,
  SWIPE_FULL,
  swipeDecay,
  swipeLean,
} from "./controls";

const none = { left: false, right: false, brace: false };

describe("controlsFrom", () => {
  it("combines keys and drag, clamped to -1..1", () => {
    expect(controlsFrom(none, null).lean).toBe(0);
    expect(controlsFrom({ ...none, left: true }, null).lean).toBe(-1);
    expect(controlsFrom({ ...none, left: true, right: true }, null).lean).toBe(
      0,
    );
    expect(controlsFrom(none, DRAG_FULL / 2).lean).toBeCloseTo(0.5);
    expect(controlsFrom({ ...none, right: true }, DRAG_FULL).lean).toBe(1);
  });
  it("passes brace through", () => {
    expect(controlsFrom({ ...none, brace: true }, null).brace).toBe(true);
  });
});

describe("easeLean", () => {
  it("eases toward the target and settles on it", () => {
    let l = 0;
    l = easeLean(l, 1, 1 / 60);
    expect(l).toBeGreaterThan(0);
    expect(l).toBeLessThan(0.15);
    for (let i = 0; i < 90; i++) l = easeLean(l, 1, 1 / 60);
    expect(l).toBe(1);
  });

  it("never jumps: A to D takes a moment, with no step over the cap", () => {
    let l = -1;
    let prev = l;
    let t = 0;
    while (l < 0.99 && t < 2) {
      l = easeLean(l, 1, 1 / 60);
      expect(l - prev).toBeLessThanOrEqual(LEAN_MAX_RATE / 60 + 1e-9);
      prev = l;
      t += 1 / 60;
    }
    expect(t).toBeGreaterThan(0.35);
    expect(t).toBeLessThan(1);
  });
});

describe("trackpad swipe", () => {
  it("fingers right lean right, clamped", () => {
    expect(swipeLean(0, -SWIPE_FULL / 2)).toBeCloseTo(0.5);
    expect(swipeLean(0.9, -SWIPE_FULL)).toBe(1);
    expect(swipeLean(0, SWIPE_FULL / 4)).toBeCloseTo(-0.25);
  });
  it("holds briefly, then fades to zero", () => {
    expect(swipeDecay(0.8, 0.05, 1 / 60)).toBe(0.8);
    let l = 0.8;
    for (let i = 0; i < 60; i++) l = swipeDecay(l, 0.5, 1 / 60);
    expect(l).toBe(0);
  });
});
