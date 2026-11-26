// The deadpan guide's lines. Game lines only: they joke about what just
// happened and never state history (history comes from cited claims, M3).

export const TITLE = "Don't Fall on the Slope";
export const READY_LINE = "Please do not touch the exhibits or the people.";

const CRASH: Record<string, string> = {
  shopfront:
    "You have touched a shopfront. Visitors are asked to admire the architecture from a respectful distance.",
  "snow-pile": "You have entered a snow pile. It was not an entrance.",
  "lamp-post": "You have embraced a lamp post.",
  crate: "You have inspected a crate at speed.",
  bicycle:
    "You have touched a parked bicycle. It was parked, which is more than can be said for you.",
  tourist: "You have bumped into a fellow visitor. Please apologise.",
  rickshaw: "You have boarded a rickshaw without paying.",
  "herring-crates": "You have rearranged the herring crates.",
  sled: "You have tripped over a child's sled.",
  snowman: "You have knocked the hat off a snowman.",
};

export function crashLine(what: string | null): string {
  return (what && CRASH[what]) ?? "You have touched an exhibit.";
}

export const FINISH_LINE =
  "You have reached the canal without touching anything. Staff have been asked to remain calm.";

/** The guide's lines for a close call (game lines, no history). */
export const CLOSE_CALL_LINES = [
  "A daring interpretation.",
  "Bold. The curator is taking notes.",
  "Closer than the guidelines recommend.",
  "An intimate viewing.",
  "The exhibit felt the draught.",
  "Technically, no contact was made.",
];

export function closeCallLine(n: number): string {
  return (
    CLOSE_CALL_LINES[n % CLOSE_CALL_LINES.length] ?? "A daring interpretation."
  );
}

/** Crashing into a glass workshop. */
export const GLASS_TITLE = "Do not touch the art.";
export const GLASS_LINE = "You have touched the glass workshop.";
