// The street's buildings, one shape per Form (core/facades.ts). The 12
// labelled ones follow the real Otaru building types in
// content/otaru-slope.md: stone storehouse-style shops with udatsu fire
// walls, a tuff clock shop with a band balcony, a red-brick merchant, timber
// machiya, soft-stone warehouses (some gable-end to the street), a
// stucco bank with copper domes, a tiled warehouse with roof creatures and a
// gate, an early-Showa hotel, canal warehouses. Generic and illustrative:
// no real names, logos or family marks (marks are made up).
//
// Meshes only. Each building stays inside its collider box
// (physics/world.ts buildingBox); anything that sticks out over the street
// (eaves, balconies, canopies) is above head height.
//
// Local axes: x across (the street is toward `out`), y up from the ice at
// the facade middle, z along the street (-z downhill).
import * as THREE from "three";
import type { Facade, Mark, Wall } from "../core/facades";
import { pointAt } from "../core/path";
import { rng } from "../core/random";
import type { Building, Track } from "../core/track";
import { buildingBox } from "../physics/world";
import { local, type Merger, placed } from "./merge";
import type { Mat } from "./street";

const E = (x = 0, y = 0, z = 0) => new THREE.Euler(x, y, z);

const WALL: Record<Wall, Mat> = {
  stone: "stone",
  tuff: "tuff",
  brick: "brick",
  wood: "wood",
  plaster: "plaster",
};
const ROOF: Record<Facade["roof"], Mat> = {
  slate: "roofSlate",
  tile: "roofTile",
  red: "roofRed",
};

/** Everything a form needs to place parts on one building. */
type Kit = ReturnType<typeof kit>;

function kit(m: Merger<Mat>, track: Track, b: Building) {
  const box0 = buildingBox(track, b);
  const len = b.s1 - b.s0;
  const ground = pointAt(
    track.path,
    b.side * (track.halfWidth + b.depth / 2),
    0,
    b.s0 + len / 2,
  );
  const M = placed(ground, box0.rot);
  const face = -b.side * (b.depth / 2);
  const out = -b.side;
  const turn = b.side > 0 ? -Math.PI / 2 : Math.PI / 2;
  const at = (dx: number) => face + out * dx;
  const k = {
    m,
    M,
    b,
    len,
    sink: box0.sink,
    depth: b.depth,
    out,
    turn,
    at,
    r: rng(b.look + 17),
    /** A box: `across` deep, `h` tall, `along` long, centred at (x, y, z). */
    box(
      mat: Mat,
      across: number,
      h: number,
      along: number,
      x: number,
      y: number,
      z: number,
      rot?: THREE.Euler,
    ) {
      m.add(
        mat,
        new THREE.BoxGeometry(across, h, along),
        local(M, x, y, z, rot),
      );
    },
    /** A box sticking `t` out of the facade. */
    front(
      mat: Mat,
      t: number,
      h: number,
      along: number,
      y: number,
      z: number,
      off = 0,
    ) {
      k.box(mat, t, h, along, at(off + t / 2), y, z);
    },
    /** A flat panel on the facade. */
    panel(mat: Mat, w: number, h: number, y: number, z: number, off = 0.02) {
      m.add(
        mat,
        new THREE.PlaneGeometry(w, h),
        local(M, at(off), y, z, E(0, turn)),
      );
    },
    /** Any geometry facing the street on the facade. */
    flat(mat: Mat, g: THREE.BufferGeometry, y: number, z: number, off = 0.02) {
      m.add(mat, g, local(M, at(off), y, z, E(0, turn)));
    },
  };
  return k;
}

// ------------------------------------------------------------- shared parts

/** Main walls, sunk so both ends meet the sloping street. */
function body(k: Kit, mat: Mat, h = k.b.h) {
  k.box(mat, k.depth, h + k.sink, k.len - 0.2, 0, (h - k.sink) / 2, 0);
}

function plinth(k: Kit, mat: Mat = "stoneDark", h = 0.9) {
  k.box(mat, k.depth + 0.16, h + k.sink, k.len - 0.1, 0, (h - k.sink) / 2, 0);
}

/** Gable roof with the ridge along the street; snow; icicles on the eave. */
function gableAlong(
  k: Kit,
  top: number,
  mat: Mat,
  roofH = 1.6 + k.depth * 0.12,
) {
  const s = new THREE.Shape();
  s.moveTo(-k.depth / 2 - 0.45, 0);
  s.lineTo(0, roofH);
  s.lineTo(k.depth / 2 + 0.45, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: k.len, bevelEnabled: false });
  g.translate(0, 0, -k.len / 2);
  k.m.add(mat, g.clone(), local(k.M, 0, top, 0));
  k.m.add(
    "snow",
    g,
    local(k.M, 0, top + roofH * 0.42, 0, E(), [0.97, 0.6, 1.01]),
  );
  icicles(k, top);
  return roofH;
}

