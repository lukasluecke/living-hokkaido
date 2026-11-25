// Drawings for the "place" kind: figures in poses (the pose sheet), things
// from the house and the animal hills, and five sketch stages. All
// illustrative, our own geometry (labs/activities-scene). Stage box is
// 800 × 450; figure box 76 × 100 with the feet at the bottom.
import type { ReactNode } from "react";
import type { PlacePose } from "@/contracts";
import { material } from "@/design/tokens";

export const STAGE_W = 800;
export const STAGE_H = 450;

type Hat = "cap" | "straw" | "band" | "hood" | "helmet";
export type Thing =
  | "cattail"
  | "bark"
  | "mortar"
  | "pot"
  | "weave"
  | "fish"
  | "deer"
  | "bear"
  | "hare"
  | "salmon"
  | "set-bow"
  | "pelt"
  | "fish-owl";

const HIP: [number, number] = [35, 60];
const rot = (p: [number, number], d: number): [number, number] => {
  const a = (d * Math.PI) / 180;
  const x = p[0] - HIP[0];
  const y = p[1] - HIP[1];
  return [
    HIP[0] + x * Math.cos(a) - y * Math.sin(a),
    HIP[1] + x * Math.sin(a) + y * Math.cos(a),
  ];
};

type PoseDef = {
  label: string;
  lean: number;
  legs: "stand" | "wide" | "bent";
  hands: [number, number][];
  back?: boolean;
  prop?: ReactNode;
};

const wood = material.wood;
const woodDark = material.woodDark;

export const POSES: Record<PlacePose, PoseDef> = {
  stand: {
    label: "Stand",
    lean: 0,
    legs: "stand",
    hands: [
      [28, 64],
      [42, 64],
    ],
  },
  watch: {
    label: "Watch",
    lean: 0,
    legs: "stand",
    hands: [
      [24, 56],
      [46, 56],
    ],
  },
  survey: {
    label: "Survey",
    lean: 8,
    legs: "stand",
    hands: [
      [50, 33],
      [53, 37],
    ],
    prop: (
      <>
        <path
          d="M60 40 50 96M60 40 70 96M60 40 60 96"
          stroke={woodDark}
          strokeWidth="2.5"
        />
        <rect
          x="51"
          y="30"
          width="17"
          height="9"
          rx="2"
          fill="#c99a3b"
          stroke="#1d2a36"
          strokeWidth="1.5"
        />
      </>
    ),
  },
  carry: {
    label: "Carry a load",
    lean: 22,
    legs: "bent",
    hands: [
      [42, 46],
      [45, 52],
    ],
    back: true,
  },
  saw: {
    label: "Saw a tree",
    lean: 16,
    legs: "wide",
    hands: [
      [54, 58],
      [57, 61],
    ],
    prop: (
      <>
        <rect x="60" y="20" width="9" height="76" rx="3" fill={wood} />
        <path d="M46 60h26" stroke="#a7b3bd" strokeWidth="5" />
        <path
          d="M48 63l2 2 2-2 2 2 2-2 2 2 2-2 2 2 2-2"
          stroke="#53606c"
          fill="none"
          strokeWidth="1"
        />
      </>
    ),
  },
  tent: {
    label: "Pitch a tent",
    lean: 10,
    legs: "bent",
    hands: [
      [47, 22],
      [47, 72],
    ],
    prop: (
      <>
        <path d="M41 12h12v7H41z" fill="#53606c" />
        <path d="M47 19v8M52 80v16" stroke={wood} strokeWidth="3" />
        <path
          d="M54 96 66 58l10 38z"
          fill="#eadcb8"
          stroke={wood}
          strokeWidth="1.5"
        />
      </>
    ),
  },
  lead: {
    label: "Lead the way",
    lean: 4,
    legs: "wide",
    hands: [
      [56, 40],
      [30, 64],
    ],
    prop: <path d="M56 40 66 30" stroke={wood} strokeWidth="3" />,
  },
  net: {
    label: "Haul a net",
    lean: -18,
    legs: "wide",
    hands: [
      [52, 48],
      [55, 52],
    ],
    prop: (
      <>
        <path
          d="M53 50C62 60 66 70 72 90"
          stroke="#c9a46a"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M62 82l12 4-4 10-12-4z"
          fill="none"
          stroke="#c9a46a"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
      </>
    ),
  },
  rake: {
    label: "Spread to dry",
    lean: 14,
    legs: "stand",
    hands: [
      [48, 56],
      [53, 63],
    ],
    prop: (
      <>
        <path d="M43 48 64 92" stroke={wood} strokeWidth="3" />
        <path d="M57 93h16" stroke="#53606c" strokeWidth="3" />
      </>
    ),
  },
  shovel: {
    label: "Shovel",
    lean: 30,
    legs: "bent",
    hands: [
      [46, 66],
      [52, 74],
    ],
    prop: (
      <>
        <path d="M40 56 60 88" stroke={wood} strokeWidth="3" />
        <ellipse cx="63" cy="92" rx="7" ry="4" fill="#53606c" />
      </>
    ),
  },
  drill: {
    label: "Drill the face",
    lean: 2,
    legs: "wide",
    hands: [
      [52, 49],
      [56, 53],
    ],
    prop: (
      <>
        <rect x="49" y="46" width="18" height="7" rx="2" fill="#53606c" />
        <path d="M67 49.5h7" stroke="#a7b3bd" strokeWidth="2" />
        <path
          d="M52 53C40 80 20 76 8 96"
          stroke="#1d2a36"
          strokeWidth="2.5"
          fill="none"
        />
      </>
    ),
  },
  sleigh: {
    label: "Drive a horse sleigh",
    lean: -6,
    legs: "wide",
    hands: [
      [54, 48],
      [50, 52],
    ],
    prop: (
      <>
        <path d="M54 48 72 40" stroke="#c9a46a" strokeWidth="2" />
        <path d="M44 90h30l4-5" stroke={woodDark} strokeWidth="3" fill="none" />
        <rect x="48" y="80" width="24" height="8" rx="3" fill={wood} />
      </>
    ),
  },
};

