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

/** Vertical reed or grass bundles for the walls. Light straw tones, after
 * the museum photos of the restored house (visual reference only). The pole
 * frame is real geometry (House.tsx), so the texture has no painted ties. */
export function reedTexture(repeat: [number, number]) {
  return canvasTexture(
    256,
    (ctx, s) => {
      const r = rng(7);
      ctx.fillStyle = "#b89a5e";
      ctx.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 3) {
        // Reed stems: pale straw to warm gold, a few darker stems.
        const l = 52 + r() * 18 - (r() < 0.1 ? 14 : 0);
        ctx.fillStyle = `hsl(${36 + r() * 12}, ${38 + r() * 16}%, ${l}%)`;
        ctx.fillRect(x, 0, 2 + r() * 2, s);
        // Stem nodes.
        if (r() < 0.5) {
          ctx.fillStyle = "rgba(90,64,30,0.35)";
          ctx.fillRect(x, r() * s, 3, 2);
        }
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

/** A plain woven floor mat: long straw strands with stitch rows across
 * (plain weave, not a cultural pattern). */
export function matTexture(repeat: [number, number]) {
  return canvasTexture(
    256,
    (ctx, s) => {
      const r = rng(3);
      ctx.fillStyle = "#c2a36a";
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 8) {
        const l = 58 + r() * 8;
        ctx.fillStyle = `hsl(${38 + r() * 6}, ${40 + r() * 8}%, ${l}%)`;
        ctx.fillRect(0, y, s, 7);
      }
      // Stitch rows across the strands.
      for (let x = 16; x < s; x += 64) {
        ctx.fillStyle = "rgba(96,70,36,0.45)";
        ctx.fillRect(x, 0, 4, s);
      }
    },
    repeat,
  );
}

/** Mat for the upper seat. The panel (claim `panel-treasures`) says that
 * mats there have patterns, but not which. So this is plain bands only, on
 * purpose: real mat motifs carry meaning and need a source and a reviewer. */
export function bandMatTexture(repeat: [number, number] = [1, 1]) {
  return canvasTexture(
    256,
    (ctx, s) => {
      const r = rng(31);
      ctx.fillStyle = "#cdb07a";
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 2) {
        ctx.fillStyle = `rgba(120,90,48,${r() * 0.2})`;
        ctx.fillRect(0, y, s, 1);
      }
      const bands: [number, number, string][] = [
        [0.12, 0.1, "#2e2620"],
        [0.27, 0.03, "#7a2c22"],
        [0.44, 0.12, "#2e2620"],
        [0.62, 0.03, "#7a2c22"],
        [0.76, 0.1, "#2e2620"],
      ];
      for (const [y, h, c] of bands) {
        ctx.fillStyle = c;
        ctx.fillRect(0, y * s, s, h * s);
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
      ctx.fillStyle = "#5e4630";
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