/** Gable roof with the gable end to the street (ridge across), with the
 *  triangle of wall filled in. */
function gableFacing(k: Kit, top: number, mat: Mat, wall: Mat) {
  const roofH = Math.min(4, k.len * 0.32);
  const span = k.len / 2 + 0.3;
  const s = new THREE.Shape();
  s.moveTo(-span, 0);
  s.lineTo(0, roofH);
  s.lineTo(span, 0);
  s.closePath();
  const deep = k.depth + 0.5;
  const g = new THREE.ExtrudeGeometry(s, { depth: deep, bevelEnabled: false });
  g.translate(0, 0, -deep / 2).rotateY(-Math.PI / 2);
  k.m.add(mat, g.clone(), local(k.M, 0, top, 0));
  k.m.add(
    "snow",
    g,
    local(k.M, 0, top + roofH * 0.4, 0, E(), [1.01, 0.62, 0.96]),
  );
  // The gable wall triangle (inset a little under the roof).
  const t = new THREE.Shape();
  t.moveTo(-k.len / 2 + 0.1, 0);
  t.lineTo(0, roofH - 0.15);
  t.lineTo(k.len / 2 - 0.1, 0);
  t.closePath();
  k.flat(wall, new THREE.ShapeGeometry(t), top, 0, 0.01);
  return roofH;
}

/** Flat roof behind a parapet, snow on top. */
function flatRoof(k: Kit, top: number, mat: Mat) {
  k.front(mat, 0.25, 0.7, k.len - 0.2, top + 0.35, 0);
  k.box(
    mat,
    0.25,
    0.7,
    k.len - 0.2,
    -k.out * (k.depth / 2 - 0.12),
    top + 0.35,
    0,
  );
  for (const end of [-1, 1])
    k.box(mat, k.depth, 0.7, 0.25, 0, top + 0.35, end * (k.len / 2 - 0.22));
  k.box("snow", k.depth - 0.5, 0.25, k.len - 0.7, 0, top + 0.12, 0);
  k.front("snow", 0.3, 0.12, k.len - 0.15, top + 0.76, 0);
}

function icicles(k: Kit, top: number) {
  for (let z = -k.len / 2 + 0.3; z < k.len / 2 - 0.2; z += 0.45 + k.r() * 0.3) {
    const l = 0.15 + k.r() * 0.45;
    k.m.add(
      "icicle",
      new THREE.ConeGeometry(0.05, l, 4),
      local(k.M, k.out * (k.depth / 2 + 0.4), top - l / 2, z, E(Math.PI)),
    );
  }
}

/** A tiled pent eave (hisashi) over the ground floor, snow on it. Sticks out
 *  over the street, so it sits above head height. */
function eave(k: Kit, y: number, along = k.len - 0.4, mat: Mat = "roofTile") {
  const tilt = E(0, 0, k.out * 0.32);
  k.box(mat, 0.9, 0.1, along, k.at(0.42), y, 0, tilt);
  k.box("snow", 0.8, 0.12, along - 0.1, k.at(0.42), y + 0.1, 0, tilt);
  k.front("woodDark", 0.12, 0.12, along, y - 0.2, 0, 0.02);
}

/** Udatsu fire walls at both ends of the front, capped with tiles. */
function fireWalls(k: Kit, top: number) {
  for (const end of [-1, 1]) {
    const z = end * (k.len / 2 - 0.2);
    k.box("stone", 1.3, top + 1.0, 0.35, k.at(-0.5), (top + 1.0) / 2, z);
    k.box("roofTile", 1.5, 0.18, 0.6, k.at(-0.5), top + 1.05, z);
    k.box("snow", 1.4, 0.12, 0.5, k.at(-0.5), top + 1.2, z);
  }
}

/** Roof creatures (shachihoko): big dark tiled fish, head down and tail
 *  fanned up, about a metre tall as in photos of the old warehouses. */
