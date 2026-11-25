// Run: npx tsx scripts/schema-check.ts — validates sample records and the rules.
import assert from "node:assert/strict";
import { knowledge, objects } from "../src/data";
import { artifactObjectSchema, checkLinks } from "../src/schema";

assert.deepEqual(checkLinks(objects, knowledge), [], "sample links resolve");
const base = { ...objects[0], model: { ...objects[0].model } };
const scanNoRights = { ...base, model: { ...base.model, representation: "scan", rights: "unknown", consent: "pending" } };
assert.equal(artifactObjectSchema.safeParse(scanNoRights).success, false, "scan without rights is rejected");
const badHotspot = { ...base, hotspots: [{ ...base.hotspots[0], claimId: "invented" }] };
assert.equal(artifactObjectSchema.safeParse(badHotspot).success, false, "hotspot must cite a linked claim");
const withdrawn = { ...base, model: { ...base.model, consent: "withdrawn" } };
assert.equal(artifactObjectSchema.safeParse(withdrawn).success, false, "withdrawn asset is rejected");
assert.deepEqual(checkLinks([{ ...objects[0], claimIds: ["nope"] }], knowledge).length, 1, "unknown claim reported");
console.log("schema checks passed:", objects.length, "objects");
