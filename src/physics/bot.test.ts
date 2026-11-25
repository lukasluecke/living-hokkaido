// Can the street be finished? The generator guarantees a clear lane; this
// checks that a bot using only the player's controls (lean, brace) can
// actually follow it at speed, so a careful player can reach the canal.
import R from "@dimforge/rapier3d-compat";
import { beforeAll, expect, it } from "vitest";
import { generateTrack, type Track } from "../core/track";
import { createPhysics, PLAYER } from "./world";

beforeAll(async () => {
  await R.init();
});

/** Lane x at distance s, interpolated between rows. */
function laneAt(track: Track, s: number): number {
  const ls = track.lanes;
  const i = ls.findIndex((l) => l.s >= s);
  if (i <= 0) return ls[Math.max(0, i)]?.x ?? 0;
  const a = ls[i - 1];
  const b = ls[i];
  if (!a || !b) return ls.at(-1)?.x ?? 0;
  return a.x + ((s - a.s) / (b.s - a.s)) * (b.x - a.x);
}

function botRun(seed: number) {
  const track = generateTrack(seed);
  const p = createPhysics(R, track);
  const finish = track.length - PLAYER.startS;
  p.slip();
  let prevX = 0;
  for (let i = 0; i < 120 * 60; i++) {
    const at = p.local();
    const s = at.s;
    const x = at.x;
    const vx = (x - prevX) * 60;
    prevX = x;
    const target = laneAt(track, s + 2);
    const lean = Math.max(-1, Math.min(1, (target - x) * 2 - vx * 0.9));
    const hit = p.step({ lean, brace: p.speed() > 15 }, 1 / 60);
    if (hit) return { seed, finished: false, d: Math.round(p.distance()), hit };
    if (p.distance() >= finish) return { seed, finished: true };
  }
  return { seed, finished: false, hit: "timeout" };
}

it("a bot following the guaranteed lane reaches the canal", () => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8])
    expect(botRun(seed)).toEqual({ seed, finished: true });
});
