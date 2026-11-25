import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_JOURNAL } from "@/contracts";
import { barkToClothPack as pack } from "@/content/bark-to-cloth";
import { route } from "@/shell/route";
import { initialState, reduce } from "@/shell/state";

const prefs = { reducedMotion: true, webgl: false };
const open = pack.island.locations.find((l) => l.status === "open");
const scene = pack.scenes.find((s) => s.id === open?.sceneId);

test("route: on the island the owl and the rail both point to the open place", () => {
  const st = initialState(prefs);
  const r = route(pack, st, EMPTY_JOURNAL);
  assert.equal(r.stations.find((s) => s.status === "now")?.id, "island");
  assert.deepEqual(r.next?.event, {
    type: "location.select",
    locationId: open?.id,
  });
  assert.deepEqual(
    r.stations.find((s) => s.id === "place")?.event,
    r.next?.event,
  );
});

test("route: in the room the next step is the first object not looked at", () => {
  assert.ok(open && scene);
  let st = initialState(prefs);
  st = reduce(pack, st, { type: "location.select", locationId: open.id });
  st = reduce(pack, st, { type: "owl.arrived", locationId: open.id });
  const first = scene.placements[0]?.artifactId;
  const second = scene.placements[1]?.artifactId;
  assert.ok(first && second);
  const j = { ...EMPTY_JOURNAL, visited: [open.id], inspected: [first] };
  const r = route(pack, st, j);
  const look = r.stations.find((s) => s.id === "look");
  assert.equal(look?.status, "now");
  assert.equal(look?.sub, `1/${scene.placements.length}`);
  assert.deepEqual(r.next?.event, {
    type: "artifact.focus",
    artifactId: second,
  });
  assert.deepEqual(look?.event, r.next?.event);
  assert.deepEqual(r.stations[0]?.event, {
    type: "scene.exit",
    sceneId: scene.id,
  });
});

test("route: no owl step while an overlay is open; journal station is now", () => {
  let st = initialState(prefs);
  st = reduce(pack, st, { type: "journal.open" });
  const r = route(pack, st, EMPTY_JOURNAL);
  assert.equal(r.next, null);
  assert.equal(r.stations.find((s) => s.status === "now")?.id, "journal");
});
