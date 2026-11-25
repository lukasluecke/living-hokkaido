// Collects static geometry by material and merges it, so the whole street
// draws in about a dozen calls (important on phones).
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export class Merger<K extends string> {
  private parts = new Map<K, THREE.BufferGeometry[]>();

  /** Add a geometry, transformed by `matrix`, to the batch for `key`. */
  add(key: K, geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) {
    // Same attributes everywhere so batches merge: position, normal, uv.
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    if (!g.getAttribute("uv")) {
      const n = g.getAttribute("position").count;
      g.setAttribute(
        "uv",
        new THREE.BufferAttribute(new Float32Array(n * 2), 2),
      );
    }
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    for (const name of Object.keys(g.attributes))
      if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
    g.applyMatrix4(matrix);
    const list = this.parts.get(key) ?? [];
    list.push(g);
    this.parts.set(key, list);
    geometry.dispose();
  }

  /** One mesh per material key. */
  build(
    materials: Record<K, THREE.Material>,
    shadows: Partial<Record<K, { cast?: boolean; receive?: boolean }>> = {},
  ): THREE.Group {
    const group = new THREE.Group();
    for (const [key, list] of this.parts) {
      const merged = mergeGeometries(list, false);
      for (const g of list) g.dispose();
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, materials[key]);
      mesh.castShadow = shadows[key]?.cast ?? false;
      mesh.receiveShadow = shadows[key]?.receive ?? false;
      mesh.name = key;
      group.add(mesh);
    }
    this.parts.clear();
    return group;
  }
}

/** Matrix from position, quaternion (x, y, z, w) and optional scale. */
export function placed(
  pos: readonly [number, number, number],
  quat: readonly [number, number, number, number],
  scale: readonly [number, number, number] = [1, 1, 1],
): THREE.Matrix4 {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion(...quat),
    new THREE.Vector3(...scale),
  );
}

/** Local offset/rotation inside a parent matrix. */
export function local(
  parent: THREE.Matrix4,
  x: number,
  y: number,
  z: number,
  rot: THREE.Euler = new THREE.Euler(),
  scale: readonly [number, number, number] = [1, 1, 1],
): THREE.Matrix4 {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(rot),
    new THREE.Vector3(...scale),
  );
  return parent.clone().multiply(m);
}
