import { describe, expect, it } from "vitest";
import { controlsFrom, DRAG_FULL } from "./controls";

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
