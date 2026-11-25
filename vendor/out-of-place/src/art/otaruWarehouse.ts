// Placeholder art: an Otaru herring warehouse on a floating isometric island (late Meiji).
// Drawn procedurally with Canvas2D so the eyedropper can read real pixels.
// Period details follow content/scenes/otaru-herring-warehouse/facts.md.
import {
  ellipse,
  hex,
  isoBox,
  line,
  makeIso,
  makeUniso,
  pointInPoly,
  poly,
  type Ctx,
  type Pt,
} from "./iso";
import {
  canvas,
  compositeOf,
  makeProp as makePropAt,
  type Prop,
  type SceneArt,
  WORLD_H,
  WORLD_W,
} from "./common";

// Island footprint in iso units, and where its origin sits on screen.
const IW = 500;
const ID = 380;
const OX = 420;
const OY = 165;
const CLIFF = 70;

const P = makeIso(OX, OY);
const toGround = makeUniso(OX, OY);

// Warehouse footprint (iso units). Stone walls on a wooden frame, dark tile gable roof.
const WH = { x0: 30, x1: 300, y0: 30, y1: 140, wall: 110, ridge: 160 };
// Harbor inlet in the island's right corner, with a wooden pier over it.
const WATER = { x0: 400, x1: IW, y0: 0, y1: 150 };
const PIER = { x0: 320, x1: 470, y0: 72, y1: 108 };

function drawIsland(ctx: Ctx) {
  const top: Pt[] = [P(0, 0), P(IW, 0), P(IW, ID), P(0, ID)];
  // Cliff faces: lit left (+y) face, shaded right (+x) face, with strata lines.
  poly(
    ctx,
    [P(0, ID), P(IW, ID), P(IW, ID, -CLIFF), P(0, ID, -CLIFF)],
    "cliff",
  );
  poly(
    ctx,
    [P(IW, 0), P(IW, ID), P(IW, ID, -CLIFF), P(IW, 0, -CLIFF)],
    "cliffDark",
  );
  // Water cross-section where the inlet meets the cliff edge.
  poly(
    ctx,
    [
      P(IW, WATER.y0, -8),
      P(IW, WATER.y1, -8),
      P(IW, WATER.y1, -CLIFF * 0.55),
      P(IW, WATER.y0, -CLIFF * 0.55),
    ],
    "sea",
    2,
  );
  for (const z of [-24, -46]) {
    line(ctx, P(10, ID, z), P(IW - 10, ID, z + 4), "cliffDark", 2);
    line(ctx, P(IW, WATER.y1 + 10, z), P(IW, ID - 10, z - 3), "outline", 2);
  }
  // Ground, then a mossy lip along the back edges.
  poly(ctx, top, "earth");
  poly(
    ctx,
    [P(0, 0), P(IW, 0), P(IW, 14), P(14, 14), P(14, ID), P(0, ID)],
    "moss",
    0,
  );
  for (let i = 0; i < 26; i++) {
    const [x, y] = P(30 + ((i * 97) % 440), 170 + ((i * 53) % 190));
    ellipse(ctx, x, y, 6, 3, "earthShade", 0);
  }
  // Harbor inlet and its wooden pier.
  poly(
    ctx,
    [
      P(WATER.x0, WATER.y0, -4),
      P(WATER.x1, WATER.y0, -4),
      P(WATER.x1, WATER.y1, -4),
      P(WATER.x0 + 30, WATER.y1, -4),
    ],
    "sea",
  );
  for (let i = 0; i < 4; i++)
    line(
      ctx,
      P(420 + i * 18, 20 + i * 30, -4),
      P(450 + i * 18, 22 + i * 30, -4),
      "seaLight",
      3,
    );
  isoBox(
    ctx,
    P,
    (PIER.x0 + PIER.x1) / 2,
    (PIER.y0 + PIER.y1) / 2,
    0,
    PIER.x1 - PIER.x0,
    PIER.y1 - PIER.y0,
    4,
    {
      top: "woodLight",
      left: "bark",
      right: "barkDark",
    },
  );
  for (let x = PIER.x0 + 15; x < PIER.x1; x += 15)
    line(ctx, P(x, PIER.y0, 4), P(x, PIER.y1, 4), "bark", 2);
  for (const x of [PIER.x0 + 100, PIER.x1 - 5])
    isoBox(ctx, P, x, PIER.y1, -30, 8, 8, 40, {
      top: "woodLight",
      left: "bark",
      right: "barkDark",
    });
}

