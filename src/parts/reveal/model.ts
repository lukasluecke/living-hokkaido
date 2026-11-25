// Pure view model for the reveal card. No React, so it is easy to test and
// to reuse in a lab. It only re-arranges data that the content pack already
// holds: it never adds a claim, a reviewer or an extraction step.
import type {
  Artifact,
  ContentPack,
  KnowledgeEntry,
  Presentation,
  ResolvedClaim,
  Source,
} from "@/contracts";

export type RevealSource = {
  source: Source;
  /** Locators from the claim's citations for this source (in order). */
  locators: string[];
};

export type RevealReview =
  | { kind: "approved"; reviewer: string; reviewedAt: string }
  | { kind: "pending" }
  | { kind: "withdrawn" };

export type RevealModel = {
  title: string;
  /** Short line on the front face (artifact title or entry subtitle). */
  subject: string | null;
  claimText: string | null;
  claimId: string | null;
  sources: RevealSource[];
  review: RevealReview;
  presentation: Presentation;
};

export function findEntry(
  content: ContentPack,
  knowledgeId: string,
): KnowledgeEntry | null {
  return content.knowledge.find((k) => k.id === knowledgeId) ?? null;
}

function reviewOf(
  presentation: Presentation,
  entry: KnowledgeEntry | null,
): RevealReview {
  if (presentation === "withdrawn") return { kind: "withdrawn" };
  // "approved" needs a real reviewer and date in the entry. The schema
  // enforces this, but check again: never show a review we cannot back.
  if (presentation === "approved" && entry?.reviewer && entry.reviewedAt)
    return {
      kind: "approved",
      reviewer: entry.reviewer,
      reviewedAt: entry.reviewedAt,
    };
  return { kind: "pending" };
}

/** Sources cited by the claim, each with its locators. */
function citedSources(claim: ResolvedClaim): RevealSource[] {
  const out: RevealSource[] = [];
  for (const cit of claim.claim.citations) {
    const source = claim.sources.find((s) => s.id === cit.sourceId);
    if (!source) continue;
    const row = out.find((r) => r.source.id === source.id);
    if (row) {
      if (!row.locators.includes(cit.locator)) row.locators.push(cit.locator);
    } else out.push({ source, locators: [cit.locator] });
  }
  return out;
}

export function buildReveal(input: {
  content: ContentPack;
  knowledgeId: string;
  claim: ResolvedClaim | null;
  artifact: Artifact | null;
}): RevealModel | null {
  const entry = findEntry(input.content, input.knowledgeId);
  const { claim, artifact } = input;
  if (!entry && !claim) return null;
  const presentation = claim?.presentation ?? entry?.presentation;
  if (!presentation) return null;
  return {
    title: entry?.title ?? "How this was made",
    subject: artifact?.title ?? entry?.subtitle ?? null,
    claimText: claim?.claim.text ?? null,
    claimId: claim?.claim.id ?? null,
    // Without a claim, list the entry's sources with no locators.
    sources: claim
      ? citedSources(claim)
      : (entry?.sources ?? []).map((source) => ({ source, locators: [] })),
    review: reviewOf(presentation, entry),
    presentation,
  };
}

export const kindLabel: Record<Source["kind"], string> = {
  museum: "Museum record",
  interview: "Interview",
  document: "Document",
  image: "Image",
  audio: "Audio",
};

/** Plain words for reuse rights. A link is never permission to reuse. */
export function rightsLabel(source: Source): string {
  if (source.rights === "approved") return "Reuse approved";
  if (source.rights === "restricted") return "Reuse restricted · link only";
  return "Reuse not cleared · link only";
}
