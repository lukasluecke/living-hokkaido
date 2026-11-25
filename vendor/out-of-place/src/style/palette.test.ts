import { describe, expect, it } from "vitest";
import { css, PALETTE } from "./palette";

describe("palette", () => {
  it("never uses pure black or pure white", () => {
    for (const [name, value] of Object.entries(PALETTE)) {
      expect(value, name).not.toBe(0x000000);
      expect(value, name).not.toBe(0xffffff);
    }
  });

  it("formats CSS hex strings", () => {
    expect(css("backdrop")).toBe("#1d3644");
  });
});
