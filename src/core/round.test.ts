import { describe, expect, it } from "vitest";
import {
  blendScore,
  createRound,
  DEFAULT_DURATIONS_MS,
  hitTest,
  roundReducer,
  secondsLeft,
  type RoundAction,
  type RoundState,
} from "./round";

const run = (s: RoundState, ...actions: RoundAction[]) =>
  actions.reduce(roundReducer, s);
const toSeek = (s = createRound({ spawn: { x: 500, y: 400 } })) =>
  run(s, { type: "skipPhase" }, { type: "skipPhase" }, { type: "ready" });

describe("round phases", () => {
  it("starts in scene reveal with 10 seconds", () => {
    const s = createRound();
    expect(s.phase).toBe("sceneReveal");
    expect(s.remainingMs).toBe(10_000);
  });

  it("counts down and carries leftover time into the next phase", () => {
    let s = roundReducer(createRound(), { type: "tick", dtMs: 2_500 });
    expect(secondsLeft(s)).toBe(8);
    s = roundReducer(createRound(), { type: "tick", dtMs: 10_500 });
    expect(s.phase).toBe("disguise");
    expect(s.remainingMs).toBe(59_500);
  });

  it("waits on the handoff screen until the seeker is ready", () => {
    let s = roundReducer(createRound(), { type: "tick", dtMs: 70_000 });
    expect(s.phase).toBe("handoff");
    s = roundReducer(s, { type: "tick", dtMs: 999_999 });
    expect(s.phase).toBe("handoff");
    s = roundReducer(s, { type: "ready" });
    expect(s.phase).toBe("seek");
    expect(s.remainingMs).toBe(90_000);
  });

  it("restart keeps durations and spawn", () => {
    const opts = {
      durations: { sceneReveal: 1, disguise: 2, seek: 3, reveal: 4 },
      penaltyMs: 5,
      spawn: { x: 9, y: 8 },
    };
    const s = run(
      createRound(opts),
      { type: "tick", dtMs: 2 },
      { type: "restart" },
    );
    expect(s).toEqual(createRound(opts));
  });
});

describe("disguise", () => {
  it("moves the hider and sets the pose only during disguise", () => {
    let s = run(createRound(), { type: "moveHider", x: 5, y: 5 });
    expect(s.hider.x).toBe(0);
    s = run(
      s,
      { type: "skipPhase" },
      { type: "moveHider", x: 120, y: 300 },
      { type: "setPose", pose: "crouching" },
    );
    expect(s.hider).toMatchObject({ x: 120, y: 300, pose: "crouching" });
  });
});

describe("seek rules", () => {
  it("a tap on the hider finds them: seekers win and the reveal starts", () => {
    const s = run(toSeek(), { type: "seekTap", x: 500, y: 350 });
    expect(s.hider.found).toBe(true);
    expect(s.outcome).toBe("seekersWin");
    expect(s.phase).toBe("reveal");
    expect(s.taps).toHaveLength(1);
  });

  it("a wrong tap costs 10 seconds", () => {
    const s = run(toSeek(), { type: "seekTap", x: 100, y: 100 });
    expect(s.phase).toBe("seek");
    expect(s.remainingMs).toBe(80_000);
    expect(s.taps[0].hit).toBe(false);
  });

  it("uses the configured wrong-tap penalty", () => {
    const s = run(
      toSeek(createRound({ spawn: { x: 500, y: 400 }, penaltyMs: 3_000 })),
      { type: "seekTap", x: 1, y: 1 },
    );
    expect(s.remainingMs).toBe(87_000);
  });

  it("hiders win if wrong taps drain the clock", () => {
    let s = toSeek();
    for (let i = 0; i < 9; i++)
      s = roundReducer(s, { type: "seekTap", x: 1, y: 1 });
    expect(s.phase).toBe("reveal");
    expect(s.outcome).toBe("hidersWin");
  });

  it("hiders win if the seek timer runs out", () => {
    const s = run(toSeek(), { type: "tick", dtMs: DEFAULT_DURATIONS_MS.seek });
    expect(s.phase).toBe("reveal");
    expect(s.outcome).toBe("hidersWin");
    expect(s.seekElapsedMs).toBe(90_000);
  });

  it("giving up (skip) in seek means the hider survived", () => {
    expect(run(toSeek(), { type: "skipPhase" }).outcome).toBe("hidersWin");
  });

  it("records when each tap happened", () => {
    const s = run(
      toSeek(),
      { type: "tick", dtMs: 4_000 },
      { type: "seekTap", x: 1, y: 1 },
    );
    expect(s.taps[0].atMs).toBe(4_000);
  });

  it("hit boxes depend on pose", () => {
    const standing = { x: 0, y: 0, pose: "standing" as const, found: false };
    const crouching = { ...standing, pose: "crouching" as const };
    expect(hitTest(standing, 0, -130)).toBe(true);
    expect(hitTest(crouching, 0, -130)).toBe(false);
    expect(hitTest(standing, 0, 5)).toBe(true); // forgiveness below the feet
  });

  it("taps outside seek are ignored", () => {
    const s = createRound();
    expect(roundReducer(s, { type: "seekTap", x: 0, y: 0 })).toBe(s);
  });
});

describe("blendScore", () => {
  it("is 100 for identical colors and 0 for opposites", () => {
    expect(blendScore([[10, 20, 30]], [[10, 20, 30]])).toBe(100);
    expect(blendScore([[0, 0, 0]], [[255, 255, 255]])).toBe(0);
  });
  it("is 0 with no samples", () => {
    expect(blendScore([], [])).toBe(0);
  });
});

it("actions are plain serializable data", () => {
  const action: RoundAction = { type: "seekTap", x: 3, y: 4 };
  expect(JSON.parse(JSON.stringify(action))).toEqual(action);
});