const LEGS = {
  wide: "M35 60 24 96M35 60 46 96",
  bent: "M35 60 28 78 26 96M35 60 45 80 47 96",
  stand: "M35 60 31 96M35 60 39 96",
};

function HatShape({
  hat,
  x,
  y,
  col,
}: {
  hat: Hat;
  x: number;
  y: number;
  col: string;
}) {
  if (hat === "straw")
    return (
      <>
        <ellipse
          cx={x}
          cy={y - 3}
          rx="14"
          ry="3.5"
          fill="#d9bb86"
          stroke={wood}
          strokeWidth="1"
        />
        <path
          d={`M${x - 7} ${y - 3}a7 6 0 0 1 14 0z`}
          fill="#d9bb86"
          stroke={wood}
          strokeWidth="1"
        />
      </>
    );
  if (hat === "band")
    return (
      <>
        <path d={`M${x - 7.5} ${y - 2}a7.5 7.5 0 0 1 15 0z`} fill="#2f3b48" />
        <path d={`M${x - 8} ${y - 2}h16`} stroke="#fbfaf6" strokeWidth="3" />
      </>
    );
  if (hat === "hood")
    return (
      <path
        d={`M${x - 9} ${y + 6}V${y - 2}a9 9 0 0 1 18 0V${y + 6}`}
        fill="none"
        stroke={col}
        strokeWidth="4"
      />
    );
  if (hat === "helmet")
    return (
      <>
        <path
          d={`M${x - 9} ${y - 1}a9 9 0 0 1 18 0z`}
          fill="#e8c27a"
          stroke={wood}
          strokeWidth="1"
        />
        <circle
          cx={x + 6}
          cy={y - 4}
          r="2.6"
          fill="#fff8d0"
          stroke="#1d2a36"
          strokeWidth=".8"
        />
      </>
    );
  return (
    <>
      <path d={`M${x - 8} ${y - 1}a8 8 0 0 1 16 0z`} fill="#53606c" />
      <path d={`M${x + 4} ${y - 1}h7`} stroke="#53606c" strokeWidth="2.5" />
    </>
  );
}

