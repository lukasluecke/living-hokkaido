import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_JOURNAL,
  eraAt,
  eraWeights,
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

// Story, words and trace kinds (labs/activities-kinds).
type Raw = ReturnType<typeof clone>;
type RawActivity = Raw["activities"][number];
const kindOf = <K extends RawActivity["kind"]>(p: Raw, kind: K) => {
  const a = p.activities.find((x) => x.kind === kind);
  if (!a) throw Error(`no ${kind} activity in pack`);
  return a as Extract<RawActivity, { kind: K }>;
};
const realTerms = (p: Raw, patch: object) => {
  const w = kindOf(p, "words");
  w.standIn = false;
  w.terms = w.terms.map((t) => ({ ...t, lang: "ain", ...patch }));
};
const allChecks = {
  spelling: true,
  region: true,
  meaning: true,
  pronunciation: true,
  consent: true,
};

test("pack has story, words and trace activities", () => {
  const kinds = pack.activities.map((a) => a.kind);
  for (const k of ["story", "words", "trace"] as const)
    assert.ok(kinds.includes(k), k);
});

test("real terms need an approved entry, five checks and a recording", () => {
  let p = clone();
  realTerms(p, {});
  let e = validateContentPack(p);
  assert.ok(e.some((x) => x.includes("approved entry")));
  assert.ok(e.some((x) => x.includes("five review checks")));
  p = clone();
  realTerms(p, { review: allChecks });
  e = validateContentPack(p);
  assert.ok(e.some((x) => x.includes("device voice")));
  p = clone();
  realTerms(p, {
    review: allChecks,
    audio: { kind: "recording", sourceId: "hdm" },
  });
  assert.ok(
    validateContentPack(p).some((x) => x.includes("not an audio source")),
  );
});

test("Ainu is never tagged as a Japanese variety; stand-ins stay stand-ins", () => {
  let p = clone();
  realTerms(p, { lang: "ja-x-ainu" });
  assert.ok(
    validateContentPack(p).some((x) => x.includes("not a Japanese dialect")),
  );
  p = clone();
  const w = kindOf(p, "words");
  w.terms = w.terms.map((t) => ({ ...t, lang: "ain" }));
  assert.ok(validateContentPack(p).some((x) => x.includes("stand-in")));
});

test("story fact lines and choices cite the activity's claims", () => {
  const p = clone();
  const s = kindOf(p, "story");
  s.claimIds = ["bark-fiber"];
  const e = validateContentPack(p);
  assert.ok(e.some((x) => x.includes("not in claimIds")));
  const q = clone();
  const line = kindOf(q, "story").chapters[0].lines[1];
  if (line.role === "fact") line.claimIds = [];
  assert.notDeepEqual(validateContentPack(q), []);
});

test("timeline: eras cite claims in their knowledge entry", () => {
  const t = pack.timelines[0];
  assert.ok(t, "pack has a timeline");
  assert.ok(t.eras.length >= 2);
  for (const e of t.eras)
    for (const c of e.claimIds)
      assert.ok(resolveClaim(pack, t.knowledgeId, c), `${e.id} → ${c}`);
  const p = clone();
  p.timelines[0].eras[1].claimIds.push("invented-claim");
  assert.ok(
    validateContentPack(p).some(
      (e) => e.includes("invented-claim") && e.includes("timeline"),
    ),
  );
});

test("timeline: eras must be in time order; packs without timelines parse", () => {
  const p = clone();
  p.timelines[0].eras[2].year = 100;
  assert.ok(validateContentPack(p).some((e) => e.includes("time order")));
  const { timelines: _drop, ...old } = clone();
  assert.deepEqual(validateContentPack(old), []);
});

test("timeline: withdrawn knowledge hides the timeline", () => {
  const p = clone();
  const k = p.knowledge.findIndex((x) => x.id === "house-over-time");
  p.knowledge[k] = { ...p.knowledge[k], presentation: "withdrawn" };
  assert.ok(
    validateContentPack(p).some(
      (e) => e.includes("timeline") && e.includes("withdrawn"),
    ),
  );
});

test("timeline: era weights blend neighbours and sum to 1", () => {
  assert.deepEqual(eraWeights(5, 0), [1, 0, 0, 0, 0]);
  const w = eraWeights(5, 2.25);
  assert.ok(Math.abs(w[2] - 0.75) < 1e-9 && Math.abs(w[3] - 0.25) < 1e-9);
  assert.deepEqual(eraWeights(3, 9), [0, 0, 1]);
  assert.equal(eraAt(5, 2.6), 3);
  assert.equal(eraAt(5, -1), 0);
});

test("timeline events parse", () => {
  for (const e of [
    { type: "timeline.open", timelineId: "house-over-time" },
    { type: "timeline.era", timelineId: "house-over-time", eraId: "meiji" },
    { type: "timeline.close", timelineId: "house-over-time" },
  ])
    assert.ok(experienceEventSchema.safeParse(e).success, e.type);
});
