// Placeholder art: a Meiji street in Sapporo (around 1889) on a floating
// isometric island. A composite of Sapporo landmarks, not a map: the red-brick
// government office (1888), the clapboard clock tower hall (1878, clock 1881)
// and a wooden shop, with rickshaws and a crowd in mixed Japanese and Western
// dress. Period details follow scenes/sapporo-street.md. No gas lamps (Sapporo's
// first came in 1912), no electric light (1891), no streetcar (1918).
import {
  canvas,
  compositeOf,
  drawIslandBase,
  type IsoFn,
  makeProp,
  type Prop,
  type SceneArt,
  WORLD_H,
  WORLD_W,
} from "./common";
import {
  type Ctx,
  ellipse,
  hex,
  isoBox,
  line,
  makeIso,
  makeUniso,
  type Pt,
  pointInPoly,
  poly,
} from "./iso";
import type { PaletteKey } from "../style/palette";

const IW = 520;
const ID = 360;
const OX = 400;
const OY = 196;
const CLIFF = 70;
const P = makeIso(OX, OY);
const toGround = makeUniso(OX, OY);

// Street layout in iso units (y runs from the back row to the front edge).
const BACK = { y0: 14, y1: 104 };
const SIDEWALK = { y0: 104, y1: 132 };
const ROAD = { y0: 132, y1: 262 };
const FRONT_WALK = { y0: 262, y1: 290 };

function drawGround(ctx: Ctx) {
  drawIslandBase(ctx, P, IW, ID, CLIFF);
  poly(ctx, [P(0, 0), P(IW, 0), P(IW, ID), P(0, ID)], "earth");
  const band = (y0: number, y1: number, fill: PaletteKey) =>
    poly(ctx, [P(0, y0), P(IW, y0), P(IW, y1), P(0, y1)], fill, 2);
  band(SIDEWALK.y0, SIDEWALK.y1, "stoneLight");
  band(ROAD.y0, ROAD.y1, "road");
  band(FRONT_WALK.y0, FRONT_WALK.y1, "stoneLight");
  // Kerb stones and wheel ruts.
  for (let x = 20; x < IW; x += 26) {
    line(ctx, P(x, SIDEWALK.y0), P(x, SIDEWALK.y1), "stuccoShade", 1.5);
    line(ctx, P(x, FRONT_WALK.y0), P(x, FRONT_WALK.y1), "stuccoShade", 1.5);
  }
  for (const y of [170, 182, 214, 226])
    line(ctx, P(6, y), P(IW - 6, y), "roadShade", 2);
  // A mossy lip along the front edges.
  poly(
    ctx,
    [
      P(0, ID - 12),
      P(IW - 12, ID - 12),
      P(IW - 12, 0),
      P(IW, 0),
      P(IW, ID),
      P(0, ID),
    ],
    "moss",
    0,
  );
}

/** Front (+y) face helper: a rectangle on the face y = fy, from x0..x1, z0..z1. */
const face = (
  x0: number,
  x1: number,
  fy: number,
  z0: number,
  z1: number,
): Pt[] => [P(x0, fy, z0), P(x1, fy, z0), P(x1, fy, z1), P(x0, fy, z1)];

