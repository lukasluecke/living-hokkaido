// Procedural sketch objects for the island's themed areas (coast, forest,
// hills, mountains). Original, illustrative geometry (MIT), drawn after the
// Hokkaido Museum panels and dioramas that the claims cite (knowledge
// "land-and-sea"). Not scans or reconstructions.
//
// Shared by the artifacts viewer (which re-materials meshes by
// userData.part) and the detail-scene room (which keeps the colours set
// here). Artifact space: metres, origin at the base centre, front +Z.
import * as THREE from "three";

export type AreaPart = "fish" | "coal" | "metal" | "canvas" | "fur" | "float";
export type AreaObjectId =
  | "herring"
  | "coal"
  | "survey-stake"
  | "set-bow"
  | "net"
  | "saw"
  | "deer"
  | "shovel";

/** Colours for the parts this file adds (the viewer's toon look uses them). */
export const AREA_PALETTE: Record<AreaPart, string> = {
  fish: "#c9d6de",
  coal: "#2c2d33",
  metal: "#6f7378",
  canvas: "#efe4c8",
  fur: "#b07a45",
  float: "#d8c49a",
};
/** Colours of parts that already exist in the viewer palette. */
const BASE: Record<string, string> = {
  wood: "#8a5a35",
  bark: "#6e4b32",
  tie: "#9c4f2e",
  fiber: "#d9bb86",
  thread: "#eadcb8",
};

function mesh(geo: THREE.BufferGeometry, part: string, name: string) {
  const color =
    (AREA_PALETTE as Record<string, string>)[part] ?? BASE[part] ?? "#999";
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      flatShading: true,
    }),
  );
  m.name = name;
  m.userData.part = part;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** A shallow basket of herring (sea-bounty, sea-products). About 0.5 m. */
function herring() {
  const g = new THREE.Group();
  g.name = "herring";
  const basket = new THREE.CylinderGeometry(0.27, 0.22, 0.14, 12, 1, true);
  basket.translate(0, 0.07, 0);
  const b = mesh(basket, "fiber", "basket");
  (b.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  g.add(b);
  const floor = new THREE.CircleGeometry(0.22, 12).rotateX(-Math.PI / 2);
  g.add(mesh(floor.translate(0, 0.01, 0), "fiber", "basket-floor"));
  g.add(
    mesh(
      new THREE.TorusGeometry(0.27, 0.015, 5, 16)
        .rotateX(Math.PI / 2)
        .translate(0, 0.14, 0),
      "bark",
      "rim",
    ),
  );
  // Fish: a stretched body with a tail, laid in two layers.
  for (let i = 0; i < 9; i++) {
    const fish = new THREE.Group();
    const body = new THREE.SphereGeometry(0.035, 8, 5).scale(3.4, 0.7, 1);
    const tail = new THREE.ConeGeometry(0.03, 0.05, 4)
      .rotateZ(Math.PI / 2)
      .translate(0.135, 0, 0);
    fish.add(mesh(body, "fish", `fish-${i}`));
    fish.add(mesh(tail, "fish", `tail-${i}`));
    const layer = i < 5 ? 0 : 1;
    const a = (i % 5) * 1.25 + layer * 0.6;
    fish.position.set(
      Math.cos(a) * 0.09 * (layer ? 0.6 : 1),
      0.06 + layer * 0.035,
      Math.sin(a) * 0.09 * (layer ? 0.6 : 1),
    );
    fish.rotation.y = a + Math.PI / 2;
    g.add(fish);
  }
  return g;
}

/** A lump of coal (coal-deposits, coal-producer). About 0.25 m. */
function coal() {
  const g = new THREE.Group();
  g.name = "coal";
  const lump = new THREE.DodecahedronGeometry(0.12, 0);
  const pos = lump.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const k = 0.8 + 0.4 * Math.abs(Math.sin(i * 12.9898) % 1);
    pos.setXYZ(
      i,
      pos.getX(i) * k * 1.2,
      pos.getY(i) * k * 0.8,
      pos.getZ(i) * k,
    );
  }
  lump.computeVertexNormals();
  g.add(mesh(lump.translate(0, 0.09, 0), "coal", "lump"));
  g.add(
    mesh(
      new THREE.DodecahedronGeometry(0.05, 0).translate(0.15, 0.04, 0.05),
      "coal",
      "chip",
    ),
  );
  return g;
}

