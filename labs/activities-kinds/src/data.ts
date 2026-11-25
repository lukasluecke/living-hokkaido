// The lab reads the three activities straight from the content pack
// (src/content/bark-to-cloth/activity-kinds.ts), validated by @/contracts.
import { defaultPack } from "@/content";
import { type ActivityOf, type ResolvedClaim, resolveClaim } from "@/contracts";

export const pack = defaultPack;

function find<K extends "story" | "words" | "trace">(kind: K) {
  const a = pack.activities.find((x) => x.kind === kind);
  if (!a) throw Error(`no ${kind} activity in the pack`);
  return a as ActivityOf<K>;
}

export const activities = {
  story: find("story"),
  words: find("words"),
  trace: find("trace"),
};

/** Same shape as ActivityPartProps.claims. */
export function claimsFor(knowledgeId: string, ids: string[]): Record<string, ResolvedClaim> {
  const out: Record<string, ResolvedClaim> = {};
  for (const id of ids) {
    const r = resolveClaim(pack, knowledgeId, id);
    if (r) out[id] = r;
  }
  return out;
}
