// Nuri: the original, paintable player character (see "Visual style" in CLAUDE.md).
// Every body part is a frame of one shared canvas texture, so paint stays on the right
// part whatever the pose, and the eyedropper/blend score can read real pixels.
import Phaser from "phaser";
import { hex } from "../art/iso";
import type { Pose, RGB } from "../core/round";
import type { PartSample } from "./giveaway";
import { PALETTE } from "../style/palette";

type PartName = "legL" | "legR" | "body" | "armL" | "armR" | "head";
const DRAW_ORDER: PartName[] = ["legL", "legR", "body", "armL", "armR", "head"];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface PartDef {
  frame: Rect;
  origin: [number, number];
  /** Adds this part's silhouette path (atlas coordinates) to ctx. */
  path(ctx: CanvasRenderingContext2D): void;
}

const paintStyle = (p: number | CanvasPattern) =>
  typeof p === "number" ? "#" + p.toString(16).padStart(6, "0") : p;

const ATLAS_W = 200;
const ATLAS_H = 60;

function capsule(r: Rect, inset = 2) {
  return (ctx: CanvasRenderingContext2D) => {
    const w = r.w - inset * 2;
    ctx.roundRect(r.x + inset, r.y + inset, w, r.h - inset * 2, w / 2);
  };
}

const PARTS: Record<PartName, PartDef> = (() => {
  const head = { x: 0, y: 0, w: 56, h: 56 };
  const body = { x: 58, y: 0, w: 48, h: 58 };
  const armL = { x: 108, y: 0, w: 20, h: 46 };
  const armR = { x: 130, y: 0, w: 20, h: 46 };
  const legL = { x: 152, y: 0, w: 22, h: 42 };
  const legR = { x: 176, y: 0, w: 22, h: 42 };
  return {
    head: {
      frame: head,
      origin: [0.5, 0.92],
      path: (ctx) => ctx.arc(head.x + 28, head.y + 28, 26, 0, Math.PI * 2),
    },
    body: {
      frame: body,
      origin: [0.5, 1],
      path: (ctx) =>
        ctx.roundRect(body.x + 2, body.y + 2, body.w - 4, body.h - 4, 16),
    },
    armL: { frame: armL, origin: [0.5, 0.08], path: capsule(armL, 3) },
    armR: { frame: armR, origin: [0.5, 0.08], path: capsule(armR, 3) },
    legL: { frame: legL, origin: [0.5, 0.05], path: capsule(legL, 3) },
    legR: { frame: legR, origin: [0.5, 0.05], path: capsule(legR, 3) },
  };
})();

interface PartPose {
  x: number;
  y: number;
  rot?: number;
  sy?: number;
}

/** Part layout per pose, relative to the feet. Must stay inside POSE_HITBOX in core/round.ts. */
const POSE_LAYOUT: Record<Pose | "victory", Record<PartName, PartPose>> = {
  /** Survivor only (not a hiding pose): arms up in a V, feet planted. */
  victory: {
    legL: { x: -11, y: -40, rot: 0.22 },
    legR: { x: 11, y: -40, rot: -0.22 },
    body: { x: 0, y: -36 },
    armL: { x: -22, y: -84, rot: 2.55 },
    armR: { x: 22, y: -84, rot: -2.55 },
    head: { x: 0, y: -88 },
  },
  standing: {
    legL: { x: -9, y: -40 },
    legR: { x: 9, y: -40 },
    body: { x: 0, y: -36 },
    armL: { x: -23, y: -86, rot: 0.15 },
    armR: { x: 23, y: -86, rot: -0.15 },
    head: { x: 0, y: -88 },
  },
  crouching: {
    legL: { x: -8, y: -26, rot: 0.95 },
    legR: { x: 8, y: -26, rot: -0.95 },
    body: { x: 0, y: -20, sy: 0.85 },
    armL: { x: -20, y: -62, rot: -0.45 },
    armR: { x: 20, y: -62, rot: 0.45 },
    head: { x: 0, y: -63 },
  },
  leaning: {
    legL: { x: -5, y: -40, rot: -0.12 },
    legR: { x: 7, y: -40, rot: 0.2 },
    body: { x: 3, y: -36, rot: 0.14 },
    armL: { x: -18, y: -84, rot: 0.6 },
    armR: { x: 26, y: -82, rot: -2.55 },
    head: { x: 12, y: -86, rot: 0.1 },
  },
};

