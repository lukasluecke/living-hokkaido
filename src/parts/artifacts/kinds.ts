// Pure helpers for the object card: activity kind labels, a short size
// line taken only from the activity data, and which activity to offer first.
import type { ActivityDefinition, ActivityKind } from "@/contracts";

/** Visitor-facing label per activity kind (small caption on the row). */
export const KIND_LABEL: Record<ActivityKind, string> = {
  quiz: "Think",
  sequence: "Put in order",
  weave: "Hands-on",
  story: "Listen",
  words: "Words",
  trace: "Sources",
  map: "Explore",
  board: "Play",
  canon: "Sing",
  pluck: "Pluck",
  "hide-seek": "Game",
  "slope-run": "Game",
  place: "Build",
  "splat-look": "Look closer",
};

export function kindLabel(kind: string): string {
  return (KIND_LABEL as Record<string, string>)[kind] ?? "Try";
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** A count read from the activity itself ("4 steps"), or undefined. */
export function activitySize(a: ActivityDefinition): string | undefined {
  switch (a.kind) {
    case "quiz":
      return "1 question";
    case "sequence":
      return plural(a.steps.length, "step");
    case "weave":
      return plural(a.rows, "row");
    default:
      return undefined;
  }
}

/** First activity not done yet; the first one when all are done. */
export function primaryActivityId(
  activityIds: readonly string[],
  done: readonly string[] = [],
): string | undefined {
  return activityIds.find((id) => !done.includes(id)) ?? activityIds[0];
}
