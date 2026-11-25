// One shared season clock. Every material reads the same uniform objects, so a
// single number (0 spring, 1 summer, 2 autumn, 3 winter, wraps at 4) drives the
// whole island: ground, trees, water, ice, lavender, particles, sky and sun.
import { Color, Vector4 } from "three";

export const SEASONS = ["Spring", "Summer", "Autumn", "Winter"] as const;
export const SEASON_NOTES = [
  "Cherry blossom · snow on the peaks",
  "Lavender fields · long green days",
  "Red and gold leaves",
  "Deep snow · drift ice · warm windows",
];

export const U = {
  uW: { value: new Vector4(1, 0, 0, 0) }, // season weights, sum = 1
  uSnowLine: { value: 1300 }, // metres
  uTime: { value: 0 },
  uTerrace: { value: 0 },
};

/** plateau easing: each season holds, then blends into the next */
export function weightsFor(s: number, out = new Vector4()) {
  const t = ((s % 4) + 4) % 4;
  const i = Math.floor(t), f = t - i;
  const hold = 0.55;
  const k = f < hold ? 0 : smooth((f - hold) / (1 - hold));
  const w = [0, 0, 0, 0];
  w[i] = 1 - k;
  w[(i + 1) % 4] += k;
  return out.set(w[0], w[1], w[2], w[3]);
}
const smooth = (x: number) => x * x * (3 - 2 * x);

export function mix4(w: Vector4, cols: [string, string, string, string], out = new Color()) {
  const c = cols.map((h) => new Color(h));
  return out.setRGB(
    c[0].r * w.x + c[1].r * w.y + c[2].r * w.z + c[3].r * w.w,
    c[0].g * w.x + c[1].g * w.y + c[2].g * w.z + c[3].g * w.w,
    c[0].b * w.x + c[1].b * w.y + c[2].b * w.z + c[3].b * w.w,
  );
}
export const num4 = (w: Vector4, v: [number, number, number, number]) => v[0] * w.x + v[1] * w.y + v[2] * w.z + v[3] * w.w;

export const SKY: [string, string, string, string] = ["#bcd6e2", "#8fc3e0", "#c9cbb8", "#1f2d46"];
export const SUN: [string, string, string, string] = ["#fff1df", "#fff6e0", "#ffd2a0", "#ffe2c4"];
export const SEA: [string, string, string, string] = ["#2f7f9c", "#1f78a8", "#2f6f82", "#2a4a68"];
export const LAVENDER: [string, string, string, string] = ["#7d9a52", "#8a63c8", "#b08a4a", "#eef3f7"];

// GLSL shared by every season-aware material.
export const GLSL_COMMON = /* glsl */ `
uniform vec4 uW;
uniform float uSnowLine;
uniform float uTime;
uniform float uTerrace;
vec3 sc(vec3 a, vec3 b, vec3 c, vec3 d) { return a * uW.x + b * uW.y + c * uW.z + d * uW.w; }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y);
}
float fbm2(vec2 p) { return vn(p) * 0.55 + vn(p * 2.03) * 0.3 + vn(p * 4.1) * 0.15; }
`;
