import { describe, expect, it } from "vitest";
import { crashLine } from "./lines";

describe("crashLine", () => {
  it("has a line for every obstacle and a fallback", () => {
    for (const k of [
      "shopfront",
      "snow-pile",
      "lamp-post",
      "crate",
      "bicycle",
      "tourist",
    ])
      expect(crashLine(k)).not.toMatch(/an exhibit\./);
    expect(crashLine("pigeon")).toMatch(/an exhibit\./);
    expect(crashLine(null)).toMatch(/an exhibit\./);
  });
});