function drawWarehouse(ctx: Ctx) {
  const { x0, x1, y0, y1, wall, ridge } = WH;
  const ym = (y0 + y1) / 2;
  // Back roof plane (mostly hidden), drawn first.
  poly(
    ctx,
    [
      P(x0 - 8, ym, ridge),
      P(x1 + 8, ym, ridge),
      P(x1 + 8, y0 - 8, wall - 5),
      P(x0 - 8, y0 - 8, wall - 5),
    ],
    "tile",
  );
  // Long front wall (+y face, lit): pale tuff stone.
  poly(
    ctx,
    [P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, wall), P(x0, y1, wall)],
    "tuff",
  );
  // Gable end wall (+x face, shaded).
  poly(
    ctx,
    [
      P(x1, y0, 0),
      P(x1, y1, 0),
      P(x1, y1, wall),
      P(x1, ym, ridge - 6),
      P(x1, y0, wall),
    ],
    "tuffShade",
  );
  // Stone block courses on a staggered grid.
  for (let z = 14, row = 0; z < wall; z += 14, row++) {
    line(ctx, P(x0 + 2, y1, z), P(x1 - 2, y1, z), "tuffShade", 1.5);
    line(ctx, P(x1, y0 + 2, z), P(x1, y1 - 2, z), "tuffDark", 1.5);
    for (let x = x0 + (row % 2 ? 14 : 28); x < x1; x += 28)
      line(ctx, P(x, y1, z - 14), P(x, y1, z), "tuffShade", 1.5);
  }
  // Wooden frame posts at the corners (stone on a timber frame).
  for (const x of [x0, x1])
    poly(
      ctx,
      [
        P(x - 4, y1, 0),
        P(x + 4, y1, 0),
        P(x + 4, y1, wall),
        P(x - 4, y1, wall),
      ],
      "bark",
      2,
    );
  // Big double doors, standing open a crack, with an iron-banded frame.
  poly(
    ctx,
    [P(130, y1, 0), P(200, y1, 0), P(200, y1, 78), P(130, y1, 78)],
    "barkDark",
  );
  poly(
    ctx,
    [P(134, y1, 0), P(163, y1, 0), P(163, y1, 74), P(134, y1, 74)],
    "bark",
    2,
  );
  poly(
    ctx,
    [P(167, y1, 0), P(196, y1, 0), P(196, y1, 74), P(167, y1, 74)],
    "bark",
    2,
  );
  for (const z of [20, 52]) line(ctx, P(134, y1, z), P(196, y1, z), "tile", 3);
  // Small barred windows high on the walls.
  for (const x of [60, 250]) {
    poly(
      ctx,
      [P(x, y1, 84), P(x + 22, y1, 84), P(x + 22, y1, 100), P(x, y1, 100)],
      "tile",
      2.5,
    );
    for (let i = 1; i < 4; i++)
      line(
        ctx,
        P(x + i * 5.5, y1, 85),
        P(x + i * 5.5, y1, 99),
        "tuffShade",
        1.5,
      );
  }
  const [gx, gy] = P(x1, ym, wall + 18);
  ellipse(ctx, gx, gy, 9, 9, "tile");
  // A ladder leaning on the front wall.
  line(ctx, P(232, y1 + 18, 0), P(232, y1, 92), "bark", 4);
  line(ctx, P(252, y1 + 18, 0), P(252, y1, 92), "bark", 4);
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    line(
      ctx,
      P(232, y1 + 18 - 18 * t, 92 * t),
      P(252, y1 + 18 - 18 * t, 92 * t),
      "woodLight",
      3,
    );
  }
  // Front roof plane with tile rows, then the ridge.
  poly(
    ctx,
    [
      P(x0 - 8, ym, ridge),
      P(x1 + 8, ym, ridge),
      P(x1 + 8, y1 + 10, wall - 6),
      P(x0 - 8, y1 + 10, wall - 6),
    ],
    "tileLight",
  );
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    const y = ym + (y1 + 10 - ym) * t;
    const z = ridge + (wall - 6 - ridge) * t;
    line(ctx, P(x0 - 6, y, z), P(x1 + 6, y, z), "tile", 2);
  }
  // Gable edge of the roof (bargeboard).
  poly(
    ctx,
    [
      P(x1 + 8, y0 - 8, wall - 5),
      P(x1 + 8, ym, ridge),
      P(x1 + 8, y1 + 10, wall - 6),
      P(x1 + 8, y1 + 10, wall - 12),
      P(x1 + 8, ym, ridge - 7),
      P(x1 + 8, y0 - 8, wall - 11),
    ],
    "tile",
    2.5,
  );
  line(ctx, P(x0 - 10, ym, ridge + 2), P(x1 + 10, ym, ridge + 2), "outline", 6);
  // A pair of shachihoko on the ridge ends (fish ornaments against fire, facts #1).
  for (const [x, flip] of [
    [x0 - 4, -1],
    [x1 + 4, 1],
  ] as const) {
    const [sx, sy] = P(x, ym, ridge + 2);
    poly(
      ctx,
      [
        [sx, sy],
        [sx + 7 * flip, sy - 6],
        [sx + 6 * flip, sy - 16],
        [sx + 12 * flip, sy - 24],
        [sx + 3 * flip, sy - 20],
        [sx - 2 * flip, sy - 10],
      ],
      "sunGlow",
      2,
    );
  }
}

