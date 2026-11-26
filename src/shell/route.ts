// The visitor's route: five stations on the line rail and the one next step
// the owl offers. Pure functions of pack, state and journal, so the rail, the
// owl button and the tray always agree on what is "current".
import {
  type ContentPack,
  type ExperienceEvent,
  type ExperienceState,
  highlightDone,
  type JournalState,
} from "@/contracts";
import { english, type Translate } from "@/i18n/core";

export type StationId = "island" | "place" | "look" | "try" | "journal";
export type StationStatus = "done" | "now" | "todo";

export type Station = {
  id: StationId;
  label: string;
  status: StationStatus;
  /** Short progress, for example "1/3". */
  sub?: string;
  /** What a tap on the station does. Absent = not tappable now. */
  event?: ExperienceEvent;
};

export type NextStep = {
  label: string;
  /** The object or activity name alone, for a button with an icon. */
  name?: string;
  event: ExperienceEvent;
};

export type Route = { stations: Station[]; next: NextStep | null };

const ORDER: StationId[] = ["island", "place", "look", "try", "journal"];

export function route(
  pack: ContentPack,
  state: ExperienceState,
  journal: JournalState,
  t: Translate = english,
): Route {
  const location =
    pack.island.locations.find((l) => l.id === state.locationId) ??
    pack.island.locations.find((l) => l.status === "open") ??
    null;
  const scene =
    pack.scenes.find((x) => x.id === (state.sceneId ?? location?.sceneId)) ??
    null;
  const placed = scene ? scene.placements.map((p) => p.artifactId) : [];
  const looked = placed.filter((id) => journal.inspected.includes(id));
  const activities = scene ? scene.activityIds : [];
  const tried = activities.filter((id) => journal.completed.includes(id));
  const inside =
    state.view === "scene" ||
    state.view === "focus" ||
    state.view === "activity";

  let current: StationId;
  if (state.overlay === "journal") current = "journal";
  else if (state.view === "island") current = "island";
  else if (state.view === "travel") current = "place";
  else if (state.view === "activity") current = "try";
  else current = looked.length < placed.length ? "look" : "try";
  const at = ORDER.indexOf(current);

  const firstUnlooked = placed.find((id) => !looked.includes(id)) ?? placed[0];
  const firstUntried =
    activities.find((id) => !tried.includes(id)) ?? activities[0];
  const events: Partial<Record<StationId, ExperienceEvent>> = {
    island:
      inside && scene ? { type: "scene.exit", sceneId: scene.id } : undefined,
    place:
      state.view === "island" && location
        ? { type: "location.select", locationId: location.id }
        : undefined,
    look:
      inside && firstUnlooked
        ? { type: "artifact.focus", artifactId: firstUnlooked }
        : undefined,
    try:
      inside && firstUntried
        ? { type: "activity.start", activityId: firstUntried }
        : undefined,
    journal: state.overlay === "journal" ? undefined : { type: "journal.open" },
  };
  const label: Record<StationId, string> = {
    island: t("Island"),
    place: location?.title ?? t("Place"),
    look: t("Look"),
    try: t("Try"),
    journal: t("Journal"),
  };
  const sub: Partial<Record<StationId, string>> = {
    look: placed.length ? `${looked.length}/${placed.length}` : undefined,
    try: activities.length ? `${tried.length}/${activities.length}` : undefined,
  };
  const stations = ORDER.map((id, i): Station => {
    const status: StationStatus = i < at ? "done" : i === at ? "now" : "todo";
    return { id, label: label[id], status, sub: sub[id], event: events[id] };
  });

  return {
    stations,
    next: nextStep(pack, state, journal, location, placed, t),
  };
}

/**
 * The owl's first-visit tour: the next highlight not done yet, in pack
 * order. In a place, its own open highlight comes first (a film counts as
 * done once it was opened and closed, or ended).
 * In a place you picked yourself, the tour pauses there (only that place's
 * own highlight); it goes on from the island or the highlight row.
 * When every highlight is done, the normal look / try route takes over.
 */
export function tourStep(
  pack: ContentPack,
  state: ExperienceState,
  journal: JournalState,
  t: Translate = english,
): NextStep | null {
  if (state.overlay) return null;
  if (
    state.view !== "island" &&
    state.view !== "scene" &&
    state.view !== "focus"
  )
    return null;
  const here = state.view === "island" ? null : state.locationId;
  const todo = pack.highlights.filter(
    (h) =>
      !highlightDone(h, journal) &&
      !(state.tourPassed ?? []).includes(h.id) &&
      pack.island.locations.some(
        (l) => l.id === h.locationId && l.status === "open",
      ),
  );
  const own = todo.find((x) => x.locationId === here);
  // Exploring on your own (you picked this place, not the tour): the owl
  // helps with this place and offers the tour again on the island.
  if (here && !own && !state.touring) return null;
  const h = own ?? todo[0];
  if (!h) return null;
  return {
    label: t("Highlight: {title}", { title: t(h.title) }),
    name: t(h.title),
    event: { type: "highlight.open", highlightId: h.id },
  };
}

function nextStep(
  pack: ContentPack,
  state: ExperienceState,
  journal: JournalState,
  location: ContentPack["island"]["locations"][number] | null,
  placed: string[],
  t: Translate,
): NextStep | null {
  if (state.overlay) return null;
  const art = (id: string) => pack.artifacts.find((a) => a.id === id);
  const act = (id: string) => pack.activities.find((a) => a.id === id);
  const unlooked = placed.filter((id) => !journal.inspected.includes(id));
  const tour = tourStep(pack, state, journal, t);
  if (tour) return tour;
  if (state.view === "island") {
    return location
      ? {
          label: t("Go to the {place}", {
            place: location.title.toLowerCase(),
          }),
          event: { type: "location.select", locationId: location.id },
        }
      : null;
  }
  if (state.view === "travel" || state.view === "activity") return null;
  if (state.view === "focus" && state.artifactId) {
    const own = art(state.artifactId)?.activityIds ?? [];
    const todo = own.find((id) => !journal.completed.includes(id));
    const a = todo ? act(todo) : undefined;
    if (a)
      return {
        label: t("Try: {title}", { title: a.title }),
        name: a.title,
        event: { type: "activity.start", activityId: a.id },
      };
    const other = unlooked.find((id) => id !== state.artifactId);
    const o = other ? art(other) : undefined;
    if (o)
      return {
        label: t("Next: {label}", { label: o.label }),
        name: o.label,
        event: { type: "artifact.focus", artifactId: o.id },
      };
    return { label: t("Open the journal"), event: { type: "journal.open" } };
  }
  const o = unlooked[0] ? art(unlooked[0]) : undefined;
  if (o)
    return {
      label: t("Look at: {label}", { label: o.label }),
      name: o.label,
      event: { type: "artifact.focus", artifactId: o.id },
    };
  const scene = pack.scenes.find((x) => x.id === state.sceneId);
  const todo = scene?.activityIds.find((id) => !journal.completed.includes(id));
  const a = todo ? act(todo) : undefined;
  if (a)
    return {
      label: t("Try: {title}", { title: a.title }),
      name: a.title,
      event: { type: "activity.start", activityId: a.id },
    };
  return { label: t("Open the journal"), event: { type: "journal.open" } };
}