function creatures(k: Kit, n: number, ridgeY: number, size = 1) {
  for (let i = 0; i < n; i++) {
    const z = n === 1 ? 0 : -k.len / 2 + 0.4 + (i * (k.len - 0.8)) / (n - 1);
    const face = i % 2 === 0 ? 1 : -1; // pairs face each other
    const y = ridgeY + 0.05;
    const s = size;
    const at = (dy: number, dz: number, g: THREE.BufferGeometry, rot = E()) =>
      k.m.add("ceramic", g, local(k.M, 0, y + dy * s, z + dz * s * face, rot));
    at(0.12, 0, new THREE.SphereGeometry(0.17 * s, 8, 6));
    at(
      0.45,
      -0.05,
      new THREE.CylinderGeometry(0.1 * s, 0.17 * s, 0.6 * s, 7),
      E(-0.25 * face),
    );
    at(
      0.86,
      -0.18,
      new THREE.ConeGeometry(0.14 * s, 0.34 * s, 5),
      E(-0.9 * face),
    );
    for (const side of [-1, 1])
      k.m.add(
        "ceramic",
        new THREE.ConeGeometry(0.1 * s, 0.32 * s, 4),
        local(
          k.M,
          side * 0.1 * s,
          y + 0.98 * s,
          z - 0.3 * s * face,
          E(-1.4 * face, 0, side * 0.5),
          [1, 1, 0.35],
        ),
      );
    k.m.add(
      "snow",
      new THREE.SphereGeometry(0.1 * s, 6, 4),
      local(k.M, 0, y + 0.3 * s, z + 0.08 * s * face),
    );
  }
}

/** A window: dark or lit glass, optionally with an arched head and frame. */
function window(
  k: Kit,
  y: number,
  z: number,
  w: number,
  h: number,
  o: { lit?: boolean; arch?: boolean; frame?: Mat; glass?: Mat } = {},
) {
  const glass: Mat = o.glass ?? (o.lit ? "window" : "woodDark");
  k.panel(glass, w, h, y, z, 0.02);
  if (o.arch) {
    k.flat(
      glass,
      new THREE.CircleGeometry(w / 2, 12, 0, Math.PI),
      y + h / 2,
      z,
      0.02,
    );
    if (o.frame)
      k.flat(
        o.frame,
        new THREE.RingGeometry(w / 2, w / 2 + 0.12, 12, 1, 0, Math.PI),
        y + h / 2,
        z,
        0.03,
      );
  }
  if (o.frame) {
    k.front(o.frame, 0.08, 0.1, w + 0.24, y - h / 2 - 0.05, z, 0.02);
    if (!o.arch)
      k.front(o.frame, 0.08, 0.12, w + 0.24, y + h / 2 + 0.06, z, 0.02);
  }
}

/** A tall narrow window in a white plaster frame, iron shutters, one leaf
 *  ajar (as on the soft-stone warehouses). */
function shuttered(k: Kit, y: number, z: number, w = 0.8, h = 1.0) {
  k.panel("woodDark", w, h, y, z, 0.02);
  for (const s of [-1, 1])
    k.front("plaster", 0.07, h + 0.3, 0.12, y, z + s * (w / 2 + 0.06), 0.01);
  k.front("plaster", 0.08, 0.14, w + 0.36, y + h / 2 + 0.1, z, 0.01);
  k.front("plaster", 0.1, 0.1, w + 0.3, y - h / 2 - 0.08, z, 0.01);
  k.front("iron", 0.06, h, w / 2, y, z - w / 4, 0.03);
  k.box(
    "iron",
    0.06,
    h,
    w / 2,
    k.at(0.28),
    y,
    z + w / 2 + 0.05,
    E(0, k.out * 0.9),
  );
}

/** Heavy iron double doors with bands. */
function ironDoors(k: Kit, z: number, w = 2.2, h = 2.7) {
  k.front("iron", 0.14, h, w, h / 2, z, 0.02);
  for (const y of [0.6, h / 2, h - 0.5])
    k.front("roofSlate", 0.17, 0.1, w + 0.04, y, z, 0.02);
  k.front("stoneDark", 0.16, 0.25, w + 0.5, h + 0.12, z, 0.02);
}

/** A row of vertical bars (lattice) over [z0, z1]. */
function lattice(
  k: Kit,
  y: number,
  h: number,
  z0: number,
  z1: number,
  gap = 0.16,
  mat: Mat = "woodDark",
) {
  for (let z = z0; z <= z1; z += gap) k.front(mat, 0.05, h, 0.05, y, z, 0.05);
  k.front(mat, 0.07, 0.07, z1 - z0, y + h / 2, (z0 + z1) / 2, 0.05);
  k.front(mat, 0.07, 0.07, z1 - z0, y - h / 2, (z0 + z1) / 2, 0.05);
}

function curtain(k: Kit, z: number) {
  for (const dz of [-0.28, 0.28])
    k.panel("noren", 0.52, 0.85, 1.9, z + dz, 0.07);
}

function sign(k: Kit, y: number, along: number) {
  k.front("woodDark", 0.12, 0.55, along, y, 0, 0.08);
  k.front("snow", 0.3, 0.12, along, y + 0.33, 0, 0.08);
}

