// Pure state for the splat-look kind: which spots and claims the visitor
// has opened, and when the look is complete (every spot claim read).
import type { ActivityOf } from "@/contracts";

type Look = ActivityOf<"splat-look">;

export type LookState = { opened: string[]; read: string[] };

export const initialLook: LookState = { opened: [], read: [] };

/** Claims that must be read to complete: the union of all spot claims. */
export function goalClaims(a: Look, known: (id: string) => boolean): string[] {
  return [...new Set(a.spots.flatMap((s) => s.claimIds))].filter(known);
}

export function openSpot(a: Look, st: LookState, spotId: string): LookState {
  const spot = a.spots.find((s) => s.id === spotId);
  if (!spot) return st;
  return {
    opened: st.opened.includes(spotId) ? st.opened : [...st.opened, spotId],
    read: [...new Set([...st.read, ...spot.claimIds])],
  };
}

export function isComplete(
  a: Look,
  st: LookState,
  known: (id: string) => boolean,
): boolean {
  const goal = goalClaims(a, known);
  return goal.length > 0 && goal.every((c) => st.read.includes(c));
}

/** What the asset check answered, as a viewer phase. */
export type AssetPhase = "ready" | "locked" | "missing" | "off";
export function phaseForStatus(status: number): AssetPhase {
  if (status >= 200 && status < 300) return "ready";
  if (status === 401) return "locked";
  if (status === 503) return "off";
  return "missing";
}
