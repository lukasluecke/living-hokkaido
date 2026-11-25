// Tiny Canvas2D helpers for drawing the isometric placeholder art in the approved style:
// flat 2–3 tone fills, dark-tinted outlines, light from the top left.
import { PALETTE, type PaletteKey } from "../style/palette";

export type Pt = [number, number];
export type Ctx = CanvasRenderingContext2D;

export const hex = (k: PaletteKey) =>
  "#" + PALETTE[k].toString(16).padStart(6, "0");

/** 2:1 isometric projection relative to an origin. +x runs right-down, +y left-down, +z up. */
export function makeIso(ox: number, oy: number) {
  return (x: number, y: number, z = 0): Pt => [
    ox + (x - y),
    oy + (x + y) / 2 - z,
  ];
}

/** Inverse of makeIso on the ground plane (z = 0). */
export function makeUniso(ox: number, oy: number) {
  return (sx: number, sy: number): Pt => {
    const a = sx - ox;
    const b = 2 * (sy - oy);
    return [(a + b) / 2, (b - a) / 2];
  };
}

/**
 * Hand-drawn look: every outlined shape's corners move by up to this many
 * pixels, the same way every time (a hash of the point), so edges are a
 * little uneven instead of a perfect pixel grid. 0 turns it off.
 */
export const WOBBLE_PX = 2.2;

function jitter(x: number, y: number, k: number): number {
  const h = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453;
  return (h - Math.floor(h) - 0.5) * 2 * WOBBLE_PX;
}

/** A point nudged by the hand-drawn wobble. */
export function wob([x, y]: Pt): Pt {
  return [x + jitter(x, y, 1), y + jitter(x, y, 2)];
}

export function poly(ctx: Ctx, pts: Pt[], fill: PaletteKey, lineW = 3) {
  ctx.beginPath();
  // The nudge depends only on the point, so shapes that share a corner
  // (a face and its shading patch) still meet.
  pts
    .map(wob)
    .forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = hex(fill);
  ctx.fill();
  if (lineW > 0) {
    ctx.lineJoin = "round";
    ctx.lineWidth = lineW;
    ctx.strokeStyle = hex("outline");
    ctx.stroke();
  }
}

export function line(ctx: Ctx, a: Pt, b: Pt, color: PaletteKey, w = 2) {
  const [ax, ay] = wob(a);
  const [bx, by] = wob(b);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  // A slight bow in the middle, so long lines are not ruler-straight.
  const mx = (ax + bx) / 2 + jitter(bx, ay, 3) * 0.8;
  const my = (ay + by) / 2 + jitter(ax, by, 4) * 0.8;
  ctx.quadraticCurveTo(mx, my, bx, by);
  ctx.strokeStyle = hex(color);
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.stroke();
}

export function ellipse(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: PaletteKey,
  lineW = 2.5,
) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = hex(fill);
  ctx.fill();
  if (lineW > 0) {
    ctx.lineWidth = lineW;
    ctx.strokeStyle = hex("outline");
    ctx.stroke();
  }
}

/** Box with visible top, lit left face (+y side) and shaded right face (+x side). */
export function isoBox(
  ctx: Ctx,
  P: (x: number, y: number, z?: number) => Pt,
  cx: number,
  cy: number,
  cz: number,
  w: number,
  d: number,
  h: number,
  colors: { top: PaletteKey; left: PaletteKey; right: PaletteKey },
  lineW = 2.5,
) {
  const x0 = cx - w / 2,
    x1 = cx + w / 2,
    y0 = cy - d / 2,
    y1 = cy + d / 2,
    z0 = cz,
    z1 = cz + h;
  poly(
    ctx,
    [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)],
    colors.left,
    lineW,
  );
  poly(
    ctx,
    [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)],
    colors.right,
    lineW,
  );
  poly(
    ctx,
    [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)],
    colors.top,
    lineW,
  );
}

export function pointInPoly(x: number, y: number, pts: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
