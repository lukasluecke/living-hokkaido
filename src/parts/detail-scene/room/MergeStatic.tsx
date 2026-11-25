import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Merges all static child meshes that share a material into one mesh.
 * A hand-built room is hundreds of small boxes; without this every box is
 * one draw call (and six more per point-light shadow).
 */
export function MergeStatic({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !enabled) return;
    root.updateWorldMatrix(true, true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const originals: THREE.Mesh[] = [];
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || Array.isArray(m.material)) return;
      const g = m.geometry.index
        ? m.geometry.toNonIndexed()
        : m.geometry.clone();
      for (const k of Object.keys(g.attributes))
        if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      const list = buckets.get(m.material) ?? [];
      list.push(g);
      buckets.set(m.material, list);
      originals.push(m);
    });
    const merged: THREE.Mesh[] = [];
    for (const [mat, geos] of buckets) {
      const g = mergeGeometries(geos, false);
      if (!g) continue;
      const mesh = new THREE.Mesh(g, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      merged.push(mesh);
      root.add(mesh);
    }
    for (const m of originals) m.visible = false;
    return () => {
      for (const m of merged) {
        root.remove(m);
        m.geometry.dispose();
      }
      for (const m of originals) m.visible = true;
    };
  }, [enabled]);
  return <group ref={ref}>{children}</group>;
}