/** A survey stake with a tag, as on the cut line (survey-1890). About 0.9 m. */
function surveyStake() {
  const g = new THREE.Group();
  g.name = "survey-stake";
  const post = new THREE.BoxGeometry(0.06, 0.85, 0.06).translate(0, 0.425, 0);
  g.add(mesh(post, "wood", "post"));
  const tip = new THREE.ConeGeometry(0.045, 0.1, 4)
    .rotateX(Math.PI)
    .translate(0, -0.03, 0);
  g.add(mesh(tip, "wood", "tip"));
  const tag = new THREE.BoxGeometry(0.16, 0.06, 0.008).translate(
    0.08,
    0.78,
    0.032,
  );
  g.add(mesh(tag, "canvas", "tag"));
  const cord = new THREE.BoxGeometry(0.012, 0.012, 0.4).translate(
    0,
    0.12,
    -0.2,
  );
  g.add(mesh(cord, "thread", "line"));
  const ground = new THREE.CylinderGeometry(0.16, 0.18, 0.03, 10).translate(
    0,
    0.015,
    0,
  );
  g.add(mesh(ground, "bark", "mound"));
  return g;
}

/** A set bow beside an animal path, as in the panel diagram (set-bow).
 * About 1.1 m wide. No poison is shown. */
function setBow() {
  const g = new THREE.Group();
  g.name = "set-bow";
  // Two stakes hold the bow low above the path.
  for (const x of [-0.42, 0.2]) {
    g.add(
      mesh(
        new THREE.BoxGeometry(0.04, 0.32, 0.04).translate(x, 0.16, 0),
        "wood",
        "stake",
      ),
    );
  }
  // The bow: a bent limb, with its string.
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.1, 0.22, -0.32),
    new THREE.Vector3(0.12, 0.22, 0),
    new THREE.Vector3(-0.1, 0.22, 0.32),
  );
  g.add(mesh(new THREE.TubeGeometry(curve, 12, 0.016, 5), "bark", "bow"));
  g.add(
    mesh(
      new THREE.BoxGeometry(0.006, 0.006, 0.62).translate(-0.12, 0.22, 0),
      "thread",
      "bowstring",
    ),
  );
  // The arrow, resting on the stakes, pointing at the path.
  g.add(
    mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.7, 5)
        .rotateZ(Math.PI / 2)
        .translate(0.16, 0.24, 0),
      "wood",
      "arrow",
    ),
  );
  g.add(
    mesh(
      new THREE.ConeGeometry(0.02, 0.06, 4)
        .rotateZ(-Math.PI / 2)
        .translate(0.53, 0.24, 0),
      "metal",
      "arrow-tip",
    ),
  );
  // The trip cord across the path.
  g.add(
    mesh(
      new THREE.BoxGeometry(0.005, 0.005, 0.9).translate(0.62, 0.1, 0),
      "thread",
      "trip-cord",
    ),
  );
  for (const z of [-0.45, 0.45])
    g.add(
      mesh(
        new THREE.BoxGeometry(0.03, 0.14, 0.03).translate(0.62, 0.07, z),
        "wood",
        "cord-peg",
      ),
    );
  // The animal path.
  g.add(
    mesh(
      new THREE.BoxGeometry(0.4, 0.01, 1.1).translate(0.7, 0.005, 0),
      "bark",
      "path",
    ),
  );
  return g;
}

/** A heap of fishing net with floats (sea-nets). About 0.6 m. */
function net() {
  const g = new THREE.Group();
  g.name = "net";
  // The heap: flattened lumps of mesh, in three layers.
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9;
    const r = i === 0 ? 0 : 0.12 + (i % 2) * 0.05;
    const lump = new THREE.IcosahedronGeometry(0.13 - (i % 3) * 0.015, 1)
      .scale(1.3, 0.45, 1)
      .translate(Math.cos(a) * r, 0.05 + (i === 0 ? 0.06 : 0), Math.sin(a) * r);
    g.add(mesh(lump, "thread", i === 0 ? "net" : `net-${i}`));
  }
  // The float line, laid over the heap, with wooden floats.
  const curve = new THREE.CatmullRomCurve3(
    [
      [-0.3, 0.02, 0.12],
      [-0.12, 0.11, 0.05],
      [0.05, 0.14, -0.04],
      [0.2, 0.1, 0.06],
      [0.32, 0.02, 0.18],
    ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  );
  g.add(mesh(new THREE.TubeGeometry(curve, 16, 0.008, 4), "tie", "rope"));
  for (const t of [0.08, 0.32, 0.56, 0.8]) {
    const p = curve.getPoint(t);
    const f = new THREE.CylinderGeometry(0.035, 0.035, 0.05, 8)
      .rotateZ(Math.PI / 2)
      .translate(p.x, p.y + 0.02, p.z);
    g.add(mesh(f, "float", "float"));
  }
  return g;
}

