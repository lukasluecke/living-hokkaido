// One line-icon set for the whole UI: a glyph per activity kind and per
// route step, so lists, chips and buttons lead with a picture and a short
// word instead of a caption line. 24 × 24, stroke = currentColor.
// Generic shapes only (no cultural motifs or patterns).

/** One path per activity kind. Unknown kinds use `try`. */
export const KIND_ICON: Record<string, string> = {
  // Speech bubble with a question mark.
  quiz: "M4 5h16v11h-9l-5 4v-4H4zM10 9a2 2 0 1 1 2.8 1.8c-.5.3-.8.6-.8 1.2M12 14h.01",
  // Numbered steps.
  sequence: "M4 6h2M4 12h2M4 18h2M9 6h11M9 12h11M9 18h11",
  // Over-under grid.
  weave: "M4 7h16M4 12h16M4 17h16M8 4v16M12 4v16M16 4v16",
  // Headphones.
  story: "M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z",
  // "Aa".
  words:
    "M3 18l4.5-12L12 18M4.6 14h5.8M17 11a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM20 11v7",
  // Page under a magnifier.
  trace:
    "M6 3h8l4 4v5M6 3v18h6M14 3v4h4M16.5 14a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM18.5 18.5 21 21",
  // Compass.
  map: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM15.5 8.5l-2 5-5 2 2-5z",
  // Board.
  board: "M5 5h14v14H5zM5 12h14M12 5v14",
  // Music notes.
  canon:
    "M9 18V6l10-2v12M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0z",
  // Strings and a pick.
  pluck: "M7 3v18M12 3v18M17 3v18M9.5 10l5 3",
  // Eye.
  "hide-seek":
    "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z",
  // Hill and a sled line.
  "slope-run": "M3 20h18M3 20 14 8l7 12M7 13l4 2",
  // A small house.
  place: "M4 11l8-6 8 6v9H4zM10 20v-5h4v5",
  // Cube with a view line (a 3D capture to look around in).
  "splat-look": "M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9",
  // Film frame with a play mark.
  film: "M4 5h16v14H4zM4 9h16M4 15h16M10.5 10.5v3l2.5-1.5z",
  // Hourglass.
  timeline: "M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9",
};

/** Route and action glyphs. */
export const UI_ICON = {
  island: "M3 17c3-1 4-6 9-6s6 5 9 6M2 20h20M12 11V6l4 2-4 2",
  place:
    "M12 21s-7-6-7-11a7 7 0 1 1 14 0c0 5-7 11-7 11zM12 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  look: "M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5 20 20",
  try: "M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6 7-2.5 0-4-1.5-5.5-4L4 13.5a1.5 1.5 0 0 1 2.5-1.5L8 13.5",
  journal:
    "M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h12M9 8h6",
  go: "M5 12h14M13 6l6 6-6 6",
  back: "M15 6l-6 6 6 6",
  check: "M5 12.5l4.5 4.5L19 7",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
  info: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 11v6M12 7.5h.01",
} as const;

export type UiIconId = keyof typeof UI_ICON;

export function kindIconPath(kind: string): string {
  return KIND_ICON[kind] ?? UI_ICON.try;
}

/** Icon for a highlight: its `icon` kind, or a star. */
export function highlightIcon(icon: string | undefined): string {
  return (icon && KIND_ICON[icon]) || UI_ICON.star;
}

/** A decorative line icon. The visible word or an aria-label names it. */
export function Icon({
  d,
  size = 18,
  className,
}: {
  d: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KindIcon({
  kind,
  size,
  className,
}: {
  kind: string;
  size?: number;
  className?: string;
}) {
  return <Icon d={kindIconPath(kind)} size={size} className={className} />;
}
