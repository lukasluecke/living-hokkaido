// Headless physics checks: real Rapier, no rendering. Simulates whole runs.
import R from "@dimforge/rapier3d-compat";
import { beforeAll, describe, expect, it } from "vitest";
import { generateTrack } from "../core/track";
import type { Controls } from "../input/controls";
import { createPhysics } from "./world";

beforeAll(async () => {
  await R.init();
});

const STEP = 1 / 60;
const none: Controls = { lean: 0, brace: false };

/** Steps until a contact or `seconds` pass. */
function run(
  physics: ReturnType<typeof createPhysics>,
  seconds: number,
  controls: (t: number) => Controls = () => none,
) {
  physics.slip();
  for (let i = 0; i < seconds * 60; i++) {
    const hit = physics.step(controls(i * STEP), STEP);
    if (hit) return { hit, t: i * STEP, d: physics.distance() };
  }
  return { hit: null, t: seconds, d: physics.distance() };
}

describe("physics", () => {
  it("slides downhill on an empty street, picking up speed", () => {
    const empty = { ...generateTrack(1), obstacles: [] };
    const p = createPhysics(R, empty);
    const r = run(p, 5);
    expect(r.hit).toBeNull();
    // Start section is 9°: ½·g·sin(9°)·t² ≈ 19 m in 5 s, plus the slip.
    expect(r.d).toBeGreaterThan(15);
    expect(r.d).toBeLessThan(28);
    expect(p.speed()).toBeGreaterThan(6);
    p.free();
  });

  it("bracing slows the slide", () => {
    const empty = { ...generateTrack(1), obstacles: [] };
    const a = createPhysics(R, empty);
    const b = createPhysics(R, empty);
    const free = run(a, 6);
    const braced = run(b, 6, (t) => ({ lean: 0, brace: t > 3 }));
    expect(braced.d).toBeLessThan(free.d - 3);
    a.free();
    b.free();
  });

  it("leaning hard into a shopfront crashes", () => {
    const empty = { ...generateTrack(1), obstacles: [] };
    const p = createPhysics(R, empty);
    const r = run(p, 8, () => ({ lean: 1, brace: false }));
    expect(r.hit).toBe("shopfront");
    p.free();
  });

  it("hits an obstacle straight ahead", () => {
    const track = generateTrack(1);
    const p = createPhysics(R, {
      ...track,
      obstacles: [
        {
          id: "x",
          kind: "crate",
          x: 0,
          s: 25,
          w: 1,
          d: 1,
          h: 1,
          turn: 0,
          look: 0,
        },
      ],
    });
    const r = run(p, 10);
    expect(r.hit).toBe("crate");
    expect(r.d).toBeGreaterThan(20);
    p.free();
  });

  it("ploughs through a snow pile: slower, but no crash", () => {
    const track = generateTrack(1);
    const pile = {
      id: "p",
      kind: "snow-pile" as const,
      x: 0,
      s: 25,
      w: 1.6,
      d: 1.4,
      h: 0.8,
      turn: 0,
      look: 0,
    };
    const p = createPhysics(R, { ...track, obstacles: [pile] });
    const r = run(p, 10);
    expect(r.hit).toBe("snow-pile");
    const before = p.speed();
    // The body keeps going past the pile.
    for (let i = 0; i < 120; i++) p.step(none, STEP);
    expect(p.crashed()).toBe(false);
    expect(p.distance()).toBeGreaterThan(r.d + 2);
    expect(before).toBeGreaterThan(0);
    p.free();
  });

  it("stays on the ice through curves and steep sections", () => {
    const track = { ...generateTrack(3), obstacles: [] };
    const p = createPhysics(R, track);
    p.slip();
    let maxH = 0;
    for (let i = 0; i < 60 * 60; i++) {
      const at = p.local();
      // Steer to the middle so the curve doesn't carry us into a wall.
      const lean = Math.max(-1, Math.min(1, -at.x * 0.8));
      const hit = p.step({ lean, brace: p.speed() > 16 }, STEP);
      expect(hit).toBeNull();
      maxH = Math.max(maxH, at.h);
      if (at.s > track.length) break;
    }
    expect(p.local().s).toBeGreaterThan(track.length * 0.9);
    // Never flew off or sank through the ice.
    expect(maxH).toBeLessThan(1.6);
    expect(p.local().h).toBeGreaterThan(0.5);
    p.free();
  });

  it("flies off the canal edge, splashes down and floats", () => {
    const track = { ...generateTrack(1), obstacles: [] };
    const p = createPhysics(R, track, 1, track.length - 30);
    p.slip();
    let launched = false;
    let flew = false;
    for (let i = 0; i < 25 * 60; i++) {
      p.step(none, STEP);
      if (!launched && p.local().s >= track.length) {
        p.flyOff();
        launched = true;
      }
      if (p.flying()) flew = true;
      if (p.floating()) break;
    }
    expect(launched).toBe(true);
    expect(flew).toBe(true);
    expect(p.floating()).toBe(true);
    expect(p.local().s).toBeGreaterThan(track.length + 7);
    // Floats: stays put at the water line.
    const y = p.position()[1];
    for (let i = 0; i < 60; i++) p.step(none, STEP);
    expect(p.position()[1]).toBeCloseTo(y, 2);
    p.reset();
    expect(p.floating()).toBe(false);
    p.free();
  });

  it("can reset and slide again", () => {
    const empty = { ...generateTrack(1), obstacles: [] };
    const p = createPhysics(R, empty);
    run(p, 8, () => ({ lean: 1, brace: false }));
    p.crash(() => 0.5);
    for (let i = 0; i < 60; i++) p.step(none, STEP);
    p.reset();
    expect(p.distance()).toBeCloseTo(0, 1);
    const r = run(p, 3);
    expect(r.hit).toBeNull();
    expect(r.d).toBeGreaterThan(5);
    p.free();
  });
});
