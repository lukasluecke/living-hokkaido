// Ground mesh from the real heightfield. Colour is computed per pixel in the
// shader from elevation, slope, noise and the season uniforms, so the season
// transition costs nothing on the CPU. "terrace" quantises elevation into
// layered-cardboard steps (a physical topo-model look).
import { useMemo } from "react";
import { BufferAttribute, BufferGeometry, MeshStandardMaterial } from "three";
import { type Field, heightFromElev } from "./field";
import { GLSL_COMMON, U } from "./season";

export function useTerrainGeometry(field: Field, terrace: number, step = 1) {
  return useMemo(() => {
    const w = Math.floor((field.w - 1) / step) + 1, h = Math.floor((field.h - 1) / step) + 1;
    const pos = new Float32Array(w * h * 3), el = new Float32Array(w * h);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const e = field.elev[j * step * field.w + i * step];
        const k = j * w + i;
        pos[k * 3] = ((i * step) / (field.w - 1) - 0.5) * field.size;
        pos[k * 3 + 1] = heightFromElev(e, terrace);
        pos[k * 3 + 2] = ((j * step) / (field.h - 1) - 0.5) * field.depth;
        el[k] = terrace > 0 && e > 0 ? Math.ceil(e / terrace) * terrace : e;
      }
    const idx = new Uint32Array((w - 1) * (h - 1) * 6);
    let n = 0;
    for (let j = 0; j < h - 1; j++)
      for (let i = 0; i < w - 1; i++) {
        const a = j * w + i, b = a + 1, c = a + w, d = c + 1;
        idx.set([a, c, b, b, c, d], n);
        n += 6;
      }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aElev", new BufferAttribute(el, 1));
    g.setIndex(new BufferAttribute(idx, 1));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }, [field, terrace, step]);
}

export function makeGroundMaterial(flat = false) {
  const m = new MeshStandardMaterial({ roughness: 0.95, metalness: 0, flatShading: flat });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>\nattribute float aElev;\nvarying float vElev;\nvarying vec3 vWN;\nvarying vec3 vWP;`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\nvElev = aElev; vWN = normal; vWP = position;`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\n${GLSL_COMMON}\nvarying float vElev;\nvarying vec3 vWN;\nvarying vec3 vWP;`)
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        /* glsl */ `
        float e = vElev;
        float slope = 1.0 - normalize(vWN).y;
        float n = fbm2(vWP.xz * 1.7);
        float fine = vn(vWP.xz * 14.0);
        vec3 low  = sc(vec3(0.53,0.70,0.36), vec3(0.36,0.62,0.27), vec3(0.60,0.58,0.36), vec3(0.93,0.95,0.98));
        vec3 mid  = sc(vec3(0.38,0.58,0.32), vec3(0.24,0.48,0.24), vec3(0.47,0.43,0.27), vec3(0.90,0.93,0.97));
        vec3 rock = vec3(0.47,0.43,0.40);
        vec3 col = mix(low, mid, smoothstep(150.0, 650.0, e + (n - 0.5) * 300.0));
        col = mix(col, rock, smoothstep(1250.0, 1700.0, e + (n - 0.5) * 300.0));
        col = mix(col, rock * 0.95, smoothstep(0.42, 0.7, slope) * 0.8);
        col = mix(vec3(0.86,0.79,0.60), col, smoothstep(4.0, 22.0, e));       // beach
        col = mix(col, vec3(0.50,0.36,0.25) * (0.8 + 0.3 * fine), smoothstep(0.55, 0.8, slope) * (1.0 - smoothstep(40.0, 140.0, e))); // coastal cliff earth
        float snow = smoothstep(uSnowLine - 120.0, uSnowLine + 120.0, e + (n - 0.5) * 400.0);
        snow *= 1.0 - smoothstep(0.45, 0.75, slope) * 0.6;
        col = mix(col, vec3(0.95,0.97,1.0), clamp(snow, 0.0, 1.0));
        if (e <= 0.0) col = mix(vec3(0.62,0.70,0.62), vec3(0.15,0.30,0.40), smoothstep(-5.0, -350.0, e)); // sea floor
        if (uTerrace > 0.0 && e > 0.0) col *= 0.95 + 0.07 * mod(floor(e / uTerrace + 0.5), 2.0);
        col *= 0.93 + 0.12 * fine;
        vec4 diffuseColor = vec4(col, opacity);`,
      );
  };
  m.customProgramCacheKey = () => `ground-${flat}`;
  return m;
}

export function Terrain({ field, terrace = 0, flat = false, step = 1 }: { field: Field; terrace?: number; flat?: boolean; step?: number }) {
  const geo = useTerrainGeometry(field, terrace, step);
  const mat = useMemo(() => makeGroundMaterial(flat), [flat]);
  U.uTerrace.value = terrace;
  return <mesh geometry={geo} material={mat} receiveShadow castShadow />;
}
