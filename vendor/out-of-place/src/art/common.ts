// Shared pieces for every procedural scene: the SceneArt shape the game reads,
// canvases, depth-sorted props, the floating-island base and the composite.
import { isoBox, line, makeIso, type Ctx, poly, type Pt } from "./iso";
import type { WorkerDress } from "./people";

export const WORLD_W = 1280;
export const WORLD_H = 720;

export type IsoFn = (x: number, y: number, z?: number) => Pt;

export interface Prop {
  canvas: HTMLCanvasElement;
  /** World position of the prop's ground anchor. */
  x: number;
  y: number;
  originX: number;
  originY: number;
  /** Screen y of the prop's front-most ground point, for depth sorting against Nuri. */
  depth: number;
}

/** A background worker who walks back and forth along a path. */
export interface Walker {
  dress: WorkerDress;
  /** Screen points on walkable ground, walked in order, then back. */
  path: Pt[];
  /** Screen pixels per second. */
  speed: number;
}

export interface SceneArt {
  background: HTMLCanvasElement;
  props: Prop[];
  /** Background with every prop drawn on top: what the eyedropper and blend score read. */
  composite: HTMLCanvasElement;
  spawn: { x: number; y: number };
  /** Can the hider stand here (world/screen coords of the feet)? */
  walkable(x: number, y: number): boolean;
  /** Optional crowd of walking workers to hide among (not in `composite`). */
  walkers?: Walker[];
}

export function canvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d", { willReadFrequently: true }) as Ctx];
}

/**
 * A prop drawn into its own canvas, anchored at its ground point, so Nuri can
 * stand behind it. `P` places the anchor in the scene; `draw` works relative
 * to the anchor with its own iso function `Q`.
 */
export function makeProp(
  P: IsoFn,
  at: [number, number],
  w: number,
  h: number,
  ax: number,
  ay: number,
  footprint: number,
  draw: (ctx: Ctx, Q: IsoFn) => void,
): Prop {
  const [c, ctx] = canvas(w, h);
  ctx.translate(ax, ay);
  draw(ctx, makeIso(0, 0));
  const [x, y] = P(at[0], at[1]);
  return {
    canvas: c,
    x,
    y,
    originX: ax / w,
    originY: ay / h,
    depth: y + footprint,
  };
}

/** Background with every prop drawn on top, in depth order. */
export function compositeOf(
  background: HTMLCanvasElement,
  props: Prop[],
): HTMLCanvasElement {
  const [composite, comp] = canvas(WORLD_W, WORLD_H);
  comp.drawImage(background, 0, 0);
  for (const p of props)
    comp.drawImage(
      p.canvas,
      Math.round(p.x - p.originX * p.canvas.width),
      Math.round(p.y - p.originY * p.canvas.height),
    );
  return composite;
}

/** The floating-island slab: lit left cliff, shaded right cliff, strata lines. */
export function drawIslandBase(
  ctx: Ctx,
  P: IsoFn,
  w: number,
  d: number,
  cliff: number,
) {
  poly(ctx, [P(0, d), P(w, d), P(w, d, -cliff), P(0, d, -cliff)], "cliff");
  poly(ctx, [P(w, 0), P(w, d), P(w, d, -cliff), P(w, 0, -cliff)], "cliffDark");
  for (const z of [-24, -46]) {
    line(ctx, P(10, d, z), P(w - 10, d, z + 4), "cliffDark", 2);
    line(ctx, P(w, 10, z), P(w, d - 10, z - 3), "outline", 2);
  }
}

export { isoBox };
