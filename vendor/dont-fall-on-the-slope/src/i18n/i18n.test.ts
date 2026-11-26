import { describe, expect, it } from "vitest";
import { GALLERY } from "../core/captions";
import { runTitle } from "../core/score";
import { langFrom, STRINGS, strings } from "./index";

describe("i18n", () => {
  it("picks Japanese for ja browsers and ?lang=ja, else English", () => {
    expect(langFrom("ja")).toBe("ja");
    expect(langFrom("ja-JP")).toBe("ja");
    expect(langFrom("en-GB")).toBe("en");
    expect(langFrom(undefined)).toBe("en");
    expect(strings("ja").lang).toBe("ja");
    expect(strings("fr").lang).toBe("en");
  });

  for (const t of Object.values(STRINGS)) {
    it(`${t.lang}: has all 12 gallery captions, short enough for 2 s`, () => {
      expect(t.gallery).toHaveLength(GALLERY.length);
      for (const g of t.gallery) {
        expect(g.title.length).toBeGreaterThan(0);
        expect(g.short.length).toBeGreaterThan(0);
        expect(g.short.length).toBeLessThanOrEqual(38);
      }
    });

    it(`${t.lang}: game lines state no history (no years or eras)`, () => {
      const lines = [
        ...t.closeCalls,
        t.finishLine,
        t.glassLine,
        t.glassTitle,
        t.crash(null),
        ...Object.keys(t.hit).map((k) => t.crash(k)),
      ];
      for (const l of lines)
        expect(l).not.toMatch(/\d{4}|Meiji|Taish|明治|大正|昭和|世紀/);
    });

    it(`${t.lang}: names every obstacle and titles runs`, () => {
      for (const k of [
        "shopfront",
        "snow-pile",
        "lamp-post",
        "crate",
        "bicycle",
        "tourist",
        "rickshaw",
        "herring-crates",
        "sled",
        "snowman",
      ])
        expect(t.hit[k]).toBeTruthy();
      expect(runTitle(1, 1, "crate", false, 2026, t.runTitles)).toMatch(/2026/);
    });
  }

  it("Japanese crash lines differ from English (really translated)", () => {
    expect(STRINGS.ja.crash("crate")).not.toBe(STRINGS.en.crash("crate"));
    expect(STRINGS.ja.title).toBe("坂道で転ばないでください");
  });
});
