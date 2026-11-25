import { describe, expect, it } from "vitest";
import {
  hideSeekActivitySchema,
  knowledgeEntrySchema,
  resolveClaims,
} from "../../src/integration/contracts";
import { sapporoStreetHideSeek } from "./sapporo-street/activity";
import { sapporoStreetKnowledge } from "./sapporo-street/knowledge";
import { otaruHideSeek } from "./otaru-herring-warehouse/activity";
import { otaruWarehouseKnowledge } from "./otaru-herring-warehouse/knowledge";

describe("Otaru warehouse content", () => {
  it("the knowledge entry passes the living-hokkaido schema", () => {
    expect(() =>
      knowledgeEntrySchema.parse(otaruWarehouseKnowledge),
    ).not.toThrow();
  });

  it("the activity passes the proposed hide-seek schema, with defaults", () => {
    const a = hideSeekActivitySchema.parse(otaruHideSeek);
    expect(a.durations).toEqual({
      sceneReveal: 10,
      disguise: 60,
      seek: 90,
      reveal: 20,
    });
    expect(a.wrongTapPenalty).toBe(10);
    expect(a.illustrative).toBe(true);
  });

  it("every claim the activity uses resolves, with at least one source", () => {
    const claims = resolveClaims(otaruWarehouseKnowledge);
    expect(otaruHideSeek.knowledgeId).toBe(otaruWarehouseKnowledge.id);
    for (const id of otaruHideSeek.claimIds) {
      expect(claims[id], id).toBeDefined();
      expect(claims[id].sources.length, id).toBeGreaterThan(0);
    }
  });

  it("is labelled as a research preview until reviewed", () => {
    expect(otaruWarehouseKnowledge.presentation).toBe("research-preview");
  });

  it("rejects caption claims that are not in claimIds", () => {
    const bad = { ...otaruHideSeek, captionClaimIds: ["not-a-claim"] };
    expect(hideSeekActivitySchema.safeParse(bad).success).toBe(false);
  });

  it("a withdrawn entry resolves to nothing", () => {
    expect(
      resolveClaims({ ...otaruWarehouseKnowledge, presentation: "withdrawn" }),
    ).toEqual({});
  });
});

describe.each([
  ["Otaru warehouse", otaruWarehouseKnowledge, otaruHideSeek],
  ["Sapporo street", sapporoStreetKnowledge, sapporoStreetHideSeek],
] as const)("%s scene", (_name, knowledge, activity) => {
  it("passes both schemas and every claim resolves with a source", () => {
    expect(() => knowledgeEntrySchema.parse(knowledge)).not.toThrow();
    const a = hideSeekActivitySchema.parse(activity);
    const claims = resolveClaims(knowledge);
    expect(a.knowledgeId).toBe(knowledge.id);
    for (const id of a.claimIds) {
      expect(claims[id], id).toBeDefined();
      expect(claims[id].sources.length, id).toBeGreaterThan(0);
    }
  });

  it("has at least one out-of-place claim for the reveal", () => {
    expect(activity.anachronismClaimIds?.length ?? 0).toBeGreaterThan(0);
  });
});
