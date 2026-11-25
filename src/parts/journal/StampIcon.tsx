// Stamp artwork, mapped from `stamp.icon`. Two versions per icon:
// locked = thin outline glyph in a dashed ring; earned = filled glyph in a
// double ink ring with a small star. Icon and colour both change.
import type { ReactNode } from "react";

type Glyph = { outline: ReactNode; filled: ReactNode };

// Each glyph is drawn in a 48 × 48 box, centred on (24, 24).
const glyphs: Record<string, Glyph> = {
  house: {
    outline: (
      <path d="M14 24 L24 15 L34 24 M17 22 V33 H31 V22 M22 33 V27 H26 V33" />
    ),
    filled: (
      <>
        <path d="M12 24 L24 13 L36 24 Z" />
        <path d="M16 23 H32 V34 H26 V28 H22 V34 H16 Z" />
      </>
    ),
  },
  magnifier: {
    outline: (
      <>
        <circle cx="21" cy="21" r="7" />
        <path d="M26 26 L33 33" />
      </>
    ),
    filled: (
      <>
        <circle cx="21" cy="21" r="8" />
        <path d="M25 27 L28 24 L35 31 L32 34 Z" />
      </>
    ),
  },
  shuttle: {
    outline: (
      <>
        <path d="M12 24 C18 18 30 18 36 24 C30 30 18 30 12 24 Z" />
        <path d="M19 24 H29" />
      </>
    ),
    filled: (
      <>
        <path d="M10 24 C17 16 31 16 38 24 C31 32 17 32 10 24 Z" />
        <path d="M14 33 H34 M14 36 H34" strokeWidth="1.6" fill="none" />
      </>
    ),
  },
  book: {
    outline: (
      <path d="M24 17 V33 M24 17 C20 15 16 15 13 16 V32 C16 31 20 31 24 33 C28 31 32 31 35 32 V16 C32 15 28 15 24 17 Z" />
    ),
    filled: (
      <path d="M23 16 C19 14 15 14 12 15 V33 C15 32 19 32 23 34 Z M25 16 C29 14 33 14 36 15 V33 C33 32 29 32 25 34 Z" />
    ),
  },
  leaf: {
    outline: (
      <>
        <path d="M15 33 C15 21 23 14 34 14 C34 25 27 33 15 33 Z" />
        <path d="M15 33 L27 21" />
      </>
    ),
    filled: (
      <>
        <path d="M14 34 C14 20 23 12 35 12 C35 25 27 34 14 34 Z" />
        <path
          d="M12 36 L28 20"
          strokeWidth="1.6"
          stroke="var(--paper)"
          fill="none"
        />
      </>
    ),
  },
  card: {
    outline: (
      <>
        <rect x="15" y="14" width="18" height="20" rx="2" />
        <path d="M19 20 H29 M19 24 H29 M19 28 H25" />
      </>
    ),
    filled: (
      <>
        <rect
          x="13"
          y="16"
          width="18"
          height="20"
          rx="2"
          transform="rotate(-8 22 26)"
        />
        <rect x="18" y="12" width="18" height="20" rx="2" />
        <path
          d="M22 18 H32 M22 22 H32 M22 26 H28"
          stroke="var(--paper)"
          strokeWidth="1.6"
          fill="none"
        />
      </>
    ),
  },
  seal: {
    outline: <circle cx="24" cy="24" r="7" />,
    filled: <circle cx="24" cy="24" r="8" />,
  },
};

export function StampIcon({
  icon,
  earned,
  size = 72,
}: {
  icon: string;
  earned: boolean;
  size?: number;
}) {
  const g = glyphs[icon] ?? glyphs.seal;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      {earned ? (
        <g>
          <circle cx="24" cy="24" r="22" fill="var(--seal)" />
          <circle
            cx="24"
            cy="24"
            r="19.5"
            fill="none"
            stroke="var(--paper)"
            strokeWidth="1.2"
          />
          <g fill="var(--paper)" stroke="var(--paper)" strokeWidth="0.6">
            {g.filled}
          </g>
          <path
            d="M24 3.5 l1.3 2.6 2.9 .4 -2.1 2 .5 2.9 -2.6 -1.4 -2.6 1.4 .5 -2.9 -2.1 -2 2.9 -.4 Z"
            fill="var(--gold)"
          />
        </g>
      ) : (
        <g>
          <circle
            cx="24"
            cy="24"
            r="21"
            fill="none"
            stroke="var(--locked)"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          <g
            fill="none"
            stroke="var(--locked)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {g.outline}
          </g>
        </g>
      )}
    </svg>
  );
}