/** Copper dome on a drum, gone green. */
function dome(k: Kit, x: number, y: number, z: number, r: number) {
  k.m.add(
    "stucco",
    new THREE.CylinderGeometry(r * 0.9, r * 0.95, r * 0.9, 12),
    local(k.M, x, y + r * 0.45, z),
  );
  k.m.add(
    "verdigris",
    new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    local(k.M, x, y + r * 0.9, z),
  );
  k.m.add(
    "verdigris",
    new THREE.CylinderGeometry(r * 0.18, r * 0.22, r * 0.5, 8),
    local(k.M, x, y + r * 2, z),
  );
  k.m.add(
    "iron",
    new THREE.ConeGeometry(r * 0.12, r * 0.6, 6),
    local(k.M, x, y + r * 2.5, z),
  );
  k.m.add(
    "snow",
    new THREE.SphereGeometry(r * 0.75, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3),
    local(k.M, x, y + r * 1.25, z),
  );
}

/** A made-up painted mark on a pale plaque (never a real family's mark). */
function mark(k: Kit, kind: Mark, y: number, z: number, size = 0.9) {
  k.panel("cream", size, size, y, z, 0.035);
  const s = size / 0.9;
  const at = (dy: number, dz: number, g: THREE.BufferGeometry) =>
    k.m.add("ink", g, local(k.M, k.at(0.045), y + dy, z + dz, E(0, k.turn)));
  if (kind === "ring-bar") {
    at(0, 0, new THREE.RingGeometry(0.22 * s, 0.3 * s, 20));
    at(0, 0, new THREE.PlaneGeometry(0.5 * s, 0.07 * s));
  } else if (kind === "diamond-dot") {
    at(0, 0, new THREE.RingGeometry(0.2 * s, 0.3 * s, 4));
    at(0, 0, new THREE.CircleGeometry(0.07 * s, 10));
  } else {
    at(0.14 * s, 0, new THREE.CircleGeometry(0.08 * s, 10));
    at(-0.1 * s, -0.15 * s, new THREE.CircleGeometry(0.08 * s, 10));
    at(-0.1 * s, 0.15 * s, new THREE.CircleGeometry(0.08 * s, 10));
  }
}

/** Evenly spaced positions along the facade. */
function slots(len: number, spacing: number, margin = 0.8): number[] {
  const n = Math.max(1, Math.floor((len - margin * 2) / spacing));
  return Array.from(
    { length: n },
    (_, i) => -len / 2 + margin + (i + 0.5) * ((len - margin * 2) / n),
  );
}

/** Glowing glass wares on shelves behind a big window. */
function glassDisplay(k: Kit, w: number) {
  window(k, 1.45, 0, w, 1.8, { glass: "glass", frame: "woodDark" });
  for (const y of [0.85, 1.55]) {
    k.front("woodDark", 0.25, 0.05, w - 0.3, y, 0, 0.06);
    for (let z = -w / 2 + 0.35; z < w / 2 - 0.2; z += 0.32 + k.r() * 0.2) {
      const mat: Mat =
        (["glassAmber", "glass", "glassRose"] as const)[
          Math.floor(k.r() * 3)
        ] ?? "glass";
      const tall = 0.14 + k.r() * 0.2;
      k.m.add(
        mat,
        k.r() < 0.5
          ? new THREE.CylinderGeometry(0.05, 0.07, tall, 6)
          : new THREE.SphereGeometry(0.08, 8, 6),
        local(k.M, k.at(0.1), y + 0.03 + tall / 2, z),
      );
    }
  }
}

/** Hip roof: tiles slope on all four sides, a short ridge along the street. */
function hipRoof(k: Kit, top: number, mat: Mat, roofH = 1.4 + k.depth * 0.1) {
  const a = k.depth / 2 + 0.45;
  const b = k.len / 2 + 0.3;
  const rz = Math.max(0.3, b - a);
  const fl = [-a, 0, -b];
  const fr = [-a, 0, b];
  const bl = [a, 0, -b];
  const br = [a, 0, b];
  const r1 = [0, roofH, -rz];
  const r2 = [0, roofH, rz];
  // Counter-clockwise from outside, so faces point out.
  const tri = [
    fl,
    fr,
    r2,
    fl,
    r2,
    r1,
    br,
    bl,
    r1,
    br,
    r1,
    r2,
    bl,
    fl,
    r1,
    fr,
    br,
    r2,
  ].flat();
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3));
  g.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(new Float32Array((tri.length / 3) * 2), 2),
  );
  g.computeVertexNormals();
  k.m.add(mat, g.clone(), local(k.M, 0, top, 0));
  k.m.add(
    "snow",
    g,
    local(k.M, 0, top + roofH * 0.38, 0, E(), [0.95, 0.62, 0.97]),
  );
  icicles(k, top);
  return roofH;
}

