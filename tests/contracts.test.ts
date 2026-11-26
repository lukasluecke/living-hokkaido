import assert from "node:assert/strict";
import test from "node:test";
import {
  loadContentPack,
  EMPTY_JOURNAL,
  eraAt,
  eraWeights,
  type ExperienceEvent,
  activitySchema,
  experienceEventSchema,
  resolveClaim,
  sanitizeJournal,
  seasonAt,
  seasonWeights,
  termReviewed,
  validateContentPack,
} from "@/contracts";
import { barkToClothPack, barkToClothRaw } from "@/content/bark-to-cloth";
import { record } from "@/shell/progress";
import { initialState, reduce } from "@/shell/state";
import { AREAS } from "@/parts/island/world/island";

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
  const shut = clone();
  const cabin = shut.island.locations.findIndex((l) => l.id === "memory-cabin");
  shut.island.locations[cabin] = {
    ...shut.island.locations[cabin],
    status: "soon",
  };
  const closed = reduce(loadContentPack(shut), initialState(prefs), {
    type: "location.select",
    locationId: "memory-cabin",
  });
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

test("unreviewed real terms are drafts; device voice never reads them", () => {
  let p = clone();
  realTerms(p, { audio: { kind: "none" } });
  assert.deepEqual(validateContentPack(p), []);
  const w = kindOf(barkToClothRaw as Raw, "words");
  assert.ok(
    w.terms.every((t) => !termReviewed(t.review)),
    "seed terms are drafts",
  );
  p = clone();
  realTerms(p, {
    review: allChecks,
    audio: { kind: "device-voice-placeholder" },
  });
  assert.ok(validateContentPack(p).some((x) => x.includes("device voice")));
  p = clone();
  realTerms(p, { audio: { kind: "recording", sourceId: "hdm" } });
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
  w.standIn = true;
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
  const { timelines: _drop, highlights: _h, ...old } = clone();
  old.scenes = old.scenes.map(({ timelineIds: _t, ...s }) => s);
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

test("timeline overlay opens, returns from a reveal and closes", () => {
  const prefs = { reducedMotion: true, webgl: false };
  const tl = pack.timelines[0];
  assert.ok(tl, "pack has a timeline");
  let s = initialState(prefs);
  s = reduce(pack, s, { type: "timeline.open", timelineId: "nope" });
  assert.equal(s.overlay, null, "unknown timeline does not open");
  s = reduce(pack, s, { type: "timeline.open", timelineId: tl.id });
  assert.equal(s.overlay, "timeline");
  s = reduce(pack, s, {
    type: "reveal.open",
    knowledgeId: tl.knowledgeId,
    claimId: tl.claimIds[0],
  });
  assert.equal(s.overlay, "reveal");
  // The part unmounts under the reveal; that must not close the timeline.
  s = reduce(pack, s, { type: "timeline.close", timelineId: tl.id });
  s = reduce(pack, s, { type: "reveal.close" });
  assert.equal(s.overlay, "timeline");
  s = reduce(pack, s, { type: "nav.back" });
  assert.equal(s.overlay, null);
  assert.equal(s.timelineId, null);
});

test("every open place has its own scene, setting and timelines", () => {
  for (const l of barkToClothPack.island.locations) {
    if (l.status !== "open") continue;
    const s = barkToClothPack.scenes.find((x) => x.id === l.sceneId);
    assert.ok(s, l.id);
    assert.equal(s.locationId, l.id);
  }
  const cabin = barkToClothPack.scenes.find((s) => s.id === "memory-cabin");
  assert.deepEqual(cabin?.timelineIds, ["house-over-time"]);
  assert.equal(
    barkToClothPack.scenes.find((s) => s.id === "lake-house")?.setting,
    "house",
  );
  const bad = clone();
  bad.scenes[3] = { ...bad.scenes[3], timelineIds: ["nope"] } as never;
  assert.ok(
    validateContentPack(bad).some((e) => e.includes('unknown timeline "nope"')),
  );
});

test("map activities: spots cite the activity's claims; placeholder defaults on", () => {
  const m = pack.activities.find((a) => a.kind === "map");
  assert.ok(m && m.kind === "map" && m.placeholder);
  const p = clone();
  const raw = kindOf(p, "map");
  raw.spots[0].claimId = "bark-fiber";
  assert.ok(validateContentPack(p).some((e) => e.includes("not in claimIds")));
  const q = clone();
  const dup = kindOf(q, "map");
  dup.spots[1].id = dup.spots[0].id;
  assert.ok(validateContentPack(q).some((e) => e.includes("Duplicate")));
});

test("story refrain lines need a refrain that cites a claim", () => {
  const owl = pack.activities.find((a) => a.id === "story-owl");
  assert.ok(owl && owl.kind === "story" && owl.refrain?.lang === "ain");
  const p = clone();
  const raw = p.activities.find((a) => a.id === "story-owl");
  assert.ok(raw && raw.kind === "story");
  raw.refrain = undefined;
  assert.ok(
    validateContentPack(p).some((e) => e.includes("is a refrain, but none")),
  );
});

test("music kinds cite their claims; tune notes name real strings", () => {
  const p = clone();
  const c = kindOf(p, "canon");
  c.structureClaimId = "bark-fiber";
  assert.ok(validateContentPack(p).some((e) => e.includes("canon-ukouk")));
  const q = clone();
  const t = kindOf(q, "pluck");
  t.tune?.notes.push({ string: 9, hand: "right" });
  assert.ok(validateContentPack(q).length > 0);
});

test("themed-area places sit on the island's area scenes", () => {
  const areas = barkToClothPack.island.locations.filter((l) =>
    l.building.startsWith("area-"),
  );
  assert.equal(areas.length, AREAS.length);
  for (const l of areas) {
    const a = AREAS.find((x) => `area-${x.id}` === l.building);
    assert.ok(a, l.id);
    assert.deepEqual([l.anchor[0], l.anchor[2]], [a.x, a.z], l.id);
    assert.ok(l.knowledgeIds.includes("land-and-sea"), l.id);
  }
});

test("journal keeps things found in activities, and old journals parse", () => {
  const slope = pack.activities.find((a) => a.kind === "slope-run");
  assert.ok(slope);
  let j = EMPTY_JOURNAL;
  for (const found of [["find-tuff"], ["find-tuff", "find-peak"], undefined])
    j = record(pack, j, {
      type: "activity.complete",
      result: {
        activityId: slope.id,
        completed: true,
        at: "2026-11-25T00:00:00Z",
        found,
      },
    }).journal;
  assert.deepEqual(j.found, [`${slope.id}/find-tuff`, `${slope.id}/find-peak`]);
  // A journal saved before `found` existed gets [] (additive default).
  const { found: _, ...old } = EMPTY_JOURNAL;
  assert.deepEqual(sanitizeJournal(pack, old)?.found, []);
  // Unknown activities drop out.
  const k = sanitizeJournal(pack, { ...j, found: [...j.found, "gone/x"] });
  assert.deepEqual(k?.found, j.found);
});

test("slope-run finds default their look (older definitions parse)", () => {
  const a = activitySchema.parse({
    kind: "slope-run",
    id: "s",
    knowledgeId: "k",
    title: "t",
    claimIds: ["c"],
    prompt: "p",
    completion: "c",
    finds: [{ id: "f", label: "F", claimId: "c" }],
  });
  assert.ok(a.kind === "slope-run");
  assert.equal(a.finds[0]?.look, "straw-sacks");
});

test("place: stage hills and the hill things parse (additive enum values)", () => {
  const step = (id: string, thing: string, right = true) => ({
    id,
    say: "Fact.",
    claimIds: ["c"],
    ask: "Where?",
    figure: { label: "Thing", thing },
    options: [
      { x: 0.2, y: 0.2, right },
      { x: 0.6, y: 0.6 },
    ],
  });
  const r = activitySchema.safeParse({
    id: "x",
    knowledgeId: "k",
    title: "T",
    claimIds: ["c"],
    kind: "place",
    stage: "hills",
    subject: "objects",
    completion: "Done.",
    steps: [
      "deer",
      "bear",
      "hare",
      "salmon",
      "set-bow",
      "pelt",
      "fish-owl",
    ].map((t) => step(t, t)),
  });
  assert.ok(r.success);
});

test("clips: only plain .mp4 keys; eras and area scenes carry their clip", async () => {
  const { clipSchema } = await import("@/contracts");
  assert.equal(
    clipSchema.safeParse({ key: "../x.mp4", title: "a", note: "b", tool: "c" })
      .success,
    false,
  );
  assert.equal(
    clipSchema.safeParse({
      key: "era-1-pit.mp4",
      title: "a",
      note: "b",
      tool: "c",
    }).success,
    true,
  );
  const t = pack.timelines[0];
  for (const e of t.eras) if (e.clip) assert.match(e.clip.note, /AI-imagined/);
  assert.ok(pack.scenes.some((s) => s.clip));
});

test("media ranges: start-end, open end, suffix, bad", async () => {
  const { parseRange } = await import("@/integrations/media");
  assert.equal(parseRange(null, 100), null);
  assert.deepEqual(parseRange("bytes=0-9", 100), { offset: 0, length: 10 });
  assert.deepEqual(parseRange("bytes=90-", 100), { offset: 90, length: 10 });
  assert.deepEqual(parseRange("bytes=-5", 100), { offset: 95, length: 5 });
  assert.equal(parseRange("bytes=200-", 100), "bad");
  assert.equal(parseRange("items=0-1", 100), "bad");
});

test("films: source from one config value; grove has the owl film", async () => {
  const { filmSourceFrom, filmSchema } = await import("@/contracts");
  const { PUBLIC_MEDIA } = await import("@/integrations/museum-assets/edge");
  assert.deepEqual(filmSourceFrom(""), { kind: "none" });
  assert.deepEqual(filmSourceFrom("owl-story.mp4"), {
    kind: "r2",
    key: "owl-story.mp4",
  });
  for (const url of [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3",
    "https://youtu.be/dQw4w9WgXcQ?si=x",
    "https://youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    "dQw4w9WgXcQ",
  ])
    assert.deepEqual(filmSourceFrom(url), {
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  assert.deepEqual(filmSourceFrom("https://example.com/x.mp4"), {
    kind: "none",
  });
  assert.deepEqual(filmSourceFrom("../x.mp4"), { kind: "none" });
  const f = filmSchema.parse({
    title: "a",
    teaser: "b",
    credit: "c",
    note: "d",
  });
  assert.equal(f.source.kind, "none");
  const grove = barkToClothPack.scenes.find((s) => s.id === "listening-grove");
  assert.ok(grove?.film);
  assert.match(grove.film.note, /not a museum source/);
  if (grove.film.source.kind === "r2")
    assert.ok(PUBLIC_MEDIA.has(grove.film.source.key));
  assert.ok(PUBLIC_MEDIA.has("owl-story.mp4"));
});
