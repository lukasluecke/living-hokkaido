// Procedural textures drawn on canvases. No image files.
import type * as T from "three";
import { rng } from "../core/random";
import { css } from "../style/palette";

type Three = typeof T;

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) throw new Error("2D canvas unavailable");
  return [c, g];
}

/** Ice with long skid streaks and patches of packed snow. The streaks run
 *  downhill, so speed reads clearly as they rush past. */
export function iceTexture(THREE: Three): T.CanvasTexture {
  const [c, g] = canvas(256);
  const r = rng(3);
  g.fillStyle = css("ice");
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) {
    g.fillStyle = css("snow", 0.25 + r() * 0.35);
    const x = r() * 256;
    const y = r() * 256;
    g.beginPath();
    g.ellipse(x, y, 6 + r() * 22, 10 + r() * 40, 0, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = css("iceStreak", 0.3 + r() * 0.4);
    g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 20 + r() * 90);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Stone blocks for the warehouses. */
export function stoneTexture(THREE: Three): T.CanvasTexture {
  const [c, g] = canvas(128);
  const r = rng(11);
  g.fillStyle = css("stoneDark");
  g.fillRect(0, 0, 128, 128);
  const rows = 6;
  const h = 128 / rows;
  for (let y = 0; y < rows; y++) {
    const off = (y % 2) * 16;
    for (let x = -32; x < 128; x += 32) {
      const shade = 0.82 + r() * 0.18;
      g.fillStyle = css("stone", shade);
      g.fillRect(x + off + 1, y * h + 1, 30, h - 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Vertical wooden boards for the shopfronts. */
export function woodTexture(THREE: Three): T.CanvasTexture {
  const [c, g] = canvas(128);
  const r = rng(5);
  g.fillStyle = css("woodDark");
  g.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 16) {
    g.fillStyle = css("wood", 0.85 + r() * 0.15);
    g.fillRect(x + 1, 0, 14, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
