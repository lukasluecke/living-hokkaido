// Demo video DSL: the step types and small builders that steps.ts uses.
// Keep this file free of Playwright imports so the shot list stays plain data.
import type { EventType, ExperienceEvent } from "@/contracts";

/** How to find an element. Prefer role + accessible name (stable for a11y). */
export type Target =
  | {
      role: "button" | "link" | "region" | "navigation" | "dialog" | "article";
      name: string | RegExp;
      exact?: boolean;
    }
  | { text: string | RegExp }
  | { label: string | RegExp }
  | { testId: string }
  | { css: string };

type Common = {
  /** If the step fails, log a warning and continue (keeps the video alive). */
  optional?: boolean;
  /** Run this step instead when the main step fails (before `optional`). */
  fallback?: Step;
};

export type Step = Common &
  (
    | { do: "goto"; path: string }
    /** Move the visible cursor to the target and click it. */
    | {
        do: "click";
        target: Target;
        moveMs?: number;
        /** Rest on the target before the click (default 150 ms). */
        pauseMs?: number;
        /** Send the click to the element (no real mouse, no user activation). */
        synthetic?: boolean;
        timeoutMs?: number;
      }
    | { do: "hover"; target: Target; moveMs?: number; timeoutMs?: number }
    | { do: "press"; key: string }
    /** Click a text field, then type like a person (charMs per key). */
    | { do: "type"; target: Target; text: string; charMs?: number }
    /** Drag from the target centre (or viewport centre) by dx/dy pixels. */
    | { do: "drag"; target?: Target; by: [number, number]; ms?: number }
    | { do: "wheel"; dy: number; ms?: number }
    | {
        do: "waitFor";
        target: Target;
        state?: "visible" | "hidden";
        timeoutMs?: number;
      }
    /** Needs the shell test hook (HANDBACK.md). Without it, waits `fallbackMs`. */
    | {
        do: "waitForEvent";
        type: EventType;
        timeoutMs?: number;
        fallbackMs?: number;
      }
    /** Needs the shell test hook (HANDBACK.md). Fails without it. */
    | { do: "emit"; event: ExperienceEvent }
    /** Keep the camera on the current shot. Scaled by --speed. */
    | { do: "hold"; ms: number }
    /** Lower-third caption, shown only with --captions. */
    | { do: "caption"; text: string }
    | { do: "captionClear" }
    /** A named chapter marker in markers.json (no visual effect). */
    | { do: "mark"; label: string }
  );

export type Shot = {
  id: string;
  title: string;
  /** false = left out unless named with --with or --shots. */
  enabled?: boolean;
  steps: Step[];
};

// ---- builders -------------------------------------------------------------

export const button = (name: string | RegExp, exact = true): Target => ({
  role: "button",
  name,
  exact,
});
export const region = (name: string | RegExp): Target => ({
  role: "region",
  name,
});
export const text = (t: string | RegExp): Target => ({ text: t });

export const goto = (path: string): Step => ({ do: "goto", path });
export const click = (
  target: Target,
  opts: Partial<Common> & {
    moveMs?: number;
    pauseMs?: number;
    timeoutMs?: number;
    synthetic?: boolean;
  } = {},
): Step => ({
  do: "click",
  target,
  ...opts,
});
export const hover = (
  target: Target,
  opts: Partial<Common> & { moveMs?: number } = {},
): Step => ({
  do: "hover",
  target,
  ...opts,
});
export const press = (key: string, opts: Partial<Common> = {}): Step => ({
  do: "press",
  key,
  ...opts,
});
export const typeInto = (
  target: Target,
  t: string,
  opts: Partial<Common> & { charMs?: number } = {},
): Step => ({ do: "type", target, text: t, ...opts });
export const hold = (ms: number): Step => ({ do: "hold", ms });
export const waitFor = (
  target: Target,
  opts: Partial<Common> & {
    state?: "visible" | "hidden";
    timeoutMs?: number;
  } = {},
): Step => ({ do: "waitFor", target, ...opts });
export const waitForEvent = (
  type: EventType,
  opts: Partial<Common> & { timeoutMs?: number; fallbackMs?: number } = {},
): Step => ({ do: "waitForEvent", type, ...opts });
export const emit = (
  event: ExperienceEvent,
  opts: Partial<Common> = {},
): Step => ({
  do: "emit",
  event,
  ...opts,
});
export const drag = (
  by: [number, number],
  opts: Partial<Common> & { target?: Target; ms?: number } = {},
): Step => ({
  do: "drag",
  by,
  ...opts,
});
export const caption = (t: string): Step => ({ do: "caption", text: t });
export const captionClear = (): Step => ({ do: "captionClear" });
export const mark = (label: string): Step => ({ do: "mark", label });
/** Scroll by dy pixels at the cursor, spread over ms. */
export const wheel = (
  dy: number,
  opts: Partial<Common> & { ms?: number } = {},
): Step => ({ do: "wheel", dy, ...opts });
