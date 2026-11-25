// Omusha diorama splat (vendor/sapporo-omusha): the splat-look kind, its
// content wiring, the look-closer logic and the museum asset gate.
import assert from "node:assert/strict";
import test from "node:test";
import {
  type ActivityOf,
  activitySchema,
  validateContentPack,
} from "@/contracts";
import { barkToClothPack, barkToClothRaw } from "@/content/bark-to-cloth";
import {
  access,
  COOKIE,
  tokenFor,
  validKey,
} from "@/integrations/museum-assets";
import {
  goalClaims,
  initialLook,
  isComplete,
  openSpot,
  phaseForStatus,
} from "@/parts/activities/captures/splatLogic";

const look = () => {
  const a = barkToClothPack.activities.find((x) => x.id === "omusha-look");
  assert.ok(a && a.kind === "splat-look");
  return a as ActivityOf<"splat-look">;
};

test("the Omusha look is in the Memory cabin, with Shaw's spots", () => {
  const cabin = barkToClothPack.scenes.find((s) => s.id === "memory-cabin");
  assert.ok(cabin?.activityIds.includes("omusha-look"));
  const a = look();
  assert.equal(a.spots.filter((s) => s.group === "figure").length, 13);
  assert.equal(a.spots.filter((s) => s.group === "scene").length, 5);
  assert.equal(a.asset.key, "omusha.sog");
  assert.equal(a.asset.gated, true);
  const k = barkToClothPack.knowledge.find((x) => x.id === a.knowledgeId);
  assert.equal(k?.presentation, "research-preview");
  // Every claim cites a source of its own knowledge entry.
  for (const cl of k?.claims ?? [])
    for (const ci of cl.citations)
      assert.ok(
        k?.sources.some((s) => s.id === ci.sourceId),
        cl.id,
      );
});

test("splat-look: spot claims must be listed in claimIds", () => {
  const raw = structuredClone(barkToClothRaw) as typeof barkToClothRaw;
  const a = raw.activities.find((x) => x.id === "omusha-look") as {
    spots: { claimIds: string[] }[];
  };
  a.spots[0]?.claimIds.push("no-such-claim");
  assert.equal(activitySchema.safeParse(a).success, false);
  assert.ok(validateContentPack(raw).length > 0);
});

test("look closer completes when every spot claim was read", () => {
  const a = look();
  const known = () => true;
  const goal = goalClaims(a, known);
  assert.ok(goal.includes("omusha-elders"));
  assert.ok(!goal.includes("omusha-capture")); // context only, no spot
  let st = initialLook;
  for (const s of a.spots.slice(0, 3)) st = openSpot(a, st, s.id);
  assert.equal(isComplete(a, st, known), false);
  for (const s of a.spots) st = openSpot(a, st, s.id);
  assert.equal(isComplete(a, st, known), true);
  assert.equal(st.opened.length, a.spots.length);
  assert.deepEqual(openSpot(a, st, "nobody"), st);
});

test("asset status maps to a viewer phase", () => {
  assert.equal(phaseForStatus(200), "ready");
  assert.equal(phaseForStatus(401), "locked");
  assert.equal(phaseForStatus(503), "off");
  assert.equal(phaseForStatus(404), "missing");
  assert.equal(phaseForStatus(0), "missing");
});

test("museum asset gate: keys, password cookie, shut without a password", async () => {
  assert.ok(validKey("omusha.sog"));
  assert.ok(!validKey("../omusha.sog"));
  assert.ok(!validKey("omusha.ply"));
  assert.ok(!validKey("a/b.sog"));
  const req = (cookie?: string) =>
    new Request("https://x/api/museum-assets/omusha.sog", {
      headers: cookie ? { cookie } : {},
    });
  assert.equal(await access(req(), undefined), "off");
  assert.equal(await access(req(), "pw"), "locked");
  assert.equal(await access(req(`${COOKIE}=wrong`), "pw"), "locked");
  const t = await tokenFor("pw");
  assert.equal(await access(req(`a=1; ${COOKIE}=${t}`), "pw"), "open");
  assert.equal(await access(req(`${COOKIE}=${t}`), "other"), "locked");
});