function brickBuilding(ctx: Ctx, x0: number, x1: number, h: number) {
  const { y0, y1 } = BACK;
  isoBox(ctx, P, (x0 + x1) / 2, (y0 + y1) / 2, 0, x1 - x0, y1 - y0, h, {
    top: "roadShade",
    left: "brick",
    right: "brickShade",
  });
  // Brick courses on the front.
  for (let z = 10; z < h; z += 10)
    line(ctx, P(x0 + 2, y1, z), P(x1 - 2, y1, z), "brickShade", 1.2);
  // Ground-floor colonnade: stucco columns and dark openings between them.
  const bays = 5;
  const bw = (x1 - x0) / bays;
  for (let i = 0; i < bays; i++) {
    const bx = x0 + i * bw;
    poly(ctx, face(bx + 7, bx + bw - 3, y1, 0, 74), "hair", 2);
    poly(ctx, face(bx, bx + 6, y1, 0, 84), "stucco", 1.5);
  }
  poly(ctx, face(x1 - 4, x1, y1, 0, 84), "stucco", 1.5);
  // Balcony band and rail.
  poly(ctx, face(x0 - 2, x1 + 2, y1 + 8, 84, 94), "stucco", 2);
  for (let x = x0 + 4; x < x1; x += 9)
    line(ctx, P(x, y1 + 8, 94), P(x, y1 + 8, 108), "stuccoShade", 1.5);
  line(ctx, P(x0 - 2, y1 + 8, 108), P(x1 + 2, y1 + 8, 108), "stucco", 3);
  // Upper windows with stucco frames.
  for (let i = 0; i < bays; i++) {
    const wx = x0 + i * bw + bw / 2 - 7;
    poly(ctx, face(wx - 2, wx + 16, y1, 118, 174), "stucco", 1.5);
    poly(ctx, face(wx + 1, wx + 13, y1, 122, 170), "indigoLight", 1.5);
  }
  // Cornice.
  isoBox(ctx, P, (x0 + x1) / 2, y1 - 2, h, x1 - x0 + 6, 8, 6, {
    top: "stucco",
    left: "stucco",
    right: "stuccoShade",
  });
  // Octagonal cupola on the roof (drawn as a drum with a dome).
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  isoBox(ctx, P, cx, cy, h, 34, 34, 30, {
    top: "brickShade",
    left: "brick",
    right: "brickShade",
  });
  for (const z of [h + 10, h + 20])
    line(ctx, P(cx - 17, cy + 17, z), P(cx + 17, cy + 17, z), "stucco", 1.5);
  const [dx, dy] = P(cx, cy, h + 30);
  ctx.beginPath();
  ctx.ellipse(dx, dy, 26, 22, 0, Math.PI, 0);
  ctx.fillStyle = hex("tileLight");
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = hex("outline");
  ctx.stroke();
  line(ctx, [dx, dy - 22], [dx, dy - 34], "outline", 3);
}

/** White clapboard hall with a square clock tower (after the Sapporo Clock Tower). */
function clockHall(ctx: Ctx, x0: number, x1: number, h: number) {
  const { y0, y1 } = BACK;
  const ym = (y0 + y1) / 2;
  isoBox(ctx, P, (x0 + x1) / 2, ym, 0, x1 - x0, y1 - y0, h, {
    top: "roadShade",
    left: "stucco",
    right: "stuccoShade",
  });
  // Clapboard siding: close horizontal lines.
  for (let z = 6; z < h; z += 7)
    line(ctx, P(x0 + 1, y1, z), P(x1 - 1, y1, z), "stuccoShade", 1);
  for (let z = 6; z < h; z += 7)
    line(ctx, P(x1, y0 + 1, z), P(x1, y1 - 1, z), "tuffDark", 1);
  // Tall sash windows on two floors, and a door.
  const bays = 4;
  const bw = (x1 - x0) / bays;
  for (let i = 0; i < bays; i++) {
    const cx = x0 + i * bw + bw / 2;
    for (const [z0, z1] of [
      [14, 74],
      [104, 160],
    ] as const) {
      const door = i === 1 && z0 === 14;
      poly(
        ctx,
        face(cx - 9, cx + 9, y1, door ? 0 : z0, z1),
        door ? "barkDark" : "indigoLight",
        2,
      );
      if (!door)
        line(
          ctx,
          P(cx - 9, y1, (z0 + z1) / 2),
          P(cx + 9, y1, (z0 + z1) / 2),
          "stucco",
          2,
        );
    }
  }
  // Gable roof along the street.
  poly(
    ctx,
    [
      P(x0 - 6, ym, h + 40),
      P(x1 + 6, ym, h + 40),
      P(x1 + 6, y1 + 8, h - 4),
      P(x0 - 6, y1 + 8, h - 4),
    ],
    "persimmonDark",
  );
  poly(ctx, [P(x1, y0, h), P(x1, ym, h + 38), P(x1, y1, h)], "stuccoShade");
  line(ctx, P(x0 - 8, ym, h + 41), P(x1 + 8, ym, h + 41), "outline", 4);
  // Square clock tower rising from the roof, with a clock face and a small spire.
  const tx = x0 + (x1 - x0) * 0.7;
  const ty = ym + 6;
  const top = h + 96;
  isoBox(ctx, P, tx, ty, h + 10, 36, 36, top - h - 10, {
    top: "stucco",
    left: "stucco",
    right: "stuccoShade",
  });
  for (let z = h + 16; z < top; z += 7)
    line(ctx, P(tx - 17, ty + 18, z), P(tx + 17, ty + 18, z), "stuccoShade", 1);
  const [fx, fy] = P(tx, ty + 18, top - 26);
  ellipse(ctx, fx, fy, 13, 13, "cream", 2.5);
  line(ctx, [fx, fy], [fx, fy - 9], "outline", 2);
  line(ctx, [fx, fy], [fx + 6, fy + 2], "outline", 2);
  const [px, py] = P(tx, ty, top);
  poly(
    ctx,
    [
      [px - 30, py],
      [px, py + 15],
      [px + 30, py],
      [px, py - 30],
    ],
    "persimmonDark",
    2.5,
  );
  line(ctx, [px, py - 30], [px, py - 44], "outline", 3);
}

