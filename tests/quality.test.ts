import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createMonitor,
  MONITOR,
  parseTier,
  settingsFor,
} from "../src/parts/shared/quality";

const run = (
  m: ReturnType<typeof createMonitor>,
  gapMs: number,
  ms: number,
) => {
  let steps = 0;
  for (let t = 0; t < ms; t += gapMs) steps += m.frame(gapMs);
  return steps;
};

test("full tier keeps the canvas default look", () => {
  assert.deepEqual(settingsFor(3, 1.5), {
    dpr: [1, 1.5],
    extraFx: true,
    shadows: true,
  });
  assert.equal(settingsFor(0, 1.5).shadows, false);
  assert.equal(settingsFor(1, 1.5).extraFx, false);
});

test("a 60 fps canvas never steps down", () => {
  assert.equal(run(createMonitor(), 1000 / 60, 60_000), 0);
});

test("a 30 fps canvas steps down one tier after warm-up and the slow windows", () => {
  const m = createMonitor();
  const until = MONITOR.warmupMs + MONITOR.windowMs * MONITOR.slowWindows + 100;
  assert.equal(run(m, 1000 / 30, MONITOR.warmupMs + MONITOR.windowMs), 0);
  assert.equal(
    run(m, 1000 / 30, until - MONITOR.warmupMs - MONITOR.windowMs),
    1,
  );
});

test("a 10 fps canvas steps two tiers at once", () => {
  const m = createMonitor();
  const until = MONITOR.warmupMs + MONITOR.windowMs * MONITOR.slowWindows;
  assert.equal(run(m, 100, until + 200), 2);
});

test("after a step, the next check comes after a short warm-up", () => {
  const m = createMonitor();
  const first = MONITOR.warmupMs + MONITOR.windowMs * MONITOR.slowWindows;
  run(m, 1000 / 30, first + 50);
  const next = MONITOR.rewarmMs + MONITOR.windowMs * MONITOR.slowWindows;
  assert.equal(run(m, 1000 / 30, next + 100), 1);
});

test("a 1 fps software GPU still counts", () => {
  assert.ok(run(createMonitor(), 1000, 20_000) >= 1);
});

test("one slow window alone (a load hitch) does not step down", () => {
  const m = createMonitor();
  run(m, 1000 / 60, MONITOR.warmupMs + 100);
  run(m, 1000 / 30, MONITOR.windowMs);
  assert.equal(run(m, 1000 / 60, 10_000), 0);
});

test("long gaps (hidden tab, stalls) are ignored", () => {
  assert.equal(run(createMonitor(), 5000, 60_000), 0);
});

test("URL override names", () => {
  assert.equal(parseTier("low"), 0);
  assert.equal(parseTier("full"), 3);
  assert.equal(parseTier("auto"), null);
  assert.equal(parseTier(null), null);
});
