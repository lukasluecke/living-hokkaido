// Generic workers for the scenes' crowds: small figures in plain work
// clothes (jacket, trousers or a wrap, a cloth on the head), about as tall as
// Nuri. They are illustrative background people, not real or named people,
// and the game states no fact about them. Two frames per figure (legs
// together / apart) make a simple walk cycle.
import { canvas } from "./common";
import { ellipse, hex, line, poly, type Ctx } from "./iso";
import type { PaletteKey } from "../style/palette";

export type WorkerDress = {
  top: PaletteKey;
  topShade: PaletteKey;
  lower: PaletteKey;
  /** A cloth tied on the head, or none. */
  headCloth?: PaletteKey;
  /** Something carried on the shoulder. */
  load?: "sack" | "basket";
};

export const WORKER_W = 70;
export const WORKER_H = 156;
/** Feet anchor inside the frame. */
export const WORKER_AX = 35;
export const WORKER_AY = 146;

function drawWorker(ctx: Ctx, d: WorkerDress, stride: number) {
  ellipse(ctx, 0, 0, 16, 5, "coolShadow", 0);
  // Legs: trousers, apart by `stride` px at the feet.
  poly(
    ctx,
    [
      [-12, -52],
      [-2, -52],
      [-3 - stride, 0],
      [-12 - stride, 0],
    ],
    d.lower,
    2,
  );
  poly(
    ctx,
    [
      [2, -52],
      [12, -52],
      [12 + stride, 0],
      [3 + stride, 0],
    ],
    d.lower,
    2,
  );
  ellipse(ctx, -7 - stride, 0, 6, 3, "hair", 0);
  ellipse(ctx, 7 + stride, 0, 6, 3, "hair", 0);
  // Short jacket with a shaded right side and a crossed collar.
  poly(
    ctx,
    [
      [-17, -104],
      [17, -104],
      [18, -46],
      [-18, -46],
    ],
    d.top,
    2,
  );
  poly(
    ctx,
    [
      [6, -103],
      [16, -103],
      [17, -47],
      [6, -47],
    ],
    d.topShade,
    0,
  );
  line(ctx, [-6, -104], [3, -80], "stucco", 2);
  line(ctx, [6, -104], [-1, -82], "stucco", 2);
  // Arms: one swings with the stride, one holds the load.
  const swing = d.load ? 0 : stride * 0.6;
  poly(
    ctx,
    [
      [-23, -100],
      [-16, -102],
      [-16 - swing, -62],
      [-23 - swing, -64],
    ],
    d.top,
    1.5,
  );
  ellipse(ctx, -20 - swing, -60, 4, 4, "skin", 1.2);
  if (d.load) {
    poly(
      ctx,
      [
        [16, -102],
        [23, -100],
        [22, -126],
        [15, -122],
      ],
      d.topShade,
      1.5,
    );
  } else {
    poly(
      ctx,
      [
        [16, -102],
        [23, -100],
        [23 + swing, -64],
        [16 + swing, -62],
      ],
      d.topShade,
      1.5,
    );
    ellipse(ctx, 20 + swing, -60, 4, 4, "skin", 1.2);
  }
  // Head and hair, then the head cloth.
  ellipse(ctx, 0, -117, 12, 13, "skin", 2);
  ctx.beginPath();
  ctx.ellipse(0, -120, 12, 10, 0, Math.PI, 0);
  ctx.fillStyle = hex("hair");
  ctx.fill();
  if (d.headCloth) {
    poly(
      ctx,
      [
        [-13, -126],
        [13, -126],
        [13, -120],
        [-13, -120],
      ],
      d.headCloth,
      1.5,
    );
    line(ctx, [13, -123], [19, -118], d.headCloth, 2);
  }
  // The load sits on the right shoulder, over the head line.
  if (d.load === "sack") {
    ellipse(ctx, 18, -128, 17, 11, "straw", 2);
    line(ctx, [8, -132], [26, -124], "strawShade", 1.5);
  } else if (d.load === "basket") {
    poly(
      ctx,
      [
        [4, -142],
        [32, -142],
        [28, -124],
        [8, -124],
      ],
      "woodLight",
      2,
    );
    line(ctx, [8, -136], [30, -136], "bark", 1.5);
    ellipse(ctx, 18, -143, 13, 3, "herring", 1.2);
  }
}

/** Two walk frames for one worker: [legs together, legs apart]. */
export function workerFrames(
  d: WorkerDress,
): [HTMLCanvasElement, HTMLCanvasElement] {
  const frame = (stride: number) => {
    const [c, ctx] = canvas(WORKER_W, WORKER_H);
    ctx.translate(WORKER_AX, WORKER_AY);
    drawWorker(ctx, d, stride);
    return c;
  };
  return [frame(0), frame(4)];
}