export class Nuri {
  readonly container: Phaser.GameObjects.Container;
  private readonly tex: Phaser.Textures.CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly parts = new Map<PartName, Phaser.GameObjects.Image>();
  private readonly undoStack: ImageData[] = [];
  private dirty = false;
  /** Nuri's untouched pixels, to tell how much has actually been painted. */
  private pristine: Uint8ClampedArray | null = null;

  constructor(scene: Phaser.Scene, key = "nuri-paint") {
    // Textures outlive a scene restart: start from a fresh paint canvas.
    if (scene.textures.exists(key)) scene.textures.remove(key);
    this.tex = scene.textures.createCanvas(key, ATLAS_W, ATLAS_H)!;
    this.tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.ctx = this.tex.getContext();
    for (const name of DRAW_ORDER)
      this.tex.add(
        name,
        0,
        PARTS[name].frame.x,
        PARTS[name].frame.y,
        PARTS[name].frame.w,
        PARTS[name].frame.h,
      );

    this.container = scene.add.container(0, 0);
    const shadow = scene.add.ellipse(0, 0, 58, 16, PALETTE.coolShadow, 0.45);
    this.container.add(shadow);
    for (const name of DRAW_ORDER) {
      const img = scene.add
        .image(0, 0, key, name)
        .setOrigin(...PARTS[name].origin);
      this.parts.set(name, img);
      this.container.add(img);
    }
    this.reset();
    this.setPose("standing");
  }

