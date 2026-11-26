// Pure helpers for the stamp book: sections, progress and hints.
// No React and no side effects, so a test or a lab can use them directly.
// Hints only navigate (what to do next); they state no cultural facts.
import {
  type ContentPack,
  factHotspots,
  type JournalState,
  type Presentation,
  type Stamp,
} from "@/contracts";
import { english, type Translate } from "@/i18n/core";

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
        factHotspots(
          pack.artifacts.find((a) => a.id === id) ?? { hotspots: [] },
        ).map((h) => `${id}/${h.id}`),
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

const list = (items: string[], t: Translate) =>
  items.length <= 1
    ? (items[0] ?? "")
    : t("{items} and {last}", {
        items: items.slice(0, -1).join(t(", ")),
        last: items[items.length - 1] ?? "",
      });

/** What to do to earn a stamp. Built from pack titles only. */
export function hintOf(
  pack: ContentPack,
  stamp: Stamp,
  t: Translate = english,
): string {
  const u = stamp.unlock;
  const titleOf = (
    items: readonly { id: string; title: string }[],
    ids: string[],
  ) =>
    list(
      ids.map((id) => items.find((x) => x.id === id)?.title ?? id),
      t,
    );
  switch (u.on) {
    case "location-visited":
      return t("Follow the owl to the {place}.", {
        place: titleOf(pack.island.locations, [u.locationId]).toLowerCase(),
      });
    case "artifacts-inspected":
      return t("Pick up and turn: {items}.", {
        items: titleOf(pack.artifacts, u.artifactIds),
      });
    case "hotspots-read":
      return t("Open every detail on: {items}.", {
        items: titleOf(pack.artifacts, u.artifactIds),
      });
    case "activities-completed":
      return t("Finish: {items}.", {
        items: titleOf(pack.activities, u.activityIds),
      });
    case "seasons-seen":
      return t("Watch the island in {seasons}.", {
        seasons: list(
          u.seasons.map((x) => t(x)),
          t,
        ),
      });
    case "reveal-opened":
      return t("Turn a card over to see where its knowledge came from.");
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

/**
 * Where a stamp is found, for the "Go there" link: an open place. For
 * objects and activities it is the place that holds the most of the ones
 * still to do (all of them, once earned); on a tie the place with the
 * fewest activities (the most specific), then pack order. Seasons and card
 * backs have no single place: null.
 */
export function placeOf(
  pack: ContentPack,
  j: JournalState,
  stamp: Stamp,
): { id: string; title: string } | null {
  const open = pack.island.locations.filter((l) => l.status === "open");
  const scenesAt = (locationId: string) =>
    pack.scenes.filter((x) => x.locationId === locationId);
  const size = (locationId: string) =>
    new Set(scenesAt(locationId).flatMap((x) => x.activityIds)).size;
  const best = (score: (locationId: string) => number) => {
    let home: { id: string; title: string; n: number } | undefined;
    for (const l of open) {
      const n = score(l.id);
      if (
        n > 0 &&
        (!home || n > home.n || (n === home.n && size(l.id) < size(home.id)))
      )
        home = { id: l.id, title: l.title, n };
    }
    return home ? { id: home.id, title: home.title } : null;
  };
  const todo = (ids: string[], done: (id: string) => boolean) => {
    const left = ids.filter((id) => !done(id));
    return left.length ? left : ids;
  };
  const u = stamp.unlock;
  switch (u.on) {
    case "location-visited":
      return best((id) => (id === u.locationId ? 1 : 0));
    case "artifacts-inspected":
    case "hotspots-read": {
      const done = (a: string) => {
        if (u.on === "artifacts-inspected") return j.inspected.includes(a);
        const p = progressOf(pack, j, {
          ...stamp,
          unlock: { on: "hotspots-read", artifactIds: [a] },
        });
        return p.have === p.need;
      };
      const left = todo(u.artifactIds, done);
      return best(
        (id) =>
          left.filter((a) =>
            scenesAt(id).some((x) =>
              x.placements.some((p) => p.artifactId === a),
            ),
          ).length,
      );
    }
    case "activities-completed": {
      const left = todo(u.activityIds, (a) => j.completed.includes(a));
      return best(
        (id) =>
          left.filter((a) =>
            scenesAt(id).some((x) => x.activityIds.includes(a)),
          ).length,
      );
    }
    case "seasons-seen":
    case "reveal-opened":
      return null;
  }
}
