// Render scale. The game is laid out in a 1280×720 world, but on a big or
// hi-DPI screen a 1280×720 canvas is stretched and text looks blurry. The
// canvas is RES × that size instead; each camera zooms by RES, so layout
// code keeps world units, and text renders at RES too.

/** 1 or 2. Set once by the mount, before the game starts. */
export let RES = 1;

/** 2 when the canvas would show more device pixels than 1.1 × 1280. */
export function pickRes(cssWidth: number, dpr: number): 1 | 2 {
  return cssWidth * dpr > 1408 ? 2 : 1;
}

export function setRes(k: number) {
  RES = k;
}
