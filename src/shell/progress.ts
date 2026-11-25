// Journal progress: records what the visitor did and awards stamps.
// Pure and tested. The journal part only renders the result.
import {
  type ContentPack,
  type ExperienceEvent,
  type JournalState,
  type Stamp,
  seasonAt,
} from "@/contracts";

const add = <T>(list: T[], item: T) =>
  list.includes(item) ? list : [...list, item];

function unlocked(pack: ContentPack, j: JournalState, stamp: Stamp): boolean {
  const u = stamp.unlock;
  switch (u.on) {
    case "location-visited":
      return j.visited.includes(u.locationId);
    case "artifacts-inspected":
      return u.artifactIds.every((id) => j.inspected.includes(id));
    case "hotspots-read":
      return u.artifactIds.every((id) => {
        const a = pack.artifacts.find((x) => x.id === id);
        return !!a?.hotspots.every((h) =>
          j.hotspotsRead.includes(`${id}/${h.id}`),
        );
      });
    case "activities-completed":
      return u.activityIds.every((id) => j.completed.includes(id));
    case "seasons-seen":
      return u.seasons.every((x) => j.seasonsSeen.includes(x));
    case "reveal-opened":
      return j.revealOpened;
  }
}

/** Returns the new journal and the ids of stamps earned by this event. */
export function record(
  pack: ContentPack,
  j: JournalState,
  e: ExperienceEvent,
  now = new Date().toISOString(),
): { journal: JournalState; earned: string[] } {
  let next = j;
  switch (e.type) {
    case "owl.arrived":
      next = { ...j, visited: add(j.visited, e.locationId) };
      break;
    case "artifact.inspected":
      next = { ...j, inspected: add(j.inspected, e.artifactId) };
      break;
    case "hotspot.open":
      next = {
        ...j,
        hotspotsRead: add(j.hotspotsRead, `${e.artifactId}/${e.hotspotId}`),
      };
      break;
    case "activity.complete":
      if (e.result.completed)
        next = { ...j, completed: add(j.completed, e.result.activityId) };
      break;
    case "season.set":
      next = { ...j, seasonsSeen: add(j.seasonsSeen, seasonAt(e.value)) };
      break;
    case "reveal.open":
      next = { ...j, revealOpened: true };
      break;
    default:
      return { journal: j, earned: [] };
  }
  if (next === j) return { journal: j, earned: [] };
  const have = new Set(next.stamps.map((s) => s.stampId));
  const earned = pack.stamps
    .filter((s) => !have.has(s.id) && unlocked(pack, next, s))
    .map((s) => s.id);
  if (earned.length)
    next = {
      ...next,
      stamps: [
        ...next.stamps,
        ...earned.map((stampId) => ({ stampId, earnedAt: now })),
      ],
    };
  return { journal: next, earned };
}
