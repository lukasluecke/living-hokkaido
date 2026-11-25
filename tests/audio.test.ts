import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  cueForEvent,
  layerGains,
  soundManifest,
  soundManifestSchema,
  validateManifest,
  zoneForView,
} from "@/audio";
import { experienceEventSchema } from "@/contracts";

const m = soundManifestSchema.parse(soundManifest);

test("sound manifest is consistent", () => {
  assert.deepEqual(validateManifest(m), []);
});

test("every sound file exists and has a credit row", () => {
  for (const [id, s] of Object.entries(m.sounds)) {
    assert.ok(s.credit, `${id} has no credit`);
    for (const src of s.src)
      assert.ok(existsSync(join("public", src)), `${id}: missing ${src}`);
  }
});

test("event map only names real shared events", () => {
  const types = new Set(
    experienceEventSchema.options.map((o) => o.shape.type.value as string),
  );
  for (const ev of Object.keys(m.events))
    assert.ok(types.has(ev), `unknown event ${ev}`);
});

test("views map to zones", () => {
  assert.equal(zoneForView(m, "island"), "island");
  assert.equal(zoneForView(m, "travel"), "island");
  assert.equal(zoneForView(m, "scene"), "interior");
  assert.equal(zoneForView(m, "activity"), "interior");
});

test("ambient mix follows the season", () => {
  const winter = layerGains(m, "island", 3);
  const summer = layerGains(m, "island", 1);
  assert.ok(winter["island-winter-wind"] > summer["island-winter-wind"]);
  assert.equal(winter["island-insects"], 0);
  assert.ok(summer["island-insects"] > 0);
  // In between two seasons, the gain lies between both values.
  const late = layerGains(m, "island", 1.9)["island-insects"];
  assert.ok(late < summer["island-insects"] && late > 0);
  assert.deepEqual(layerGains(m, null, 0), {});
});

test("season.set plays only when the main season changes", () => {
  const set = (value: number) => ({ type: "season.set" as const, value });
  assert.equal(cueForEvent(m, set(0.2), 0.1), null);
  assert.equal(cueForEvent(m, set(1), 0.2), "season");
  assert.equal(cueForEvent(m, { type: "journal.open" }, 0), "book-open");
  assert.equal(
    cueForEvent(m, { type: "artifact.inspected", artifactId: "cloth" }, 0),
    null,
  );
});
