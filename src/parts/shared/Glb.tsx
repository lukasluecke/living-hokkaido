"use client";
// Real model path: a GLB from public/models, named in the artifact contract
// (model.source = { kind: "glb", url }). Authored in metres, origin on the
// base, +Y up, front to +Z; keep the node names listed in model.nodes.
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { Object3D } from "three";

/** Generated GLBs ship glossy PBR maps: make them matte (no photo-real look). */
function matte(o: Object3D) {
  o.traverse((c) => {
    const m = (c as THREE.Mesh).material as
      | THREE.MeshStandardMaterial
      | undefined;
    if (!m || !(c as THREE.Mesh).isMesh || !m.isMeshStandardMaterial) return;
    const n = m.clone();
    n.roughness = 1;
    n.metalness = 0;
    n.roughnessMap = null;
    n.metalnessMap = null;
    n.normalMap = null;
    (c as THREE.Mesh).material = n;
  });
  return o;
}

/**
 * For the object viewer: toon materials that keep the colour texture, plus a
 * thin ink hull, so a generated GLB matches the code-built objects
 * (docs/STYLE.md: toon + ink outline). Rooms toon the matte material instead.
 */
export function toonify(o: Object3D) {
  const meshes: THREE.Mesh[] = [];
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh && !c.userData.hull)
      meshes.push(c as THREE.Mesh);
  });
  for (const m of meshes) {
    const src = (Array.isArray(m.material) ? m.material[0] : m.material) as
      | THREE.MeshStandardMaterial
      | undefined;
    m.material = new THREE.MeshToonMaterial({
      color: src?.color ?? new THREE.Color("#ffffff"),
      map: src?.map ?? null,
    });
    m.geometry.computeBoundingSphere();
    const r = m.geometry.boundingSphere?.radius ?? 1;
    const ink = new THREE.MeshBasicMaterial({
      color: "#2a1d17",
      side: THREE.BackSide,
    });
    const t = (r * 0.012).toFixed(5);
    ink.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `vec3 transformed = position + normalize(normal) * ${t};`,
      );
    };
    const hull = new THREE.Mesh(m.geometry, ink);
    hull.userData.hull = true;
    hull.raycast = () => {};
    m.add(hull);
  }
  return o;
}

export function useGlbClone(url: string, prepare?: (o: Object3D) => Object3D) {
  const { scene } = useGLTF(url);
  return useMemo(() => {
    const o = matte(scene.clone(true));
    o.traverse((c) => {
      c.castShadow = true;
      c.receiveShadow = true;
    });
    return prepare ? prepare(o) : o;
  }, [scene, prepare]);
}

export function GlbObject({ url }: { url: string }) {
  const o = useGlbClone(url);
  return <primitive object={o} />;
}
