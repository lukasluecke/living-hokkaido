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
 * Don't Fall on the Slope has no knowledge of its own yet. It reuses the
 * cited Otaru claims, as its CLAUDE.md suggests: each find is one claim,
 * and the completion only restates one of them.
 */
const slopeRun: ActivityInput = {
  kind: "slope-run",
  id: "slope-run-otaru",
  knowledgeId: otaruWarehouseKnowledge.id,
  title: "Don't Fall on the Slope",
  claimIds: [
    "otaru-warehouse-1890",
    "kitahama-tuff-on-timber",
    "otaru-warehouse-shachihoko",
    "kimura-warehouse-1894",
    "herring-fertilizer",
    "herring-peak-1897",
    "otaru-canal-1914-1923",
  ],
  prompt:
    "January, an icy shopping street. Slide down to the canal without touching the shops, lamp posts or people. Snow piles only slow you down. Slide through the floating museum labels to collect them: the end card explains each one.",
  // Labels are short game names; the end card shows each claim's text.
  finds: [
    {
      id: "find-warehouse",
      label: "A stone warehouse",
      claimId: "otaru-warehouse-1890",
    },
    {
      id: "find-tuff",
      label: "Tuff stone",
      claimId: "kitahama-tuff-on-timber",
    },
    {
      id: "find-shachihoko",
      label: "Shachihoko",
      claimId: "otaru-warehouse-shachihoko",
    },
    {
      id: "find-fertilizer",
      label: "Herring fertilizer",
      claimId: "herring-fertilizer",
    },
    {
      id: "find-kimura",
      label: "The Kimura warehouse",
      claimId: "kimura-warehouse-1894",
    },
    {
      id: "find-peak",
      label: "The herring peak",
      claimId: "herring-peak-1897",
    },
  ],
  completion:
    "Otaru Canal was built from 1914 to 1923, to ease moving goods between ships in the bay and the warehouses on shore.",
};

export const gameActivities: ActivityInput[] = [otaruHideSeek, slopeRun];

/**
 * Hidden for now (Lukas, 2026-11-25): the Meiji Sapporo street has no fitting
 * place on the island yet. Kept so a place can offer it again: add it to
 * gameActivities and to gameActivityIdsByScene.
 */
export const hiddenGameActivities: ActivityInput[] = [sapporoStreetHideSeek];

/**
 * Which place offers which game (a placement choice, not a claim). The
 * Otaru games go to the herring coast.
 */
export const gameActivityIdsByScene: Record<string, string[]> = {
  "herring-coast": [otaruHideSeek.id, slopeRun.id],
};
