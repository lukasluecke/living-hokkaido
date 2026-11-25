// The content pack: everything the visitor side shows, as data.
// One pack per story. Parts receive it read-only. validateContentPack()
// checks every cross-reference; run it in tests and in every lab.
import { z } from "zod";
import {
  type ActivityDefinition,
  activitySchema,
  type MediaRef,
  type Term,
} from "./activity";
import { artifactSchema } from "./artifact";
import { guideLineSchema } from "./guide";
import { journalStateSchema, stampSchema, type JournalState } from "./journal";
import {
  knowledgeEntrySchema,
  type KnowledgeEntry,
  type ResolvedClaim,
} from "./knowledge";
import { detailSceneSchema } from "./scene";
import { timelineSchema } from "./timeline";
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
  /** "Over time" timelines (additive; old packs parse with none). */
  timelines: z.array(timelineSchema).default([]),
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

function checkMedia(
  m: MediaRef,
  k: KnowledgeEntry,
  where: string,
  errors: string[],
) {
  if (m.kind !== "recording") return;
  const s = k.sources.find((x) => x.id === m.sourceId);
  if (!s) return void errors.push(`${where}: unknown source "${m.sourceId}"`);
  if (s.kind !== "audio")
    errors.push(`${where}: source "${s.id}" is not an audio source`);
  if (s.rights !== "approved" || s.consent !== "granted")
    errors.push(
      `${where}: recording "${s.id}" needs approved rights and consent`,
    );
  if (s.placeholder)
    errors.push(`${where}: recording "${s.id}" is a placeholder`);
}

const allReviewed = (r: Term["review"]) =>
  r.spelling && r.region && r.meaning && r.pronunciation && r.consent;

/**
 * Rules for story / words / trace that a schema alone cannot check.
 * Words: a real term (standIn false) needs an approved entry, all five review
 * checks and a consented recording; the device voice never reads it; Ainu is
 * "ain", never a Japanese variety; a stand-in never claims the target lang.
 */
function checkActivityKind(
  a: ActivityDefinition,
  k: KnowledgeEntry,
  errors: string[],
) {
  const at = `activity ${a.id}`;
  const cited = new Set(a.claimIds);
  if (a.kind === "story") {
    checkMedia(a.narrator.voice, k, `${at} narrator`, errors);
    const chapters = new Set(a.chapters.map((c) => c.id));
    for (const ch of a.chapters) {
      for (const l of ch.lines)
        if (l.role === "fact")
          for (const c of l.claimIds)
            if (!cited.has(c))
              errors.push(`${at}: line ${l.id} cites "${c}", not in claimIds`);
      for (const choice of ch.pause?.choices ?? []) {
        const act = choice.action;
        if (act.to === "chapter" && !chapters.has(act.chapterId))
          errors.push(
            `${at}: choice ${choice.id}: unknown chapter "${act.chapterId}"`,
          );
        if (act.to === "reveal" && !cited.has(act.claimId))
          errors.push(
            `${at}: choice ${choice.id}: claim "${act.claimId}" not in claimIds`,
          );
      }
    }
  }
  if (a.kind === "words") {
    for (const t of a.terms) {
      const where = `${at} term ${t.id}`;
      if (!cited.has(t.claimId))
        errors.push(`${where}: claim "${t.claimId}" not in claimIds`);
      checkMedia(t.audio, k, where, errors);
      if (a.lang === "ain" && t.lang.toLowerCase().startsWith("ja"))
        errors.push(
          `${where}: Ainu is not a Japanese dialect (lang ${t.lang})`,
        );
      if (a.standIn) {
        if (t.lang === a.lang)
          errors.push(
            `${where}: a stand-in term must not claim lang ${a.lang}`,
          );
        continue;
      }
      if (k.presentation !== "approved")
        errors.push(`${where}: real terms need an approved entry`);
      if (!allReviewed(t.review))
        errors.push(`${where}: real terms need all five review checks`);
      if (t.audio.kind === "device-voice-placeholder")
        errors.push(`${where}: device voice must not read a real term`);
    }
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
    const k = knowledge.get(a.knowledgeId);
    if (k) checkActivityKind(a, k, errors);
    if (a.kind === "words")
      for (const t of a.terms)
        if (!artifacts.has(t.artifactId))
          errors.push(`activity ${a.id}: unknown artifact "${t.artifactId}"`);
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
  dupes(
    "timeline",
    p.timelines.map((t) => t.id),
    errors,
  );
  for (const t of p.timelines) {
    visible(t.knowledgeId, `timeline ${t.id}`);
    if (t.locationId && !locationIds.has(t.locationId))
      errors.push(`timeline ${t.id}: unknown location "${t.locationId}"`);
    const claims = claimsOf(t.knowledgeId);
    for (const c of t.claimIds)
      if (!claims.has(c))
        errors.push(`timeline ${t.id}: claim "${c}" not in ${t.knowledgeId}`);
    dupes(
      `timeline ${t.id} era`,
      t.eras.map((e) => e.id),
      errors,
    );
    for (const e of t.eras)
      for (const c of e.claimIds)
        if (!claims.has(c))
          errors.push(
            `timeline ${t.id} era ${e.id}: claim "${c}" not in ${t.knowledgeId}`,
          );
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
