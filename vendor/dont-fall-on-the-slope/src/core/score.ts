// Shareable score (step 8): daily seed, clean streaks, style points and a
// dry, museum-style title for each run. Pure; no DOM, no storage.
import { rng } from "./random";

/** Today's slope: the date as YYYYMMDD (local time), e.g. 20261126. */
export function dailySeed(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/** Share link for a seed. Only the seed goes in: no personal data. */
export function shareLink(base: string, seed: number): string {
  const u = new URL(base);
  u.search = "";
  u.hash = "";
  u.searchParams.set("seed", String(seed));
  return u.toString();
}

/** Obstacles passed in a row without ploughing through a snow pile. */
export type Streak = { current: number; longest: number };
export const NO_STREAK: Streak = { current: 0, longest: 0 };

export function streakStep(s: Streak, event: "pass" | "soft"): Streak {
  if (event === "soft") return { current: 0, longest: s.longest };
  const current = s.current + 1;
  return { current, longest: Math.max(s.longest, current) };
}

/** Style points: close calls and the longest clean streak. */
export function stylePoints(closeCalls: number, longestStreak: number) {
  return closeCalls * 25 + longestStreak * 5;
}

/** Title pools for runTitle (one per language, see src/i18n). */
export type RunTitles = {
  crash: Record<string, string[]>;
  open: string[];
  finish: string[];
  format: (name: string, year: number) => string;
};

const CRASH_TITLES: Record<string, string[]> = {
  shopfront: ["Figure Meeting Facade", "Study in Architecture, Abrupt"],
  "lamp-post": ["Figure with Lamp Post", "Embrace (Iron)"],
  crate: ["Still Life with Crate", "Arrangement in Wood"],
  bicycle: ["Composition with Bicycle", "Parked, Disturbed"],
  tourist: ["Two Visitors", "Group Portrait, Unplanned"],
  glass: ["Do Not Touch", "Study in Glass, Unrequested"],
};
const OPEN_TITLES = [
  "Untitled (Descent)",
  "Descent, Interrupted",
  "Study in Ice",
];
const FINISH_TITLES = ["Arrival at the Canal", "Untitled (Complete Descent)"];

export const EN_TITLES: RunTitles = {
  crash: CRASH_TITLES,
  open: OPEN_TITLES,
  finish: FINISH_TITLES,
  format: (name, year) => `${name}, ${year}`,
};

/** A museum-style title for a run, e.g. "Untitled (Descent), 2026". */
export function runTitle(
  seed: number,
  run: number,
  hit: string | null,
  finished: boolean,
  year: number,
  titles: RunTitles = EN_TITLES,
): string {
  const r = rng(seed * 31 + run);
  const pool = finished
    ? titles.finish
    : hit && titles.crash[hit] && r() < 0.7
      ? (titles.crash[hit] as string[])
      : titles.open;
  const name = pool[Math.floor(r() * pool.length)] ?? titles.open[0] ?? "";
  return titles.format(name, year);
}
