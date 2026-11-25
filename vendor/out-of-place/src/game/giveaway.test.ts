import { describe, expect, it } from "vitest";
import type { RGB } from "../core/round";
import { PALETTE } from "../style/palette";
import {
  analyse,
  giveawayLine,
  nameSurface,
  type PartSample,
} from "./giveaway";

const rgb = (c: number): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const part = (
  p: PartSample["part"],
  hider: number,
  bg: number,
  bare = 0,
): PartSample => ({
  part: p,
  hider: Array(10).fill(rgb(hider)),
  background: Array(10).fill(rgb(bg)),
  bare,
});

describe("giveaway", () => {
  it("names scene surfaces by colour", () => {
    expect(nameSurface(rgb(PALETTE.tuff))).toBe("the stone wall");
    expect(nameSurface(rgb(PALETTE.sea))).toBe("the harbour water");
    expect(nameSurface(rgb(PALETTE.brick))).toBe("the brick wall");
    expect(nameSurface(rgb(PALETTE.road))).toBe("the gravel road");
    expect(nameSurface(rgb(PALETTE.hair))).toBe("the dark doorways");
  });

  it("finds the part that matched worst and what was behind it", () => {
    const a = analyse([
      part("head", PALETTE.persimmon, PALETTE.tuff),
      part("body", PALETTE.tuff, PALETTE.tuff),
      part("legL", PALETTE.tuff, PALETTE.tuff),
    ]);
    expect(a.worst?.label).toBe("Your head");
    expect(a.worst?.behind).toBe("the stone wall");
    expect(giveawayLine(true, a)).toBe(
      "Your head gave you away: it didn’t match the stone wall behind it.",
    );
  });

  it("merges both legs into one part", () => {
    const a = analyse([
      part("legL", PALETTE.sea, PALETTE.earth),
      part("legR", PALETTE.sea, PALETTE.earth),
      part("body", PALETTE.earth, PALETTE.earth),
    ]);
    expect(a.worst?.label).toBe("Your legs");
  });

  it("calls out bare clay first", () => {
    const a = analyse([part("body", PALETTE.clay, PALETTE.tuff, 1)]);
    expect(giveawayLine(true, a)).toMatch(/^Bare clay!/);
  });

  it("survivors hear why it worked", () => {
    const a = analyse([part("body", PALETTE.straw, PALETTE.straw)]);
    expect(giveawayLine(false, a)).toBe(
      "Your paint matched the straw sacks so well that nobody looked twice.",
    );
  });
});
