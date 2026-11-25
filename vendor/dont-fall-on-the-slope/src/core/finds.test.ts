import { describe, expect, it } from "vitest";
import { collectAt, FIND_REACH, placeFinds } from "./finds";
import { END_CLEAR, START_CLEAR, generateTrack } from "./track";

describe("finds", () => {
  const track = generateTrack(3);
  const ids = ["a", "b", "c", "d"];
  const spots = placeFinds(track, ids);

  it("places one find per id, in order down the street, on the lane", () => {
    expect(spots.map((f) => f.id)).toEqual(ids);
    for (let i = 1; i < spots.length; i++)
      expect(spots[i].s).toBeGreaterThan(spots[i - 1].s);
    for (const f of spots) {
      expect(f.s).toBeGreaterThanOrEqual(START_CLEAR);
      expect(f.s).toBeLessThanOrEqual(track.length - END_CLEAR);
      expect(track.lanes.some((l) => l.s === f.s && l.x === f.x)).toBe(true);
    }
  });

  it("collects a find once, only when the body passes close", () => {
    const f = spots[0];
    expect(collectAt(spots, [], f.s, f.x)).toEqual([f.id]);
    expect(collectAt(spots, [f.id], f.s, f.x)).toEqual([]);
    expect(collectAt(spots, [], f.s, f.x + FIND_REACH.x + 0.1)).toEqual([]);
    expect(collectAt(spots, [], f.s - FIND_REACH.s - 0.1, f.x)).toEqual([]);
  });

  it("no ids, no finds", () => {
    expect(placeFinds(track, [])).toEqual([]);
  });
});