/** Japanese wooden shop (two storeys, tile roof, noren curtain, vertical sign). */
function woodenShop(ctx: Ctx, x0: number, x1: number) {
  const { y0, y1 } = BACK;
  const h = 150;
  isoBox(ctx, P, (x0 + x1) / 2, (y0 + y1) / 2, 0, x1 - x0, y1 - y0, h, {
    top: "tile",
    left: "bark",
    right: "barkDark",
  });
  // Upper lattice window over warm light (as the slope game's machiya).
  poly(ctx, face(x0 + 18, x1 - 18, y1, 100, 136), "windowLit", 2);
  for (let x = x0 + 24; x < x1 - 18; x += 7)
    line(ctx, P(x, y1, 100), P(x, y1, 136), "bark", 1.5);
  // Small pent roof over the shop front.
  poly(
    ctx,
    [
      P(x0 - 4, y1, 90),
      P(x1 + 4, y1, 90),
      P(x1 + 4, y1 + 18, 80),
      P(x0 - 4, y1 + 18, 80),
    ],
    "tileLight",
  );
  line(ctx, P(x0 - 4, y1 + 1, 90), P(x1 + 4, y1 + 1, 90), "snow", 4);
  for (let x = x0; x <= x1; x += 10) {
    const len = 4 + ((x * 5) % 7);
    line(ctx, P(x, y1 + 18, 79), P(x, y1 + 18, 79 - len), "icicle", 2);
  }
  // Lit shop floor behind the curtain.
  poly(ctx, face(x0 + 12, x1 - 12, y1 + 1, 6, 80), "windowLit", 2);
  // Noren: indigo curtain panels with a pale circle crest.
  const panels = 4;
  const pw = (x1 - x0 - 30) / panels;
  for (let i = 0; i < panels; i++) {
    const px = x0 + 15 + i * pw;
    poly(ctx, face(px, px + pw - 2, y1 + 2, 34, 80), "indigo", 1.5);
  }
  const [cx, cy] = P((x0 + x1) / 2, y1 + 2, 58);
  ellipse(ctx, cx, cy, 6, 6, "stucco", 0);
  // Main roof sloping toward the street.
  poly(
    ctx,
    [
      P(x0 - 6, 50, h + 26),
      P(x1 + 6, 50, h + 26),
      P(x1 + 6, y1 + 10, h - 4),
      P(x0 - 6, y1 + 10, h - 4),
    ],
    "tileLight",
  );
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    const y = 50 + (y1 + 10 - 50) * t;
    const z = h + 26 - 30 * t;
    line(ctx, P(x0 - 4, y, z), P(x1 + 4, y, z), "tile", 2);
  }
  line(ctx, P(x0 - 8, 50, h + 27), P(x1 + 8, 50, h + 27), "outline", 5);
  // Snow on the roof edge, icicles under it.
  line(ctx, P(x0 - 6, y1 + 8, h - 2), P(x1 + 6, y1 + 8, h - 2), "snow", 5);
  for (let x = x0 - 2; x <= x1; x += 12) {
    const len = 6 + ((x * 7) % 9);
    line(ctx, P(x, y1 + 10, h - 5), P(x, y1 + 10, h - 5 - len), "icicle", 2.5);
  }
}

/** Wooden shop sign standing on the pavement, with plain generic words. */
function signBoard(ctx: Ctx, x: number, y: number, text: string) {
  isoBox(ctx, P, x, y, 0, 6, 4, 96, {
    top: "woodLight",
    left: "woodLight",
    right: "bark",
  });
  const [sx, sy] = P(x, y + 2, 90);
  ctx.fillStyle = hex("outline");
  ctx.font = "bold 13px 'Hiragino Mincho ProN', serif";
  ctx.textAlign = "center";
  [...text].forEach((ch, i) => ctx.fillText(ch, sx - 1, sy + 4 + i * 15));
}

