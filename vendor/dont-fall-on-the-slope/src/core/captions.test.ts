import { describe, expect, it } from "vitest";
import {
  CAPTION_COUNT,
  GALLERY,
  SHORTS,
  passedCaptions,
  placeCaptions,
  quipFor,
} from "./captions";
import { generateTrack } from "./track";

describe("captions", () => {
  for (const seed of [1, 3, 7]) {
    const track = generateTrack(seed);
    const caps = placeCaptions(track.buildings, track.length);

    it(`seed ${seed}: the 12 researched types, in order down the street`, () => {
      expect(caps).toHaveLength(CAPTION_COUNT);
      expect(caps.map((c) => c.title)).toEqual(GALLERY.map((g) => g.title));
      expect(new Set(caps.map((c) => c.buildingId)).size).toBe(CAPTION_COUNT);
      const at = caps.map((c) => c.at);
      expect(at[0]).toBeLessThan(track.length / 4);
      expect(at.at(-1)).toBeGreaterThan((track.length * 3) / 4);
      for (const c of caps) expect(c.at).toBeLessThan(track.length);
    });

    it(`seed ${seed}: the glass workshop sits on a glass-workshop building if one is near`, () => {
      const glass = caps.find((c) => c.title === "Glass Workshop");
      const b = track.buildings.find((x) => x.id === glass?.buildingId);
      const near = track.buildings.some(
        (x) => x.kind === "glass-workshop" && Math.abs(x.s0 - (b?.s0 ?? 0)) < 8,
      );
      if (near) expect(b?.kind).toBe("glass-workshop");
    });
  }

  it("every type has a short fact, readable in 2 seconds", () => {
    expect(SHORTS).toHaveLength(GALLERY.length);
    for (const t of SHORTS) {
      expect(t.length).toBeLessThanOrEqual(38);
      expect(t.split(/\s+/).length).toBeLessThanOrEqual(7);
    }
  });

  it("every type has a label line and a source", () => {
    expect(GALLERY).toHaveLength(12);
    for (const g of GALLERY) {
      expect(g.label.length).toBeGreaterThan(10);
      expect(g.sources.length).toBeGreaterThan(0);
      for (const s of g.sources) expect(s).toMatch(/^https:\/\//);
    }
  });

  it("is the same for the same track", () => {
    const t = generateTrack(3);
    expect(placeCaptions(t.buildings, t.length)).toEqual(
      placeCaptions(t.buildings, t.length),
    );
  });

  it("earns a caption only once, after the building", () => {
    const t = generateTrack(3);
    const caps = placeCaptions(t.buildings, t.length);
    const first = caps[0];
    if (!first) throw new Error("no captions");
    expect(passedCaptions(caps, new Set(), first.at - 0.1)).toEqual([]);
    expect(passedCaptions(caps, new Set(), first.at)).toEqual([first]);
    expect(passedCaptions(caps, new Set([first.id]), first.at)).toEqual([]);
  });

  it("quips state the viewing time, never history", () => {
    expect(quipFor(1, 12, 10)).toContain("1.2 seconds");
    for (let i = 0; i < 8; i++)
      expect(quipFor(i, 10, 10)).not.toMatch(
        /\d{4}|Meiji|Taish|Sh[oō]wa|century/,
      );
  });
});
