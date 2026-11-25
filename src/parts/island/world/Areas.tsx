// Themed areas of the island: coast (herring fishery), forest (plants and the
// 1890 survey camp), hills (animals), mountains (coal mine and winter
// logging). Toy scenes after the Hokkaido Museum theme 2 and theme 4
// dioramas (Lukas's photos 7744–7750, 7865–7883; visual reference only, not
// reconstructions). Claims for these areas: knowledge "land-and-sea".
//
// Each area is ONE merged mesh with vertex colours (1 draw call), plus one
// small mesh for the boats that bob on the sea. Positions: AREAS in island.ts.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  type BufferGeometry,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Matrix4,
  type Mesh,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { snowCap } from "../../shared/snowCap";
import type { Field } from "./field";
import { AREAS, type Area } from "./island";
import { U } from "./season";

type V3 = [number, number, number];
type PartOpts = {
  /** Rotation in radians, local to the area. */
  r?: V3;
  /** "ground": y is above the terrain at that point; "sea": above sea level. */
  on?: "ground" | "sea";
};

/** Collects coloured primitives in an area's local frame, then merges them. */
class Kit {
  private parts: BufferGeometry[] = [];
  private q = new Quaternion();
  private m = new Matrix4();
  /** While set, "ground" parts all stand on the terrain at this local x, z
   * (one figure or animal stays in one piece on a slope). */
  pin: [number, number] | null = null;
  constructor(
    private field: Field,
    private area: Area,
  ) {
    this.q.setFromAxisAngle(new Vector3(0, 1, 0), area.ry);
  }
  add(g: BufferGeometry, color: string, p: V3, o: PartOpts = {}) {
    const geo = g.index ? g.toNonIndexed() : g;
    if (g.index) g.dispose();
    const local = new Vector3(...p)
      .multiplyScalar(this.area.s)
      .applyQuaternion(this.q);
    const wx = this.area.x + local.x;
    const wz = this.area.z + local.z;
    let gx = wx;
    let gz = wz;
    if (this.pin) {
      const at = new Vector3(this.pin[0], 0, this.pin[1])
        .multiplyScalar(this.area.s)
        .applyQuaternion(this.q);
      gx = this.area.x + at.x;
      gz = this.area.z + at.z;
    }
    const base = o.on === "sea" ? 0 : this.field.groundY(gx, gz);
    const rot = new Quaternion()
      .setFromEuler(new Euler(...(o.r ?? [0, 0, 0])))
      .premultiply(this.q);
    this.m.compose(
      new Vector3(wx, base + local.y, wz),
      rot,
      new Vector3(this.area.s, this.area.s, this.area.s),
    );
    geo.applyMatrix4(this.m);
    const c = new Color(color);
    const n = geo.getAttribute("position").count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) c.toArray(col, i * 3);
    geo.setAttribute("color", new Float32BufferAttribute(col, 3));
    geo.deleteAttribute("uv");
    this.parts.push(geo);
    return this;
  }
  /** Terrain height at a local x, z, in local units (above sea level). */
  groundLocal(x: number, z: number) {
    const at = new Vector3(x, 0, z)
      .multiplyScalar(this.area.s)
      .applyQuaternion(this.q);
    return (
      this.field.groundY(this.area.x + at.x, this.area.z + at.z) / this.area.s
    );
  }
  box(size: V3, color: string, p: V3, o?: PartOpts) {
    return this.add(new BoxGeometry(...size), color, p, o);
  }
  cyl(rt: number, rb: number, h: number, color: string, p: V3, o?: PartOpts) {
    return this.add(new CylinderGeometry(rt, rb, h, 6), color, p, o);
  }
  cone(r: number, h: number, color: string, p: V3, o?: PartOpts, seg = 6) {
    return this.add(new ConeGeometry(r, h, seg), color, p, o);
  }
  blob(r: number, color: string, p: V3, o?: PartOpts, sy = 1) {
    const g = new IcosahedronGeometry(r, 0).scale(1, sy, 1);
    return this.add(g, color, p, o);
  }
  /** A tent or roof: a triangular prism along local x. */
  prism(len: number, w: number, h: number, color: string, p: V3, o?: PartOpts) {
    const g = new CylinderGeometry(1, 1, len, 3, 1).rotateZ(Math.PI / 2);
    g.rotateX(-Math.PI / 2).scale(1, h / 1.5, w / Math.sqrt(3));
    g.translate(0, h / 3, 0);
    return this.add(g, color, p, o);
  }
  build() {
    const g = mergeGeometries(this.parts);
    for (const p of this.parts) p.dispose();
    g.computeVertexNormals();
    return g;
  }
}