/** A prop anchored on this island (see makeProp in common.ts). */
function makeProp(
  at: [number, number],
  w: number,
  h: number,
  ax: number,
  ay: number,
  footprint: number,
  draw: (ctx: Ctx, Q: (x: number, y: number, z?: number) => Pt) => void,
): Prop {
  return makePropAt(P, at, w, h, ax, ay, footprint, draw);
}

const WOOD = { top: "woodLight", left: "bark", right: "barkDark" } as const;
const STRAW = { top: "straw", left: "straw", right: "strawShade" } as const;

function sackPile(at: [number, number]) {
  return makeProp(at, 130, 110, 65, 85, 22, (ctx, Q) => {
    for (const [x, y, z] of [
      [-14, 8, 0],
      [14, -8, 0],
      [10, 14, 0],
      [0, 0, 22],
    ] as const) {
      isoBox(ctx, Q, x, y, z, 30, 22, 22, STRAW);
      const [tx, ty] = Q(x, y, z + 22);
      line(ctx, [tx - 6, ty], [tx + 6, ty], "strawShade", 2);
    }
  });
}

function crates(at: [number, number]) {
  return makeProp(at, 120, 130, 60, 100, 22, (ctx, Q) => {
    isoBox(ctx, Q, 0, 0, 0, 36, 36, 32, WOOD);
    isoBox(ctx, Q, 26, -6, 0, 24, 24, 24, WOOD);
    isoBox(ctx, Q, 2, -2, 32, 28, 28, 26, WOOD);
    for (const z of [10, 22])
      line(ctx, Q(-18, 18, z), Q(18, 18, z), "barkDark", 1.5);
  });
}

function barrel(at: [number, number]) {
  return makeProp(at, 50, 70, 25, 60, 10, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(-15, -40);
    ctx.lineTo(-15, 0);
    ctx.ellipse(0, 0, 15, 7, 0, Math.PI, 0, true);
    ctx.lineTo(15, -40);
    ctx.closePath();
    ctx.fillStyle = hex("bark");
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = hex("outline");
    ctx.stroke();
    ellipse(ctx, -4, -20, 6, 18, "woodLight", 0);
    for (const y of [-30, -8]) line(ctx, [-15, y], [15, y], "tile", 3);
    ellipse(ctx, 0, -40, 15, 7, "woodLight");
  });
}

