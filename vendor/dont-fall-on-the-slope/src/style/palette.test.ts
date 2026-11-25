import { describe, expect, it } from "vitest";
import { css, PALETTE } from "./palette";

describe("palette", () => {
  it("has no pure black or pure white", () => {
    for (const c of Object.values(PALETTE)) {
      expect(c).not.toBe(0x000000);
      expect(c).not.toBe(0xffffff);
    }
  });
  it("formats CSS colours", () => {
    expect(css("ink")).toBe("rgb(26 34 54)");
    expect(css("ink", 0.5)).toBe("rgb(26 34 54 / 0.5)");
  });
});
