import { describe, expect, it } from "vitest";
import {
  initialRun,
  reduceRun,
  resultScore,
  type RunAction,
  score,
} from "./run";

const play = (...actions: RunAction[]) => actions.reduce(reduceRun, initialRun);

describe("run rules", () => {
  it("starts from ready only", () => {
    expect(play({ type: "start" }).phase).toBe("sliding");
    expect(play({ type: "progress", distance: 5 }).distance).toBe(0);
  });

  it("counts distance and never goes backwards", () => {
    const s = play(
      { type: "start" },
      { type: "progress", distance: 12.7 },
      { type: "progress", distance: 10 },
    );
    expect(s.distance).toBe(12.7);
    expect(score(s)).toBe(12);
  });

  it("ends the run on the first touch and keeps the best score", () => {
    const s = play(
      { type: "start" },
      { type: "progress", distance: 40.2 },
      { type: "crash", what: "lamp-post" },
      { type: "crash", what: "crate" },
      { type: "progress", distance: 80 },
    );
    expect(s.phase).toBe("crashed");
    expect(s.hit).toBe("lamp-post");
    expect(s.distance).toBe(40.2);
    expect(s.best).toBe(40);
    expect(s.runsEnded).toBe(1);
  });

  it("reaching the canal finishes the run", () => {
    const s = play({ type: "start" }, { type: "finish" });
    expect(s.phase).toBe("finished");
    expect(play({ type: "finish" }).phase).toBe("ready");
  });

  it("restarts only after a run ended, keeping best", () => {
    const s = play(
      { type: "start" },
      { type: "progress", distance: 30 },
      { type: "crash", what: "crate" },
      { type: "restart" },
    );
    expect(s).toMatchObject({
      phase: "ready",
      distance: 0,
      best: 30,
      hit: null,
    });
    expect(play({ type: "start" }, { type: "restart" }).phase).toBe("sliding");
  });

  it("maps distance to a 0..1 result", () => {
    expect(resultScore(160, 320)).toBe(0.5);
    expect(resultScore(400, 320)).toBe(1);
    expect(resultScore(-3, 320)).toBe(0);
  });
});
