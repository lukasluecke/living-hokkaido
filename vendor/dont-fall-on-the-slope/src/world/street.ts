// Builds the street's meshes from a Track: ice following the path,
// shopfronts, street furniture, fellow visitors and the canal. All static
// geometry is merged by material (see merge.ts). Placement uses the same
// poses as the physics colliders, so what you see is what you hit.
import * as THREE from "three";
import { frameAt, frameQuat, pointAt, ribbon } from "../core/path";
import { rng } from "../core/random";
import type { Building, Obstacle, Track } from "../core/track";
import { buildingBox, obstaclePose } from "../physics/world";
import { PALETTE, type PaletteName } from "../style/palette";
import { local, Merger, placed } from "./merge";
import { iceTexture, stoneTexture, woodTexture } from "./textures";

const MAT_KEYS = [
  "snow",
  "stone",
  "stoneDark",
  "wood",
  "woodDark",
  "plaster",
  "brick",
  "roofSlate",
  "roofRed",
  "iron",
  "window",
  "glass",
  "lamp",
  "icicle",
  "noren",
  "skin",
  "trousers",
  "touristMustard",
  "touristMoss",
  "touristPlum",
  "touristSky",
  "water",
] as const;
type Mat = (typeof MAT_KEYS)[number];
const COATS: Mat[] = [
  "touristMustard",
  "touristMoss",
  "touristPlum",
  "touristSky",
];

function materials(): Record<Mat, THREE.Material> {
  const std = (
    name: PaletteName,
    extra: THREE.MeshStandardMaterialParameters = {},
  ) =>
    new THREE.MeshStandardMaterial({
      color: PALETTE[name],
      roughness: 0.85,
      ...extra,
    });
  const glow = (name: PaletteName, intensity: number) =>
    std(name, { emissive: PALETTE[name], emissiveIntensity: intensity });
  const m = {} as Record<Mat, THREE.Material>;
  for (const k of MAT_KEYS) m[k] = std(k as PaletteName);
  m.snow = std("snow", { flatShading: true });
  m.stone = std("stone", { map: stoneTexture(THREE) });
  m.wood = std("wood", { map: woodTexture(THREE) });
  m.iron = std("iron", { roughness: 0.5, metalness: 0.4 });
  m.window = glow("window", 0.9);
  m.glass = glow("glassGlow", 0.75);
  m.lamp = glow("lamp", 2);
  m.icicle = std("icicle", { roughness: 0.2, flatShading: true });
  m.water = std("water", { roughness: 0.15, metalness: 0.2 });
  return m;
}

