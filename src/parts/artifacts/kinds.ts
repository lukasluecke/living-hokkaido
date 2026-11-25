// Pure helpers for the object card: activity kind labels, a short size
// line taken only from the activity data, and which activity to offer first.
import type { ActivityDefinition, ActivityKind } from "@/contracts";
import { english, type Translate } from "@/i18n/core";

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
};

export function kindLabel(kind: string): string {
  return (KIND_LABEL as Record<string, string>)[kind] ?? "Try";
}

const plural = (t: Translate, n: number, one: string, many = `${one}s`) =>
  t(n === 1 ? `{n} ${one}` : `{n} ${many}`, { n });

/** A count read from the activity itself ("4 steps"), or undefined. */
export function activitySize(
  a: ActivityDefinition,
  t: Translate = english,
): string | undefined {
  switch (a.kind) {
    case "quiz":
      return t("1 question");
    case "sequence":
      return plural(t, a.steps.length, "step");
    case "weave":
      return plural(t, a.rows, "row");
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