const C = {
  wood: "#8a5a35",
  woodDark: "#5e3f2a",
  plank: "#b48a5a",
  shingle: "#c9a25e",
  stone: "#a7a090",
  sand: "#e3cf9e",
  herring: "#c9d6de",
  net: "#6f6a5c",
  canvas: "#efe4c8",
  shirt: "#e9e2d0",
  indigo: "#2f4b6e",
  skin: "#e0b48a",
  horse: "#7a4e30",
  pack: "#bfa77a",
  coal: "#24252a",
  rail: "#55575c",
  deer: "#b07a45",
  bear: "#4a3326",
  leaf: "#4f7f45",
  garlic: "#6fae55",
  katakuri: "#c98bd0",
  lily: "#f1efe4",
};

/** A tiny standing figure (diorama scale, about 0.22 du tall). */
function figure(
  k: Kit,
  p: V3,
  shirt = C.shirt,
  legs = C.indigo,
  on: PartOpts["on"] = "ground",
) {
  const [x, y, z] = p;
  const outer = k.pin;
  k.pin ??= [x, z];
  k.box([0.06, 0.09, 0.05], legs, [x, y + 0.045, z], { on });
  k.box([0.08, 0.08, 0.06], shirt, [x, y + 0.13, z], { on });
  k.blob(0.035, C.skin, [x, y + 0.2, z], { on });
  k.pin = outer;
}

function horse(k: Kit, p: V3, ry: number, load = true) {
  const [x, y, z] = p;
  const outer = k.pin;
  k.pin ??= [x, z];
  const r: V3 = [0, ry, 0];
  const at = (dx: number, dy: number): V3 => [
    x + Math.cos(ry) * dx,
    y + dy,
    z - Math.sin(ry) * dx,
  ];
  k.box([0.3, 0.12, 0.11], C.horse, at(0, 0.2), { r });
  for (const dx of [-0.11, 0.11])
    for (const dz of [-0.035, 0.035]) {
      const q = at(dx, 0.07);
      k.box(
        [0.03, 0.14, 0.03],
        C.horse,
        [q[0] + Math.sin(ry) * dz, q[1], q[2] + Math.cos(ry) * dz],
        { r },
      );
    }
  k.box([0.08, 0.13, 0.06], C.horse, at(0.17, 0.29), { r: [0, ry, -0.5] });
  k.box([0.1, 0.05, 0.05], C.horse, at(0.23, 0.34), { r });
  if (load) k.box([0.16, 0.09, 0.17], C.pack, at(-0.01, 0.31), { r });
  k.pin = outer;
}

function deer(k: Kit, p: V3, ry: number, antlers: boolean) {
  const [x, y, z] = p;
  const outer = k.pin;
  k.pin ??= [x, z];
  const r: V3 = [0, ry, 0];
  const at = (dx: number, dy: number): V3 => [
    x + Math.cos(ry) * dx,
    y + dy,
    z - Math.sin(ry) * dx,
  ];
  k.box([0.24, 0.1, 0.09], C.deer, at(0, 0.2), { r });
  for (const dx of [-0.09, 0.09])
    k.box([0.025, 0.15, 0.07], C.deer, at(dx, 0.075), { r });
  k.box([0.05, 0.13, 0.05], C.deer, at(0.12, 0.29), { r: [0, ry, -0.35] });
  k.box([0.08, 0.045, 0.045], C.deer, at(0.16, 0.36), { r });
  k.box([0.04, 0.03, 0.06], C.lily, at(-0.12, 0.22), { r });
  if (antlers)
    for (const s of [-1, 1]) {
      const q = at(0.15, 0.43);
      k.box(
        [0.012, 0.1, 0.012],
        C.woodDark,
        [
          q[0] + Math.sin(ry) * 0.025 * s,
          q[1],
          q[2] + Math.cos(ry) * 0.025 * s,
        ],
        { r: [0.3 * s, ry, 0.25] },
      );
    }
  k.pin = outer;
}