function cart(at: [number, number]) {
  return makeProp(at, 170, 110, 80, 85, 24, (ctx, Q) => {
    isoBox(ctx, Q, 0, 0, 22, 60, 36, 6, WOOD);
    line(ctx, Q(30, -10, 26), Q(78, -10, 22), "bark", 4);
    line(ctx, Q(30, 10, 26), Q(78, 10, 22), "bark", 4);
    isoBox(ctx, Q, -6, 0, 28, 30, 26, 18, STRAW);
    const [wx, wy] = Q(0, 20, 18);
    ellipse(ctx, wx, wy, 13, 18, "barkDark");
    ellipse(ctx, wx, wy, 4, 5, "woodLight");
  });
}

function dryingRack(at: [number, number]) {
  return makeProp(at, 170, 130, 85, 110, 16, (ctx, Q) => {
    for (const x of [-50, 50]) line(ctx, Q(x, 0, 0), Q(x, 0, 80), "bark", 5);
    line(ctx, Q(-56, 0, 76), Q(56, 0, 76), "barkDark", 5);
    line(ctx, Q(-50, 0, 48), Q(50, 0, 48), "barkDark", 4);
    for (const z of [76, 48]) {
      for (let x = -42; x <= 42; x += 12) {
        const [hx, hy] = Q(x, 0, z);
        line(ctx, [hx, hy], [hx, hy + 6], "outline", 1.5);
        ellipse(
          ctx,
          hx,
          hy + 14,
          3.5,
          9,
          x % 24 === 0 ? "herring" : "herringDark",
          1.5,
        );
      }
    }
  });
}

function pine(at: [number, number], scale = 1) {
  const h = 190 * scale;
  return makeProp(at, 120, h + 20, 60, h, 14, (ctx) => {
    line(ctx, [0, 0], [0, -40 * scale], "barkDark", 8 * scale);
    const tiers: [number, number, "pineDark" | "pine" | "moss"][] = [
      [-40, 46, "pineDark"],
      [-80, 40, "pine"],
      [-116, 32, "pine"],
      [-148, 22, "moss"],
    ];
    for (const [y, r, c] of tiers) {
      // Rounded foliage clumps, lit from the top left.
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

export function buildOtaruWarehouse(): SceneArt {
  const [background, bg] = canvas(WORLD_W, WORLD_H);
  bg.imageSmoothingEnabled = false;
  drawIsland(bg);
  drawWarehouse(bg);

  const props: Prop[] = [
    pine([18, 210], 1),
    pine([26, 300], 0.8),
    barrel([110, 175]),
    barrel([132, 190]),
    barrel([340, 175]),
    sackPile([210, 235]),
    dryingRack([120, 300]),
    crates([390, 280]),
    cart([270, 330]),
  ].sort((a, b) => a.depth - b.depth);

  const composite = compositeOf(background, props);

  const islandTop: Pt[] = [
    [12, 12],
    [IW - 12, 12],
    [IW - 12, ID - 12],
    [12, ID - 12],
  ];
  const walkable = (sx: number, sy: number) => {
    const [x, y] = toGround(sx, sy);
    if (!pointInPoly(x, y, islandTop)) return false;
    if (x < WH.x1 + 14 && y < WH.y1 + 10) return false; // the warehouse and the strip behind it
    const onPier = x >= PIER.x0 && x <= PIER.x1 && y >= PIER.y0 && y <= PIER.y1;
    const inWater = x >= WATER.x0 && y <= WATER.y1;
    return onPier || !inWater;
  };

  const [sx, sy] = P(300, 250);
  return { background, props, composite, spawn: { x: sx, y: sy }, walkable };
}