  /** Back to bare clay, with an empty undo history. */
  reset() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, ATLAS_W, ATLAS_H);
    for (const name of DRAW_ORDER) {
      const { frame: f, path } = PARTS[name];
      ctx.save();
      ctx.beginPath();
      path(ctx);
      ctx.clip();
      // Two-tone clay: lit on the left, shaded on the right and at the mitten/foot ends.
      ctx.fillStyle = hex("clay");
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.fillStyle = hex("clayShade");
      ctx.fillRect(f.x + f.w * 0.62, f.y, f.w, f.h);
      if (name.startsWith("arm") || name.startsWith("leg"))
        ctx.fillRect(f.x, f.y + f.h - 12, f.w, 12);
      ctx.restore();
    }
    this.drawLines();
    this.undoStack.length = 0;
    this.pristine = ctx.getImageData(0, 0, ATLAS_W, ATLAS_H).data;
    this.tex.refresh();
  }

  /**
   * Outline (inside each silhouette, so the brush can cover it completely) and
   * the face: dot eyes and a tiny smile.
   */
  private drawLines() {
    const ctx = this.ctx;
    for (const name of DRAW_ORDER) {
      const { path } = PARTS[name];
      ctx.save();
      ctx.beginPath();
      path(ctx);
      ctx.clip();
      ctx.lineWidth = 6;
      ctx.strokeStyle = hex("outline");
      ctx.beginPath();
      path(ctx);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = hex("nuriFace");
    ctx.beginPath();
    ctx.arc(20, 27, 3.2, 0, Math.PI * 2);
    ctx.arc(36, 27, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = hex("nuriFace");
    ctx.beginPath();
    ctx.arc(28, 33, 5, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }

  /** A hiding pose, or the survivor's "Master of Disguise" victory pose. */
  setPose(pose: Pose | "victory") {
    for (const name of DRAW_ORDER) {
      const p = POSE_LAYOUT[pose][name];
      this.parts
        .get(name)!
        .setPosition(p.x, p.y)
        .setRotation(p.rot ?? 0)
        .setScale(1, p.sy ?? 1);
    }
  }

  setFeet(x: number, y: number) {
    this.container.setPosition(x, y).setDepth(y);
  }

  beginStroke() {
    this.undoStack.push(this.ctx.getImageData(0, 0, ATLAS_W, ATLAS_H));
    if (this.undoStack.length > 30) this.undoStack.shift();
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  undo() {
    const snap = this.undoStack.pop();
    if (!snap) return;
    this.ctx.putImageData(snap, 0, 0);
    this.tex.refresh();
  }

  /**
   * A texture swatch from the scene as paint: a small patch, tiled. Paint
   * with it to copy a pattern (stone blocks, planks), not only a colour.
   */
  pattern(patch: HTMLCanvasElement): CanvasPattern | null {
    return this.ctx.createPattern(patch, "repeat");
  }

  /** Paint a round dab at a world point. Paint is clipped to each part's silhouette. */
  dab(wx: number, wy: number, radius: number, paint: number | CanvasPattern) {
    const ctx = this.ctx;
    ctx.fillStyle = paintStyle(paint);
    for (const name of DRAW_ORDER) {
      const img = this.parts.get(name)!;
      const { frame: f, path } = PARTS[name];
      const local = img.getLocalPoint(wx, wy);
      if (
        local.x < -radius ||
        local.y < -radius ||
        local.x > f.w + radius ||
        local.y > f.h + radius
      )
        continue;
      ctx.save();
      ctx.beginPath();
      path(ctx);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(f.x + local.x, f.y + local.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    this.dirty = true;
  }

  /**
   * Paint every part in one colour (undoable): the keyboard and quick-paint
   * path. The outline and face stay, so a perfect hide still takes brushwork.
   */
  fill(paint: number | CanvasPattern) {
    this.beginStroke();
    const ctx = this.ctx;
    ctx.fillStyle = paintStyle(paint);
    for (const name of DRAW_ORDER) {
      const { frame: f, path } = PARTS[name];
      ctx.save();
      ctx.beginPath();
      path(ctx);
      ctx.clip();
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.restore();
    }
    this.drawLines();
    this.dirty = true;
  }

  /** Upload paint changes to the GPU (call once per frame at most). */
  flush() {
    if (!this.dirty) return;
    this.dirty = false;
    this.tex.refresh();
  }

  /**
   * Matched samples of each body part's visible pixels and the scene behind
   * them (for the blend score and "what gave you away"), plus how much of each
   * part is still unpainted.
   */
  sampleParts(scene: CanvasRenderingContext2D, step = 2): PartSample[] {
    const atlas = this.ctx.getImageData(0, 0, ATLAS_W, ATLAS_H).data;
    const { width: sw, height: sh } = scene.canvas;
    const bg = scene.getImageData(0, 0, sw, sh).data;
    const pristine = this.pristine;
    const pt = new Phaser.Math.Vector2();
    const out: PartSample[] = [];
    for (const name of DRAW_ORDER) {
      const img = this.parts.get(name)!;
      const m = img.getWorldTransformMatrix();
      const f = PARTS[name].frame;
      const sample: PartSample = {
        part: name,
        hider: [],
        background: [],
        bare: 1,
      };
      let bare = 0;
      for (let ly = 0; ly < f.h; ly += step) {
        for (let lx = 0; lx < f.w; lx += step) {
          const i = ((f.y + ly) * ATLAS_W + f.x + lx) * 4;
          if (atlas[i + 3] < 128) continue;
          m.transformPoint(
            lx - img.displayOriginX,
            ly - img.displayOriginY,
            pt,
          );
          const bx = Math.round(pt.x);
          const by = Math.round(pt.y);
          if (bx < 0 || by < 0 || bx >= sw || by >= sh) continue;
          const j = (by * sw + bx) * 4;
          const px: RGB = [atlas[i], atlas[i + 1], atlas[i + 2]];
          sample.hider.push(px);
          sample.background.push([bg[j], bg[j + 1], bg[j + 2]]);
          if (
            pristine &&
            Math.abs(px[0] - pristine[i]) +
              Math.abs(px[1] - pristine[i + 1]) +
              Math.abs(px[2] - pristine[i + 2]) <
              8
          ) {
            bare++;
          }
        }
      }
      sample.bare = sample.hider.length ? bare / sample.hider.length : 1;
      out.push(sample);
    }
    return out;
  }
}
