import { describe, expect, it } from "vitest";
import { GALLERY, placeCaptions } from "./captions";
import { facadeFor, facadesFor, MARKS } from "./facades";
import { generateTrack } from "./track";

const track = generateTrack(1);
const caps = placeCaptions(track.buildings, track.length - 3);
const facades = facadesFor(track.buildings, caps);
const of = (title: string) => {
  const c = caps.find((x) => x.title === title);
  return facades.get(c?.buildingId ?? "");
};

describe("facades", () => {
  it("gives every building a look", () => {
    expect(facades.size).toBe(track.buildings.length);
  });

  it("follows the research for the labelled buildings", () => {
    expect(GALLERY).toHaveLength(12);
    expect(of("Merchant House with Fire Walls")).toMatchObject({
      fireWalls: true,
      shutters: true,
    });
    expect(of("Clock Shop with a Band Balcony")).toMatchObject({
      balcony: true,
      clock: true,
      creatures: 2,
    });
    expect(of("Rice Merchant")?.wall).toBe("brick");
    expect(of("Glass Workshop")?.ground).toBe("glass-display");
    expect(of("Lamp-Lit Hall")?.lamps).toBe(true);
    expect(of("Bank")).toMatchObject({ columns: true, turrets: true });
    expect(of("Shipowner's Warehouse with Roof Creatures")?.creatures).toBe(8);
    expect(of("Shipping House with a Painted Mark")?.mark).not.toBeNull();
    expect(of("Hotel")?.extraStorey).toBe(true);
  });

  it("gives each researched type the shape of its real building type", () => {
    expect(of("Merchant House with Fire Walls")?.form).toBe("kura-shop");
    expect(of("Clock Shop with a Band Balcony")?.form).toBe("clock-shop");
    expect(of("Rice Merchant")?.form).toBe("brick-merchant");
    expect(of("Wholesale Store")?.form).toBe("machiya");
    expect(of("Glass Workshop")?.form).toBe("glass-shop");
    expect(of("Herring Fertilizer Warehouse")?.form).toBe("gable-warehouse");
    expect(of("Lamp-Lit Hall")?.form).toBe("lamp-hall");
    expect(of("Bank")?.form).toBe("bank");
    expect(of("Shipowner's Warehouse with Roof Creatures")?.form).toBe(
      "gate-warehouse",
    );
    expect(of("Shipping House with a Painted Mark")?.form).toBe(
      "gable-warehouse",
    );
    expect(of("Hotel")?.form).toBe("hotel");
    expect(of("Canal Warehouse")?.form).toBe("canal-warehouse");
  });

  it("keeps roof creatures, columns and turrets for the labelled few", () => {
    const labelled = new Set(caps.map((c) => c.buildingId));
    for (const b of track.buildings) {
      if (labelled.has(b.id)) continue;
      const f = facadeFor(b);
      expect(f.creatures).toBe(0);
      expect(f.columns || f.turrets || f.balcony || f.clock).toBe(false);
    }
  });

  it("mixes the generic street like the photos: machiya and clapboard", () => {
    const forms = new Set([...facades.values()].map((f) => f.form));
    expect(forms).toContain("machiya");
    expect(forms).toContain("clapboard-house");
    expect(forms).toContain("stone-warehouse");
  });

  it("only uses made-up marks", () => {
    for (const f of facades.values())
      if (f.mark) expect(MARKS).toContain(f.mark);
  });

  it("is the same for the same street", () => {
    expect(facadesFor(track.buildings, caps)).toEqual(facades);
  });
});
