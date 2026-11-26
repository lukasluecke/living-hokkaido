import { describe, expect, it } from "vitest";
import {
  displayLabel,
  type FindInfo,
  laneAt,
  NOTICE_PROP,
  NOTICE_WALL,
  noticeAt,
  pickExhibits,
  placeExhibits,
  slidPast,
} from "./exhibits";
import { rng } from "./random";
import { generateTrack } from "./track";

const f = (id: string, look: FindInfo["look"]): FindInfo => ({
  id,
  label: id,
  look,
  text: `${id} text`,
});
const POOL = [
  f("wall", "warehouse-wall"),
  f("fish", "shachihoko"),
  f("sacks", "straw-sacks"),
  f("cart", "sack-cart"),
  f("boxes", "herring-boxes"),
  f("canal", "canal"),
];

describe("pickExhibits", () => {
  it("takes at most 2 new ones, fills up with seen ones, always the canal", () => {
    const first = pickExhibits(POOL, [], rng(1));
    expect(first.filter((p) => p.look !== "canal")).toHaveLength(2);
    expect(first.some((p) => p.id === "canal")).toBe(true);

    const seen = ["wall", "fish", "sacks"];
    const next = pickExhibits(POOL, seen, rng(2));
    const others = next.filter((p) => p.look !== "canal");
    expect(others).toHaveLength(4);
    expect(others.filter((p) => !seen.includes(p.id))).toHaveLength(2);

    const all = pickExhibits(
      POOL,
      POOL.map((p) => p.id),
      rng(3),
    );
    expect(all.filter((p) => p.look !== "canal")).toHaveLength(4);
  });
});

describe("placeExhibits", () => {
  const track = generateTrack(3);
  const { track: t, spots } = placeExhibits(track, POOL);

  it("places every exhibit once, down the street in order", () => {
    expect(spots.map((s) => s.id).sort()).toEqual(POOL.map((p) => p.id).sort());
    const along = spots.filter((s) => s.look !== "canal");
    for (let i = 1; i < along.length; i++)
      expect(along[i]!.s0).toBeGreaterThan(along[i - 1]!.s0);
  });

  it("turns wall and shachihoko buildings into stone warehouses", () => {
    for (const s of spots.filter(
      (x) => x.look === "warehouse-wall" || x.look === "shachihoko",
    )) {
      const b = t.buildings.find((x) => x.id === s.buildingId);
      expect(b?.kind).toBe("stone-warehouse");
    }
  });

  it("props are solid, on the side away from the lane, with room around", () => {
    for (const s of spots.filter((x) =>
      ["straw-sacks", "sack-cart", "herring-boxes"].includes(x.look),
    )) {
      const prop = t.obstacles.find((o) => o.id === `exhibit-${s.id}`);
      expect(prop?.kind).toBe("exhibit");
      const lane = laneAt(t, s.s0);
      expect(Math.abs(lane - s.x)).toBeGreaterThan(2);
      const near = t.obstacles.filter(
        (o) =>
          o !== prop &&
          Math.sign(o.x) === s.side &&
          Math.abs(o.x) > t.halfWidth - 1.8 &&
          Math.abs(o.s - s.s0) < 1.5,
      );
      expect(near).toEqual([]);
    }
  });

  it("does not change the original track", () => {
    expect(track.obstacles.some((o) => o.kind === "exhibit")).toBe(false);
  });
});

describe("noticeAt", () => {
  const { spots } = placeExhibits(generateTrack(3), POOL);
  it("notices a wall when close to it, a prop when close by, never twice", () => {
    const wall = spots.find((s) => s.id === "wall")!;
    const mid = (wall.s0 + wall.s1) / 2;
    expect(
      noticeAt(spots, [], mid, wall.x - wall.side * NOTICE_WALL * 0.9),
    ).toContain("wall");
    expect(
      noticeAt(spots, [], mid, wall.x - wall.side * (NOTICE_WALL + 0.5)),
    ).not.toContain("wall");
    expect(noticeAt(spots, ["wall"], mid, wall.x)).not.toContain("wall");

    const sacks = spots.find((s) => s.id === "sacks")!;
    expect(noticeAt(spots, [], sacks.s0, sacks.x - sacks.side * 2)).toContain(
      "sacks",
    );
    expect(
      noticeAt(spots, [], sacks.s0 + NOTICE_PROP.s + 1, sacks.x),
    ).not.toContain("sacks");
  });
  it("never notices the canal on the way (it is the finish)", () => {
    expect(noticeAt(spots, [], 320, 0)).not.toContain("canal");
  });
});

describe("slidPast", () => {
  it("explains a passed, missed exhibit, new ones first", () => {
    const passed = () => true;
    expect(slidPast(POOL, ["wall"], [], passed)?.id).toBe("fish");
    expect(
      slidPast(POOL, [], ["wall", "fish", "sacks", "cart", "boxes"], passed),
    ).toBeUndefined();
    expect(slidPast(POOL, [], [], () => false)).toBeUndefined();
  });
});

describe("displayLabel", () => {
  it("capitalises the first word and turns ids into words", () => {
    expect(displayLabel("shachihoko")).toBe("Shachihoko");
    expect(displayLabel("herring-boxes")).toBe("Herring boxes");
    expect(displayLabel("Canal")).toBe("Canal");
  });
});
