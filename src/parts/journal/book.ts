// Pure helpers for the stamp book: sections, progress and hints.
// No React and no side effects, so a test or a lab can use them directly.
// Hints only navigate (what to do next); they state no cultural facts.
import type {
  ContentPack,
  JournalState,
  Presentation,
  Stamp,
} from "@/contracts";

export type SectionId = "stories" | "objects" | "words" | "skills";

export const SECTIONS: readonly {
  id: SectionId;
  title: string;
  blurb: string;
}[] = [
  { id: "stories", title: "Stories", blurb: "Places and seasons you saw" },
  { id: "objects", title: "Objects", blurb: "Things you picked up and turned" },
  { id: "words", title: "Words", blurb: "Questions and sources you read" },
  { id: "skills", title: "Skills", blurb: "Things you tried with your hands" },
];

/** Section of a stamp, from its unlock rule (and activity kinds). */
export function sectionOf(pack: ContentPack, stamp: Stamp): SectionId {
  const u = stamp.unlock;
  switch (u.on) {
    case "location-visited":
    case "seasons-seen":
      return "stories";
    case "artifacts-inspected":
    case "hotspots-read":
      return "objects";
    case "reveal-opened":
      return "words";
    case "activities-completed": {
      const kinds = u.activityIds.map(
        (id) => pack.activities.find((a) => a.id === id)?.kind,
      );
      return kinds.every((k) => k === "quiz") ? "words" : "skills";
    }
  }
}

export type Progress = { have: number; need: number };

/** How far the visitor is toward a stamp. */
export function progressOf(
  pack: ContentPack,
  j: JournalState,
  stamp: Stamp,
): Progress {
  const u = stamp.unlock;
  const count = (ids: string[], done: string[]) => ({
    have: ids.filter((id) => done.includes(id)).length,
    need: ids.length,
  });
  switch (u.on) {
    case "location-visited":
      return count([u.locationId], j.visited);
    case "artifacts-inspected":
      return count(u.artifactIds, j.inspected);
    case "hotspots-read": {
      const keys = u.artifactIds.flatMap((id) =>
        (pack.artifacts.find((a) => a.id === id)?.hotspots ?? []).map(
          (h) => `${id}/${h.id}`,
        ),
      );
      return count(keys, j.hotspotsRead);
    }
    case "activities-completed":
      return count(u.activityIds, j.completed);
    case "seasons-seen":
      return count(u.seasons, j.seasonsSeen);
    case "reveal-opened":
      return { have: j.revealOpened ? 1 : 0, need: 1 };
  }
}

const list = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** What to do to earn a stamp. Built from pack titles only. */
export function hintOf(pack: ContentPack, stamp: Stamp): string {
  const u = stamp.unlock;
  const titleOf = (
    items: readonly { id: string; title: string }[],
    ids: string[],
  ) => list(ids.map((id) => items.find((x) => x.id === id)?.title ?? id));
  switch (u.on) {
    case "location-visited":
      return `Follow the owl to the ${titleOf(pack.island.locations, [u.locationId]).toLowerCase()}.`;
    case "artifacts-inspected":
      return `Pick up and turn: ${titleOf(pack.artifacts, u.artifactIds)}.`;
    case "hotspots-read":
      return `Open every detail on: ${titleOf(pack.artifacts, u.artifactIds)}.`;
    case "activities-completed":
      return `Finish: ${titleOf(pack.activities, u.activityIds)}.`;
    case "seasons-seen":
      return `Watch the island in ${list(u.seasons)}.`;
    case "reveal-opened":
      return "Turn a card over to see where its knowledge came from.";
  }
}

export type Reminder = {
  knowledgeId: string;
  claimId: string;
  text: string;
  presentation: Presentation;
};

/** Claims a stamp shows again. Withdrawn knowledge is never shown. */
export function remindersOf(pack: ContentPack, stamp: Stamp): Reminder[] {
  return stamp.claimIds.flatMap((claimId) => {
    const k = pack.knowledge.find(
      (x) =>
        x.presentation !== "withdrawn" &&
        x.claims.some((c) => c.id === claimId),
    );
    const claim = k?.claims.find((c) => c.id === claimId);
    return k && claim
      ? [
          {
            knowledgeId: k.id,
            claimId,
            text: claim.text,
            presentation: k.presentation,
          },
        ]
      : [];
  });
}
