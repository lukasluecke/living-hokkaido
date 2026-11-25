// Procedural, original sketch geometry for the three story objects.
// Not scans or reconstructions. Each mesh carries userData.part so a "look"
// can assign materials per part without touching geometry.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type Part = "cloth" | "band" | "wood" | "thread" | "fiber" | "bark" | "tie";
export type ObjectId = "fiber" | "cloth" | "garment";

function mesh(geo: THREE.BufferGeometry, part: Part, name: string) {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial());
  m.name = name;
  m.userData.part = part;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Tiny deterministic noise so shapes look hand-made, not CAD-perfect. */
function jitter(geo: THREE.BufferGeometry, amount: number, seed = 1) {
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
    const r = (n - Math.floor(n) - 0.5) * amount;
    pos.setXYZ(i, x + r, y + r * 0.6, z - r);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Garment: T-shaped robe silhouette with hem and cuff bands. */
function garment() {
  const g = new THREE.Group();
  g.name = "garment";
  // Body: tapered extruded outline, slightly wider at the hem.
  const s = new THREE.Shape();
  s.moveTo(-0.34, 0.62);
  s.lineTo(-0.42, -0.7);
  s.lineTo(0.42, -0.7);
  s.lineTo(0.34, 0.62);
  s.lineTo(0.08, 0.66);
  s.lineTo(0, 0.5);
  s.lineTo(-0.08, 0.66);
  s.closePath();
  const body = new THREE.ExtrudeGeometry(s, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    bevelSegments: 1,
    curveSegments: 2,
  });
  body.translate(0, 0, -0.06);
  g.add(mesh(jitter(body, 0.012, 2), "cloth", "body"));
  // Sleeves
  for (const side of [-1, 1]) {
    const sl = new THREE.BoxGeometry(0.46, 0.26, 0.13, 3, 1, 1);
    sl.translate(side * 0.55, 0.47, 0);
    g.add(mesh(jitter(sl, 0.012, side + 4), "cloth", `sleeve${side}`));
    const cuff = new THREE.BoxGeometry(0.06, 0.28, 0.15);
    cuff.translate(side * 0.79, 0.47, 0);
    g.add(mesh(cuff, "band", `cuff${side}`));
  }
  // Hem band (plain placeholder band, no motif)
  const hem = new THREE.BoxGeometry(0.88, 0.1, 0.19, 4, 1, 1);
  hem.translate(0, -0.66, 0);
  g.add(mesh(jitter(hem, 0.006, 9), "band", "hem"));
  // Display pole the robe hangs on
  const pole = new THREE.CylinderGeometry(0.022, 0.022, 1.9, 6);
  pole.rotateZ(Math.PI / 2);
  pole.translate(0, 0.6, -0.1);
  g.add(mesh(pole, "wood", "pole"));
  g.position.y = 0.75;
  return g;
}

/** Loom: small frame with warp threads and a shuttle bar. */
function loom() {
  const g = new THREE.Group();
  g.name = "loom";
  const beams: THREE.BufferGeometry[] = [];
  for (const z of [-0.45, 0.45]) {
    const b = new THREE.BoxGeometry(0.9, 0.07, 0.08);
    b.translate(0, 0.05, z);
    beams.push(b);
  }
  for (const x of [-0.42, 0.42]) {
    const r = new THREE.BoxGeometry(0.06, 0.06, 1.0);
    r.translate(x, 0.05, 0);
    beams.push(r);
  }
  g.add(mesh(jitter(mergeGeometries(beams), 0.008, 3), "wood", "frame"));
  const warp: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 14; i++) {
    const t = new THREE.CylinderGeometry(0.006, 0.006, 0.9, 4);
    t.rotateX(Math.PI / 2);
    t.translate(-0.33 + i * 0.05, 0.09, 0);
    warp.push(t);
  }
  g.add(mesh(mergeGeometries(warp), "thread", "warp"));
  // Woven patch near one beam
  const woven = new THREE.BoxGeometry(0.7, 0.02, 0.3, 6, 1, 3);
  woven.translate(0, 0.09, 0.27);
  g.add(mesh(jitter(woven, 0.006, 5), "cloth", "woven"));
  const shuttle = new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6);
  shuttle.rotateZ(Math.PI / 2);
  shuttle.translate(0, 0.13, 0.06);
  g.add(mesh(shuttle, "wood", "shuttle"));
  g.rotation.x = 0.55;
  g.position.y = 0.45;
  return g;
}

/** Fiber bundle: a bark strip and a tied bundle of loose strands. */
function fiber() {
  const g = new THREE.Group();
  g.name = "fiber";
  const strands: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 0.05 + (i % 3) * 0.025;
    const pts = [0, 0.25, 0.5, 0.75, 1].map(
      (t) =>
        new THREE.Vector3(
          Math.cos(a) * r * (1 + 0.8 * Math.abs(t - 0.45)) + Math.sin(t * 5 + i) * 0.02,
          (t - 0.5) * 1.0,
          Math.sin(a) * r * (1 + 0.8 * Math.abs(t - 0.45)),
        ),
    );
    strands.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.011, 4));
  }
  const bundle = mesh(mergeGeometries(strands), "fiber", "strands");
  bundle.rotation.z = Math.PI / 2.4;
  bundle.position.set(0.05, 0.16, 0.05);
  g.add(bundle);
  const tie = new THREE.TorusGeometry(0.085, 0.022, 4, 10);
  const tieM = mesh(tie, "tie", "tie");
  tieM.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 1, 0).applyEuler(bundle.rotation),
  );
  tieM.position.copy(bundle.position);
  g.add(tieM);
  // Curved bark strip
  const bark = new THREE.CylinderGeometry(0.28, 0.28, 0.9, 10, 3, true, 0, Math.PI * 0.55);
  bark.rotateZ(Math.PI / 2);
  bark.translate(0, -0.2, -0.32);
  const barkM = mesh(jitter(bark, 0.02, 7), "bark", "bark");
  (barkM.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  g.add(barkM);
  g.position.y = 0.12;
  return g;
}

export const builders: Record<ObjectId, () => THREE.Group> = { fiber, cloth: loom, garment };

export const OBJECT_IDS: ObjectId[] = ["fiber", "cloth", "garment"];
