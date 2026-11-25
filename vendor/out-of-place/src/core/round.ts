// Pure round logic. No Phaser imports: this module must also run on a server later.

export type Phase =
  | "sceneReveal"
  | "disguise"
  | "handoff"
  | "seek"
  | "reveal"
  | "roundOver";

/** Play order. `handoff` (pass the device) has no clock; it waits for `ready`. */
export const PHASE_ORDER: readonly Phase[] = [
  "sceneReveal",
  "disguise",
  "handoff",
  "seek",
  "reveal",
  "roundOver",
];

export type TimedPhase = "sceneReveal" | "disguise" | "seek" | "reveal";
export type PhaseDurations = Record<TimedPhase, number>;

export const DEFAULT_DURATIONS_MS: PhaseDurations = {
  sceneReveal: 10_000,
  disguise: 80_000,
  seek: 90_000,
  reveal: 20_000,
};

export const WRONG_TAP_PENALTY_MS = 10_000;
/** Extra pixels around the hider that still count as a hit (fat-finger friendly). */
export const TAP_FORGIVENESS = 8;

/**
 * Practical body shapes, about the same area each: tall and narrow, then
 * lower and wider, down to flat on the ground. Pick the one that fits the
 * spot (a doorway, a bench, a row of sacks).
 */
export type Pose = "standing" | "sitting" | "kneeling" | "lying";
export const POSES: readonly Pose[] = [
  "standing",
  "sitting",
  "kneeling",
  "lying",
];

/** Hit box per pose in world px, anchored bottom-center at the hider's feet. Renderer must match. */
export const POSE_HITBOX: Record<Pose, { w: number; h: number }> = {
  standing: { w: 64, h: 142 },
  sitting: { w: 92, h: 120 },
  kneeling: { w: 80, h: 128 },
  lying: { w: 152, h: 58 },
};

export interface Hider {
  x: number;
  y: number;
  pose: Pose;
  found: boolean;
}

export interface Tap {
  x: number;
  y: number;
  hit: boolean;
  /** Ms since the seek phase began. */
  atMs: number;
}

export type Outcome = "seekersWin" | "hidersWin";

export interface RoundState {
  phase: Phase;
  /** Time left in the current phase (0 in untimed phases). */
  remainingMs: number;
  durations: PhaseDurations;
  /** Ms taken off the seek clock per wrong tap. */
  penaltyMs: number;
  spawn: { x: number; y: number };
  hider: Hider;
  taps: Tap[];
  seekElapsedMs: number;
  outcome: Outcome | null;
}

/** Every action is plain, serializable data so it can travel over the network later. */
export type RoundAction =
  | { type: "tick"; dtMs: number }
  | { type: "skipPhase" }
  | { type: "ready" }
  | { type: "restart" }
  | { type: "moveHider"; x: number; y: number }
  | { type: "setPose"; pose: Pose }
  | { type: "seekTap"; x: number; y: number };

export interface RoundOptions {
  durations?: PhaseDurations;
  penaltyMs?: number;
  spawn?: { x: number; y: number };
}

export function createRound(opts: RoundOptions = {}): RoundState {
  const durations = opts.durations ?? DEFAULT_DURATIONS_MS;
  const spawn = opts.spawn ?? { x: 0, y: 0 };
  return {
    phase: "sceneReveal",
    remainingMs: durations.sceneReveal,
    durations,
    penaltyMs: opts.penaltyMs ?? WRONG_TAP_PENALTY_MS,
    spawn,
    hider: { ...spawn, pose: "standing", found: false },
    taps: [],
    seekElapsedMs: 0,
    outcome: null,
  };
}

function isTimed(phase: Phase): phase is TimedPhase {
  return (
    phase === "sceneReveal" ||
    phase === "disguise" ||
    phase === "seek" ||
    phase === "reveal"
  );
}

function nextPhase(phase: Phase): Phase {
  const i = PHASE_ORDER.indexOf(phase);
  return PHASE_ORDER[Math.min(i + 1, PHASE_ORDER.length - 1)];
}

