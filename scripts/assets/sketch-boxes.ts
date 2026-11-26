// Prints the bounding box (metres) of each code-built sketch, so a generated
// GLB can be scaled to the same size and the hotspots still sit on it.
import * as THREE from "three";
import { builders } from "../../src/parts/artifacts/model/models";

for (const id of process.argv.slice(2)) {
  const b = builders[id as keyof typeof builders];
  if (!b) throw new Error(`no builder ${id}`);
  const box = new THREE.Box3().setFromObject(b());
  const s = box.getSize(new THREE.Vector3());
  console.log(
    JSON.stringify({
      id,
      size: s.toArray().map((v) => +v.toFixed(3)),
      min: box.min.toArray().map((v) => +v.toFixed(3)),
    }),
  );
}
