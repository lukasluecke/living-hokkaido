// Blue-grey ink outlines from depth edges (Messenger-style look, cheap),
// shared by the island and over-time parts:
// one full-screen pass, no extra geometry. Used inside <EffectComposer>.
import { BlendFunction, Effect, EffectAttribute } from "postprocessing";
import { Color, Uniform } from "three";

const fragment = /* glsl */ `
uniform vec3 ink;
uniform float strength;
uniform float threshold;
float vz(vec2 uv) { return -getViewZ(readDepth(uv)); }
void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  float c = -getViewZ(depth);
  vec2 t = texelSize * 1.2;
  float e = abs(vz(uv + vec2(t.x, 0.0)) - c) + abs(vz(uv - vec2(t.x, 0.0)) - c)
          + abs(vz(uv + vec2(0.0, t.y)) - c) + abs(vz(uv - vec2(0.0, t.y)) - c);
  float edge = smoothstep(threshold, threshold * 2.5, e / max(c, 0.001));
  outputColor = vec4(mix(inputColor.rgb, ink, edge * strength), inputColor.a);
}`;

export class InkEdgesEffect extends Effect {
  constructor({ color = "#3b4a5e", strength = 0.9, threshold = 0.025 } = {}) {
    super("InkEdgesEffect", fragment, {
      attributes: EffectAttribute.DEPTH,
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["ink", new Uniform(new Color(color))],
        ["strength", new Uniform(strength)],
        ["threshold", new Uniform(threshold)],
      ]),
    });
  }
}
