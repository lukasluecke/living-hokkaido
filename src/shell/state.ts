// Experience state machine. Pure: (state, event) -> state. The shell is the
// only writer; parts only emit events. Tested in tests/shell.test.ts.
import {
  type ContentPack,
  DEFAULT_SEASON,
  type ExperienceEvent,
  type ExperienceState,
  type Prefs,
} from "@/contracts";

export function initialState(prefs: Prefs): ExperienceState {
  return {
    view: "island",
    overlay: null,
    locationId: null,
    sceneId: null,
    artifactId: null,
    activityId: null,
    reveal: null,
    season: { ...DEFAULT_SEASON, playing: false },
    prefs,
  };
}

export function reduce(
  pack: ContentPack,
  s: ExperienceState,
  e: ExperienceEvent,
): ExperienceState {
  switch (e.type) {
    case "location.select": {
      const loc = pack.island.locations.find((l) => l.id === e.locationId);
      if (!loc || loc.status !== "open") return s;
      return { ...s, view: "travel", locationId: loc.id, overlay: null };
    }
    case "owl.arrived": {
      if (s.view !== "travel" || s.locationId !== e.locationId) return s;
      const loc = pack.island.locations.find((l) => l.id === e.locationId);
      return loc?.sceneId
        ? { ...s, view: "scene", sceneId: loc.sceneId }
        : { ...s, view: "island" };
    }
    case "scene.enter":
      if (!pack.scenes.some((x) => x.id === e.sceneId)) return s;
      return { ...s, view: "scene", sceneId: e.sceneId };
    case "scene.exit":
      return {
        ...s,
        view: "island",
        sceneId: null,
        artifactId: null,
        activityId: null,
      };
    case "artifact.focus":
      if (!s.sceneId || !pack.artifacts.some((a) => a.id === e.artifactId))
        return s;
      return { ...s, view: "focus", artifactId: e.artifactId };
    case "artifact.blur":
      return { ...s, view: s.sceneId ? "scene" : "island", artifactId: null };
    case "activity.start":
      if (!pack.activities.some((a) => a.id === e.activityId)) return s;
      return { ...s, view: "activity", activityId: e.activityId };
    case "activity.complete":
      // Stay open so the part can show its completion text.
      return s;
    case "activity.close":
      return {
        ...s,
        view: s.artifactId ? "focus" : s.sceneId ? "scene" : "island",
        activityId: null,
      };
    case "journal.open":
      return { ...s, overlay: "journal" };
    case "journal.close":
    case "reveal.close":
      return { ...s, overlay: null, reveal: null };
    case "reveal.open":
      return {
        ...s,
        overlay: "reveal",
        reveal: {
          knowledgeId: e.knowledgeId,
          claimId: e.claimId,
          artifactId: e.artifactId,
        },
      };
    case "season.set":
      return { ...s, season: { ...s.season, value: e.value } };
    case "season.play":
      return { ...s, season: { ...s.season, playing: e.playing } };
    case "nav.back":
      if (s.overlay) return { ...s, overlay: null, reveal: null };
      if (s.view === "activity")
        return {
          ...s,
          view: s.artifactId ? "focus" : "scene",
          activityId: null,
        };
      if (s.view === "focus") return { ...s, view: "scene", artifactId: null };
      if (s.view === "scene" || s.view === "travel")
        return { ...s, view: "island", sceneId: null };
      return s;
    default:
      return s;
  }
}
