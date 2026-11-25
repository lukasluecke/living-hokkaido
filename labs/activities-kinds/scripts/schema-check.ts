// Run: npm run check:schema. Validates the samples and the gate rules.
import assert from "node:assert/strict";
import type { KnowledgeEntry } from "@/contracts";
import { checkActivityKinds, proposedActivitySchema } from "../contract-proposal";
import { activities, knowledge, raw } from "../src/data";

for (const a of Object.values(activities))
  assert.deepEqual(checkActivityKinds(a, knowledge), [], `${a.id} is clean`);

const words = proposedActivitySchema.parse(raw.words);
const realWord = (patch: object, k: KnowledgeEntry = knowledge) => {
  const a = proposedActivitySchema.parse({
    ...raw.words,
    standIn: false,
    terms: raw.words.terms.map((t) => ({ ...t, lang: "ain", ...patch })),
  });
  return checkActivityKinds(a, k);
};
assert.ok(words.kind === "words" && words.standIn);

// 1. A real (non stand-in) term in a research-preview entry is rejected.
assert.ok(realWord({}).some((e) => e.includes("approved entry")));
// 2. Unreviewed terms are rejected even in an approved entry.
const approved = { ...knowledge, presentation: "approved" as const, reviewer: "test", reviewedAt: "2026-11-25" };
assert.ok(realWord({}, approved).some((e) => e.includes("five review checks")));
// 3. The device voice may never read a real term.
const allOk = { spelling: true, region: true, meaning: true, pronunciation: true, consent: true };
assert.ok(realWord({ review: allOk }, approved).some((e) => e.includes("device voice")));
// 4. A recording must point to an audio source with rights and consent.
assert.ok(
  realWord({ review: allOk, audio: { kind: "recording", sourceId: "hdm" } }, approved).some((e) =>
    e.includes("not an audio source"),
  ),
);
// 5. Ainu tagged as a Japanese variety is rejected.
assert.ok(realWord({ lang: "ja-x-ainu" }).some((e) => e.includes("not a Japanese dialect")));
// 6. A stand-in must not pretend to be the target language.
const fake = proposedActivitySchema.parse({ ...raw.words, terms: raw.words.terms.map((t) => ({ ...t, lang: "ain" })) });
assert.ok(checkActivityKinds(fake, knowledge).some((e) => e.includes("stand-in")));
// 7. A story fact line must cite a claim the activity lists.
const story = proposedActivitySchema.parse({ ...raw.story, claimIds: ["bark-fiber"] });
assert.ok(checkActivityKinds(story, knowledge).length > 0);
// 8. A fact line without a claim fails the schema.
assert.equal(
  proposedActivitySchema.safeParse({
    ...raw.story,
    chapters: [{ id: "x", title: "x", lines: [{ id: "l", role: "fact", text: "t", claimIds: [] }] }],
  }).success,
  false,
);
// 9. A withdrawn entry blocks every activity.
assert.ok(checkActivityKinds(activities.trace, { ...knowledge, presentation: "withdrawn" }).length > 0);
console.log("schema checks passed: 3 samples, 9 rules");