/** A two-person crosscut saw on a log (winter-logging, survey-tasks).
 * About 1.2 m long. */
function saw() {
  const g = new THREE.Group();
  g.name = "saw";
  const log = new THREE.CylinderGeometry(0.11, 0.12, 1.1, 10)
    .rotateZ(Math.PI / 2)
    .translate(0, 0.12, 0);
  g.add(mesh(log, "bark", "log"));
  const end = new THREE.CircleGeometry(0.11, 10)
    .rotateY(Math.PI / 2)
    .translate(0.551, 0.12, 0);
  g.add(mesh(end, "fiber", "cut"));
  // The blade: a long thin plate, deeper in the middle, resting on the log.
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.quadraticCurveTo(0, -0.12, 0.5, 0);
  shape.lineTo(0.5, 0.03);
  shape.lineTo(-0.5, 0.03);
  shape.closePath();
  const blade = new THREE.ExtrudeGeometry(shape, {
    depth: 0.004,
    bevelEnabled: false,
  }).translate(0, 0.36, 0.13);
  g.add(mesh(blade, "metal", "blade"));
  // Teeth along the lower edge.
  for (let i = -9; i <= 9; i++) {
    const x = i * 0.05;
    const y = 0.36 - 0.12 * (1 - (x / 0.5) ** 2) - 0.012;
    g.add(
      mesh(
        new THREE.ConeGeometry(0.012, 0.025, 3)
          .rotateX(Math.PI)
          .translate(x, y, 0.132),
        "metal",
        "tooth",
      ),
    );
  }
  // A handle at each end, upright.
  for (const x of [-0.53, 0.53])
    g.add(
      mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.16, 6).translate(
          x,
          0.42,
          0.132,
        ),
        "wood",
        "handle",
      ),
    );
  return g;
}

/** A Hokkaido sika deer, toy figure (hunt-animals). About 0.6 m long. */
function deer() {
  const g = new THREE.Group();
  g.name = "deer";
  const box = (
    s: [number, number, number],
    p: [number, number, number],
    name: string,
    part = "fur",
    rz = 0,
  ) =>
    g.add(
      mesh(new THREE.BoxGeometry(...s).rotateZ(rz).translate(...p), part, name),
    );
  box([0.42, 0.17, 0.15], [0, 0.36, 0], "body");
  for (const x of [-0.16, 0.16])
    for (const z of [-0.05, 0.05]) box([0.04, 0.28, 0.04], [x, 0.14, z], "leg");
  box([0.08, 0.22, 0.08], [0.22, 0.5, 0], "neck", "fur", -0.4);
  box([0.14, 0.07, 0.07], [0.3, 0.6, 0], "head");
  box([0.03, 0.06, 0.03], [0.26, 0.66, 0.04], "ear");
  box([0.03, 0.06, 0.03], [0.26, 0.66, -0.04], "ear");
  box([0.05, 0.06, 0.1], [-0.22, 0.38, 0], "rump", "thread");
  return g;
}

/** A coal shovel (mine-diorama-tasks). About 1 m long. */
function shovel() {
  const g = new THREE.Group();
  g.name = "shovel";
  const shaft = new THREE.CylinderGeometry(0.016, 0.018, 0.8, 6)
    .rotateZ(Math.PI / 2 - 0.12)
    .translate(-0.1, 0.07, 0);
  g.add(mesh(shaft, "wood", "shaft"));
  const grip = new THREE.BoxGeometry(0.03, 0.03, 0.12).translate(-0.5, 0.12, 0);
  g.add(mesh(grip, "wood", "grip"));
  const blade = new THREE.BoxGeometry(0.26, 0.012, 0.22).translate(
    0.4,
    0.02,
    0,
  );
  g.add(mesh(blade, "metal", "blade"));
  const lip = new THREE.BoxGeometry(0.2, 0.05, 0.012);
  for (const z of [-0.11, 0.11])
    g.add(mesh(lip.clone().translate(0.38, 0.04, z), "metal", "lip"));
  // A few lumps of coal on the blade.
  for (const [x, z, r] of [
    [0.4, 0.03, 0.035],
    [0.46, -0.05, 0.03],
    [0.34, -0.03, 0.028],
  ] as const)
    g.add(
      mesh(
        new THREE.DodecahedronGeometry(r, 0).translate(x, 0.045, z),
        "coal",
        "coal",
      ),
    );
  return g;
}

export const areaObjects: Record<AreaObjectId, () => THREE.Group> = {
  herring,
  coal,
  "survey-stake": surveyStake,
  "set-bow": setBow,
  net,
  saw,
  deer,
  shovel,
};
