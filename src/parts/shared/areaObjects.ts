// Procedural sketch objects for the island's themed areas (coast, forest,
// hills, mountains). Original, illustrative geometry (MIT), drawn after the
// Hokkaido Museum panels and dioramas that the claims cite (knowledge
// "land-and-sea"). Not scans or reconstructions.
//
// Shared by the artifacts viewer (which re-materials meshes by
// userData.part) and the detail-scene room (which keeps the colours set
// here). Artifact space: metres, origin at the base centre, front +Z.
import * as THREE from "three";

export type AreaPart =
  | "fish"
  | "coal"
  | "metal"
  | "canvas"
  | "fur"
  | "float"
  | "lacquer"
  | "lacquer-red"
  | "vine"
  | "glass";
export type AreaObjectId =
  | "herring"
  | "coal"
  | "survey-stake"
  | "set-bow"
  | "net"
  | "saw"
  | "deer"
  | "shovel"
  | "tonkori"
  | "vine-rings"
  | "canoe"
  | "lacquer-vessel"
  | "omusha-case";

/** Colours for the parts this file adds (the viewer's toon look uses them). */
export const AREA_PALETTE: Record<AreaPart, string> = {
  fish: "#c9d6de",
  coal: "#2c2d33",
  metal: "#6f7378",
  canvas: "#efe4c8",
  fur: "#b07a45",
  float: "#d8c49a",
  lacquer: "#2a1714",
  "lacquer-red": "#8e2a1e",
  vine: "#7a6040",
  glass: "#cfe6ee",
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

// ------------------------------------------------ the other places
// Sketches after objects in Lukas's Hokkaido Museum photos (visual reference
// only), for knowledge "hokkaido-museum". Shapes are simplified.

/** A tonkori on a low stand: five strings played open (tonkori-strings,
 * tonkori-open). About 1.1 m long. */
function tonkori() {
  const g = new THREE.Group();
  g.name = "tonkori";
  // Long, narrow, flat body, lying on two small blocks.
  for (const x of [-0.35, 0.35])
    g.add(
      mesh(
        new THREE.BoxGeometry(0.06, 0.05, 0.16).translate(x, 0.025, 0),
        "bark",
        "stand",
      ),
    );
  const shape = new THREE.Shape();
  shape.moveTo(-0.55, -0.05);
  shape.lineTo(0.42, -0.06);
  shape.quadraticCurveTo(0.5, 0, 0.42, 0.06);
  shape.lineTo(-0.55, 0.05);
  shape.closePath();
  const body = new THREE.ExtrudeGeometry(shape, {
    depth: 0.045,
    bevelEnabled: false,
  })
    .rotateX(-Math.PI / 2)
    .translate(0, 0.05, 0);
  g.add(mesh(body, "wood", "body"));
  // Head with five pegs (one per string).
  g.add(
    mesh(
      new THREE.BoxGeometry(0.1, 0.05, 0.09).translate(-0.6, 0.075, 0),
      "wood",
      "head",
    ),
  );
  for (let i = 0; i < 5; i++) {
    const z = -0.032 + i * 0.016;
    g.add(
      mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.07, 5).translate(
          -0.62 + (i % 2) * 0.03,
          0.12,
          z,
        ),
        "bark",
        "peg",
      ),
    );
    // Strings from the pegs to the tail, open (no frets).
    g.add(
      mesh(
        new THREE.BoxGeometry(1.0, 0.003, 0.003).translate(-0.08, 0.1, z),
        "thread",
        `string-${i + 1}`,
      ),
    );
  }
  g.add(
    mesh(
      new THREE.BoxGeometry(0.02, 0.012, 0.09).translate(0.4, 0.1, 0),
      "bark",
      "tail",
    ),
  );
  return g;
}

/** Rings of wild grape vine on the ground and a stick to pick them up
 * (ring-game). About 0.8 m across. */
function vineRings() {
  const g = new THREE.Group();
  g.name = "vine-rings";
  const spots: [number, number, number][] = [
    [-0.2, 0.1, 0.2],
    [0.05, -0.15, 1.1],
    [0.25, 0.12, 2.3],
    [-0.05, 0.25, 0.6],
    [0.3, -0.2, 1.7],
  ];
  spots.forEach(([x, z, r], i) => {
    const ring = new THREE.TorusGeometry(0.075, 0.012, 5, 14)
      .rotateX(Math.PI / 2)
      .rotateY(r)
      .translate(x, 0.012, z);
    g.add(mesh(ring, "vine", i === 0 ? "ring" : `ring-${i}`));
  });
  const stick = new THREE.CylinderGeometry(0.012, 0.016, 0.8, 6)
    .rotateZ(Math.PI / 2 - 0.08)
    .rotateY(0.4)
    .translate(-0.05, 0.03, -0.05);
  g.add(mesh(stick, "wood", "stick"));
  return g;
}

/** A dugout canoe with its steering pole (canoe-pole, canoe-kamuy).
 * About 2.6 m long; the pole about 3.4 m. */
