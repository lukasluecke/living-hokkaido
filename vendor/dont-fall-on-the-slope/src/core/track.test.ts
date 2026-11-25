import { describe, expect, it } from "vitest";
import {
  END_CLEAR,
  LANE_DRIFT,
  generateTrack,
  MIN_GAP,
  START_CLEAR,
  widestGap,
} from "./track";

describe("generateTrack", () => {
  const track = generateTrack(7);

  it("is the same street for the same seed", () => {
    expect(generateTrack(7)).toEqual(track);
    expect(generateTrack(8)).not.toEqual(track);
  });

  it("keeps the start and the canal clear", () => {
    for (const o of track.obstacles) {
      expect(o.s).toBeGreaterThan(START_CLEAR - 8.01);
      expect(o.s).toBeLessThan(track.length - END_CLEAR + 1.01);
    }
  });

  it("keeps obstacles inside the street", () => {
    for (const o of track.obstacles) {
      const half =
        (Math.abs(Math.cos(o.turn)) * o.w + Math.abs(Math.sin(o.turn)) * o.d) /
        2;
      expect(Math.abs(o.x) + half).toBeLessThanOrEqual(track.halfWidth);
    }
  });

  it("keeps a followable lane clear through every row", () => {
    for (let i = 0; i < track.lanes.length; i++) {
      const l = track.lanes[i];
      if (!l) continue;
      for (const o of track.obstacles.filter(
        (p) => Math.abs(p.s - l.s) < 1.01,
      )) {
        const clear =
          o.x + o.w / 2 <= l.x - MIN_GAP / 2 ||
          o.x - o.w / 2 >= l.x + MIN_GAP / 2;
        expect(clear).toBe(true);
      }
      const prev = track.lanes[i - 1];
      if (prev)
        expect(Math.abs(l.x - prev.x)).toBeLessThanOrEqual(
          (l.s - prev.s) * LANE_DRIFT + 1e-9,
        );
    }
  });

  it("gets steeper further down and flattens at the canal", () => {
    const deg = (s: number) => ((track.path.pitch[s] ?? 0) * 180) / Math.PI;
    expect(deg(10)).toBeCloseTo(9, 0);
    const mid = Math.max(...track.path.pitch.slice(150, 300)) * (180 / Math.PI);
    expect(mid).toBeGreaterThan(12);
    expect(deg(track.length + 20)).toBeCloseTo(5, 0);
  });

  it("has street furniture: bikes, tourists, lamp posts", () => {
    const kinds = new Set(track.obstacles.map((o) => o.kind));
    for (const k of ["bicycle", "tourist", "lamp-post", "snow-pile", "crate"])
      expect(kinds).toContain(k);
  });

  it("lines both sides with shopfronts from start to canal", () => {
    for (const side of [-1, 1]) {
      const b = track.buildings.filter((x) => x.side === side);
      expect(b[0]?.s0).toBeLessThanOrEqual(0);
      expect(b.at(-1)?.s1).toBeGreaterThanOrEqual(track.length + 6);
      for (let i = 1; i < b.length; i++)
        expect(b[i]?.s0).toBeCloseTo(b[i - 1]?.s1 ?? 0);
    }
  });
});

describe("widestGap", () => {
  it("measures the free space between obstacles and walls", () => {
    const o = {
      id: "a",
      kind: "crate" as const,
      s: 0,
      d: 1,
      h: 1,
      turn: 0,
      look: 0,
    };
    expect(widestGap(5, [])).toBe(10);
    expect(widestGap(5, [{ ...o, x: 0, w: 2 }])).toBe(4);
    expect(widestGap(5, [{ ...o, x: -4, w: 2 }])).toBe(8);
  });
});
