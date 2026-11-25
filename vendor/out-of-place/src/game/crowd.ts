// The crowd: background workers who walk back and forth so a painted Nuri
// can blend in with people, not only with walls. Pure game dressing: they
// are not hit-tested (tapping one is a normal wrong tap) and they state no
// fact. With reduced motion they stand still at the start of their path.
import Phaser from "phaser";
import type { Walker } from "../art/common";
import type { Pt } from "../art/iso";
import {
  WORKER_AX,
  WORKER_AY,
  WORKER_H,
  WORKER_W,
  workerFrames,
} from "../art/people";

/** Seconds per walk frame. */
const STEP_S = 0.22;

type Mover = {
  img: Phaser.GameObjects.Image;
  keys: [string, string];
  path: Pt[];
  speed: number;
  /** Distance walked along the ping-pong path, in px. */
  s: number;
  length: number;
  t: number;
};

const segLen = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Point at distance `s` along the path walked there and back. */
export function pointAlong(path: Pt[], s: number): { p: Pt; dir: number } {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += segLen(path[i - 1], path[i]);
  if (total === 0 || path.length < 2) return { p: path[0], dir: 1 };
  let d = s % (2 * total);
  const back = d > total;
  if (back) d = 2 * total - d;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const l = segLen(a, b);
    if (d <= l) {
      const k = l ? d / l : 0;
      const dx = b[0] - a[0];
      const dir = (back ? -dx : dx) < 0 ? -1 : 1;
      return { p: [a[0] + dx * k, a[1] + (b[1] - a[1]) * k], dir };
    }
    d -= l;
  }
  return { p: path[path.length - 1], dir: 1 };
}

export class Crowd {
  private movers: Mover[] = [];
  private paused = false;

  constructor(
    scene: Phaser.Scene,
    layer: Phaser.GameObjects.Layer,
    walkers: Walker[],
    private still: boolean,
  ) {
    walkers.forEach((w, i) => {
      const frames = workerFrames(w.dress);
      const keys: [string, string] = [`walker-${i}-a`, `walker-${i}-b`];
      frames.forEach((c, f) => {
        if (scene.textures.exists(keys[f])) scene.textures.remove(keys[f]);
        scene.textures
          .addCanvas(keys[f], c)
          ?.setFilter(Phaser.Textures.FilterMode.NEAREST);
      });
      const img = scene.add
        .image(0, 0, keys[0])
        .setOrigin(WORKER_AX / WORKER_W, WORKER_AY / WORKER_H);
      layer.add(img);
      let length = 0;
      for (let k = 1; k < w.path.length; k++)
        length += segLen(w.path[k - 1], w.path[k]);
      // Spread the starting points so they do not walk in step.
      const m: Mover = {
        img,
        keys,
        path: w.path,
        speed: w.speed,
        s: still ? 0 : (i * 0.37 * 2 * length) % (2 * length || 1),
        length,
        t: 0,
      };
      this.movers.push(m);
      this.place(m);
    });
  }

  /** Freeze (reveal) or walk on (a new round). */
  setPaused(p: boolean) {
    this.paused = p;
  }

  update(dtMs: number) {
    if (this.paused || this.still) return;
    const dt = dtMs / 1000;
    for (const m of this.movers) {
      m.s += m.speed * dt;
      m.t += dt;
      this.place(m);
    }
  }

  private place(m: Mover) {
    const { p, dir } = pointAlong(m.path, m.s);
    const frame = this.still ? 0 : Math.floor(m.t / STEP_S) % 2;
    m.img
      .setTexture(m.keys[frame])
      .setPosition(Math.round(p[0]), Math.round(p[1]))
      .setFlipX(dir < 0)
      .setDepth(p[1]);
  }

  setVisible(v: boolean) {
    for (const m of this.movers) m.img.setVisible(v);
  }
}
