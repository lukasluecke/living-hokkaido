import { describe, expect, it } from "vitest";
import { instability, wobble, wobbleAccel, WOBBLE } from "./balance";

const phase = [0.3, 1.7, 4.1] as const;

describe("balance", () => {
  it("is steady when slow and gets wobblier with speed", () => {
    expect(instability(5)).toBe(0);
    expect(instability(16)).toBeGreaterThan(0.3);
    expect(instability(40)).toBe(1);
    expect(wobbleAccel(5, 2, phase, false)).toBe(0);
  });

  it("wobbles smoothly within -1..1", () => {
    let prev = wobble(0, phase);
    for (let t = 0.01; t < 20; t += 0.01) {
      const w = wobble(t, phase);
      expect(Math.abs(w)).toBeLessThanOrEqual(1);
      expect(Math.abs(w - prev)).toBeLessThan(0.05);
      prev = w;
    }
  });

  it("bracing steadies you", () => {
    const t = 1.1;
    const free = Math.abs(wobbleAccel(25, t, phase, false));
    const braced = Math.abs(wobbleAccel(25, t, phase, true));
    expect(free).toBeGreaterThan(0);
    expect(braced).toBeCloseTo(free * WOBBLE.braceFactor);
  });
});