function bear(k: Kit, p: V3, ry: number) {
  const [x, y, z] = p;
  const outer = k.pin;
  k.pin ??= [x, z];
  const r: V3 = [0, ry, 0];
  const at = (dx: number, dy: number): V3 => [
    x + Math.cos(ry) * dx,
    y + dy,
    z - Math.sin(ry) * dx,
  ];
  k.blob(0.16, C.bear, at(0, 0.17), { r }, 0.75);
  k.blob(0.1, C.bear, at(0.12, 0.22), { r }, 0.9);
  k.blob(0.075, C.bear, at(0.22, 0.2), { r });
  k.box([0.05, 0.04, 0.05], "#3a281e", at(0.29, 0.19), { r });
  for (const dx of [-0.1, 0.12])
    k.box([0.06, 0.1, 0.16], C.bear, at(dx, 0.05), { r });
  k.pin = outer;
}

// ------------------------------------------------------------------ coast
/** Herring work house on a stone base, drying racks, a jetty, crates. */
function coast(k: Kit) {
  // Sand yard.
  k.cyl(1.35, 1.4, 0.04, C.sand, [0, 0.0, -0.1]);
  // Long work house: stone base, plank walls, shingle gable roof.
  k.box([2.0, 0.12, 0.95], C.stone, [0, 0.06, -0.55]);
  k.box([1.9, 0.38, 0.85], C.plank, [0, 0.31, -0.55]);
  k.prism(2.05, 1.05, 0.42, C.shingle, [0, 0.5, -0.55]);
  k.box([0.12, 0.16, 0.12], C.woodDark, [0, 0.98, -0.55]);
  // Front windows and door in a row (the long open front of the diorama).
  for (let i = -3; i <= 3; i++)
    k.box([0.12, 0.11, 0.01], i === 0 ? C.woodDark : "#3d3a36", [
      i * 0.25,
      i === 0 ? 0.24 : 0.36,
      -0.12,
    ]);
  // Drying racks with hanging herring.
  for (const rx of [-1.1, 1.1]) {
    for (const dz of [-0.25, 0.25])
      k.cyl(0.015, 0.015, 0.42, C.woodDark, [rx, 0.21, 0.35 + dz]);
    k.box([0.02, 0.02, 0.6], C.woodDark, [rx, 0.4, 0.35]);
    for (let j = 0; j < 5; j++)
      k.box([0.03, 0.12, 0.02], C.herring, [rx, 0.32, 0.12 + j * 0.115]);
  }
  // Herring laid out in square trays (as in the diorama yard).
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 2; j++)
      k.box([0.16, 0.02, 0.16], C.herring, [
        -0.45 + i * 0.3,
        0.05,
        0.25 + j * 0.28,
      ]);
  // Coiled net and baskets.
  k.cyl(0.11, 0.12, 0.05, C.net, [0.7, 0.05, 0.75]);
  k.cyl(0.06, 0.05, 0.08, C.pack, [-0.75, 0.06, 0.85]);
  // Jetty out to the boats.
  for (let j = 0; j < 7; j++)
    k.box([0.36, 0.03, 0.12], C.plank, [0.15, 0.1, 1.15 + j * 0.13], {
      on: "sea",
    });
  for (const dz of [1.2, 1.6, 2.0])
    for (const dx of [-0.02, 0.32])
      k.cyl(0.02, 0.02, 0.3, C.woodDark, [dx, 0.0, dz], { on: "sea" });
  // Straw mats under the trays, and a worker carrying a basket up from the
  // jetty (sea-diorama-tasks).
  k.box([1.3, 0.012, 0.62], "#c9b07a", [0, 0.035, 0.39]);
  figure(k, [0.3, 0.04, 0.85]);
  k.box([0.08, 0.07, 0.06], C.pack, [0.3, 0.21, 0.81]);
  // Workers.
  figure(k, [-0.3, 0.04, 0.05]);
  figure(k, [0.2, 0.04, 0.6], C.indigo, C.shirt);
  figure(k, [0.9, 0.04, 0.3]);
  // Steps down the shore to the jetty.
  const top = k.groundLocal(0.15, 0.9);
  const run = 0.4;
  const drop = top - 0.11;
  k.box(
    [0.3, 0.03, Math.hypot(run, drop)],
    C.plank,
    [0.15, (top + 0.11) / 2, 0.9 + run / 2],
    {
      r: [Math.atan2(drop, run), 0, 0],
      on: "sea",
    },
  );
}

