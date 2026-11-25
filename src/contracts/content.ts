// The content pack: everything the visitor side shows, as data.
// One pack per story. Parts receive it read-only. validateContentPack()
// checks every cross-reference; run it in tests and in every lab.
import { z } from "zod";
import { activitySchema } from "./activity";
import { artifactSchema } from "./artifact";
import { guideLineSchema } from "./guide";
import { journalStateSchema, stampSchema, type JournalState } from "./journal";
import {
  knowledgeEntrySchema,
  type KnowledgeEntry,
  type ResolvedClaim,
} from "./knowledge";
import { detailSceneSchema } from "./scene";
import { islandSchema } from "./world";

export const CONTRACT_VERSION = 1;

export const contentPackSchema = z.object({
  contractVersion: z.literal(CONTRACT_VERSION),
  id: z.string().min(1),
  knowledge: z.array(knowledgeEntrySchema).min(1),
  island: islandSchema,
  scenes: z.array(detailSceneSchema),
  artifacts: z.array(artifactSchema),
  activities: z.array(activitySchema),
  stamps: z.array(stampSchema),
  guide: z.array(guideLineSchema),
});
export type ContentPack = z.infer<typeof contentPackSchema>;
export type ContentPackInput = z.input<typeof contentPackSchema>;

function dupes(kind: string, ids: string[], out: string[]) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) out.push(`Duplicate ${kind} id "${id}"`);
    seen.add(id);
  }
}