/** Small roof vents (dormers) on the street-side slope. */
function vents(k: Kit, top: number, roofH: number, n = 3) {
  for (let i = 0; i < n; i++) {
    const z = -k.len / 2 + (i + 0.5) * (k.len / n);
    const x = k.out * (k.depth / 4);
    k.box("roofTile", 0.6, 0.5, 0.6, x, top + roofH * 0.45 + 0.2, z);
    k.box("snow", 0.66, 0.1, 0.66, x, top + roofH * 0.45 + 0.5, z);
  }
}

/** Paper lanterns hanging under a shop eave. */
function lanterns(k: Kit, y: number, zs: number[]) {
  for (const z of zs) {
    k.m.add(
      "lanternRed",
      new THREE.CylinderGeometry(0.16, 0.16, 0.42, 10),
      local(k.M, k.at(0.55), y, z),
    );
    k.m.add(
      "iron",
      new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10),
      local(k.M, k.at(0.55), y + 0.23, z),
    );
  }
}

// ------------------------------------------------------------------ forms

export function drawBuilding(
  m: Merger<Mat>,
  track: Track,
  b: Building,
  f: Facade,
) {
  const k = kit(m, track, b);
  const top = b.h;
  const L = k.len;
  const roof = ROOF[f.roof];
  const upper = b.h >= 5.2;

  switch (f.form) {
    case "kura-shop": {
      // Stone storehouse-style shop: timber shopfront with lattice and a
      // curtain, tiled pent eave, plaster fire shutters above, udatsu.
      body(k, "stone");
      k.front("woodDark", 0.1, 2.5, L * 0.86, 1.25, 0);
      window(k, 1.3, 0, L * 0.8, 1.9, { lit: true });
      lattice(k, 1.35, 1.9, -L * 0.4, L * 0.15);
      curtain(k, L * 0.28);
      eave(k, 2.75);
      if (upper)
        for (const z of slots(L, 2.6)) {
          k.panel("iron", 0.9, 1.0, 3.9, z, 0.02);
          for (const s of [-1, 1])
            k.box(
              "plaster",
              0.14,
              1.1,
              0.48,
              k.at(0.3),
              3.9,
              z + s * 0.72,
              E(0, s * k.out * 0.5),
            );
          k.front("plaster", 0.16, 0.16, 1.4, 4.55, z, 0.02);
        }
      gableAlong(k, top, "roofTile");
      fireWalls(k, top);
      break;
    }
    case "clock-shop": {
      body(k, "tuff");
      plinth(k, "stoneDark", 0.6);
      for (const z of slots(L, 2.4, 0.9))
        window(k, 1.25, z, 1.2, 1.7, { lit: true, arch: true, frame: "cream" });
      k.front("cream", 0.16, 0.18, L - 0.3, 2.85, 0);
      // The band's balcony across the front, above head height.
      const bl = L - 0.8;
      k.front("tuff", 0.9, 0.16, bl, 3.05, 0);
      k.front("snow", 0.82, 0.08, bl - 0.05, 3.17, 0);
      k.front("iron", 0.05, 0.05, bl, 3.95, 0, 0.84);
      for (let z = -bl / 2; z <= bl / 2 + 0.01; z += 0.45)
        k.front("iron", 0.04, 0.78, 0.04, 3.55, z, 0.84);
      if (upper)
        for (const z of slots(L, 2.2, 0.9))
          window(k, 4.0, z, 0.9, 1.4, {
            lit: k.r() < 0.8,
            arch: true,
            frame: "cream",
          });
      k.front("cream", 0.28, 0.25, L - 0.1, top - 0.15, 0);
      if (f.clock) {
        const y = top + 0.65;
        k.flat("clockFace", new THREE.CircleGeometry(0.45, 20), y, 0, 0.05);
        k.flat("iron", new THREE.RingGeometry(0.45, 0.53, 20), y, 0, 0.055);
        k.flat("ink", new THREE.PlaneGeometry(0.05, 0.32), y + 0.14, 0, 0.06);
        k.flat(
          "ink",
          new THREE.PlaneGeometry(0.22, 0.05),
          y,
          0.09 * k.out,
          0.06,
        );
      }
      const rh = gableAlong(k, top, "roofTile");
      creatures(k, f.creatures || 2, top + rh);
      break;
    }
    case "brick-merchant": {
      // Red brick with pale stone: a surround round every window, strips
      // between the bays, an arched door, a flat parapet (from photos).
      body(k, "brick");
      plinth(k, "cream", 0.7);
      const bays = slots(L, 2.2, 0.9);
      const edges = [-L / 2 + 0.35, L / 2 - 0.35];
      for (let i = 1; i < bays.length; i++)
        edges.push(((bays[i - 1] ?? 0) + (bays[i] ?? 0)) / 2);
      for (const z of edges)
        k.front("cream", 0.1, top - 0.7, 0.32, 0.7 + (top - 0.7) / 2, z, 0.01);
      k.front("cream", 0.16, 0.16, L - 0.2, 3.0, 0);
      const mid = bays.length % 2 ? Math.floor(bays.length / 2) : -1;
      bays.forEach((z, i) => {
        if (i === mid) {
          window(k, 1.25, z, 1.3, 2.1, {
            glass: "woodDark",
            arch: true,
            frame: "cream",
          });
          for (const s of [-1, 1])
            k.front("cream", 0.12, 2.6, 0.22, 1.3, z + s * 0.82, 0.02);
        } else {
          window(k, 1.55, z, 0.85, 1.4, {
            lit: true,
            arch: true,
            frame: "cream",
          });
          for (const s of [-1, 1])
            k.front("cream", 0.1, 1.6, 0.16, 1.55, z + s * 0.56, 0.02);
        }
        if (upper) {
          window(k, 4.05, z, 0.75, 1.35, {
            lit: k.r() < 0.7,
            arch: true,
            frame: "cream",
          });
          for (const s of [-1, 1])
            k.front("cream", 0.1, 1.5, 0.15, 4.05, z + s * 0.5, 0.02);
          for (const s of [-1, 1])
            k.front("cream", 0.04, 1.3, 0.04, 4.05, z + s * 0.12, 0.03);
          k.front("cream", 0.04, 0.04, 0.75, 4.1, z, 0.03);
        }
      });
      flatRoof(k, top, "brick");
      k.front("cream", 0.32, 0.18, L, top + 0.75, 0);
      break;
    }
    case "machiya": {
      // Timber shop: lattice front over warm light, curtain, tiled eave,
      // plastered upper storey with slatted windows.
      body(k, "wood");
      window(k, 1.3, 0, L * 0.84, 2.0, { lit: true });
      const door = -L * 0.3;
      lattice(k, 1.35, 2.0, door + 0.8, L * 0.42, 0.13);
      curtain(k, door);
      eave(k, 2.7);
      if (upper) {
        k.front("plaster", 0.06, 1.6, L - 0.6, 4.0, 0);
        for (const z of slots(L, 2.4))
          lattice(k, 4.0, 0.8, z - 0.5, z + 0.5, 0.11);
      }
      if (f.mark) mark(k, f.mark, upper ? 4.0 : 3.3, L / 2 - 0.9, 0.6);
      gableAlong(k, top, "roofTile");
      if (f.fireWalls) fireWalls(k, top);
      break;
    }
    case "glass-shop": {
      body(k, "stone");
      plinth(k);
      glassDisplay(k, Math.min(L - 1.6, 5));
      k.front("woodDark", 0.1, 2.3, 1.0, 1.15, L / 2 - 0.7);
      sign(k, 2.75, Math.min(4, L * 0.55));
      if (upper) for (const z of slots(L, 2.4)) shuttered(k, 4.0, z);
      gableAlong(k, top, roof);
      if (f.chimney) {
        const z = (k.r() - 0.5) * (L - 2);
        k.box("brick", 0.8, 2.6, 0.8, b.side * (k.depth / 4), top + 1.3, z);
        k.box("snow", 0.9, 0.15, 0.9, b.side * (k.depth / 4), top + 2.65, z);
      }
      break;
    }
    case "gable-warehouse": {
      // Soft-stone warehouse with its gable end to the street.
      body(k, "stone");
      plinth(k);
      ironDoors(k, 0, Math.min(2.4, L * 0.32), 2.8);
      if (upper) for (const s of [-1, 1]) shuttered(k, 4.0, s * L * 0.26);
      const rh = gableFacing(k, top, "roofTile", "stone");
      if (f.mark) mark(k, f.mark, top + rh * 0.4, 0, Math.min(1.1, rh * 0.45));
      else shuttered(k, top + rh * 0.35, 0, 0.6, 0.6);
      break;
    }
    case "lamp-hall": {
      body(k, "stone");
      plinth(k);
      window(k, 1.35, 0, 1.8, 2.2, {
        lit: true,
        arch: true,
        frame: "stoneDark",
      });
      for (const row of upper ? [1.45, 4.0] : [1.45])
        for (const z of slots(L, 2.4, 1.0)) {
          if (row < 2 && Math.abs(z) < 1.4) continue;
          k.panel("woodDark", 1.0, 1.1, row, z);
          for (const dy of [-0.3, 0.2])
            for (const dz of [-0.32, 0, 0.32])
              k.m.add(
                "lamp",
                new THREE.SphereGeometry(0.07, 6, 4),
                local(k.M, k.at(0.06), row + dy, z + dz),
              );
          k.front("iron", 0.06, 0.1, 1.2, row + 0.62, z, 0.02);
        }
      gableAlong(k, top, "roofTile");
      break;
    }
    case "bank": {
      // Classical stucco bank (light grey in photos): rusticated ground
      // floor, deep arched windows in heavy surrounds, projecting end bays
      // with curved pediments, cornice, copper domes.
      body(k, "stucco");
      plinth(k, "stoneDark", 0.6);
      for (let y = 0.9; y < 3.0; y += 0.45)
        k.front("stoneDark", 0.03, 0.04, L - 0.3, y, 0, 0.01);
      const ends = [-L / 2 + 0.9, L / 2 - 0.9];
      for (const z of ends) {
        k.front("stucco", 0.28, top - 0.2, 1.6, (top - 0.2) / 2, z);
        k.flat(
          "cream",
          new THREE.RingGeometry(0.75, 0.95, 16, 1, 0, Math.PI),
          top - 0.25,
          z,
          0.3,
        );
      }
      const mid = slots(L - 2.4, 2.2, 0.6);
      for (const z of [...mid, ...ends]) {
        const off = ends.includes(z) ? 0.28 : 0;
        window(k, 1.6, z, 0.95, 1.7, { lit: true, arch: true, frame: "cream" });
        k.front("cream", 0.14 + off, 0.16, 1.35, 0.7, z, 0.02);
        if (upper) {
          window(k, 4.1, z, 0.8, 1.5, {
            lit: k.r() < 0.7,
            arch: true,
            frame: "cream",
          });
          k.front("cream", 0.18 + off, 0.12, 1.25, 5.05, z, 0.02);
        }
      }
      k.front("cream", 0.2, 0.2, L - 0.1, 3.05, 0);
      k.front("cream", 0.38, 0.34, L, top - 0.1, 0);
      gableAlong(k, top + 0.1, "roofSlate", 1.0);
      for (const z of ends) dome(k, k.at(0.9), top + 0.2, z, 0.75);
      if (L > 8) dome(k, k.at(1.6), top + 0.6, 0, 0.95);
      break;
    }
    case "gate-warehouse": {
      // After the old warehouse round a courtyard: soft stone, hip roof of
      // dark tiles with big roof creatures, a red-brick gatehouse with three
      // small arched windows, small arched windows along the walls.
      body(k, "stone");
      plinth(k);
      for (const z of slots(L, 2.2)) {
        if (Math.abs(z) < 2.0) continue;
        window(k, upper ? 3.9 : 2.3, z, 0.6, 0.8, {
          glass: "woodDark",
          arch: true,
          frame: "plaster",
        });
      }
      const gw = Math.min(3.6, L * 0.4);
      k.front("brick", 0.35, 4.2, gw, 2.1, 0);
      for (const dz of [-gw / 3, 0, gw / 3])
        window(k, 3.35, dz, 0.42, 0.6, {
          lit: true,
          arch: true,
          frame: "cream",
        });
      k.front("stoneDark", 0.4, 2.6, 1.7, 1.3, 0);
      k.front("woodDark", 0.12, 2.2, 1.3, 1.1, 0, 0.38);
      k.flat(
        "woodDark",
        new THREE.CircleGeometry(0.65, 12, 0, Math.PI),
        2.2,
        0,
        0.5,
      );
      // The gatehouse's own small tiled roof, above head height.
      k.box(
        "roofTile",
        1.4,
        0.5,
        gw + 0.5,
        k.at(0.2),
        4.45,
        0,
        E(0, 0, k.out * 0.25),
      );
      k.box(
        "snow",
        1.3,
        0.12,
        gw + 0.4,
        k.at(0.2),
        4.72,
        0,
        E(0, 0, k.out * 0.25),
      );
      const rh = hipRoof(k, top, "roofTile");
      vents(k, top, rh, Math.max(2, Math.floor(L / 4)));
      creatures(k, f.creatures || 8, top + rh, 2.2);
      break;
    }
    case "hotel": {
      // Early-Showa block: three storeys, flat roof, regular windows.
      const tall = top + (f.extraStorey ? 2.4 : 0);
      body(k, "tileTan", tall);
      plinth(k, "stoneDark", 0.6);
      for (const z of slots(L, 2.2, 0.9))
        window(k, 1.5, z, 1.4, 1.6, { lit: true, frame: "cream" });
      for (let y = 3.9; y < tall - 0.9; y += 2.4) {
        k.front("cream", 0.12, 0.14, L - 0.2, y - 1.05, 0);
        for (const z of slots(L, 1.6, 0.8))
          window(k, y, z, 0.75, 1.3, { lit: k.r() < 0.65, frame: "cream" });
      }
      // Entrance canopy, above head height.
      k.front("cream", 1.2, 0.16, 3.0, 2.75, 0);
      k.front("snow", 1.1, 0.1, 2.9, 2.88, 0);
      flatRoof(k, tall, "tileTan");
      break;
    }
    case "canal-warehouse": {
      body(k, "stone");
      plinth(k);
      for (const s of [-1, 1]) ironDoors(k, s * L * 0.25, 2.0, 2.6);
      if (upper)
        for (const z of slots(L, 1.6, 0.7)) shuttered(k, 4.0, z, 0.6, 0.75);
      const rh = gableAlong(k, top, "roofTile");
      creatures(k, f.creatures || 2, top + rh);
      if (f.mark) mark(k, f.mark, 2.95, L / 2 - 1.0, 0.7);
      break;
    }
    case "stone-warehouse": {
      body(k, WALL[f.wall]);
      plinth(k);
      if (f.canopy) {
        // Converted to shops: lit fronts under a long tiled eave, lanterns.
        window(k, 1.3, 0, L - 1.4, 1.9, { lit: true });
        for (const z of slots(L, 2.4))
          k.front("woodDark", 0.08, 2.0, 0.12, 1.3, z + 1.2, 0.02);
        eave(k, 2.8, L - 0.2);
        lanterns(k, 2.3, slots(L, 3.2, 1.2));
      } else ironDoors(k, (k.r() - 0.5) * (L - 4), Math.min(2.2, L * 0.3));
      if (upper) for (const z of slots(L, 2.6)) shuttered(k, 4.0, z);
      if (f.shutters && upper)
        for (const z of slots(L, 2.6))
          k.front("plaster", 0.12, 1.1, 0.9, 4.0, z + 0.05, 0.03);
      if (f.mark)
        mark(k, f.mark, f.canopy ? 3.6 : 2.95, k.b.side * (L / 2 - 0.9));
      gableAlong(k, top, roof);
      if (f.fireWalls) fireWalls(k, top);
      break;
    }
    case "clapboard-house": {
      // Western-style wooden house (common in Otaru): painted clapboard,
      // gable to the street, white-framed sash windows, a small porch roof.
      body(k, "clapboard");
      plinth(k, "stoneDark", 0.5);
      for (const z of slots(L, 2.0, 0.9)) {
        window(k, 1.5, z, 0.8, 1.4, { lit: k.r() < 0.8, frame: "cream" });
        k.front("cream", 0.04, 1.4, 0.05, 1.5, z, 0.04);
        if (upper) {
          window(k, 4.0, z, 0.7, 1.3, { lit: k.r() < 0.6, frame: "cream" });
          k.front("cream", 0.04, 0.04, 0.7, 4.0, z, 0.04);
        }
      }
      for (const end of [-1, 1])
        k.front("cream", 0.08, top, 0.16, top / 2, end * (L / 2 - 0.15), 0.01);
      k.front("cream", 1.0, 0.12, 2.0, 2.6, -L / 2 + 1.4);
      k.front("snow", 0.95, 0.1, 1.95, 2.7, -L / 2 + 1.4);
      gableFacing(k, top, "roofSlate", "clapboard");
      break;
    }
    default: {
      // Wooden shop: lit window, canopy, sign, curtain, lattice above.
      body(k, "wood");
      window(k, 1.4, 0, Math.min(L - 1.2, 5), 1.7, { lit: true });
      sign(k, 2.75, Math.min(4, L * 0.55));
      const can = Math.min(L - 0.8, 5.6);
      k.box(
        "roofRed",
        1.1,
        0.08,
        can,
        k.at(0.5),
        2.35,
        0,
        E(0, 0, k.out * 0.35),
      );
      k.box("snow", 1.0, 0.1, can, k.at(0.5), 2.43, 0, E(0, 0, k.out * 0.35));
      curtain(k, -L / 2 + 1);
      if (upper)
        for (const z of slots(L, 2.6)) {
          window(k, 3.9, z, 1.1, 1.2, { lit: k.r() < 0.7 });
          lattice(k, 3.9, 1.2, z - 0.5, z + 0.5, 0.25);
        }
      gableAlong(k, top, f.roof === "tile" ? "roofTile" : "roofRed");
      if (f.fireWalls) fireWalls(k, top);
      break;
    }
  }
}
