import { describe, expect, it } from "vitest";
import {
  dailySeed,
  NO_STREAK,
  runTitle,
  shareLink,
  streakStep,
  stylePoints,
} from "./score";

describe("score", () => {
  it("makes a daily seed from the date", () => {
    expect(dailySeed(new Date(2026, 10, 26))).toBe(20261126);
    expect(dailySeed(new Date(2027, 0, 5))).toBe(20270105);
  });

  it("share links carry only the seed", () => {
    expect(
      shareLink("https://x.test/slope/?seed=1&at=120&name=me#top", 20261126),
    ).toBe("https://x.test/slope/?seed=20261126");
  });

  it("tracks the longest clean streak", () => {
    let s = NO_STREAK;
    for (const e of ["pass", "pass", "pass", "soft", "pass"] as const)
      s = streakStep(s, e);
    expect(s).toEqual({ current: 1, longest: 3 });
  });

  it("counts style points", () => {
    expect(stylePoints(2, 10)).toBe(100);
    expect(stylePoints(0, 0)).toBe(0);
  });

  it("titles runs like museum works, deterministically", () => {
    const t = runTitle(20261126, 1, "crate", false, 2026);
    expect(t).toMatch(/, 2026$/);
    expect(runTitle(20261126, 1, "crate", false, 2026)).toBe(t);
    expect(runTitle(5, 2, null, true, 2026)).toMatch(/Canal|Complete/);
    for (let i = 0; i < 20; i++)
      expect(runTitle(i, i, "lamp-post", false, 2026)).not.toMatch(
        /Meiji|Taish/,
      );
  });
});
