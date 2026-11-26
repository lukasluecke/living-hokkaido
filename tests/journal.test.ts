import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_JOURNAL } from "@/contracts";
import { barkToClothPack as pack } from "@/content/bark-to-cloth";
import { placeOf } from "@/parts/journal/book";

const stamp = (id: string) => {
  const s = pack.stamps.find((x) => x.id === id);
  assert.ok(s, id);
  return s;
};

test("journal: every place, object and activity stamp names an open place", () => {
  const open = new Set(
    pack.island.locations.filter((l) => l.status === "open").map((l) => l.id),
  );
  for (const s of pack.stamps) {
    const p = placeOf(pack, EMPTY_JOURNAL, s);
    if (s.unlock.on === "seasons-seen" || s.unlock.on === "reveal-opened")
      assert.equal(p, null, s.id);
    else assert.ok(p && open.has(p.id), s.id);
  }
});

test("journal: a visit stamp points to its own place", () => {
  const s = stamp("grove-visit");
  assert.equal(placeOf(pack, EMPTY_JOURNAL, s)?.id, "listening-grove");
});

test("journal: an activity stamp points to the place of what is left", () => {
  const s = stamp("weaver");
  assert.equal(placeOf(pack, EMPTY_JOURNAL, s)?.id, "makers-clearing");
});
