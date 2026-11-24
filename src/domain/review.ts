import { knowledgeSchema, type Knowledge, type Review } from "./contracts";
export function issues(k: Knowledge): string[] {
  const result = knowledgeSchema.safeParse(k);
  if (!result.success) return ["Invalid knowledge structure"];
  const errors: string[] = [];
  if (!k.activities.length)
    errors.push("At least one reviewed activity is required");
  if (new Set(k.activities.map((a) => a.id)).size !== k.activities.length)
    errors.push("Duplicate activity identifiers");
  const sources = new Set(k.sources.map((s) => s.id));
  const claims = new Set(k.claims.map((c) => c.id));
  if (sources.size !== k.sources.length || claims.size !== k.claims.length)
    errors.push("Duplicate identifiers");
  for (const c of k.claims)
    if (c.citations.some((s) => !sources.has(s.sourceId)))
      errors.push("Unresolved source reference");
  for (const a of k.activities)
    if (a.storyId !== k.id || a.claimIds.some((id) => !claims.has(id)))
      errors.push("Activity is not grounded in this story");
  if (k.sources.some((s) => s.rights !== "approved" || s.consent !== "granted"))
    errors.push("Source rights and consent must be approved");
  return errors;
}
export function approve(k: Knowledge, r: Review): Knowledge {
  if (k.status !== "review")
    throw Error("Only review-ready drafts can be approved");
  if (
    !r.reviewer.trim() ||
    !r.provenance ||
    !r.accuracy ||
    !r.consent ||
    !r.activityQuality
  )
    throw Error("Complete every human review check");
  const errors = issues(k);
  if (errors.length) throw Error(errors.join("; "));
  return {
    ...k,
    status: "approved",
    reviewer: r.reviewer.trim(),
    reviewedAt: new Date().toISOString(),
  };
}
export function publishable(k: Knowledge): boolean {
  return (
    k.status === "approved" &&
    !!k.reviewer &&
    !!k.reviewedAt &&
    issues(k).length === 0
  );
}
export function withdraw(k: Knowledge): Knowledge {
  return {
    ...k,
    status: "withdrawn",
    sources: k.sources.map((s) => ({ ...s, consent: "withdrawn" })),
  };
}