export function buildStreet(track: Track): THREE.Group {
  const root = new THREE.Group();
  const L = track.length;
  const W = track.halfWidth;
  const m = new Merger<Mat>();

  // Ice ribbon from behind the start to the canal edge.
  const ice = ribbon(track.path, [-(W + 1.2), W + 1.2], -20, L + 7);
  const iceGeo = new THREE.BufferGeometry();
  iceGeo.setAttribute("position", new THREE.BufferAttribute(ice.positions, 3));
  for (let i = 1; i < ice.uvs.length; i += 2)
    ice.uvs[i] = (ice.uvs[i] ?? 0) / 10;
  iceGeo.setAttribute("uv", new THREE.BufferAttribute(ice.uvs, 2));
  iceGeo.setIndex(new THREE.BufferAttribute(ice.indices, 1));
  iceGeo.computeVertexNormals();
  const iceMap = iceTexture(THREE);
  iceMap.repeat.set(1.5, 1);
  const street = new THREE.Mesh(
    iceGeo,
    new THREE.MeshStandardMaterial({
      color: PALETTE.snow,
      map: iceMap,
      roughness: 0.25,
      metalness: 0.05,
    }),
  );
  street.receiveShadow = true;
  root.add(street);

  // Snow banks along the foot of the facades.
  for (const side of [-1, 1]) {
    const xs = side < 0 ? [-(W + 0.6), -(W - 0.15)] : [W - 0.15, W + 0.6];
    const bank = ribbon(track.path, xs, -20, L + 7, 0.1);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(bank.positions, 3));
    g.setIndex(new THREE.BufferAttribute(bank.indices, 1));
    m.add("snow", g, new THREE.Matrix4());
  }

  for (const b of track.buildings) building(m, track, b);
  for (const o of track.obstacles) obstacle(m, track, o);

  // The canal: dark water below the end of the street, an embankment edge,
  // and warehouses on the far bank.
  const fw = frameAt(track.path, L + 30);
  m.add(
    "water",
    new THREE.PlaneGeometry(90, 50).rotateX(-Math.PI / 2),
    placed(pointAt(track.path, 0, -2.5, L + 30), frameQuat(fw, true)),
  );
  const fe = frameAt(track.path, L + 7.3);
  m.add(
    "stone",
    new THREE.BoxGeometry(W * 2 + 3, 0.5, 0.6),
    placed(pointAt(track.path, 0, -0.05, L + 7.3), frameQuat(fe)),
  );
  const ff = frameAt(track.path, L + 52);
  for (let i = -3; i <= 3; i++) {
    const p = pointAt(track.path, i * 12, 1, L + 52);
    m.add(
      "stone",
      new THREE.BoxGeometry(11, 8, 8),
      placed([p[0], p[1] + 1, p[2]], frameQuat(ff, true)),
    );
    m.add(
      "snow",
      new THREE.BoxGeometry(11.2, 0.5, 8.2),
      placed([p[0], p[1] + 5.2, p[2]], frameQuat(ff, true)),
    );
  }

  root.add(
    m.build(materials(), {
      stone: { cast: true, receive: true },
      wood: { cast: true, receive: true },
      plaster: { cast: true, receive: true },
      brick: { cast: true },
      iron: { cast: true },
      snow: { cast: true, receive: true },
      skin: { cast: true },
      trousers: { cast: true },
      touristMustard: { cast: true },
      touristMoss: { cast: true },
      touristPlum: { cast: true },
      touristSky: { cast: true },
    }),
  );
  return root;
}

const E = (x = 0, y = 0, z = 0) => new THREE.Euler(x, y, z);

/** A building, upright, its front flush with the street edge. Local axes:
 *  x across (street is toward -side), y up from the ice at the facade
 *  middle, z along the street (-z is downhill). */
