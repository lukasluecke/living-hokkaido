// Automatic quality step-down for slow GPUs. Pure logic, no React or three,
// so it is easy to test. React glue: ./Quality.tsx.
//
// Tier 3 is the full look (what every fast machine gets). A canvas measures
// its own frame rate; when it stays low, the tier goes down one step. The
// tier is shared by every canvas on the page (it is the same GPU) and kept
// for the browser session. It never goes back up by itself.

export type Tier = 0 | 1 | 2 | 3;
export const FULL: Tier = 3;

/** What each tier keeps. */
export type QualitySettings = {
  /** Device pixel ratio cap; [1, max] at full = the canvas default. */
  dpr: number | [number, number];
  /** Extra screen passes (tilt-shift blur, SMAA, bloom). The ink lines and
   *  vignette are the look and stay on every tier. */
  extraFx: boolean;
  /** Real-time shadow maps. */
  shadows: boolean;
};

export function settingsFor(tier: Tier, maxDpr: number): QualitySettings {
  switch (tier) {
    case 3:
      return { dpr: [1, maxDpr], extraFx: true, shadows: true };
    case 2:
      return { dpr: 1, extraFx: true, shadows: true };
    case 1:
      return { dpr: 1, extraFx: false, shadows: true };
    default:
      return { dpr: 0.75, extraFx: false, shadows: false };
  }
}

/** `?quality=` override, for demos and tests: full, high, mid, low, auto. */
export function parseTier(value: string | null | undefined): Tier | null {
  switch (value) {
    case "full":
      return 3;
    case "high":
      return 2;
    case "mid":
      return 1;
    case "low":
      return 0;
    default:
      return null;
  }
}

export type MonitorOptions = {
  /** Ignore this long after start or a step (shader compile, loading). */
  warmupMs: number;
  /** Length of one measuring window. */
  windowMs: number;
  /** A window under this average frame rate is "slow". */
  minFps: number;
  /** Step down after this many slow windows in a row. */
  slowWindows: number;
  /** A single frame gap longer than this (a load, a stall) is skipped.
   *  Long enough that a 1 fps software GPU still counts. */
  maxGapMs: number;
};

export const MONITOR: MonitorOptions = {
  warmupMs: 2500,
  windowMs: 1500,
  minFps: 40,
  slowWindows: 2,
  maxGapMs: 2000,
};

/**
 * Frame-rate monitor. Feed it each frame's gap in ms; it answers true when
 * the tier should go down one step (then it starts a new warm-up).
 */
export function createMonitor(opts: MonitorOptions = MONITOR) {
  let warm = 0;
  let time = 0;
  let frames = 0;
  let slow = 0;
  return {
    frame(gapMs: number): boolean {
      if (gapMs > opts.maxGapMs || gapMs <= 0) return false;
      if (warm < opts.warmupMs) {
        warm += gapMs;
        return false;
      }
      time += gapMs;
      frames++;
      if (time < opts.windowMs) return false;
      const fps = (frames * 1000) / time;
      time = 0;
      frames = 0;
      slow = fps < opts.minFps ? slow + 1 : 0;
      if (slow < opts.slowWindows) return false;
      slow = 0;
      warm = 0;
      return true;
    },
    /** Start again with a warm-up (for example after a tier change). */
    reset() {
      warm = 0;
      time = 0;
      frames = 0;
      slow = 0;
    },
  };
}