/** Returns a list of problems. Empty list = pack is consistent. */
export function validateContentPack(input: unknown): string[] {
  const parsed = contentPackSchema.safeParse(input);
  if (!parsed.success)
    return parsed.error.issues.map(
      (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
    );
  const p = parsed.data;
  const errors: string[] = [];
  const locations = p.island.locations;
  dupes(
    "knowledge",
    p.knowledge.map((k) => k.id),
    errors,
  );
  dupes(
    "location",
    locations.map((l) => l.id),
    errors,
  );
  dupes(
    "scene",
    p.scenes.map((s) => s.id),
    errors,
  );
  dupes(
    "artifact",
    p.artifacts.map((a) => a.id),
    errors,
  );
  dupes(
    "activity",
    p.activities.map((a) => a.id),
    errors,
  );
  dupes(
    "stamp",
    p.stamps.map((s) => s.id),
    errors,
  );
  dupes(
    "guide line",
    p.guide.map((g) => g.id),
    errors,
  );

  const knowledge = new Map(p.knowledge.map((k) => [k.id, k]));
  const claimsOf = (kid: string) =>
    new Set(knowledge.get(kid)?.claims.map((c) => c.id) ?? []);
  const allClaims = new Set(
    p.knowledge.flatMap((k) => k.claims.map((c) => c.id)),
  );
  const visible = (kid: string, where: string) => {
    const k = knowledge.get(kid);
    if (!k) errors.push(`${where}: unknown knowledge "${kid}"`);
    else if (k.presentation === "withdrawn")
      errors.push(`${where}: knowledge "${kid}" is withdrawn`);
  };
  const locationIds = new Set(locations.map((l) => l.id));
  const sceneIds = new Set(p.scenes.map((s) => s.id));
  const artifacts = new Map(p.artifacts.map((a) => [a.id, a]));
  const activityIds = new Set(p.activities.map((a) => a.id));

  for (const l of locations) {
    if (l.status === "open" && !l.sceneId)
      errors.push(`location ${l.id}: open locations need a sceneId`);
    if (l.sceneId && !sceneIds.has(l.sceneId))
      errors.push(`location ${l.id}: unknown scene "${l.sceneId}"`);
    for (const k of l.knowledgeIds) visible(k, `location ${l.id}`);
  }
  for (const s of p.scenes) {
    if (!locationIds.has(s.locationId))
      errors.push(`scene ${s.id}: unknown location "${s.locationId}"`);
    visible(s.knowledgeId, `scene ${s.id}`);
    for (const pl of s.placements)
      if (!artifacts.has(pl.artifactId))
        errors.push(`scene ${s.id}: unknown artifact "${pl.artifactId}"`);
    for (const a of s.activityIds)
      if (!activityIds.has(a))
        errors.push(`scene ${s.id}: unknown activity "${a}"`);
  }
  for (const a of p.artifacts) {
    visible(a.knowledgeId, `artifact ${a.id}`);
    const claims = claimsOf(a.knowledgeId);
    for (const c of a.claimIds)
      if (!claims.has(c))
        errors.push(`artifact ${a.id}: claim "${c}" not in ${a.knowledgeId}`);
    for (const act of a.activityIds)
      if (!activityIds.has(act))
        errors.push(`artifact ${a.id}: unknown activity "${act}"`);
  }
  for (const a of p.activities) {
    visible(a.knowledgeId, `activity ${a.id}`);
    const claims = claimsOf(a.knowledgeId);
    const cited =
      a.kind === "sequence"
        ? [...a.claimIds, ...a.steps.map((s) => s.claimId)]
        : a.claimIds;
    for (const c of cited)
      if (!claims.has(c))
        errors.push(`activity ${a.id}: claim "${c}" not in ${a.knowledgeId}`);
    if (a.artifactId && !artifacts.has(a.artifactId))
      errors.push(`activity ${a.id}: unknown artifact "${a.artifactId}"`);
  }
  for (const s of p.stamps) {
    const u = s.unlock;
    const need = (ok: boolean, what: string) => {
      if (!ok) errors.push(`stamp ${s.id}: unknown ${what}`);
    };
    if (u.on === "location-visited")
      need(locationIds.has(u.locationId), `location "${u.locationId}"`);
    if (u.on === "artifacts-inspected" || u.on === "hotspots-read")
      for (const id of u.artifactIds)
        need(artifacts.has(id), `artifact "${id}"`);
    if (u.on === "activities-completed")
      for (const id of u.activityIds)
        need(activityIds.has(id), `activity "${id}"`);
    for (const c of s.claimIds) need(allClaims.has(c), `claim "${c}"`);
  }
  for (const g of p.guide)
    for (const c of g.claimIds)
      if (!allClaims.has(c)) errors.push(`guide ${g.id}: unknown claim "${c}"`);
  return errors;
}

/** Parse and validate, or throw with every problem listed. */
export function loadContentPack(input: unknown): ContentPack {
  const errors = validateContentPack(input);
  if (errors.length) throw Error(`Invalid content pack:\n${errors.join("\n")}`);
  return contentPackSchema.parse(input);
}

export function resolveClaim(
  pack: ContentPack,
  knowledgeId: string,
  claimId: string,
): ResolvedClaim | null {
  const k: KnowledgeEntry | undefined = pack.knowledge.find(
    (x) => x.id === knowledgeId,
  );
  const claim = k?.claims.find((c) => c.id === claimId);
  if (!k || !claim || k.presentation === "withdrawn") return null;
  const ids = new Set(claim.citations.map((c) => c.sourceId));
  return {
    claim,
    sources: k.sources.filter((s) => ids.has(s.id)),
    knowledgeId: k.id,
    presentation: k.presentation,
  };
}

/** Load stored progress; drop anything that is not in this pack. */
export function sanitizeJournal(
  pack: ContentPack,
  raw: unknown,
): JournalState | null {
  const parsed = journalStateSchema.safeParse(raw);
  if (!parsed.success) return null;
  const j = parsed.data;
  const loc = new Set(pack.island.locations.map((l) => l.id));
  const art = new Map(pack.artifacts.map((a) => [a.id, a]));
  const act = new Set(pack.activities.map((a) => a.id));
  const st = new Set(pack.stamps.map((s) => s.id));
  return {
    ...j,
    visited: j.visited.filter((id) => loc.has(id)),
    inspected: j.inspected.filter((id) => art.has(id)),
    hotspotsRead: j.hotspotsRead.filter((key) => {
      const [a, h] = key.split("/");
      return !!art.get(a)?.hotspots.some((x) => x.id === h);
    }),
    completed: j.completed.filter((id) => act.has(id)),
    stamps: j.stamps.filter((s) => st.has(s.stampId)),
  };
}
