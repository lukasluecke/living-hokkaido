// Vendored teammate games (vendor/README.md): contract kinds, content wiring
// and the boundary check inside the vendored hide-seek game.
import assert from "node:assert/strict";
import test from "node:test";
import { checkProps } from "@vendor/out-of-place/src/embed";
import {
  activitySchema,
  type ResolvedClaim,
  resolveClaim,
  validateContentPack,
} from "@/contracts";
import { barkToClothPack, barkToClothRaw } from "@/content/bark-to-cloth";
import { hiddenGameActivities } from "@/content/bark-to-cloth/games";

const clone = () => structuredClone(barkToClothRaw) as typeof barkToClothRaw;

const prefs = { reducedMotion: false, webgl: true };
const noop = () => {};

test("both games are activities on the herring coast", () => {
  const kinds = barkToClothPack.activities.map((a) => a.kind);
  assert.ok(kinds.includes("hide-seek"));
  assert.ok(kinds.includes("slope-run"));
  const coast = barkToClothPack.scenes.find((s) => s.id === "herring-coast");
  assert.ok(coast?.activityIds.includes("hide-seek-otaru-warehouse"));
  assert.ok(coast?.activityIds.includes("slope-run-otaru"));
  // The area's own quizzes stay.
  assert.ok(coast?.activityIds.includes("quiz-sea-products"));
  // The Meiji Sapporo street is hidden for now (kept in games.ts).
  assert.ok(
    !barkToClothPack.activities.some(
      (a) => a.id === "hide-seek-sapporo-street",
    ),
  );
  for (const a of hiddenGameActivities)
    assert.equal(activitySchema.safeParse(a).success, true);
});

test("hide-seek: referenced claims must be in claimIds; defaults apply", () => {
  const a = barkToClothPack.activities.find((x) => x.kind === "hide-seek");
  assert.ok(a && a.kind === "hide-seek");
  assert.equal(a.players, "pass-and-play");
  assert.equal(a.illustrative, true);
  assert.equal(a.durations.seek, 90);
  const bad = { ...a, captionClaimIds: ["not-listed"] };
  assert.equal(activitySchema.safeParse(bad).success, false);
});

test("slope-run parses and an unknown claim is reported", () => {
  const p = clone();
  const s = p.activities.find((x) => x.kind === "slope-run");
  assert.ok(s);
  s.claimIds = ["no-such-claim"];
  assert.ok(validateContentPack(p).some((e) => e.includes("no-such-claim")));
});

test("slope-run finds must cite a claim of the activity", () => {
  const s = barkToClothPack.activities.find((x) => x.kind === "slope-run");
  assert.ok(s && s.kind === "slope-run" && s.finds.length > 0);
  const p = clone();
  const raw = p.activities.find((x) => x.kind === "slope-run");
  assert.ok(raw && raw.kind === "slope-run" && raw.finds);
  raw.finds[0] = { ...raw.finds[0], claimId: "sapporo-grid-1871" };
  assert.ok(validateContentPack(p).some((e) => e.includes("find find-")));
});

test("the vendored game accepts our parsed activities and claims", () => {
  for (const a of barkToClothPack.activities) {
    if (a.kind !== "hide-seek") continue;
    const claims: Record<string, ResolvedClaim> = {};
    for (const id of a.claimIds) {
      const c = resolveClaim(barkToClothPack, a.knowledgeId, id);
      if (c) claims[id] = c;
    }
    const out = checkProps({ activity: a, claims, prefs, emit: noop });
    assert.equal(out.activity.id, a.id);
    // A missing (e.g. withdrawn) claim fails loudly at the game boundary.
    const [first] = a.claimIds;
    const { [first]: _gone, ...fewer } = claims;
    assert.throws(() =>
      checkProps({ activity: a, claims: fewer, prefs, emit: noop }),
    );
  }
});

test("game knowledge stays a research preview without a reviewer", () => {
  for (const id of ["otaru-herring-warehouse", "meiji-sapporo-street"]) {
    const k = barkToClothPack.knowledge.find((x) => x.id === id);
    assert.equal(k?.presentation, "research-preview");
    assert.equal(k?.reviewer, undefined);
  }
});
