// Local mirror of the living-hokkaido contracts this game touches
// (src/contracts: activity.ts ActivityResult, events.ts, experience.ts Prefs).
// When the game is ported, import these from `@/contracts` and delete this
// file. Keep it in sync by hand; never add fields living-hokkaido lacks.
// The activity definition (kind "slope-run") is a later contract proposal.
import type { FindInfo } from "../core/exhibits";

export type ActivityResult = {
  activityId: string;
  completed: boolean;
  /** 0..1 where it makes sense. */
  score?: number;
  at: string;
  /** Ids of the things the visitor found (noticed) in this run. */
  found?: string[];
};

/** The subset of living-hokkaido's ExperienceEvent this game emits. */
export type ExperienceEvent =
  | { type: "activity.complete"; result: ActivityResult }
  | { type: "activity.close"; activityId: string };
export type Emit = (event: ExperienceEvent) => void;

/** Same as living-hokkaido's Prefs. */
export type Prefs = {
  /** prefers-reduced-motion: no slow-motion, FOV kick or tumbling camera. */
  reducedMotion: boolean;
  /** False when WebGL failed. The game then shows its HTML fallback. */
  webgl: boolean;
};

/** Props for the game. Shaped like ActivityPartProps until the activity
 *  definition exists. */
export type SlopeProps = {
  activityId: string;
  prefs: Prefs;
  emit: Emit;
  /** Street layout seed. Same seed, same street. */
  seed?: number;
  /**
   * The pool of exhibits: real things of the street, each explained by a
   * cited claim (`text`, resolved by the host). Each street shows a few,
   * new ones first; the end card explains what was noticed. Optional:
   * without it there are no exhibits.
   */
  finds?: FindInfo[];
  /** Exhibit ids this visitor noticed before (the host's journal keeps
   *  them; the game keeps no storage). */
  seen?: string[];
  /** Dev only: start this many metres down the street (the page reads
   *  ?at=N). Hosts leave it out. */
  startAt?: number;
};
