// Bakes a real Hokkaido heightfield from open Terrarium elevation tiles
// (AWS Open Data "Terrain Tiles", Mapzen/Tilezen; sources incl. SRTM, GMTED, ETOPO1).
// Output: public/data/hokkaido-<w>.bin (Int16 metres, row-major, north-up) + .json meta.
// Honshu (touches south edge) and islands touching the east edge are masked out.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { PNG } from "pngjs";

const Z = 8;
const BBOX = { w: 139.25, e: 145.9, s: 41.3, n: 45.6 };
const OUT_W = Number(process.argv[2] ?? 512);
const cache = new URL("../.cache/", import.meta.url);
mkdirSync(cache, { recursive: true });

const lon2x = (lon) => ((lon + 180) / 360) * 2 ** Z * 256;
const lat2y = (lat) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** Z * 256;
};
const x0 = Math.floor(lon2x(BBOX.w)), x1 = Math.ceil(lon2x(BBOX.e));
const y0 = Math.floor(lat2y(BBOX.n)), y1 = Math.ceil(lat2y(BBOX.s));
const W = x1 - x0, H = y1 - y0;
const full = new Float32Array(W * H);

async function tile(tx, ty) {
  const f = new URL(`${Z}-${tx}-${ty}.png`, cache);
  if (!existsSync(f)) {
    const r = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`);
    if (!r.ok) throw new Error(`tile ${tx}/${ty}: ${r.status}`);
    writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  }
  return PNG.sync.read(readFileSync(f));
}
for (let ty = Math.floor(y0 / 256); ty <= Math.floor((y1 - 1) / 256); ty++)
  for (let tx = Math.floor(x0 / 256); tx <= Math.floor((x1 - 1) / 256); tx++) {
    const png = await tile(tx, ty);
    for (let py = 0; py < 256; py++)
      for (let px = 0; px < 256; px++) {
        const gx = tx * 256 + px - x0, gy = ty * 256 + py - y0;
        if (gx < 0 || gy < 0 || gx >= W || gy >= H) continue;
        const i = (py * 256 + px) * 4;
        full[gy * W + gx] = png.data[i] * 256 + png.data[i + 1] + png.data[i + 2] / 256 - 32768;
      }
  }

// Connected land components; drop those touching south/east edges (Honshu, Kunashir).
const comp = new Int32Array(W * H).fill(-1);
const drop = new Set();
let n = 0;
for (let s = 0; s < W * H; s++) {
  if (full[s] <= 0 || comp[s] >= 0) continue;
  const stack = [s];
  comp[s] = n;
  let edge = false;
  while (stack.length) {
    const p = stack.pop(), x = p % W, y = (p / W) | 0;
    if (y === H - 1 || x === W - 1) edge = true;
    for (const q of [p - 1, p + 1, p - W, p + W]) {
      if (q < 0 || q >= W * H || comp[q] >= 0 || full[q] <= 0) continue;
      if (Math.abs((q % W) - x) > 1) continue;
      comp[q] = n;
      stack.push(q);
    }
  }
  if (edge) drop.add(n);
  n++;
}
for (let i = 0; i < W * H; i++) if (comp[i] >= 0 && drop.has(comp[i])) full[i] = -5;

// Box-filter downsample to OUT_W.
const OUT_H = Math.round((OUT_W * H) / W);
const out = new Int16Array(OUT_W * OUT_H);
for (let y = 0; y < OUT_H; y++)
  for (let x = 0; x < OUT_W; x++) {
    const sx0 = Math.floor((x * W) / OUT_W), sx1 = Math.max(sx0 + 1, Math.floor(((x + 1) * W) / OUT_W));
    const sy0 = Math.floor((y * H) / OUT_H), sy1 = Math.max(sy0 + 1, Math.floor(((y + 1) * H) / OUT_H));
    let sum = 0, c = 0;
    for (let yy = sy0; yy < sy1; yy++) for (let xx = sx0; xx < sx1; xx++) { sum += full[yy * W + xx]; c++; }
    out[y * OUT_W + x] = Math.round(Math.max(-3000, Math.min(3000, sum / c)));
  }
let max = 0;
for (const v of out) max = Math.max(max, v);
const name = `hokkaido-${OUT_W}`;
writeFileSync(new URL(`../public/data/${name}.bin`, import.meta.url), Buffer.from(out.buffer));
writeFileSync(
  new URL(`../public/data/${name}.json`, import.meta.url),
  JSON.stringify({ width: OUT_W, height: OUT_H, maxElevation: max, bbox: BBOX, zoom: Z,
    metresPerPixel: (40075016 * Math.cos((43.4 * Math.PI) / 180)) / (2 ** Z * 256) * (W / OUT_W),
    source: "AWS Terrain Tiles (Terrarium), https://registry.opendata.aws/terrain-tiles/" }, null, 2),
);
console.log(name, OUT_W, OUT_H, "max", max, "src", W, H);
