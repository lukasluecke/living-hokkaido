// Identifier rules shared by every part.
//
// All ids are stable, lower-case kebab-case strings ("lake-house", "fiber").
// An id never changes after another part or the journal refers to it. Rename
// = new id + migration note in docs/CONTRACTS.md.
import { z } from "zod";

export const idSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Ids are lower-case kebab-case");

/** Aliases document which kind of id a field holds. They are plain strings. */
export type KnowledgeId = string;
export type ClaimId = string;
export type SourceId = string;
export type LocationId = string;
export type SceneId = string;
export type ArtifactId = string;
export type HotspotId = string;
export type ActivityId = string;
export type StampId = string;
export type GuideLineId = string;

/** The parts of the visitor experience. Folder names use the same words. */
export const PART_IDS = [
  "island",
  "detail-scene",
  "artifacts",
  "activities",
  "journal",
  "reveal",
] as const;
export type PartId = (typeof PART_IDS)[number];
