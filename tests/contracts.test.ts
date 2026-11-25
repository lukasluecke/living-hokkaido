import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_JOURNAL,
  type ExperienceEvent,
  experienceEventSchema,
  resolveClaim,
  sanitizeJournal,
  seasonAt,
  seasonWeights,
  validateContentPack,
} from "@/contracts";
import { barkToClothPack, barkToClothRaw } from "@/content/bark-to-cloth";
import { record } from "@/shell/progress";
import { initialState, reduce } from "@/shell/state";

const pack = barkToClothPack;
const clone = () => structuredClone(barkToClothRaw);

test("default content pack is consistent", () => {
  assert.deepEqual(validateContentPack(barkToClothRaw), []);
});

test("broken references are reported", () => {
  const p = clone();
  p.scenes[0].placements[0].artifactId = "no-such-thing";
  p.artifacts[0].claimIds.push("invented-claim");
  const errors = validateContentPack(p);
  assert.ok(errors.some((e) => e.includes("no-such-thing")));
  assert.ok(errors.some((e) => e.includes("invented-claim")));
});

test("hotspots must cite a linked claim", () => {
  const p = clone();
  const h = p.artifacts[0].hotspots?.[0];
  if (h) h.claimId = "variation";
  assert.notDeepEqual(validateContentPack(p), []);
});

test("scans without rights and consent are rejected", () => {
  const p = clone();
  p.artifacts[0].model = {
    ...p.artifacts[0].model,
    representation: "scan",
    rights: "unknown",
    consent: "pending",
  };
  assert.notDeepEqual(validateContentPack(p), []);
});

test("withdrawn knowledge cannot be referenced", () => {
  const p = clone();
  p.knowledge[0] = { ...p.knowledge[0], presentation: "withdrawn" };
  assert.ok(validateContentPack(p).some((e) => e.includes("withdrawn")));
  assert.equal(
    resolveClaim(
      {
        ...pack,
        knowledge: [{ ...pack.knowledge[0], presentation: "withdrawn" }],
      },
      "bark-to-cloth",
      "bark-fiber",
    ),
    null,
  );
});

test("ids must be kebab-case", () => {
  const p = clone();
  p.island.locations[0].id = "Lake House";
  assert.notDeepEqual(validateContentPack(p), []);
});

test("visitor flow through the shell state machine", () => {
  const prefs = { reducedMotion: true, webgl: false };
  const run = (events: ExperienceEvent[]) =>
    events.reduce((s, e) => reduce(pack, s, e), initialState(prefs));
  const closed = run([{ type: "location.select", locationId: "memory-cabin" }]);
  assert.equal(closed.view, "island", "closed locations do not open");
  const s = run([
    { type: "location.select", locationId: "lake-house" },
    { type: "owl.arrived", locationId: "lake-house" },
    { type: "artifact.focus", artifactId: "garment" },
  ]);
  assert.equal(s.view, "focus");
  assert.equal(s.sceneId, "lake-house");
  const back = reduce(pack, s, { type: "nav.back" });
  assert.equal(back.view, "scene");
  assert.equal(back.artifactId, null);
});

test("journal awards stamps once", () => {
  let j = EMPTY_JOURNAL;
  const earned: string[] = [];
  const events: ExperienceEvent[] = [
    { type: "owl.arrived", locationId: "lake-house" },
    { type: "artifact.inspected", artifactId: "fiber" },
    { type: "artifact.inspected", artifactId: "cloth" },
    { type: "artifact.inspected", artifactId: "garment" },
    { type: "artifact.inspected", artifactId: "garment" },
    ...[0, 1, 2, 3].map(
      (value): ExperienceEvent => ({ type: "season.set", value }),
    ),
  ];
  for (const e of events) {
    const r = record(pack, j, e, "2026-11-25T00:00:00Z");
    j = r.journal;
    earned.push(...r.earned);
  }
  assert.deepEqual(earned, [
    "lake-house-visit",
    "three-objects",
    "four-seasons",
  ]);
});

test("stored journal drops unknown ids", () => {
  const j = sanitizeJournal(pack, {
    ...EMPTY_JOURNAL,
    inspected: ["fiber", "deleted-object"],
    hotspotsRead: ["fiber/fibers", "fiber/nope"],
  });
  assert.deepEqual(j?.inspected, ["fiber"]);
  assert.deepEqual(j?.hotspotsRead, ["fiber/fibers"]);
  assert.equal(sanitizeJournal(pack, { version: 1 }), null);
});

test("season helpers", () => {
  for (const v of [0, 0.7, 1.99, 3.8]) {
    const w = seasonWeights(v);
    assert.ok(Math.abs(w.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  }
  assert.equal(seasonAt(3.8), "spring");
  assert.equal(seasonAt(2.2), "autumn");
});

test("events are validated at the boundary", () => {
  assert.ok(
    experienceEventSchema.safeParse({
      type: "artifact.focus",
      artifactId: "fiber",
    }).success,
  );
  assert.equal(
    experienceEventSchema.safeParse({ type: "artifact.focus" }).success,
    false,
  );
  assert.equal(
    experienceEventSchema.safeParse({ type: "made.up" }).success,
    false,
  );
});
