import Phaser from "phaser";
import { css, PALETTE, type PaletteKey } from "./palette";
import { RES } from "./res";

export const SERIF = 'Georgia, "Hiragino Mincho ProN", serif';
export const OUTLINE = 4;

/** Chunky rounded rect: dark-tinted outline, flat fill, and a darker lower lip (2 tones). */
export function drawChunkyBox(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w: number,
  h: number,
  fill: PaletteKey | number,
  lip: PaletteKey | number,
) {
  const color = (c: PaletteKey | number) =>
    typeof c === "number" ? c : PALETTE[c];
  const x = cx - w / 2;
  const y = cy - h / 2;
  const r = Math.min(14, h / 2);
  g.fillStyle(PALETTE.outline).fillRoundedRect(
    x - OUTLINE,
    y - OUTLINE,
    w + OUTLINE * 2,
    h + OUTLINE * 2,
    r + OUTLINE,
  );
  g.fillStyle(color(lip)).fillRoundedRect(x, y, w, h, r);
  g.fillStyle(color(fill)).fillRoundedRect(
    x,
    y,
    w,
    h - Math.max(6, h * 0.12),
    r,
  );
}

export function makeText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  color: PaletteKey = "cream",
  opts: Phaser.Types.GameObjects.Text.TextStyle = {},
) {
  return scene.add.text(x, y, "", {
    fontFamily: SERIF,
    fontSize: `${size}px`,
    color: css(color),
    stroke: css("outline"),
    strokeThickness: Math.max(4, Math.round(size / 9)),
    resolution: RES,
    ...opts,
  });
}

export interface Button {
  root: Phaser.GameObjects.Container;
  setLabel(label: string): void;
  setSelected(on: boolean): void;
}

/** Chunky wooden button. Dips when pressed; turns warm gold when selected. */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  size = 28,
): Button {
  const root = scene.add.container(x, y);
  const g = scene.add.graphics();
  const text = makeText(scene, 0, -3, size).setOrigin(0.5).setText(label);
  let selected = false;
  const draw = (down: boolean) => {
    g.clear();
    drawChunkyBox(
      g,
      0,
      down ? 3 : 0,
      w,
      h,
      selected ? "sunGlow" : "woodLight",
      selected ? "persimmonDark" : "bark",
    );
    text.setY(down ? 0 : -3);
  };
  draw(false);
  const hit = scene.add
    .zone(0, 0, w + OUTLINE * 2, h + OUTLINE * 2)
    .setInteractive({ useHandCursor: true });
  hit.on("pointerdown", () => draw(true));
  hit.on("pointerout", () => draw(false));
  hit.on("pointerup", () => {
    draw(false);
    onClick();
  });
  root.add([g, text, hit]);
  return {
    root,
    setLabel: (l) => text.setText(l),
    setSelected: (on) => {
      selected = on;
      draw(false);
    },
  };
}

/** One stroke or dot of a panel icon, in the button's local units (about ±16). */
export type IconPart =
  | { line: number[][] }
  | { dot: [number, number, number] }
  | { ring: [number, number, number] };

/** Draws an icon as cream strokes with a dark-tinted outline (like the text). */
export function drawIcon(
  g: Phaser.GameObjects.Graphics,
  parts: IconPart[],
  ox = 0,
  oy = 0,
) {
  for (const [w, color, grow] of [
    [9, PALETTE.outline, 2.5],
    [4, PALETTE.cream, 0],
  ] as const) {
    g.lineStyle(w, color);
    g.fillStyle(color);
    for (const p of parts) {
      if ("line" in p) {
        g.beginPath();
        p.line.forEach(([x, y], i) =>
          i ? g.lineTo(ox + x, oy + y) : g.moveTo(ox + x, oy + y),
        );
        g.strokePath();
      } else if ("dot" in p) {
        const [x, y, r] = p.dot;
        g.fillCircle(ox + x, oy + y, r + grow);
      } else {
        const [x, y, r] = p.ring;
        g.strokeCircle(ox + x, oy + y, r);
      }
    }
  }
}

/** A chunky button with an icon above a short label (the tool panel). */
export function makeIconButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  icon: IconPart[],
  onClick: () => void,
  size = 15,
): Button {
  const root = scene.add.container(x, y);
  const g = scene.add.graphics();
  const ig = scene.add.graphics();
  drawIcon(ig, icon);
  const text = makeText(scene, 0, 0, size).setOrigin(0.5).setText(label);
  const iconY = label ? -h / 2 + 30 : -4;
  let selected = false;
  const draw = (down: boolean) => {
    g.clear();
    drawChunkyBox(
      g,
      0,
      down ? 3 : 0,
      w,
      h,
      selected ? "sunGlow" : "woodLight",
      selected ? "persimmonDark" : "bark",
    );
    const d = down ? 3 : 0;
    ig.setPosition(0, iconY + d);
    text.setY(h / 2 - 20 + d);
  };
  draw(false);
  const hit = scene.add
    .zone(0, 0, w + OUTLINE * 2, h + OUTLINE * 2)
    .setInteractive({ useHandCursor: true });
  hit.on("pointerdown", () => draw(true));
  hit.on("pointerout", () => draw(false));
  hit.on("pointerup", () => {
    draw(false);
    onClick();
  });
  root.add([g, ig, text, hit]);
  return {
    root,
    setLabel: (l) => text.setText(l),
    setSelected: (on) => {
      selected = on;
      draw(false);
    },
  };
}
