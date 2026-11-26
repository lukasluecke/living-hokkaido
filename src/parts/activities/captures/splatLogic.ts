// Pure state for the splat-look kind: which spots and claims the visitor
// has opened, and when the look is complete (enough spot claims read).
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

/** Panel notes to read before the look counts as done (the tour goes on). */
export const NOTES_TO_READ = 3;

export function notesNeeded(a: Look, known: (id: string) => boolean): number {
  return Math.min(NOTES_TO_READ, goalClaims(a, known).length);
}

export function notesRead(
  a: Look,
  st: LookState,
  known: (id: string) => boolean,
): number {
  return goalClaims(a, known).filter((c) => st.read.includes(c)).length;
}

export function isComplete(
  a: Look,
  st: LookState,
  known: (id: string) => boolean,
): boolean {
  const need = notesNeeded(a, known);
  return need > 0 && notesRead(a, st, known) >= need;
}

/** iPhone and iPad (also iPadOS that says it is a Mac). Safari there closes
 * the page when a large splat uses too much memory. */
export function isIOS(ua: string, touchPoints: number): boolean {
  return /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1);
}

/** What the asset check answered, as a viewer phase. */
export type AssetPhase = "ready" | "locked" | "missing" | "off";
export function phaseForStatus(status: number): AssetPhase {
  if (status >= 200 && status < 300) return "ready";
  if (status === 401) return "locked";
  if (status === 503) return "off";
  return "missing";
}