/** Two herring boats, heavy with fish. Separate mesh so they can bob. */
function boats(k: Kit) {
  for (const [x, z, ry] of [
    [-0.6, 1.9, 0.25],
    [0.95, 2.45, -0.3],
  ] as const) {
    const r: V3 = [0, ry, 0];
    k.box([0.75, 0.1, 0.22], C.plank, [x, 0.04, z], { r, on: "sea" });
    const bx = x + Math.cos(ry) * 0.42;
    const bz = z - Math.sin(ry) * 0.42;
    k.cone(
      0.11,
      0.18,
      C.plank,
      [bx, 0.04, bz],
      { r: [0, ry, -Math.PI / 2], on: "sea" },
      4,
    );
    k.box([0.55, 0.05, 0.16], C.herring, [x, 0.1, z], { r, on: "sea" });
    figure(
      k,
      [x - Math.cos(ry) * 0.3, 0.08, z + Math.sin(ry) * 0.3],
      C.shirt,
      C.indigo,
      "sea",
    );
  }
}

// ------------------------------------------------------------------ forest
/** Forest plants, and at the edge the 1890 survey camp with its straight line. */
function forest(k: Kit) {
  // Plants on the forest floor: wild garlic, katakuri, giant lily.
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4;
    const rr = 0.35 + (i % 3) * 0.12;
    k.cone(0.035, 0.12, C.garlic, [
      -0.9 + Math.cos(a) * rr,
      0.06,
      0.6 + Math.sin(a) * rr * 0.6,
    ]);
  }
  for (let i = 0; i < 7; i++)
    k.blob(0.035, C.katakuri, [
      -0.2 + (i % 4) * 0.13,
      0.05,
      0.75 + Math.floor(i / 4) * 0.13,
    ]);
  for (const [x, z] of [
    [0.55, 0.3],
    [0.75, 0.45],
  ])
    k.cyl(0.012, 0.015, 0.35, C.garlic, [x, 0.17, z]).blob(0.05, C.lily, [
      x,
      0.36,
      z,
    ]);
  // Survey camp: three canvas tents.
  for (const [x, z] of [
    [0.9, -0.55],
    [1.45, -0.3],
    [1.3, -1.0],
  ]) {
    k.prism(0.42, 0.36, 0.3, C.canvas, [x, 0.0, z], { r: [0, 0.3, 0] });
  }
  // The straight survey line: a cut row of stakes with white tags.
  for (let i = 0; i < 9; i++) {
    const x = -1.8 + i * 0.32;
    k.box([0.02, 0.16, 0.02], C.wood, [x, 0.08, 0.05]);
    k.box([0.04, 0.03, 0.01], C.lily, [x + 0.02, 0.15, 0.05]);
  }
  // Pack horses with loads, and two people sawing a tree that is in the way
  // of the line; a felled trunk lies beside them.
  horse(k, [-0.7, 0, -0.15], 0.2);
  horse(k, [-1.15, 0, -0.05], 0.2);
  figure(k, [-0.35, 0, -0.2]);
  k.cyl(0.05, 0.065, 0.55, C.woodDark, [0.3, 0.27, 0.05]);
  k.blob(0.2, "#6b8a45", [0.3, 0.62, 0.05], undefined, 0.8);
  k.box([0.32, 0.025, 0.01], C.rail, [0.3, 0.1, 0.1]);
  figure(k, [0.12, 0, 0.12]);
  figure(k, [0.48, 0, 0.12]);
  k.cyl(0.05, 0.05, 0.65, C.woodDark, [0.6, 0.05, 0.55], {
    r: [0, 0.5, Math.PI / 2],
  });
  figure(k, [1.1, 0, -0.15], C.indigo, C.shirt);
  // Surveying at a tripod on the line (survey-tasks).
  for (const a of [0, 2.1, 4.2])
    k.box(
      [0.012, 0.2, 0.012],
      C.woodDark,
      [-1.5 + Math.cos(a) * 0.03, 0.1, 0.22 + Math.sin(a) * 0.03],
      { r: [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3] },
    );
  k.box([0.05, 0.025, 0.025], C.rail, [-1.5, 0.21, 0.22]);
  figure(k, [-1.62, 0, 0.3]);
}

