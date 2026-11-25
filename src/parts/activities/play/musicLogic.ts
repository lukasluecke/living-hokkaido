// Pure state for the canon and pluck kinds. No React, no audio.

/** An illustrative melody contour (semitones), not any real song. */
export const CANON_PATTERN = [0, 3, 5, 3, 7, 5, 3, 0];

export const patternNote = (beat: number) =>
  CANON_PATTERN[
    ((beat % CANON_PATTERN.length) + CANON_PATTERN.length) %
      CANON_PATTERN.length
  ];

/**
 * Is a tap at `beat` (fractional beats since voice 1 began) on the mark of
 * voice `index`? Marks repeat every `beats`. Returns the signed distance to
 * the nearest mark, in beats.
 */
export function canonOffBy(
  beat: number,
  index: number,
  offset: number,
  beats: number,
): number {
  const mark = (index * offset) % beats;
  let d = (((beat - mark) % beats) + beats) % beats;
  if (d > beats / 2) d -= beats;
  return d;
}

/** Half a beat either side: the nearest beat is the mark. */
export const ON_MARK = 0.5;

export type PluckState = {
  /** Strings plucked at least once (1-based). */
  tried: number[];
  /** Next note of the tune to play (index). */
  next: number;
  misses: number;
};

export const startPluck = (): PluckState => ({ tried: [], next: 0, misses: 0 });

export function pluckString(
  s: PluckState,
  string: number,
  strings: number,
  tune: number[] | null,
): PluckState {
  const tried = s.tried.includes(string) ? s.tried : [...s.tried, string];
  const explored = tried.length >= strings;
  if (!explored || !tune || s.next >= tune.length) return { ...s, tried };
  // The step that explored the last string does not count as a tune note.
  if (s.tried.length < strings) return { ...s, tried };
  if (tune[s.next] === string) return { ...s, tried, next: s.next + 1 };
  return { ...s, tried, misses: s.misses + 1 };
}

export const pluckPhase = (
  s: PluckState,
  strings: number,
  tune: number[] | null,
): "explore" | "tune" | "done" =>
  s.tried.length < strings
    ? "explore"
    : tune && s.next < tune.length
      ? "tune"
      : "done";