function canoe() {
  const g = new THREE.Group();
  g.name = "canoe";
  // Hull: a log shape, hollowed (a dark inner box), with pointed ends.
  const hull = new THREE.CylinderGeometry(0.28, 0.28, 2.1, 10, 1)
    .rotateZ(Math.PI / 2)
    .scale(1, 0.7, 1)
    .translate(0, 0.2, 0);
  g.add(mesh(hull, "wood", "hull"));
  for (const s of [-1, 1]) {
    const end = new THREE.ConeGeometry(0.28, 0.32, 10)
      .rotateZ((-s * Math.PI) / 2)
      .scale(1, 0.7, 1)
      .translate(s * 1.21, 0.2, 0);
    g.add(mesh(end, "wood", "end"));
  }
  g.add(
    mesh(
      new THREE.BoxGeometry(1.9, 0.02, 0.36).translate(0, 0.39, 0),
      "bark",
      "inside",
    ),
  );
  // The pole, laid along the side.
  g.add(
    mesh(
      new THREE.CylinderGeometry(0.02, 0.025, 3.4, 6)
        .rotateZ(Math.PI / 2)
        .translate(0.1, 0.03, 0.45),
      "wood",
      "pole",
    ),
  );
  return g;
}

/** A lidded lacquer vessel on short feet, a treasure passed down
 * (tools-mixed). About 0.4 m wide. */
function lacquerVessel() {
  const g = new THREE.Group();
  g.name = "lacquer-vessel";
  g.add(
    mesh(
      new THREE.CylinderGeometry(0.19, 0.17, 0.24, 20).translate(0, 0.17, 0),
      "lacquer",
      "body",
    ),
  );
  g.add(
    mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.04, 20).translate(0, 0.31, 0),
      "lacquer",
      "lid",
    ),
  );
  g.add(
    mesh(
      new THREE.TorusGeometry(0.19, 0.008, 4, 24)
        .rotateX(Math.PI / 2)
        .translate(0, 0.25, 0),
      "lacquer-red",
      "band",
    ),
  );
  g.add(
    mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.03, 10).translate(0, 0.345, 0),
      "lacquer-red",
      "knob",
    ),
  );
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    g.add(
      mesh(
        new THREE.BoxGeometry(0.05, 0.06, 0.05).translate(
          Math.cos(a) * 0.13,
          0.03,
          Math.sin(a) * 0.13,
        ),
        "lacquer",
        "foot",
      ),
    );
  }
  return g;
}

/**
 * A museum display case for the Omusha diorama (memory cabin): a wooden
 * plinth with a glass box and plain stand-in shapes inside. The shapes only
 * mark where the scene's parts are (a building, a line of seven seated
 * figures, rows of figures, bales); they are not the museum's figures and
 * show no clothing or pattern. Clicking it opens the splat. About 1.1 m.
 */
function omushaCase() {
  const g = new THREE.Group();
  g.name = "omusha-case";
  const W = 0.8;
  const D = 0.5;
  const H = 0.75;
  g.add(
    mesh(
      new THREE.BoxGeometry(W, H, D).translate(0, H / 2, 0),
      "wood",
      "plinth",
    ),
  );
  const ground = mesh(
    new THREE.BoxGeometry(W - 0.04, 0.03, D - 0.04).translate(0, H + 0.015, 0),
    "canvas",
    "ground",
  );
  const gm = ground.material as THREE.MeshStandardMaterial;
  gm.emissive = new THREE.Color("#f2c14e");
  gm.emissiveIntensity = 0.35;
  g.add(ground);
  const top = H + 0.03;
  // Building at the back, figures as plain capsules.
  g.add(
    mesh(
      new THREE.BoxGeometry(0.22, 0.12, 0.1).translate(0, top + 0.06, -0.15),
      "bark",
      "building",
    ),
  );
  g.add(
    mesh(
      new THREE.ConeGeometry(0.16, 0.06, 4)
        .rotateY(Math.PI / 4)
        .scale(1, 1, 0.5)
        .translate(0, top + 0.15, -0.15),
      "bark",
      "roof",
    ),
  );
  const figure = (x: number, z: number, part: string, name: string) =>
    g.add(
      mesh(
        new THREE.CapsuleGeometry(0.012, 0.025, 3, 6).translate(
          x,
          top + 0.025,
          z,
        ),
        part,
        name,
      ),
    );
  for (let i = 0; i < 7; i++)
    figure(-0.12 + i * 0.04, -0.04, "float", `elder-${i}`);
  for (let r = 0; r < 2; r++)
    for (let i = 0; i < 4; i++)
      figure(0.22 + i * 0.035, -0.12 + r * 0.06, "metal", `row-${r}-${i}`);
  for (let i = 0; i < 6; i++)
    figure(
      -0.3 + (i % 3) * 0.04,
      0.06 + Math.floor(i / 3) * 0.05,
      "fur",
      `crowd-${i}`,
    );
  for (let i = 0; i < 3; i++)
    g.add(
      mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.05, 8)
          .rotateZ(Math.PI / 2)
          .translate(-0.3 + i * 0.05, top + 0.018, 0.17),
        "fiber",
        `bale-${i}`,
      ),
    );
  // Glass box last (transparent, drawn over the inside).
  const glass = mesh(
    new THREE.BoxGeometry(W - 0.02, 0.34, D - 0.02).translate(0, top + 0.17, 0),
    "glass",
    "glass",
  );
  const mat = glass.material as THREE.MeshStandardMaterial;
  mat.transparent = true;
  mat.opacity = 0.22;
  mat.depthWrite = false;
  mat.roughness = 0.1;
  glass.castShadow = false;
  g.add(glass);
  g.add(
    mesh(
      new THREE.BoxGeometry(W, 0.02, D).translate(0, top + 0.35, 0),
      "wood",
      "lid",
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
  tonkori,
  "vine-rings": vineRings,
  canoe,
  "lacquer-vessel": lacquerVessel,
  "omusha-case": omushaCase,
};
