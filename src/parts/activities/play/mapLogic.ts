// Pure state for the map kind (explore and match). No React.

export type MapState = {
  /** Spots opened (explore) or correctly placed (match). */
  done: string[];
  /** Match mode: the word the visitor holds, waiting for a spot. */
  held: string | null;
  misses: number;
};

export type MapAction =
  | { type: "open"; spotId: string }
  | { type: "hold"; spotId: string }
  | { type: "place"; spotId: string }
  | { type: "reset" };

export const startMap = (): MapState => ({ done: [], held: null, misses: 0 });

export function stepMap(
  s: MapState,
  mode: "explore" | "match",
  a: MapAction,
): MapState {
  if (a.type === "reset") return startMap();
  if (mode === "explore") {
    if (a.type !== "open" || s.done.includes(a.spotId)) return s;
    return { ...s, done: [...s.done, a.spotId] };
  }
  if (a.type === "hold")
    return s.done.includes(a.spotId)
      ? s
      : { ...s, held: s.held === a.spotId ? null : a.spotId };
  if (a.type === "place") {
    if (!s.held || s.done.includes(a.spotId)) return s;
    if (s.held === a.spotId)
      return { ...s, done: [...s.done, a.spotId], held: null };
    return { ...s, misses: s.misses + 1 };
  }
  return s;
}

export const mapFinished = (s: MapState, spots: number) =>
  s.done.length >= spots;

/** 1 with no misses, falling towards 0.5 with many. */
export const mapScore = (s: MapState, spots: number) =>
  spots / (spots + s.misses);
