import * as THREE from "three";

// All textures are drawn at runtime: no image files, no third-party art.
// Each one is small and tileable, so the room stays a few kilobytes.

function canvasTexture(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
  repeat: [number, number] = [1, 1],
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas not available");
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A seeded random, so screenshots stay the same between runs.
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Vertical reed or grass bundles for the walls. */
export function reedTexture(repeat: [number, number]) {
  return canvasTexture(
    256,
    (ctx, s) => {
      const r = rng(7);
      ctx.fillStyle = "#8a6a43";
      ctx.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 3) {
        const l = 38 + r() * 22;
        ctx.fillStyle = `hsl(${32 + r() * 10}, ${35 + r() * 15}%, ${l}%)`;
        ctx.fillRect(x, 0, 2 + r() * 2, s);
      }
      // Horizontal ties.
      for (const y of [s * 0.25, s * 0.75]) {
        ctx.fillStyle = "rgba(60,40,22,0.75)";
        ctx.fillRect(0, y, s, 6);
      }
    },
    repeat,
  );
}

/** Layered thatch for the roof. */
export function thatchTexture(repeat: [number, number]) {
  return canvasTexture(
    256,
    (ctx, s) => {
      const r = rng(11);
      ctx.fillStyle = "#7a6544";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 2600; i++) {
        const x = r() * s;
        const y = r() * s;
        const len = 18 + r() * 30;
        ctx.strokeStyle = `hsla(${38 + r() * 12}, ${30 + r() * 20}%, ${40 + r() * 25}%, 0.8)`;
        ctx.lineWidth = 1 + r();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (r() - 0.5) * 4, y + len);
        ctx.stroke();
      }
    },
    repeat,
  );
}

/** A plain woven floor mat (simple over-under grid, not a cultural pattern). */
export function matTexture(repeat: [number, number]) {
  return canvasTexture(
    256,
    (ctx, s) => {
      const r = rng(3);
      const cell = 16;
      for (let y = 0; y < s; y += cell) {
        for (let x = 0; x < s; x += cell) {
          const horizontal = (x / cell + y / cell) % 2 === 0;
          const l = 52 + r() * 10;
          ctx.fillStyle = `hsl(42, 38%, ${l}%)`;
          ctx.fillRect(x, y, cell, cell);
          ctx.strokeStyle = "rgba(90,66,36,0.35)";
          ctx.lineWidth = 1;
          for (let k = 3; k < cell; k += 4) {
            ctx.beginPath();
            if (horizontal) {
              ctx.moveTo(x, y + k);
              ctx.lineTo(x + cell, y + k);
            } else {
              ctx.moveTo(x + k, y);
              ctx.lineTo(x + k, y + cell);
            }
            ctx.stroke();
          }
        }
      }
    },
    repeat,
  );
}

/** Wood grain for posts and furniture. */
export function woodTexture(repeat: [number, number] = [1, 1]) {
  return canvasTexture(
    128,
    (ctx, s) => {
      const r = rng(19);
      ctx.fillStyle = "#6b4a2e";
      ctx.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 2) {
        ctx.fillStyle = `rgba(${40 + r() * 40},${24 + r() * 20},${12},${0.15 + r() * 0.25})`;
        ctx.fillRect(x, 0, 1 + r() * 2, s);
      }
    },
    repeat,
  );
}

/** Plain handwoven cloth: warp and weft noise, one plain border band. */
export function clothTexture() {
  return canvasTexture(256, (ctx, s) => {
    const r = rng(23);
    ctx.fillStyle = "#b39a72";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += 2) {
      ctx.fillStyle = `rgba(80,60,35,${r() * 0.18})`;
      ctx.fillRect(i, 0, 1, s);
      ctx.fillStyle = `rgba(255,240,210,${r() * 0.12})`;
      ctx.fillRect(0, i, s, 1);
    }
    // A plain dark band near the hem. Deliberately no motif: real garment
    // patterns carry meaning and need a source and a reviewer.
    ctx.fillStyle = "#2d3b4a";
    ctx.fillRect(0, s * 0.86, s, s * 0.08);
  });
}
