import { describe, expect, it } from "vitest";
import {
  buildPath,
  frameAt,
  frameQuat,
  pathLength,
  pointAt,
  project,
  quatFromBasis,
  ribbon,
} from "./path";

const straight = buildPath([{ length: 100, pitch: 12, curve: 0 }]);
const curvy = buildPath([
  { length: 40, pitch: 9, curve: 0 },
  { length: 60, pitch: 15, curve: 1 / 150 },
  { length: 60, pitch: 11, curve: -1 / 180 },
]);

describe("path", () => {
  it("a straight section is a plain tilted plane", () => {
    const t = (12 * Math.PI) / 180;
    const p = pointAt(straight, 2, 1.5, 50);
    expect(p[0]).toBeCloseTo(2);
    expect(p[1]).toBeCloseTo(1.5 * Math.cos(t) - 50 * Math.sin(t), 4);
    expect(p[2]).toBeCloseTo(-1.5 * Math.sin(t) - 50 * Math.cos(t), 4);
    expect(pathLength(straight)).toBe(100);
  });

  it("frames are orthonormal and right is level", () => {
    for (const s of [0, 33.3, 75, 120, 159]) {
      const f = frameAt(curvy, s);
      const len = (v: number[]) => Math.hypot(...v);
      expect(len(f.forward)).toBeCloseTo(1);
      expect(len(f.up)).toBeCloseTo(1);
      expect(f.right[1]).toBe(0);
      expect(f.up[1]).toBeGreaterThan(0.9);
    }
  });

  it("curves turn and steepness changes smoothly", () => {
    expect(frameAt(curvy, 100).yaw).toBeGreaterThan(0.2);
    const pitches = curvy.pitch.map((p) => (p * 180) / Math.PI);
    for (let i = 1; i < pitches.length; i++)
      expect(Math.abs((pitches[i] ?? 0) - (pitches[i - 1] ?? 0))).toBeLessThan(
        1,
      );
  });

  it("project inverts pointAt on a curved path", () => {
    for (const [x, h, s] of [
      [0, 0, 10],
      [3.2, 0.8, 70.4],
      [-4.5, 1.2, 130.7],
    ] as const) {
      const p = pointAt(curvy, x, h, s);
      const q = project(curvy, p, s + 3);
      expect(q.s).toBeCloseTo(s, 1);
      expect(q.x).toBeCloseTo(x, 1);
      expect(q.h).toBeCloseTo(h, 1);
      expect(project(curvy, p).s).toBeCloseTo(s, 1);
    }
  });

  it("extrapolates straight before the start", () => {
    const q = project(straight, pointAt(straight, 0, 0, -3), 0);
    expect(q.s).toBeCloseTo(-3, 3);
  });
});

describe("quaternions", () => {
  it("identity basis is the identity rotation", () => {
    const q = quatFromBasis([1, 0, 0], [0, 1, 0], [0, 0, 1]);
    expect(q[3]).toBeCloseTo(1);
  });
  it("upright frames stay level", () => {
    const [x, y, z, w] = frameQuat(frameAt(curvy, 90), true);
    // Rotating world-up by an upright quat leaves it unchanged: no x/z part.
    expect(x).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
    expect(Math.hypot(y, w)).toBeCloseTo(1);
  });
});

describe("ribbon", () => {
  it("makes two triangles per cell", () => {
    const r = ribbon(straight, [-5, 0, 5], 0, 10);
    expect(r.positions.length).toBe(11 * 3 * 3);
    expect(r.indices.length).toBe(10 * 2 * 6);
  });
});
