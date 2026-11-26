import { describe, expect, it } from "vitest";
import { CLOSE_CALL_LINES, closeCallLine, GLASS_TITLE } from "./lines";
import { cameraRaise, flashNow, isPhotographer } from "./tourists";
import { generateTrack } from "./track";
import { buildingAt } from "./where";

const track = generateTrack(1);

describe("buildingAt", () => {
  it("finds the building on the side the body is on", () => {
    const b = track.buildings.find((x) => x.side === 1 && x.s0 > 50);
    if (!b) throw new Error("no building");
    const mid = (b.s0 + b.s1) / 2;
    expect(buildingAt(track.buildings, mid, 4.8)?.id).toBe(b.id);
    expect(buildingAt(track.buildings, mid, -4.8)?.side).toBe(-1);
  });
});

describe("close-call lines", () => {
  it("cycle and state no history", () => {
    expect(closeCallLine(0)).toBe("A daring interpretation.");
    expect(closeCallLine(CLOSE_CALL_LINES.length)).toBe(closeCallLine(0));
    for (const l of [...CLOSE_CALL_LINES, GLASS_TITLE])
      expect(l).not.toMatch(/\d{4}|Meiji|Taish|century/);
  });
});

describe("tourist photos", () => {
  it("some tourists carry cameras, deterministically", () => {
    const tourists = track.obstacles.filter((o) => o.kind === "tourist");
    const n = tourists.filter(isPhotographer).length;
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(tourists.length);
    expect(isPhotographer({ kind: "crate", look: 1 })).toBe(false);
  });

  it("raises the camera as you come, lowers it after", () => {
    expect(cameraRaise(20)).toBe(0);
    expect(cameraRaise(12.5)).toBeCloseTo(0.5);
    expect(cameraRaise(6)).toBe(1);
    expect(cameraRaise(-4.5)).toBeCloseTo(0.5);
    expect(cameraRaise(-10)).toBe(0);
  });

  it("flashes once, when you cross the photo point", () => {
    expect(flashNow(6.3, 5.9)).toBe(true);
    expect(flashNow(5.9, 5.5)).toBe(false);
    expect(flashNow(5, 4)).toBe(false);
  });
});
