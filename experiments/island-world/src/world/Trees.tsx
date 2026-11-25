// Instanced vegetation: two InstancedMeshes (conifer, broadleaf) = 2 draw calls
// for any count. Placement uses real elevation, slope and a forest-density noise.
// Season colour and winter leaf loss happen in the vertex/fragment shader.
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferGeometry, ConeGeometry, CylinderGeometry, Float32BufferAttribute, IcosahedronGeometry,
  InstancedBufferAttribute, type InstancedMesh, MeshStandardMaterial, Object3D,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { type Field, fbm, heightFromElev, rng } from "./field";
import { GLSL_COMMON, U } from "./season";

function tagged(g: BufferGeometry, part: number) {
  const n = g.getAttribute("position").count;
  g.setAttribute("aPart", new Float32BufferAttribute(new Float32Array(n).fill(part), 1));
  return g.index ? g.toNonIndexed() : g;
}
function coniferGeo() {
  const trunk = tagged(new CylinderGeometry(0.025, 0.035, 0.12, 5).translate(0, 0.06, 0), 0);
  const c1 = tagged(new ConeGeometry(0.13, 0.26, 6).translate(0, 0.21, 0), 1);
  const c2 = tagged(new ConeGeometry(0.095, 0.2, 6).translate(0, 0.33, 0), 1);
  return mergeGeometries([trunk, c1, c2]);
}
function broadleafGeo() {
  const trunk = tagged(new CylinderGeometry(0.022, 0.032, 0.16, 5).translate(0, 0.08, 0), 0);
  const crown = tagged(new IcosahedronGeometry(0.13, 0).scale(1, 0.9, 1).translate(0, 0.25, 0), 1);
  return mergeGeometries([trunk, crown]);
}

function treeMaterial(kind: "conifer" | "broad") {
  const m = new MeshStandardMaterial({ roughness: 0.85, flatShading: true });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>\n${GLSL_COMMON}\nattribute float aPart;\nattribute float aRand;\nvarying float vPart;\nvarying float vRand;\nvarying float vUp;`)
      .replace(
        "#include <begin_vertex>",
        /* glsl */ `#include <begin_vertex>
        vPart = aPart; vRand = aRand; vUp = normal.y;
        ${kind === "broad" ? "if (aPart > 0.5) { float bare = uW.w * 0.6; transformed.xz *= 1.0 - bare; transformed.y = mix(transformed.y, 0.2, bare * 0.5); }" : ""}
        // gentle wind sway, stronger at the top
        transformed.x += sin(uTime * 1.3 + aRand * 40.0) * 0.006 * transformed.y * 3.0;`,
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\n${GLSL_COMMON}\nvarying float vPart;\nvarying float vRand;\nvarying float vUp;`)
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        kind === "conifer"
          ? /* glsl */ `
          vec3 leaf = sc(vec3(0.20,0.45,0.30), vec3(0.13,0.38,0.24), vec3(0.16,0.36,0.24), vec3(0.14,0.33,0.26));
          leaf *= 0.85 + 0.3 * vRand;
          float snow = uW.w * smoothstep(0.35, 0.75, vUp) * 0.9;
          vec3 col = mix(vec3(0.42,0.30,0.22), mix(leaf, vec3(0.95,0.97,1.0), snow), vPart);
          vec4 diffuseColor = vec4(col, opacity);`
          : /* glsl */ `
          float r = vRand;
          vec3 spring = r < 0.32 ? vec3(0.98,0.74,0.82) : (r < 0.42 ? vec3(0.99,0.92,0.94) : vec3(0.55,0.76,0.38));
          vec3 summer = vec3(0.25,0.52,0.24) * (0.85 + 0.3 * r);
          vec3 autumn = r < 0.35 ? vec3(0.80,0.22,0.12) : (r < 0.7 ? vec3(0.93,0.52,0.14) : vec3(0.95,0.76,0.22));
          vec3 winter = mix(vec3(0.42,0.34,0.30), vec3(0.95,0.97,1.0), smoothstep(0.4, 0.8, vUp));
          vec3 leaf = sc(spring, summer, autumn, winter);
          vec3 col = mix(vec3(0.42,0.30,0.22), leaf, vPart);
          vec4 diffuseColor = vec4(col, opacity);`,
      );
  };
  m.customProgramCacheKey = () => `tree-${kind}`;
  return m;
}

export type Clearing = { x: number; z: number; r: number };

export function placeTrees(field: Field, count: number, clearings: Clearing[], scale = 1) {
  const R = rng(7);
  const con: number[][] = [], brd: number[][] = [];
  let tries = 0;
  while (con.length + brd.length < count && tries++ < count * 40) {
    const x = (R() - 0.5) * field.size, z = (R() - 0.5) * field.depth;
    const e = field.elevAt(x, z);
    if (e < 12 || e > 1450 + fbm(x, z) * 300) continue;
    const d = 0.12, gx = field.groundY(x + d, z) - field.groundY(x - d, z), gz = field.groundY(x, z + d) - field.groundY(x, z - d);
    if (Math.hypot(gx, gz) / (2 * d) > 1.4) continue; // too steep
    const dens = fbm(x * 0.8 + 3, z * 0.8 - 7);
    if (dens < 0.42 + R() * 0.18) continue; // clearings and meadows
    if (clearings.some((c) => Math.hypot(c.x - x, c.z - z) < c.r)) continue;
    const pConifer = 0.25 + 0.6 * Math.min(1, Math.max(0, (e - 150) / 800));
    const s = (0.75 + R() * 0.6) * scale;
    (R() < pConifer ? con : brd).push([x, heightFromElev(e) - 0.01, z, s, R() * Math.PI * 2, R()]);
  }
  return { con, brd };
}

function Forest({ items, kind }: { items: number[][]; kind: "conifer" | "broad" }) {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = kind === "conifer" ? coniferGeo() : broadleafGeo();
    g.setAttribute("aRand", new InstancedBufferAttribute(new Float32Array(items.map((t) => t[5])), 1));
    return g;
  }, [items, kind]);
  const mat = useMemo(() => treeMaterial(kind), [kind]);
  useLayoutEffect(() => {
    const o = new Object3D();
    items.forEach((t, i) => {
      o.position.set(t[0], t[1], t[2]);
      o.rotation.set(0, t[4], 0);
      o.scale.setScalar(t[3]);
      o.updateMatrix();
      ref.current?.setMatrixAt(i, o.matrix);
    });
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      ref.current.computeBoundingSphere();
    }
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow receiveShadow />;
}

export function Trees({ field, count, clearings, scale = 1 }: { field: Field; count: number; clearings: Clearing[]; scale?: number }) {
  const { con, brd } = useMemo(() => placeTrees(field, count, clearings, scale), [field, count, clearings, scale]);
  return (
    <>
      <Forest key={`c${count}`} items={con} kind="conifer" />
      <Forest key={`b${count}`} items={brd} kind="broad" />
    </>
  );
}