/** One person in one pose. Neutral figure; nothing marks ethnicity. */
export function Person({
  pose,
  colour = "#53606c",
  hat = "cap",
}: {
  pose: PlacePose;
  colour?: string;
  hat?: Hat;
}) {
  const P = POSES[pose];
  const neck = rot([35, 34], P.lean);
  const head = rot([35, 23], P.lean);
  const sh = rot([35, 38], P.lean);
  const arms = P.hands
    .map((h) => `M${sh[0]} ${sh[1]} ${h[0]} ${h[1]}`)
    .join("");
  return (
    <svg viewBox="0 0 76 100" aria-hidden="true">
      <ellipse cx="38" cy="97" rx="20" ry="3.5" fill="rgb(0 0 0 / 22%)" />
      {P.prop}
      {P.back && (
        <g transform={`rotate(${P.lean} 35 60)`}>
          <rect
            x="14"
            y="30"
            width="15"
            height="24"
            rx="4"
            fill="#c9a46a"
            stroke={woodDark}
            strokeWidth="1.5"
          />
          <path d="M16 38h11M16 46h11" stroke={woodDark} />
        </g>
      )}
      <path
        d={LEGS[P.legs]}
        stroke="#2f3b48"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M35 60 ${neck[0]} ${neck[1]}`}
        stroke={colour}
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path
        d={arms}
        stroke={colour}
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx={head[0]}
        cy={head[1]}
        r="7.5"
        fill="#e7c9a6"
        stroke="#1d2a36"
        strokeWidth="1.2"
      />
      <HatShape hat={hat} x={head[0]} y={head[1]} col={colour} />
    </svg>
  );
}

const INK = "#1d2a36";

/** Animal hills things: animals in side view, the set bow, the pelt. */
const HILL_THINGS: Partial<Record<Thing, ReactNode>> = {
  deer: (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <g stroke="#5a3f2b" strokeWidth="3" strokeLinecap="round">
        <path d="M18 38v17M24 39v16M38 39v16M44 38v17" />
        <path d="M45 16l-3-8M45 16l4-7M42 9l-4-3M49 9l3-4" strokeWidth="2" />
      </g>
      <path
        d="M14 30c0-6 6-9 14-9h12c4 0 6-4 5-10l5 2c2 4 1 10-3 14l-1 13H16c-2-2-2-6-2-10z"
        fill="#9a6a3e"
        stroke="#5a3f2b"
        strokeWidth="1.3"
      />
      <path d="M45 13c3 0 7 1 9 3l-3 4c-2 0-5-1-7-3z" fill="#9a6a3e" />
      <ellipse cx="15.5" cy="31" rx="3.5" ry="5" fill="#f4efe4" />
      <g fill="#f4efe4">
        <circle cx="24" cy="27" r="1.3" />
        <circle cx="30" cy="25" r="1.3" />
        <circle cx="36" cy="27" r="1.3" />
        <circle cx="27" cy="31" r="1.3" />
        <circle cx="33" cy="31" r="1.3" />
      </g>
      <circle cx="49" cy="15" r="1.2" fill={INK} />
    </svg>
  ),
  bear: (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <path
        d="M6 40c0-12 8-20 22-20 8 0 14 2 18 6l6 2c3 1 4 4 3 6l-6 2-3 4v15h-7l-1-9H18v9h-7l-1-8c-3-2-4-4-4-7z"
        fill="#5b3b26"
        stroke="#3a2618"
        strokeWidth="1.3"
      />
      <circle cx="44" cy="23" r="3" fill="#5b3b26" stroke="#3a2618" />
      <path d="M52 33l3 1" stroke="#2a1b12" strokeWidth="2" />
      <circle cx="48" cy="29" r="1.2" fill="#140d09" />
    </svg>
  ),
  hare: (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <path
        d="M34 26c-2-8-1-18 2-20s4 8 2 18M38 26c1-8 4-16 7-16s1 9-4 17"
        fill="#b8a58a"
        stroke="#6f5f48"
        strokeWidth="1.2"
      />
      <path
        d="M14 48c0-10 8-16 18-16 2-4 6-7 10-6 4 1 6 5 4 9l-4 3c2 4 1 8-2 10z"
        fill="#b8a58a"
        stroke="#6f5f48"
        strokeWidth="1.2"
      />
      <circle cx="13" cy="44" r="3.5" fill="#efe9dc" />
      <path d="M20 55h22" stroke="#6f5f48" strokeWidth="2" />
      <circle cx="43" cy="31" r="1.2" fill={INK} />
    </svg>
  ),
  salmon: (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <path
        d="M8 50c6-4 12-4 18 0s12 4 18 0 8-3 10-2"
        stroke="#6fb3c8"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M8 32c10-10 28-12 38-2l8-7v18l-8-7C36 44 18 42 8 32z"
        fill="#b0796e"
        stroke="#6b4a44"
        strokeWidth="1.3"
      />
      <path
        d="M14 30c10-6 24-6 30 0"
        stroke="#d9c9b8"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="14" cy="30" r="1.4" fill={INK} />
    </svg>
  ),
  "set-bow": (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <path d="M8 56V34M52 56V40" stroke={woodDark} strokeWidth="3" />
      <path
        d="M4 40c10 6 10 6 2 12"
        stroke="#c8562e"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        fill="none"
      />
      <path
        d="M8 36 52 42"
        stroke="#c8562e"
        strokeWidth="1.2"
        strokeDasharray="3 2"
      />
      <path
        d="M30 18c8 6 8 26 0 32"
        stroke={wood}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M30 18v32" stroke="#efe9dc" strokeWidth="1" />
      <path d="M50 34H14" stroke={woodDark} strokeWidth="2" />
      <path d="M14 34l5-3v6z" fill="#53606c" />
      <path d="M48 31l4 3-4 3" stroke="#c9a46a" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  pelt: (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <path
        d="M30 6c4 0 6 3 6 6 6 0 10 3 10 8l8-2-4 10 2 14 6 4-8 2c-2 6-8 10-20 10S12 54 10 48l-8-2 6-4 2-14-4-10 8 2c0-5 4-8 10-8 0-3 2-6 6-6z"
        fill="#6b4a33"
        stroke="#3a2618"
        strokeWidth="1.3"
      />
      <path d="M30 18v30" stroke="#57392a" strokeWidth="1.5" />
    </svg>
  ),
  "fish-owl": (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <path
        d="M4 52h52"
        stroke={woodDark}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M30 12c-8 0-14 4-14 14 0 10 4 18 14 22 10-4 14-12 14-22 0-10-6-14-14-14z"
        fill="#8a6a48"
        stroke="#4f3a26"
        strokeWidth="1.3"
      />
      <path
        d="M17 16l-3-9 9 6zM43 16l3-9-9 6z"
        fill="#8a6a48"
        stroke="#4f3a26"
      />
      <path d="M22 32c4 10 12 10 16 0" fill="#b49470" />
      <g stroke="#4f3a26" strokeWidth="1">
        <path d="M26 36v6M30 38v6M34 36v6" />
      </g>
      <circle cx="24" cy="23" r="4" fill="#e8b830" />
      <circle cx="36" cy="23" r="4" fill="#e8b830" />
      <circle cx="24" cy="23" r="1.8" fill={INK} />
      <circle cx="36" cy="23" r="1.8" fill={INK} />
      <path d="M28 27h4l-2 4z" fill="#3b4a5e" />
      <path d="M24 48v4M36 48v4" stroke="#53606c" strokeWidth="2" />
    </svg>
  ),
};

const STALKS = [14, 22, 30, 38, 46];

/** Things from the house and the hills (objects scenes), 60 × 60. */
export function ThingArt({ thing }: { thing: Thing }) {
  if (HILL_THINGS[thing]) return HILL_THINGS[thing];
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      {thing === "cattail" && (
        <>
          {STALKS.map((x, i) => (
            <path
              key={`s${x}`}
              d={`M${x} 56 ${x + (i - 2) * 2} 8`}
              stroke="#6f7f3e"
              strokeWidth="2.5"
            />
          ))}
          {STALKS.map((x, i) => (
            <rect
              key={`h${x}`}
              x={x + (i - 2) * 1.4 - 3}
              y="14"
              width="6"
              height="14"
              rx="3"
              fill="#7a5233"
            />
          ))}
          <path d="M10 44h40" stroke="#c99a3b" strokeWidth="4" />
        </>
      )}
      {thing === "bark" && (
        <path
          d="M10 10c8 4 8 36 2 42h10c6-10 4-34-2-42zM26 8c8 6 6 38 0 44h10c6-10 6-36-2-44zM42 10c6 6 6 36 0 42h8c4-10 4-34-2-42z"
          fill="#b98a55"
          stroke={woodDark}
          strokeWidth="1.5"
        />
      )}
      {thing === "mortar" && (
        <>
          <path
            d="M14 30h32l-4 24H18z"
            fill={wood}
            stroke={woodDark}
            strokeWidth="1.5"
          />
          <ellipse cx="30" cy="30" rx="16" ry="4" fill={woodDark} />
          <path
            d="M40 4 32 30"
            stroke="#c9a46a"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      )}
      {thing === "pot" && (
        <>
          <path d="M30 2v14" stroke="#53606c" strokeWidth="2" />
          <path d="M12 22h36c0 18-6 30-18 30S12 40 12 22z" fill="#3b4a5e" />
          <path
            d="M14 22a16 7 0 0 1 32 0"
            fill="none"
            stroke="#53606c"
            strokeWidth="2"
          />
          <path
            d="M18 56c4-6 8-6 12 0s8 6 12 0"
            stroke="#e8763a"
            strokeWidth="3"
            fill="none"
          />
        </>
      )}
      {thing === "weave" && (
        <>
          <rect
            x="8"
            y="14"
            width="44"
            height="32"
            fill={material.fiber}
            stroke={wood}
            strokeWidth="2"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={`w${i}`} d={`M${12 + i * 7} 14v32`} stroke="#b98a55" />
          ))}
          {[0, 1, 2].map((i) => (
            <path key={`f${i}`} d={`M8 ${22 + i * 8}h44`} stroke={wood} />
          ))}
          <path d="M4 50h52" stroke={woodDark} strokeWidth="4" />
        </>
      )}
      {thing === "fish" && (
        <>
          <path d="M6 8h48" stroke={woodDark} strokeWidth="3" />
          {[14, 30, 46].map((x) => (
            <g key={`fish${x}`}>
              <path d={`M${x} 8v4`} stroke="#53606c" />
              <path
                d={`M${x} 12c6 6 6 26 0 36-6-10-6-30 0-36z`}
                fill="#9aa7a0"
                stroke="#53606c"
                strokeWidth="1.2"
              />
              <path d={`M${x - 5} 52l5-5 5 5z`} fill="#9aa7a0" />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------- stages

/** Seeded scatter of round tree crowns (stable between renders). */
function crowns(
  n: number,
  seed: number,
  area: [number, number, number, number],
  cols: string[],
  rmin: number,
  rmax: number,
) {
  let s = seed;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: n }, (_, i) => {
    const x = area[0] + r() * (area[2] - area[0]);
    const y = area[1] + r() * (area[3] - area[1]);
    const rad = rmin + r() * (rmax - rmin);
    const c = cols[Math.floor(r() * cols.length)];
    return (
      <circle
        key={`c${seed}-${i}`}
        cx={x.toFixed(1)}
        cy={y.toFixed(1)}
        r={rad.toFixed(1)}
        fill={c}
      />
    );
  });
}

const AUTUMN = ["#b08a4a", "#c9a24f", "#8f7a45", "#a3803f"];

function SurveyCamp() {
  return (
    <>
      <defs>
        <linearGradient id="place-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9c6cf" />
          <stop offset="1" stopColor="#dfe3dc" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#place-sky)" />
      <path
        d="M0 120 140 92 300 110 470 84 640 104 800 90V170H0z"
        fill="#9fb0b8"
      />
      <rect y="150" width="800" height="300" fill="#a89060" />
      {crowns(60, 7, [0, 140, 800, 230], AUTUMN, 16, 30)}
      <path d="M80 450 460 160 520 160 220 450z" fill="#c9b07a" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = 150 + (i / 5) * 335;
        const y = 450 - (i / 5) * 285;
        return (
          <g key={`stake${i}`}>
            <path d={`M${x} ${y}v-16`} stroke="#fbfaf6" strokeWidth="3" />
            <circle cx={x} cy={y - 17} r="3" fill="#c8562e" />
          </g>
        );
      })}
      {crowns(26, 11, [0, 240, 120, 450], AUTUMN, 22, 42)}
      {crowns(30, 13, [560, 250, 800, 450], AUTUMN, 22, 44)}
      <g fill="#eadcb8" stroke={wood} strokeWidth="2">
        {[600, 660, 720].map((x) => (
          <path key={`tent${x}`} d={`M${x} 205 ${x + 26} 160 ${x + 52} 205z`} />
        ))}
      </g>
      <path
        d="M300 330c40-20 60-40 70-70"
        stroke="#7d6a3a"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="372" cy="250" r="26" fill="#8f7a45" />
    </>
  );
}

function HerringYard() {
  return (
    <>
      <defs>
        <linearGradient id="place-sea" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1f78a8" />
          <stop offset="1" stopColor="#6fb3c8" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="#d8bf8a" />
      <path d="M0 0H330C300 120 250 260 170 450H0z" fill="url(#place-sea)" />
      <path
        d="M330 0C300 120 250 260 170 450"
        stroke="#fbfaf6"
        strokeWidth="6"
        fill="none"
        opacity=".8"
      />
      {[0, 1].map((i) => (
        <g
          key={`boat${i}`}
          transform={`translate(${120 + i * 40} ${250 + i * 80}) rotate(-62)`}
        >
          <path
            d="M0 0h120l-12 22H10z"
            fill={wood}
            stroke={woodDark}
            strokeWidth="2"
          />
          <rect x="18" y="4" width="84" height="12" fill="#c6ccd2" />
        </g>
      ))}
      <rect x="410" y="20" width="360" height="110" fill={material.wall} />
      <path d="M400 30 590 0 780 30v40H400z" fill="#a87d52" />
      <path d="M400 70h380" stroke={woodDark} strokeWidth="3" />
      {Array.from({ length: 18 }, (_, i) => (
        <path
          key={`post${i}`}
          d={`M${420 + i * 20} 130v14`}
          stroke={woodDark}
          strokeWidth="3"
        />
      ))}
      <rect x="410" y="132" width="360" height="12" fill="#c6ccd2" />
      <path
        d="M330 300 760 300"
        stroke="#8a7a5a"
        strokeWidth="2"
        strokeDasharray="6 6"
      />
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={`mat${i}`}
          x={560 + (i % 4) * 52}
          y={230 + Math.floor(i / 4) * 60}
          width="40"
          height="28"
          fill="#8796a0"
          stroke="#c9a46a"
          strokeWidth="3"
        />
      ))}
    </>
  );
}

function Cise() {
  return (
    <>
      <rect width="800" height="450" fill="#cfd8c9" />
      <rect
        x="60"
        y="70"
        width="680"
        height="320"
        rx="6"
        fill={material.roof}
      />
      <rect x="74" y="84" width="140" height="292" fill={material.wall} />
      <rect x="226" y="84" width="500" height="292" fill={material.fiber} />
      <path d="M214 84v292" stroke={woodDark} strokeWidth="10" />
      <rect x="200" y="210" width="30" height="40" fill={material.fiber} />
      <rect x="30" y="200" width="44" height="60" fill="#cfd8c9" />
      <rect x="390" y="190" width="180" height="80" fill={woodDark} />
      <rect x="402" y="202" width="156" height="56" fill="#3b2a22" />
      <path
        d="M430 230c10-14 20-14 30 0s20 14 30 0 20-14 30 0"
        stroke="#e8763a"
        strokeWidth="5"
        fill="none"
      />
      <rect
        x="370"
        y="160"
        width="220"
        height="140"
        fill="none"
        stroke="#3b4a5e"
        strokeWidth="3"
        strokeDasharray="10 7"
      />
      <g fontSize="15" fontWeight="700" fill="#1d2a36">
        <text x="144" y="108" textAnchor="middle">
          Entrance room
        </text>
        <text x="480" y="108" textAnchor="middle">
          Main room
        </text>
        <text x="480" y="322" textAnchor="middle">
          Hearth, with a rack above it (dashed)
        </text>
        <text x="34" y="190">
          Door
        </text>
      </g>
    </>
  );
}

function MineForest({ winter }: { winter: boolean }) {
  return (
    <>
      <rect width="800" height="450" fill={winter ? "#dfe7ee" : "#9fc0d2"} />
      <rect
        x="400"
        y="300"
        width="400"
        height="150"
        fill={winter ? "#f4f7fa" : "#6f9a4e"}
      />
      {crowns(
        14,
        5,
        [420, 170, 790, 300],
        winter ? ["#5b6e66", "#6d7f78"] : ["#3f6b3a", "#4f7f45"],
        22,
        40,
      )}
      {winter && crowns(14, 5, [420, 166, 790, 296], ["#ffffff"], 10, 18)}
      <rect width="400" height="450" fill="#2b2a2c" />
      <path d="M0 0h400v70C300 90 100 90 0 70z" fill="#1a191b" />
      {[60, 200, 340].map((x) => (
        <g key={`prop${x}`} fill="#a8835a">
          <rect x={x - 8} y="70" width="16" height="320" />
          <rect x={x - 50} y="62" width="100" height="16" />
        </g>
      ))}
      <path d="M0 395h400M0 425h400" stroke="#6b6e72" strokeWidth="5" />
      {Array.from({ length: 12 }, (_, i) => (
        <path
          key={`tie${i}`}
          d={`M${10 + i * 34} 390v40`}
          stroke="#5a3f2b"
          strokeWidth="6"
        />
      ))}
      {crowns(
        40,
        3,
        [0, 300, 400, 390],
        ["#151416", "#232224", "#0e0d0f"],
        4,
        10,
      )}
      <path d="M400 0v450" stroke="#1d2a36" strokeWidth="6" />
      <g fontSize="16" fontWeight="700">
        <text x="20" y="40" fill="#e9eef2">
          Coal mine
        </text>
        <text x="780" y="40" fill="#1d2a36" textAnchor="end">
          {`Forest · ${winter ? "winter" : "summer"}`}
        </text>
      </g>
    </>
  );
}

function Hills() {
  return (
    <>
      <defs>
        <linearGradient id="place-hill-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9cfdc" />
          <stop offset="1" stopColor="#e3e7dc" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#place-hill-sky)" />
      <path
        d="M0 130C90 80 180 90 260 115 340 70 440 75 560 120L560 330H0z"
        fill="#8fa06a"
      />
      {crowns(18, 21, [380, 90, 560, 150], ["#5f7a45", "#6d8a4f"], 12, 22)}
      <path
        d="M0 210C120 170 260 180 420 220 500 240 560 260 600 300V340H0z"
        fill="#a3b178"
      />
      <rect y="330" width="800" height="120" fill="#b9bf8a" />
      <path
        d="M640 0C600 90 700 160 660 260 630 330 700 390 690 450H760C770 390 700 330 730 260 770 160 670 90 700 0z"
        fill="#6fa9c2"
      />
      <path
        d="M670 40C650 110 720 170 690 250"
        stroke="#e9f2f6"
        strokeWidth="3"
        fill="none"
        opacity=".7"
      />
      <path
        d="M30 305C110 290 160 270 205 262 260 250 320 215 400 165"
        stroke="#7d6a3a"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
        opacity=".35"
      />
      {[
        [60, 300],
        [110, 290],
        [160, 276],
        [250, 252],
        [300, 226],
        [350, 196],
      ].map(([x, y]) => (
        <g key={`track${x}`} fill="#5a3f2b">
          <ellipse cx={x - 3} cy={y} rx="2" ry="3" />
          <ellipse cx={x + 3} cy={y} rx="2" ry="3" />
        </g>
      ))}
      <path d="M548 410V215" stroke={woodDark} strokeWidth="9" />
      <path
        d="M548 260 510 236M548 230l30-16"
        stroke={woodDark}
        strokeWidth="5"
      />
      {crowns(9, 31, [505, 150, 595, 205], ["#4f7044", "#5f7a45"], 16, 26)}
      {[
        [210, 345],
        [410, 350],
      ].map(([x, y]) => (
        <g key={`house${x}`}>
          <rect x={x} y={y} width="90" height="45" fill={material.wall} />
          <path
            d={`M${x - 10} ${y + 4} ${x + 45} ${y - 32} ${x + 100} ${y + 4}z`}
            fill={material.roof}
          />
          <rect x={x + 52} y={y + 18} width="18" height="27" fill={woodDark} />
        </g>
      ))}
      <g fontSize="15" fontWeight="700" fill={INK}>
        <text x="150" y="160" textAnchor="middle">
          Hills
        </text>
        <text x="780" y="30" textAnchor="end">
          River
        </text>
        <text x="150" y="420" textAnchor="middle">
          Village
        </text>
        <text x="40" y="335">
          Animal path
        </text>
      </g>
    </>
  );
}

export function StageArt({
  stage,
  winter,
}: {
  stage: "survey-camp" | "herring-yard" | "cise" | "mine-forest" | "hills";
  winter: boolean;
}) {
  return (
    <svg
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {stage === "survey-camp" && <SurveyCamp />}
      {stage === "herring-yard" && <HerringYard />}
      {stage === "cise" && <Cise />}
      {stage === "mine-forest" && <MineForest winter={winter} />}
      {stage === "hills" && <Hills />}
    </svg>
  );
}
