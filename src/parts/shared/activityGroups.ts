// Groups a place's activities by kind for the "Try here" sheet. Pure data:
// no React, no content import. Labels are UI captions, not cultural content.

/** The fields the grouping needs; any activity definition fits. */
export type GroupableActivity = { id: string; kind: string; title: string };

export type ActivityGroupId =
  | "hands-on"
  | "listen"
  | "think"
  | "behind"
  | "more";

export type ActivityGroup<A extends GroupableActivity = GroupableActivity> = {
  id: ActivityGroupId;
  label: string;
  items: A[];
};

/** Group order and the kinds in each. Kinds not listed go to "More". */
const GROUPS: { id: ActivityGroupId; label: string; kinds: string[] }[] = [
  {
    id: "hands-on",
    label: "Hands-on",
    kinds: ["place", "weave", "map", "sequence"],
  },
  {
    id: "listen",
    label: "Listen and learn",
    kinds: ["story", "words", "splat-look"],
  },
  { id: "think", label: "Think about it", kinds: ["quiz"] },
  { id: "behind", label: "Behind the content", kinds: ["trace"] },
];

/** Short caption per kind, shown above an activity's title. */
const KIND_CAPTION: Record<string, string> = {
  quiz: "Think",
  sequence: "Put in order",
  weave: "Hands-on",
  map: "Explore",
  story: "Listen",
  words: "Words",
  trace: "Sources",
  board: "Play",
  canon: "Sing",
  pluck: "Pluck",
  "hide-seek": "Game",
  "slope-run": "Game",
  place: "Build",
  "splat-look": "Look closer",
};

export function kindCaption(kind: string): string {
  return KIND_CAPTION[kind] ?? "Try";
}

/**
 * Activities in fixed groups (Hands-on, Listen and learn, Think about it,
 * Behind the content, then More for any other kind). Keeps the input order
 * inside a group and leaves out empty groups.
 */
export function groupActivities<A extends GroupableActivity>(
  activities: readonly A[],
): ActivityGroup<A>[] {
  const out: ActivityGroup<A>[] = [
    ...GROUPS.map((g) => ({ id: g.id, label: g.label, items: [] as A[] })),
    { id: "more", label: "More", items: [] },
  ];
  for (const a of activities) {
    const i = GROUPS.findIndex((g) => g.kinds.includes(a.kind));
    out[i === -1 ? GROUPS.length : i].items.push(a);
  }
  return out.filter((g) => g.items.length > 0);
}
