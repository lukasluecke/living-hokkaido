// Toon look for existing MeshStandardMaterials, without replacing them:
// two-tone direct light (lit / shade) that keeps shadow maps, a cool shade
// tint, and a two-colour depth fog (near tint, then far sky colour).
// Chains any onBeforeCompile the material already has (season shaders).
import {
  Color,
  type Material,
  MeshStandardMaterial,
  type Object3D,
  Uniform,
} from "three";

export type ToonUniforms = {
  uShade: Uniform<Color>;
  uFogNear: Uniform<Color>;
  uFogMid: Uniform<number>;
  uBand: Uniform<number>;
};

export function createToonUniforms(): ToonUniforms {
  return {
    uShade: new Uniform(new Color("#7f93b3")),
    uFogNear: new Uniform(new Color("#b9c7d8")),
    uFogMid: new Uniform(0.35),
    uBand: new Uniform(0.22),
  };
}

const HEAD = /* glsl */ `
uniform vec3 uShade; uniform vec3 uFogNear; uniform float uFogMid; uniform float uBand;`;

const LIGHT = /* glsl */ `
#include <lights_fragment_end>
#if NUM_DIR_LIGHTS > 0
{
  float ndl = dot(geometryNormal, directionalLights[0].direction);
  float lit = smoothstep(uBand - 0.04, uBand + 0.04, ndl);
  // directDiffuse = colour * irradiance(ndl) * shadow; keep shadow, flatten ndl.
  vec3 flat_ = reflectedLight.directDiffuse / max(ndl, 0.06);
  reflectedLight.directDiffuse = flat_ * lit;
  reflectedLight.directSpecular *= 0.25;
  reflectedLight.indirectDiffuse *= mix(uShade * 1.25, vec3(1.0), lit);
}
#endif`;

const FOG = /* glsl */ `
#ifdef USE_FOG
{
  #ifdef FOG_EXP2
  float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
  float ff = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  vec3 c = mix(gl_FragColor.rgb, uFogNear, smoothstep(0.0, uFogMid, ff) * 0.25);
  gl_FragColor.rgb = mix(c, fogColor, smoothstep(uFogMid, 1.0, ff));
}
#endif`;

const PATCHED = "lhToon";

export function toonify(m: Material, U: ToonUniforms) {
  if (!(m instanceof MeshStandardMaterial) || m.userData[PATCHED]) return;
  m.userData[PATCHED] = true;
  const prev = m.onBeforeCompile.bind(m);
  m.onBeforeCompile = (sh, r) => {
    prev(sh, r);
    Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\n${HEAD}`)
      .replace("#include <lights_fragment_end>", LIGHT)
      .replace("#include <fog_fragment>", FOG);
  };
  const key = m.customProgramCacheKey.bind(m);
  m.customProgramCacheKey = () => `${key()}|toon`;
  m.needsUpdate = true;
}

/** Patch every standard material under `root` (idempotent; call again after mounts). */
export function toonifyTree(root: Object3D, U: ToonUniforms) {
  root.traverse((o) => {
    const mat = (o as Object3D & { material?: Material | Material[] }).material;
    if (!mat) return;
    for (const m of Array.isArray(mat) ? mat : [mat]) toonify(m, U);
  });
}