function building(m: Merger<Mat>, track: Track, b: Building) {
  const r = rng(b.look + 17);
  const box = buildingBox(track, b);
  const len = b.s1 - b.s0;
  const ground = pointAt(
    track.path,
    b.side * (track.halfWidth + b.depth / 2),
    0,
    b.s0 + len / 2,
  );
  const M = placed(ground, box.rot);
  const face = -b.side * (b.depth / 2);
  const out = -b.side; // direction toward the street
  const turnToStreet = b.side > 0 ? -Math.PI / 2 : Math.PI / 2;
  const wall: Mat =
    b.kind === "stone-warehouse"
      ? "stone"
      : b.kind === "wooden-shop"
        ? "wood"
        : "plaster";

  m.add(
    wall,
    new THREE.BoxGeometry(b.depth, b.h + box.sink, len - 0.2),
    local(M, 0, (b.h - box.sink) / 2, 0),
  );

  // Gabled roof along the street, snow on top, icicles on the street eave.
  const roofH = 1.6 + b.depth * 0.12;
  const shape = new THREE.Shape();
  shape.moveTo(-b.depth / 2 - 0.45, 0);
  shape.lineTo(0, roofH);
  shape.lineTo(b.depth / 2 + 0.45, 0);
  shape.closePath();
  const roof = new THREE.ExtrudeGeometry(shape, {
    depth: len,
    bevelEnabled: false,
  }).translate(0, 0, -len / 2);
  const roofMat: Mat = b.kind === "wooden-shop" ? "roofRed" : "roofSlate";
  m.add(roofMat, roof.clone(), local(M, 0, b.h, 0));
  m.add(
    "snow",
    roof,
    local(M, 0, b.h + roofH * 0.42, 0, E(), [0.97, 0.6, 1.01]),
  );
  for (let z = -len / 2 + 0.3; z < len / 2 - 0.2; z += 0.45 + r() * 0.3) {
    const l = 0.15 + r() * 0.45;
    m.add(
      "icicle",
      new THREE.ConeGeometry(0.05, l, 4),
      local(M, out * (b.depth / 2 + 0.4), b.h - l / 2, z, E(Math.PI)),
    );
  }

  // Upper-floor windows on every building.
  const n = Math.max(1, Math.floor(len / 3));
  const slot = (i: number) => -len / 2 + (i + 0.5) * (len / n);
  for (let i = 0; i < n; i++) {
    if (b.h < 5.2) break;
    const lit = r() < 0.7;
    m.add(
      b.kind === "stone-warehouse" ? "iron" : lit ? "window" : "woodDark",
      new THREE.PlaneGeometry(1.1, 1.2),
      local(M, face + out * 0.02, 3.9, slot(i), E(0, turnToStreet)),
    );
    if (b.kind === "wooden-shop") {
      // Lattice bars over the window.
      for (const dz of [-0.3, 0, 0.3])
        m.add(
          "woodDark",
          new THREE.BoxGeometry(0.06, 1.2, 0.06),
          local(M, face + out * 0.05, 3.9, slot(i) + dz),
        );
    }
  }

  if (b.kind === "stone-warehouse") {
    // Darker plinth, a big plank door with iron bands.
    m.add(
      "stoneDark",
      new THREE.BoxGeometry(b.depth + 0.2, 0.9 + box.sink, len - 0.1),
      local(M, 0, (0.9 - box.sink) / 2, 0),
    );
    const doorW = Math.min(2.4, len * 0.35);
    m.add(
      "woodDark",
      new THREE.BoxGeometry(0.15, 2.6, doorW),
      local(M, face + out * 0.05, 1.3, 0),
    );
    for (const y of [0.7, 1.9])
      m.add(
        "iron",
        new THREE.BoxGeometry(0.18, 0.12, doorW + 0.05),
        local(M, face + out * 0.07, y, 0),
      );
  } else {
    // Shop or workshop: a wide lit window at street level.
    const winLen = Math.min(len - 1.2, 5);
    m.add(
      b.kind === "glass-workshop" ? "glass" : "window",
      new THREE.PlaneGeometry(winLen, 1.7),
      local(M, face + out * 0.02, 1.4, 0, E(0, turnToStreet)),
    );
    // Sign board with a cap of snow.
    const signLen = Math.min(4, len * 0.55);
    m.add(
      "woodDark",
      new THREE.BoxGeometry(0.12, 0.55, signLen),
      local(M, face + out * 0.1, 2.75, 0),
    );
    m.add(
      "snow",
      new THREE.BoxGeometry(0.3, 0.12, signLen),
      local(M, face + out * 0.12, 3.08, 0),
    );
  }
  if (b.kind === "wooden-shop") {
    // Sloped canopy over the shop window, snow on it, and a door curtain.
    const canLen = Math.min(len - 0.8, 5.6);
    m.add(
      "roofRed",
      new THREE.BoxGeometry(1.1, 0.08, canLen),
      local(M, face + out * 0.5, 2.35, 0, E(0, 0, out * 0.35)),
    );
    m.add(
      "snow",
      new THREE.BoxGeometry(1.0, 0.1, canLen),
      local(M, face + out * 0.5, 2.43, 0, E(0, 0, out * 0.35)),
    );
    for (const dz of [-0.28, 0.28])
      m.add(
        "noren",
        new THREE.PlaneGeometry(0.5, 0.8),
        local(
          M,
          face + out * 0.06,
          1.85,
          -len / 2 + 1 + dz,
          E(0, turnToStreet),
        ),
      );
  }
  if (b.kind === "glass-workshop") {
    // A brick chimney at the back of the roof, capped with snow.
    const z = (r() - 0.5) * (len - 2);
    m.add(
      "brick",
      new THREE.BoxGeometry(0.8, 2.6, 0.8),
      local(M, b.side * (b.depth / 4), b.h + 1.3, z),
    );
    m.add(
      "snow",
      new THREE.BoxGeometry(0.9, 0.15, 0.9),
      local(M, b.side * (b.depth / 4), b.h + 2.65, z),
    );
  }
}