// ------------------------------------------------------------------ hills
/** Sika deer in a meadow, a brown bear by the rocks, a hare. */
function hills(k: Kit) {
  deer(k, [-0.5, 0, 0.3], 0.4, true);
  deer(k, [-0.15, 0, 0.6], 0.9, false);
  deer(k, [-0.85, 0, 0.75], -0.3, false);
  for (const [x, z, r] of [
    [0.8, -0.5, 0.28],
    [1.15, -0.25, 0.2],
    [0.6, -0.85, 0.18],
  ])
    k.blob(r, C.stone, [x, r * 0.5, z], undefined, 0.7);
  bear(k, [0.55, 0, -0.1], 2.4);
  // Hare.
  k.blob(0.05, "#c8b89a", [0.2, 0.05, 0.9]).blob(
    0.03,
    "#c8b89a",
    [0.26, 0.09, 0.9],
  );
  k.box([0.012, 0.05, 0.012], "#c8b89a", [0.27, 0.13, 0.9]);
  // Raccoon dog and a hazel grouse (hunt-animals).
  k.box([0.1, 0.05, 0.05], "#6b5a48", [-0.3, 0.05, -0.45], { r: [0, 0.6, 0] });
  k.blob(0.03, "#6b5a48", [-0.25, 0.08, -0.49]);
  k.blob(0.035, "#8a6a4a", [0.1, 0.04, -0.6], undefined, 0.8);
  // The set bow on the animal path: two stakes and the bow.
  k.box([0.6, 0.006, 0.08], "#9b8466", [-0.1, 0.004, 0.05], { r: [0, 0.4, 0] });
  for (const dx of [-0.08, 0.08])
    k.box([0.012, 0.06, 0.012], C.wood, [-0.1 + dx, 0.03, 0.15]);
  k.box([0.17, 0.008, 0.008], C.woodDark, [-0.1, 0.055, 0.15]);
}

// ------------------------------------------------------------------ mountains
/** Coal mine entrance with timber props, rails, carts, a coal heap, and logs
 * on a horse sleigh coming down from the woods. */
