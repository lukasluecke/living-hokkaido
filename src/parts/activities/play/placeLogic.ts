// Pure state for the "place" kind (Build the scene). One step at a time:
// a step without a figure is done at once; a step with a figure goes
// place → pose (people) → done. Wrong answers count tries; after two,
// "Show me" may finish the step.
import type { ActivityOf, PlacePose } from "@/contracts";

type Place = ActivityOf<"place">;
type Step = Place["steps"][number];

export type Placed = { step: number; x: number; y: number; pose: PlacePose };

export type PlaceState = {
  step: number;
  phase: "place" | "pose" | "done";
  placed: Placed[];
  tries: number;
  /** Ring or pose the visitor got wrong last, for a red outline. */
  wrong: number | PlacePose | null;
  /** Hint shown after a wrong answer, or null. */
  hint: string | null;
  finished: boolean;
  season: "summer" | "winter";
};

export type PlaceAction =
  | { type: "ring"; index: number }
  | { type: "pose"; pose: PlacePose }
  | { type: "show" }
  | { type: "next" }
  | { type: "finish" };

const needsPose = (a: Place, s: Step) => a.subject === "people" && !!s.pose;

function enter(a: Place, step: number, prev: PlaceState): PlaceState {
  const s = a.steps[step];
  return {
    ...prev,
    step,
    phase: s.figure ? "place" : "done",
    tries: 0,
    wrong: null,
    hint: null,
    season: s.season ?? prev.season,
  };
}

export function startPlace(a: Place): PlaceState {
  return enter(a, 0, {
    step: 0,
    phase: "done",
    placed: [],
    tries: 0,
    wrong: null,
    hint: null,
    finished: false,
    season: a.season,
  });
}

export function stepPlace(
  a: Place,
  st: PlaceState,
  act: PlaceAction,
): PlaceState {
  const s = a.steps[st.step];
  switch (act.type) {
    case "ring": {
      const o = s.options[act.index];
      if (st.phase !== "place" || !o) return st;
      if (!o.right)
        return {
          ...st,
          tries: st.tries + 1,
          wrong: act.index,
          hint: s.hintPlace ?? "Not there. Read the clue again.",
        };
      const placed = [
        ...st.placed,
        { step: st.step, x: o.x, y: o.y, pose: "stand" as PlacePose },
      ];
      return needsPose(a, s)
        ? { ...st, placed, phase: "pose", tries: 0, wrong: null, hint: null }
        : { ...st, placed, phase: "done", wrong: null, hint: null };
    }
    case "pose": {
      if (st.phase !== "pose") return st;
      const placed = st.placed.map((p, i) =>
        i === st.placed.length - 1 ? { ...p, pose: act.pose } : p,
      );
      if (act.pose === s.pose)
        return { ...st, placed, phase: "done", wrong: null, hint: null };
      return {
        ...st,
        placed,
        tries: st.tries + 1,
        wrong: act.pose,
        hint: s.hintPose ?? "Not quite. Read the clue again.",
      };
    }
    case "show": {
      if (st.phase === "place") {
        const k = s.options.findIndex((o) => o.right);
        return stepPlace(a, stepPlace(a, st, { type: "ring", index: k }), act);
      }
      if (st.phase === "pose" && s.pose)
        return stepPlace(a, st, { type: "pose", pose: s.pose });
      return st;
    }
    case "next":
      if (st.phase !== "done" || st.step >= a.steps.length - 1) return st;
      return enter(a, st.step + 1, st);
    case "finish":
      if (st.phase !== "done" || st.step !== a.steps.length - 1) return st;
      return { ...st, finished: true };
  }
}

/** 1 when every step was right first time, less for each wrong try. */
export function placeScore(misses: number, steps: number): number {
  return Math.max(0, 1 - misses / Math.max(1, steps * 2));
}
