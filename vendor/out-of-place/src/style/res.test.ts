import { describe, expect, it } from "vitest";
import { pickRes } from "./res";

describe("pickRes", () => {
  it("renders at 2× on hi-DPI or wide hosts, else 1×", () => {
    expect(pickRes(1280, 1)).toBe(1);
    expect(pickRes(900, 2)).toBe(2);
    expect(pickRes(1920, 1)).toBe(2);
    expect(pickRes(640, 2)).toBe(1);
  });
});
