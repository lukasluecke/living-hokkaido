// Board-game style: the island as hexagonal columns (one InstancedMesh, 1 draw call).
// Elevation is quantised per column; colour reuses the ground shader logic via
// an instanced elevation attribute.
import { useLayoutEffect, useMemo, useRef } from "react";
import { CylinderGeometry, InstancedBufferAttribute, type InstancedMesh, MeshStandardMaterial, Object3D } from "three";
import { type Field, heightFromElev } from "./field";
import { GLSL_COMMON, U } from "./season";

export function HexTerrain({ field, radius = 0.22 }: { field: Field; radius?: number }) {
  const ref = useRef<InstancedMesh>(null);
  const cells = useMemo(() => {
    const out: { x: number; z: number; e: number }[] = [];
    const dx = radius * Math.sqrt(3), dz = radius * 1.5;
    for (let r = 0, z = -field.depth / 2; z < field.depth / 2; z += dz, r++)
      for (let x = -field.size / 2 + (r % 2) * dx * 0.5; x < field.size / 2; x += dx) {
        const e = field.elevAt(x, z);
        if (e > 2) out.push({ x, z, e: Math.ceil(e / 150) * 150 });
      }
    return out;
  }, [field, radius]);
  const geo = useMemo(() => {
    const g = new CylinderGeometry(radius * 0.98, radius * 0.98, 1, 6, 1);
    g.translate(0, -0.5, 0); // top at y = 0
    g.setAttribute("aElev", new InstancedBufferAttribute(new Float32Array(cells.map((c) => c.e)), 1));
    return g;
  }, [cells, radius]);
  const mat = useMemo(() => {
    const m = new MeshStandardMaterial({ roughness: 0.9, flatShading: true });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float aElev;\nvarying float vElev;\nvarying float vTop;\nvarying vec3 vWP;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvElev = aElev; vTop = step(0.5, normal.y); vWP = (instanceMatrix * vec4(position,1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", `#include <common>\n${GLSL_COMMON}\nvarying float vElev;\nvarying float vTop;\nvarying vec3 vWP;`)
        .replace(
          "vec4 diffuseColor = vec4( diffuse, opacity );",
          /* glsl */ `
          float e = vElev;
          vec3 low = sc(vec3(0.55,0.72,0.38), vec3(0.38,0.64,0.28), vec3(0.72,0.56,0.28), vec3(0.94,0.96,0.99));
          vec3 mid = sc(vec3(0.36,0.58,0.33), vec3(0.24,0.50,0.25), vec3(0.62,0.38,0.20), vec3(0.90,0.93,0.98));
          vec3 col = mix(low, mid, smoothstep(200.0, 700.0, e));
          col = mix(col, vec3(0.50,0.46,0.42), smoothstep(1200.0, 1600.0, e));
          col = mix(col, vec3(0.96,0.97,1.0), smoothstep(uSnowLine - 100.0, uSnowLine + 100.0, e));
          vec3 side = vec3(0.55,0.40,0.28) * (0.75 + 0.25 * fract(vWP.y * 3.0));
          col = mix(side, col, vTop);
          col *= 0.94 + 0.1 * h21(floor(vWP.xz * 5.0));
          vec4 diffuseColor = vec4(col, opacity);`,
        );
    };
    m.customProgramCacheKey = () => "hex";
    return m;
  }, []);
  useLayoutEffect(() => {
    const o = new Object3D();
    cells.forEach((c, i) => {
      const top = heightFromElev(c.e);
      o.position.set(c.x, top, c.z);
      o.scale.set(1, top + 0.6, 1);
      o.updateMatrix();
      ref.current?.setMatrixAt(i, o.matrix);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [cells]);
  return <instancedMesh ref={ref} args={[geo, mat, cells.length]} castShadow receiveShadow />;
}
