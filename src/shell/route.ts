// The visitor's route: five stations on the line rail and the one next step
// the owl offers. Pure functions of pack, state and journal, so the rail, the
// owl button and the tray always agree on what is "current".
import type {
  ContentPack,
  ExperienceEvent,
  ExperienceState,
  JournalState,
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

export type NextStep = { label: string; event: ExperienceEvent };

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
        event: { type: "activity.start", activityId: a.id },
      };
    const other = unlooked.find((id) => id !== state.artifactId);
    const o = other ? art(other) : undefined;
    if (o)
      return {
        label: t("Next: {label}", { label: o.label }),
        event: { type: "artifact.focus", artifactId: o.id },
      };
    return { label: t("Open the journal"), event: { type: "journal.open" } };
  }
  const o = unlooked[0] ? art(unlooked[0]) : undefined;
  if (o)
    return {
      label: t("Look at: {label}", { label: o.label }),
      event: { type: "artifact.focus", artifactId: o.id },
    };
  const scene = pack.scenes.find((x) => x.id === state.sceneId);
  const todo = scene?.activityIds.find((id) => !journal.completed.includes(id));
  const a = todo ? act(todo) : undefined;
  if (a)
    return {
      label: t("Try: {title}", { title: a.title }),
      event: { type: "activity.start", activityId: a.id },
    };
  return { label: t("Open the journal"), event: { type: "journal.open" } };
}
