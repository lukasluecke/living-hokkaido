// Rules of one run. Pure and serialisable: physics reports what happened
// (progress, contact, reaching the canal); this decides what it means.

export type Phase = "ready" | "sliding" | "crashed" | "finished";

export type RunState = {
  phase: Phase;
  /** Metres downhill in the current run. */
  distance: number;
  /** What the body touched, when crashed. */
  hit: string | null;
  /** Best score this session. */
  best: number;
  /** How many runs have ended (crash or canal). */
  runsEnded: number;
};

export type RunAction =
  | { type: "start" }
  | { type: "progress"; distance: number }
  | { type: "crash"; what: string }
  | { type: "finish" }
  | { type: "restart" };

export const initialRun: RunState = {
  phase: "ready",
  distance: 0,
  hit: null,
  best: 0,
  runsEnded: 0,
};

/** Score for M1: whole metres. Captions and style points come later. */
export function score(state: Pick<RunState, "distance">): number {
  return Math.max(0, Math.floor(state.distance));
}

/** Score as 0..1 of the whole street, for the host's ActivityResult. */
export function resultScore(distance: number, length: number): number {
  return Math.min(1, Math.max(0, distance / length));
}

function end(state: RunState, phase: Phase, hit: string | null): RunState {
  return {
    ...state,
    phase,
    hit,
    best: Math.max(state.best, score(state)),
    runsEnded: state.runsEnded + 1,
  };
}

export function reduceRun(state: RunState, action: RunAction): RunState {
  switch (action.type) {
    case "start":
      return state.phase === "ready" ? { ...state, phase: "sliding" } : state;
    case "progress":
      if (state.phase !== "sliding") return state;
      // Distance never goes backwards (sliding uphill doesn't undo metres).
      return { ...state, distance: Math.max(state.distance, action.distance) };
    case "crash":
      return state.phase === "sliding"
        ? end(state, "crashed", action.what)
        : state;
    case "finish":
      return state.phase === "sliding" ? end(state, "finished", null) : state;
    case "restart":
      return state.phase === "crashed" || state.phase === "finished"
        ? { ...state, phase: "ready", distance: 0, hit: null }
        : state;
  }
}
