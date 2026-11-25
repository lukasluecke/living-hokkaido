// Teammate games, vendored with git subtree (vendor/README.md). Their cited
// knowledge and hide-seek activities are imported as-is from the vendored
// folders, so an upstream pull updates them here too. Only the wiring
// (which place offers which game) and the slope-run activity live here.
import type { ActivityInput, KnowledgeEntry } from "@/contracts";
import { otaruHideSeek } from "@vendor/out-of-place/content/scenes/otaru-herring-warehouse/activity";
import { otaruWarehouseKnowledge } from "@vendor/out-of-place/content/scenes/otaru-herring-warehouse/knowledge";
import { sapporoStreetHideSeek } from "@vendor/out-of-place/content/scenes/sapporo-street/activity";
import { sapporoStreetKnowledge } from "@vendor/out-of-place/content/scenes/sapporo-street/knowledge";

export const gameKnowledge: KnowledgeEntry[] = [
  otaruWarehouseKnowledge,
  sapporoStreetKnowledge,
];

/**
 * Don't Fall on the Slope has no knowledge of its own yet (its captions are
 * upstream milestone M3). Until then it reuses the cited Otaru claims, as
 * its CLAUDE.md suggests; the completion only restates one of them.
 */
const slopeRun: ActivityInput = {
  kind: "slope-run",
  id: "slope-run-otaru",
  knowledgeId: otaruWarehouseKnowledge.id,
  title: "Don't Fall on the Slope",
  claimIds: ["kitahama-tuff-on-timber", "otaru-canal-1914-1923"],
  prompt:
    "January, an icy shopping street. Slide down to the canal without touching anything: not the shops, not the snow piles, not the tourists.",
  completion:
    "Otaru Canal was built from 1914 to 1923, to ease moving goods between ships in the bay and the warehouses on shore.",
};

export const gameActivities: ActivityInput[] = [
  otaruHideSeek,
  sapporoStreetHideSeek,
  slopeRun,
];

/**
 * Which place offers which game (a placement choice, not a claim). The
 * Otaru games go to the herring coast; the Meiji Sapporo street (planned
 * grid, Kaitakushi era) to the survey forest.
 */
export const gameActivityIdsByScene: Record<string, string[]> = {
  "herring-coast": [otaruHideSeek.id, slopeRun.id],
  "survey-forest": [sapporoStreetHideSeek.id],
};
