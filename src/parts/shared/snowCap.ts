// Snow on the top faces of props. One float uniform (0 = no snow, 1 = full
// winter) is shared by every patched material; faces that point up turn
// white, sides stay as they are. Works with vertex colours and plain colours,
// and with the toon patch (call this first; toonify wraps it).
import type { Material } from "three";
import { MeshStandardMaterial } from "three";

export type SnowUniform = { value: number };

const PATCHED = "lhSnow";

export function snowCap(m: Material, uSnow: SnowUniform, amount = 0.9) {
  if (!(m instanceof MeshStandardMaterial) || m.userData[PATCHED]) return m;
  m.userData[PATCHED] = true;
  const prev = m.onBeforeCompile.bind(m);
  m.onBeforeCompile = (sh, r) => {
    prev(sh, r);
    sh.uniforms.uSnow = uSnow;
    sh.vertexShader = sh.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vSnowUp;\nvarying vec2 vSnowXZ;",
      )
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
        vSnowUp = normalize(mat3(modelMatrix) * objectNormal).y;
        vSnowXZ = (modelMatrix * vec4(position, 1.0)).xz;`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uSnow;\nvarying float vSnowUp;\nvarying vec2 vSnowXZ;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float snowN = fract(sin(dot(floor(vSnowXZ * 6.0), vec2(127.1, 311.7))) * 43758.5453);
        float snowK = uSnow * smoothstep(0.45, 0.8, vSnowUp) * (0.8 + 0.2 * snowN);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.94, 0.96, 1.0), snowK * ${amount.toFixed(2)});`,
      );
  };
  const key = m.customProgramCacheKey.bind(m);
  m.customProgramCacheKey = () => `${key()}|snow${amount.toFixed(2)}`;
  m.needsUpdate = true;
  return m;
}
