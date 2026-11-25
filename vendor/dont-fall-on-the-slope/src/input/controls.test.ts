import { describe, expect, it } from "vitest";
import { controlsFrom, DRAG_FULL, easeLean } from "./controls";

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
  it("ramps toward the target and stops on it", () => {
    let l = 0;
    l = easeLean(l, 1, 0.05);
    expect(l).toBeCloseTo(0.35);
    for (let i = 0; i < 10; i++) l = easeLean(l, 1, 0.05);
    expect(l).toBe(1);
    expect(easeLean(0.5, 0, 1)).toBe(0);
  });
});
