// Stylised figures for the map kind. Hand-drawn sketch shapes made for this
// demo (MIT): not survey maps and not a copy of the museum's plan.
import type { ActivityOf } from "@/contracts";

type Figure = ActivityOf<"map">["figure"];

/** Width / height of each figure's viewBox (spot x, y are 0..1 of these). */
export const FIGURE_BOX: Record<Figure, [number, number]> = {
  hokkaido: [100, 100],
  "cise-plan": [100, 62],
};

export const FIGURE_LABEL: Record<Figure, string> = {
  hokkaido: "Sketch map of Hokkaido and southern Sakhalin",
  "cise-plan": "Sketch floor plan of a cise",
};

const HOKKAIDO =
  "M47 42 L53 47 L60 52 L67 56 L74 58 L82 59 L88 54 L91 56 L86 63 L94 67 L92 70 L84 70 L78 73 L72 74 L66 76 L61 82 L58 87 L54 81 L50 78 L45 77 L41 80 L37 84 L33 82 L31 88 L28 95 L23 97 L20 94 L23 88 L22 83 L26 77 L30 73 L33 67 L36 61 L39 55 L41 49 L44 45 Z";
const SAKHALIN =
  "M41 2 L45 3 L46 10 L48 17 L50 25 L49 33 L46 37 L44 31 L43 24 L41 16 L40 9 Z";

export function FigureArt({ figure }: { figure: Figure }) {
  const [w, h] = FIGURE_BOX[figure];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="figure-art"
      role="img"
      aria-label={FIGURE_LABEL[figure]}
    >
      {figure === "hokkaido" ? (
        <>
          <rect width={w} height={h} className="sea" />
          <path d={SAKHALIN} className="land" />
          <path d={HOKKAIDO} className="land" />
          <text x="62" y="97" className="figure-note">
            sketch · not to scale
          </text>
        </>
      ) : (
        <>
          <rect width={w} height={h} className="ground" />
          {/* Entrance room, left; main room; hearth in the middle. */}
          <rect x="4" y="18" width="18" height="26" className="room" />
          <rect x="22" y="5" width="74" height="52" className="room" />
          <rect x="47" y="26" width="22" height="10" className="hearth" />
          {/* Openings: doors (gaps) and windows (thick marks). */}
          <line x1="4" y1="27" x2="4" y2="35" className="opening" />
          <line x1="22" y1="27" x2="22" y2="35" className="opening" />
          <line x1="96" y1="27" x2="96" y2="35" className="window" />
          <line x1="76" y1="57" x2="86" y2="57" className="window" />
          <line x1="30" y1="5" x2="38" y2="5" className="window" />
          <text x="4" y="4" className="figure-note">
            sketch · not to scale
          </text>
        </>
      )}
    </svg>
  );
}