/** Obstacles, drawn around the same centre the physics collider uses. */
function obstacle(m: Merger<Mat>, track: Track, o: Obstacle) {
  const { pos, rot } = obstaclePose(track, o);
  const M = placed(pos, rot);
  const base = -o.h / 2;
  const r = rng(o.look + 5);
  switch (o.kind) {
    case "snow-pile":
      m.add(
        "snow",
        new THREE.IcosahedronGeometry(0.5, 1),
        local(M, 0, base + o.h * 0.35, 0, E(0, r() * 3), [o.w, o.h * 1.6, o.d]),
      );
      break;
    case "crate":
      m.add("wood", new THREE.BoxGeometry(o.w, o.h, o.d), M.clone());
      m.add(
        "snow",
        new THREE.BoxGeometry(o.w * 0.95, 0.12, o.d * 0.95),
        local(M, 0, o.h / 2 + 0.05, 0),
      );
      break;
    case "lamp-post":
      m.add(
        "iron",
        new THREE.CylinderGeometry(o.w / 3, o.w / 2, o.h, 8),
        M.clone(),
      );
      m.add(
        "lamp",
        new THREE.BoxGeometry(0.4, 0.5, 0.4),
        local(M, 0, o.h / 2 + 0.25, 0),
      );
      m.add(
        "iron",
        new THREE.ConeGeometry(0.38, 0.3, 4),
        local(M, 0, o.h / 2 + 0.65, 0, E(0, Math.PI / 4)),
      );
      m.add(
        "snow",
        new THREE.ConeGeometry(0.3, 0.14, 4),
        local(M, 0, o.h / 2 + 0.83, 0, E(0, Math.PI / 4)),
      );
      break;
    case "bicycle": {
      // Along local z: two wheels, a frame, handlebars, a snowy seat.
      for (const z of [-0.55, 0.55])
        m.add(
          "iron",
          new THREE.TorusGeometry(0.32, 0.035, 6, 16),
          local(M, 0, base + 0.34, z, E(0, Math.PI / 2)),
        );
      m.add(
        "touristSky",
        new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6),
        local(M, 0, base + 0.55, 0, E(Math.PI / 2 - 0.2)),
      );
      m.add(
        "touristSky",
        new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6),
        local(M, 0, base + 0.62, 0.3, E(0.4)),
      );
      m.add(
        "iron",
        new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6),
        local(M, 0, base + 0.95, -0.5, E(0, 0, Math.PI / 2)),
      );
      m.add(
        "woodDark",
        new THREE.BoxGeometry(0.14, 0.06, 0.25),
        local(M, 0, base + 0.85, 0.35),
      );
      m.add(
        "snow",
        new THREE.BoxGeometry(0.16, 0.06, 0.26),
        local(M, 0, base + 0.9, 0.35),
      );
      break;
    }
    case "tourist": {
      // A fellow visitor: legs, coat, head, a hat, a little camera.
      const coat = COATS[o.look % COATS.length] ?? "touristSky";
      const hat = COATS[(o.look + 2) % COATS.length] ?? "noren";
      for (const x of [-0.1, 0.1])
        m.add(
          "trousers",
          new THREE.BoxGeometry(0.14, 0.75, 0.16),
          local(M, x, base + 0.375, 0),
        );
      m.add(
        coat,
        new THREE.CapsuleGeometry(0.22, 0.45, 4, 10),
        local(M, 0, base + 1.05, 0),
      );
      m.add(
        "skin",
        new THREE.SphereGeometry(0.15, 12, 10),
        local(M, 0, base + 1.5, 0),
      );
      m.add(
        hat,
        new THREE.SphereGeometry(0.16, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        local(M, 0, base + 1.53, 0),
      );
      if (r() < 0.6)
        m.add(
          "iron",
          new THREE.BoxGeometry(0.16, 0.1, 0.08),
          local(M, 0, base + 1.35, -0.25),
        );
      break;
    }
  }
}