// ---------------------------------------------------------------- props

const prop = (
  at: [number, number],
  w: number,
  h: number,
  ax: number,
  ay: number,
  footprint: number,
  draw: (ctx: Ctx, Q: IsoFn) => void,
) => makeProp(P, at, w, h, ax, ay, footprint, draw);

/** A small generic pine in the scene's foliage style. */
function pine(at: [number, number], scale = 1): Prop {
  const h = 150 * scale;
  return prop(at, 90, h + 16, 45, h, 10, (ctx) => {
    line(ctx, [0, 0], [0, -30 * scale], "barkDark", 6 * scale);
    const tiers: [number, number, "pineDark" | "pine" | "moss"][] = [
      [-34, 34, "pineDark"],
      [-66, 28, "pine"],
      [-94, 22, "pine"],
      [-118, 15, "moss"],
    ];
    for (const [y, r, c] of tiers) {
      ellipse(ctx, 0, y * scale, r * scale, r * 0.62 * scale, c);
      ellipse(
        ctx,
        -r * 0.3 * scale,
        (y - r * 0.18) * scale,
        r * 0.45 * scale,
        r * 0.24 * scale,
        c === "pineDark" ? "pine" : "leafLight",
        0,
      );
    }
  });
}

function rickshaw(at: [number, number]): Prop {
  return prop(at, 120, 100, 50, 80, 20, (ctx, Q) => {
    // Shafts toward +x, seat box, folding hood, big wheel.
    line(ctx, Q(10, -8, 22), Q(56, -8, 14), "bark", 3);
    line(ctx, Q(10, 8, 22), Q(56, 8, 14), "bark", 3);
    isoBox(ctx, Q, 0, 0, 22, 22, 22, 14, {
      top: "indigoLight",
      left: "wool",
      right: "hair",
    });
    const [hx, hy] = Q(-8, 0, 40);
    ctx.beginPath();
    ctx.ellipse(hx, hy, 16, 18, 0, Math.PI, 0);
    ctx.fillStyle = hex("hair");
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = hex("outline");
    ctx.stroke();
    const [wx, wy] = Q(0, 14, 18);
    ellipse(ctx, wx, wy, 13, 19, "barkDark");
    ellipse(ctx, wx, wy, 9, 14, "road", 1.5);
    ellipse(ctx, wx, wy, 3, 4, "woodLight", 1.5);
  });
}

type Dress = {
  top: PaletteKey;
  topShade: PaletteKey;
  lower: "kimono" | "trousers" | "hakama";
  lowerColor?: PaletteKey;
  sash?: PaletteKey;
  hat?: boolean;
  bun?: boolean;
  parasol?: PaletteKey;
};

