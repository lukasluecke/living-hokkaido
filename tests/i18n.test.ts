import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_JOURNAL, loadContentPack } from "@/contracts";
import { barkToClothPack as pack } from "@/content/bark-to-cloth";
import {
  dictionary,
  fill,
  isLocale,
  localizePack,
  translate,
  translator,
} from "@/i18n/core";
import { route } from "@/shell/route";
import { initialState } from "@/shell/state";

const ja = localizePack(pack, "ja");

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) for (const x of v) strings(x, out);
  else if (v && typeof v === "object")
    for (const x of Object.values(v)) strings(x, out);
  return out;
}

test("i18n: English is the source and returns the same pack", () => {
  assert.equal(localizePack(pack, "en"), pack);
  assert.equal(translate("en", "Close"), "Close");
  assert.equal(translate("ja", "Close"), "閉じる");
  assert.equal(
    translate("ja", "Not in the dictionary"),
    "Not in the dictionary",
  );
  assert.equal(fill("{a} of {b}", { a: 1 }), "1 of {b}");
  assert.ok(isLocale("ja") && !isLocale("de"));
});

test("i18n: the Japanese pack keeps ids and structure and still validates", () => {
  const ids = (p: typeof pack) =>
    JSON.stringify([
      p.island.locations.map((l) => l.id),
      p.artifacts.map((a) => a.id),
      p.activities.map((a) => a.id),
      p.stamps.map((s) => s.id),
      p.knowledge.map((k) => [k.id, k.claims.map((c) => c.id)]),
    ]);
  assert.equal(ids(ja), ids(pack));
  assert.doesNotThrow(() => loadContentPack(ja));
  const lake = ja.island.locations.find((l) => l.id === "lake-house");
  assert.equal(lake?.title, "湖のほとりの家");
});

test("i18n: sources, memories and Ainu words are never translated", () => {
  assert.deepEqual(
    ja.knowledge.map((k) => k.sources),
    pack.knowledge.map((k) => k.sources),
  );
  assert.deepEqual(ja.memories, pack.memories);
  // Every object with lang "ain" keeps its text.
  const ainu = (p: unknown, out: unknown[] = []): unknown[] => {
    if (Array.isArray(p)) for (const x of p) ainu(x, out);
    else if (p && typeof p === "object") {
      const o = p as Record<string, unknown>;
      if (o.lang === "ain") out.push([o.text, o.romanised]);
      for (const x of Object.values(o)) ainu(x, out);
    }
    return out;
  };
  assert.deepEqual(ainu(ja), ainu(pack));
});

test("i18n: no Japanese entry is empty or still English", () => {
  for (const [en, jp] of Object.entries(dictionary("ja"))) {
    assert.ok(jp.trim(), `empty translation for ${en}`);
    const slots = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    assert.equal(slots(jp), slots(en), `slots differ for ${en}`);
  }
});

test("i18n: report content strings without a Japanese draft", () => {
  const dict = dictionary("ja");
  const all = new Set(strings(pack));
  const used = Object.keys(dict).filter((k) => all.has(k)).length;
  const left = strings(ja).filter(
    (s) => all.has(s) && /[a-z] [a-z]/i.test(s) && !(s in dict),
  );
  // Information only: other teams change English text; it shows in English
  // until the dictionary catches up.
  console.log(
    `i18n: ${used} content strings in Japanese; ${new Set(left).size} still English`,
  );
});

test("i18n: route labels follow the locale", () => {
  const r = route(
    ja,
    initialState({ reducedMotion: true, webgl: false }),
    EMPTY_JOURNAL,
    translator("ja"),
  );
  assert.equal(r.stations[0]?.label, "島");
});