function enter(state: RoundState, phase: Phase): RoundState {
  const remainingMs = isTimed(phase) ? state.durations[phase] : 0;
  // Leaving seek without a find means the hider survived.
  const outcome =
    phase === "reveal" && state.outcome === null ? "hidersWin" : state.outcome;
  return { ...state, phase, remainingMs, outcome };
}

export function hitTest(hider: Hider, x: number, y: number): boolean {
  const { w, h } = POSE_HITBOX[hider.pose];
  const f = TAP_FORGIVENESS;
  return (
    x >= hider.x - w / 2 - f &&
    x <= hider.x + w / 2 + f &&
    y >= hider.y - h - f &&
    y <= hider.y + f
  );
}

export function roundReducer(
  state: RoundState,
  action: RoundAction,
): RoundState {
  switch (action.type) {
    case "tick": {
      if (!isTimed(state.phase) || action.dtMs <= 0) return state;
      let s = state;
      let dt = action.dtMs;
      // Carry leftover time into following phases so a long frame never loses time.
      while (isTimed(s.phase) && dt >= s.remainingMs) {
        dt -= s.remainingMs;
        if (s.phase === "seek")
          s = { ...s, seekElapsedMs: s.seekElapsedMs + s.remainingMs };
        s = enter(s, nextPhase(s.phase));
      }
      if (!isTimed(s.phase)) return s;
      if (s.phase === "seek") s = { ...s, seekElapsedMs: s.seekElapsedMs + dt };
      return { ...s, remainingMs: s.remainingMs - dt };
    }
    case "skipPhase":
      // In seek, skipping means the seeker gives up.
      if (state.phase === "handoff" || state.phase === "roundOver")
        return state;
      return enter(state, nextPhase(state.phase));
    case "ready":
      return state.phase === "handoff" ? enter(state, "seek") : state;
    case "restart":
      return createRound({
        durations: state.durations,
        penaltyMs: state.penaltyMs,
        spawn: state.spawn,
      });
    case "moveHider":
      if (state.phase !== "disguise") return state;
      return { ...state, hider: { ...state.hider, x: action.x, y: action.y } };
    case "setPose":
      if (state.phase !== "disguise") return state;
      return { ...state, hider: { ...state.hider, pose: action.pose } };
    case "seekTap": {
      if (state.phase !== "seek") return state;
      const hit = hitTest(state.hider, action.x, action.y);
      const taps = [
        ...state.taps,
        { x: action.x, y: action.y, hit, atMs: state.seekElapsedMs },
      ];
      if (hit) {
        return enter(
          {
            ...state,
            taps,
            hider: { ...state.hider, found: true },
            outcome: "seekersWin",
          },
          "reveal",
        );
      }
      const remainingMs = state.remainingMs - state.penaltyMs;
      if (remainingMs <= 0)
        return enter({ ...state, taps, outcome: "hidersWin" }, "reveal");
      return { ...state, taps, remainingMs };
    }
  }
}

/** Whole seconds to show on a countdown (rounds up, so "1" shows until time is truly out). */
export function secondsLeft(state: RoundState): number {
  return Math.ceil(state.remainingMs / 1000);
}

export type RGB = readonly [number, number, number];

/**
 * How well the hider's paint matches what's behind it: 100 = invisible, 0 = opposite colors.
 * Takes matched samples (hider pixel, background pixel at the same world point).
 */
export function blendScore(
  hiderPixels: readonly RGB[],
  backgroundPixels: readonly RGB[],
): number {
  const n = Math.min(hiderPixels.length, backgroundPixels.length);
  if (n === 0) return 0;
  const maxDist = Math.sqrt(3 * 255 * 255);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const [r1, g1, b1] = hiderPixels[i];
    const [r2, g2, b2] = backgroundPixels[i];
    total +=
      Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2) / maxDist;
  }
  return Math.round(100 * (1 - total / n));
}