/** A generic passer-by in period dress, about as tall as Nuri. */
function person(at: [number, number], d: Dress): Prop {
  return prop(at, 70, 150, 35, 140, 8, (ctx) => {
    ellipse(ctx, 0, 0, 16, 5, "coolShadow", 0);
    const lower = d.lowerColor ?? d.top;
    if (d.lower === "trousers") {
      poly(
        ctx,
        [
          [-12, -52],
          [-2, -52],
          [-3, 0],
          [-12, 0],
        ],
        lower,
        2,
      );
      poly(
        ctx,
        [
          [2, -52],
          [12, -52],
          [12, 0],
          [3, 0],
        ],
        lower,
        2,
      );
    } else if (d.lower === "hakama") {
      poly(
        ctx,
        [
          [-16, -60],
          [16, -60],
          [21, 0],
          [-21, 0],
        ],
        lower,
        2,
      );
      for (const x of [-8, 0, 8])
        line(ctx, [x, -56], [x * 1.3, -2], "outline", 1.2);
    } else {
      poly(
        ctx,
        [
          [-16, -80],
          [16, -80],
          [13, 0],
          [-13, 0],
        ],
        lower,
        2,
      );
      line(ctx, [4, -78], [-2, -2], "outline", 1.2);
    }
    ellipse(ctx, -7, 0, 6, 3, "hair", 0);
    ellipse(ctx, 7, 0, 6, 3, "hair", 0);
    // Torso with a shaded right side.
    poly(
      ctx,
      [
        [-17, -104],
        [17, -104],
        [16, -52],
        [-16, -52],
      ],
      d.top,
      2,
    );
    poly(
      ctx,
      [
        [6, -103],
        [16, -103],
        [15, -53],
        [6, -53],
      ],
      d.topShade,
      0,
    );
    if (d.lower === "trousers") {
      poly(
        ctx,
        [
          [-5, -104],
          [5, -104],
          [0, -86],
        ],
        "stucco",
        1,
      );
    } else {
      line(ctx, [-6, -104], [3, -86], "stucco", 2);
      line(ctx, [6, -104], [-1, -88], "stucco", 2);
    }
    if (d.sash)
      poly(
        ctx,
        [
          [-16, -70],
          [16, -70],
          [16, -60],
          [-16, -60],
        ],
        d.sash,
        1.5,
      );
    // Arms and hands.
    poly(
      ctx,
      [
        [-23, -100],
        [-16, -102],
        [-16, -62],
        [-23, -64],
      ],
      d.top,
      1.5,
    );
    poly(
      ctx,
      [
        [16, -102],
        [23, -100],
        [23, -64],
        [16, -62],
      ],
      d.topShade,
      1.5,
    );
    ellipse(ctx, -20, -60, 4, 4, "skin", 1.2);
    ellipse(ctx, 20, -60, 4, 4, "skin", 1.2);
    // Head, hair, hat.
    ellipse(ctx, 0, -117, 12, 13, "skin", 2);
    ctx.beginPath();
    ctx.ellipse(0, -120, 12, 10, 0, Math.PI, 0);
    ctx.fillStyle = hex("hair");
    ctx.fill();
    if (d.bun) ellipse(ctx, 0, -134, 7, 5, "hair", 1.5);
    if (d.hat) {
      ellipse(ctx, 0, -126, 18, 4, "wool", 1.5);
      ctx.beginPath();
      ctx.ellipse(0, -127, 12, 10, 0, Math.PI, 0);
      ctx.fillStyle = hex("wool");
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = hex("outline");
      ctx.stroke();
    }
    if (d.parasol) {
      line(ctx, [20, -60], [24, -132], "bark", 2);
      ctx.beginPath();
      ctx.ellipse(24, -132, 26, 10, 0, Math.PI, 0);
      ctx.fillStyle = hex(d.parasol);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = hex("outline");
      ctx.stroke();
    }
  });
}

export function buildSapporoStreet(): SceneArt {
  const [background, bg] = canvas(WORLD_W, WORLD_H);
  bg.imageSmoothingEnabled = false;
  drawGround(bg);
  brickBuilding(bg, 14, 186, 200);
  clockHall(bg, 196, 336, 170);
  woodenShop(bg, 346, 506);
  signBoard(bg, 352, 116, "呉服");
  signBoard(bg, 500, 116, "茶");

  const props: Prop[] = [
    pine([30, 300], 0.9),
    pine([500, 300], 0.8),
    rickshaw([150, 196]),
    rickshaw([400, 214]),
    // Rickshaw puller resting by the shafts.
    person([214, 204], {
      top: "indigo",
      topShade: "indigoLight",
      lower: "trousers",
      lowerColor: "wool",
    }),
    // Western suit and bowler hat.
    person([250, 160], {
      top: "wool",
      topShade: "woolLight",
      lower: "trousers",
      hat: true,
    }),
    // Kimono with obi and parasol.
    person([300, 240], {
      top: "plum",
      topShade: "persimmonDark",
      lower: "kimono",
      sash: "sunGlow",
      bun: true,
      parasol: "persimmon",
    }),
    // Kimono, hakama and a bowler hat: a common Meiji mix.
    person([110, 246], {
      top: "tuffDark",
      topShade: "barkDark",
      lower: "hakama",
      lowerColor: "woolLight",
      hat: true,
    }),
    person([470, 248], {
      top: "indigoLight",
      topShade: "indigo",
      lower: "kimono",
      sash: "stuccoShade",
    }),
    person([60, 310], {
      top: "moss",
      topShade: "pine",
      lower: "kimono",
      sash: "persimmon",
      bun: true,
    }),
  ].sort((a, b) => a.depth - b.depth);

  const composite = compositeOf(background, props);

  const islandTop: Pt[] = [
    [12, BACK.y1 + 6],
    [IW - 12, BACK.y1 + 6],
    [IW - 12, ID - 12],
    [12, ID - 12],
  ];
  const walkable = (sx: number, sy: number) => {
    const [x, y] = toGround(sx, sy);
    return pointInPoly(x, y, islandTop);
  };

  const [spx, spy] = P(270, 300);
  return { background, props, composite, spawn: { x: spx, y: spy }, walkable };
}