function mountains(k: Kit) {
  k.cyl(1.6, 1.7, 0.03, "#8c8577", [0, 0, 0.2]);
  // Rock face with the adit (tunnel mouth) and its timber frame.
  k.blob(0.9, "#6f6a62", [0, 0.25, -1.05], undefined, 0.75);
  k.box([0.5, 0.42, 0.3], C.coal, [0, 0.21, -0.5]);
  k.box([0.06, 0.48, 0.06], C.wood, [-0.26, 0.24, -0.34]);
  k.box([0.06, 0.48, 0.06], C.wood, [0.26, 0.24, -0.34]);
  k.box([0.64, 0.07, 0.08], C.wood, [0, 0.5, -0.34]);
  // Rails with sleepers, out of the adit.
  for (let j = 0; j < 12; j++)
    k.box([0.28, 0.02, 0.04], C.woodDark, [0, 0.02, -0.3 + j * 0.14]);
  for (const dx of [-0.09, 0.09])
    k.box([0.015, 0.025, 1.7], C.rail, [dx, 0.04, 0.48]);
  // Coal carts.
  for (const z of [0.2, 0.62]) {
    k.box([0.24, 0.12, 0.3], C.rail, [0, 0.12, z]);
    k.blob(0.12, C.coal, [0, 0.19, z], undefined, 0.4);
    for (const dx of [-0.1, 0.1])
      for (const dz of [-0.09, 0.09])
        k.cyl(0.035, 0.035, 0.02, C.coal, [dx, 0.05, z + dz], {
          r: [0, 0, Math.PI / 2],
        });
  }
  // Coal heap and a small shed.
  k.cone(0.42, 0.38, C.coal, [-0.85, 0.19, 0.4], undefined, 7);
  k.cone(0.25, 0.22, C.coal, [-0.55, 0.11, 0.75], undefined, 6);
  k.box([0.5, 0.3, 0.38], C.plank, [0.85, 0.15, 0.0]);
  k.prism(0.56, 0.48, 0.22, C.woodDark, [0.85, 0.3, 0.0]);
  // Miners with head lamps.
  figure(k, [0.25, 0, -0.1], C.shirt, C.indigo);
  figure(k, [-0.3, 0, 0.1], C.shirt, C.indigo);
  k.box([0.03, 0.03, 0.02], "#ffd27a", [0.25, 0.23, -0.07]);
  k.box([0.03, 0.03, 0.02], "#ffd27a", [-0.3, 0.23, 0.13]);
  // Winter logging: horse sleigh with logs.
  k.box([0.55, 0.03, 0.2], C.woodDark, [0.95, 0.03, 0.85]);
  for (const [dy, dz] of [
    [0.07, -0.05],
    [0.07, 0.05],
    [0.15, 0],
  ])
    k.cyl(0.045, 0.045, 0.6, C.plank, [0.95, dy, 0.85 + dz], {
      r: [0, 0, Math.PI / 2],
    });
  horse(k, [1.45, 0, 0.85], 0, false);
  // A miner drilling at the adit, and a stack of logs (mine-diorama-tasks,
  // winter-logging).
  figure(k, [-0.12, 0, -0.28], C.shirt, C.indigo);
  k.box([0.1, 0.025, 0.025], C.rail, [-0.12, 0.13, -0.34]);
  for (const [dy, dz] of [
    [0.04, -0.05],
    [0.04, 0.05],
    [0.12, 0],
  ])
    k.cyl(0.04, 0.04, 0.45, C.plank, [1.35, dy, 0.35 + dz], {
      r: [0, 0, Math.PI / 2],
    });
}

const BUILD: Record<Area["id"], (k: Kit) => void> = {
  coast,
  forest,
  hills,
  mountains,
};

export function Areas({ field, still }: { field: Field; still: boolean }) {
  // Top faces turn white in winter (same season weights as the terrain).
  const snow = useMemo(() => ({ value: 0 }), []);
  const mat = useMemo(
    () =>
      snowCap(
        new MeshStandardMaterial({
          vertexColors: true,
          flatShading: true,
          roughness: 0.9,
        }),
        snow,
      ),
    [snow],
  );
  const geos = useMemo(
    () =>
      AREAS.map((a) => {
        const k = new Kit(field, a);
        BUILD[a.id](k);
        return { id: a.id, g: k.build() };
      }),
    [field],
  );
  const boatGeo = useMemo(() => {
    const a = AREAS.find((x) => x.id === "coast");
    if (!a) return null;
    const k = new Kit(field, a);
    boats(k);
    return k.build();
  }, [field]);
  const boatRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    snow.value = U.uW.value.w;
    if (!boatRef.current || still) return;
    const t = clock.elapsedTime;
    boatRef.current.position.y = Math.sin(t * 1.3) * 0.025;
  });
  return (
    <>
      {geos.map(({ id, g }) => (
        <mesh key={id} geometry={g} material={mat} castShadow receiveShadow />
      ))}
      {boatGeo && (
        <mesh ref={boatRef} geometry={boatGeo} material={mat} castShadow />
      )}
    </>
  );
}
