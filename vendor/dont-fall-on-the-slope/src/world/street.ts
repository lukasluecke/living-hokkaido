// Builds the street's meshes from a Track: ice following the path,
// shopfronts, street furniture, fellow visitors and the canal. All static
// geometry is merged by material (see merge.ts). Placement uses the same
// poses as the physics colliders, so what you see is what you hit.
import * as THREE from "three";
import { frameAt, frameQuat, pointAt, ribbon } from "../core/path";
import { placeCaptions } from "../core/captions";
import { facadesFor } from "../core/facades";
import { rng } from "../core/random";
import type { Obstacle, Track } from "../core/track";
import { obstaclePose, PLAYER } from "../physics/world";
import { PALETTE, type PaletteName } from "../style/palette";
import { drawBuilding } from "./buildings";
import { local, Merger, placed } from "./merge";
import {
  brickTexture,
  clapboardTexture,
  iceTexture,
  kawaraTexture,
  stoneTexture,
  woodTexture,
} from "./textures";

const MAT_KEYS = [
  "snow",
  "clapboard",
  "lanternRed",
  "verdigris",
  "stucco",
  "tileTan",
  "tuff",
  "roofTile",
  "ceramic",
  "clockFace",
  "cream",
  "ink",
  "glassAmber",
  "glassRose",
  "footprint",
  "icePatch",
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
export type Mat = (typeof MAT_KEYS)[number];
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
  m.roofTile = std("roofTile", {
    map: kawaraTexture(THREE),
    color: PALETTE.snow,
  });
  m.brick = std("brick", { map: brickTexture(THREE), color: PALETTE.snow });
  m.verdigris = std("verdigris", { roughness: 0.6, metalness: 0.25 });
  m.clapboard = std("clapboard", {
    map: clapboardTexture(THREE),
    color: PALETTE.snow,
  });
  m.lanternRed = glow("lanternRed", 0.8);
  m.glassAmber = glow("glassAmber", 1.1);
  m.glassRose = glow("glassRose", 1.0);
  // Road decals sit a hair above the ice; offset so they never flicker.
  const decal = {
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  };
  m.footprint = std("footprint", { roughness: 0.95, ...decal });
  m.icePatch = std("icePatch", { roughness: 0.06, metalness: 0.15, ...decal });
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

  // The 12 gallery buildings get the looks from content/otaru-slope.md.
  const captions = placeCaptions(track.buildings, L - PLAYER.startS);
  const facades = facadesFor(track.buildings, captions);
  for (const b of track.buildings) {
    const f = facades.get(b.id);
    if (f) drawBuilding(m, track, b, f);
  }
  roadDecals(m, track);
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

/** Footprints wandering down the street and patches of polished ice. */
function roadDecals(m: Merger<Mat>, track: Track) {
  const r = rng(track.seed + 7);
  const W = track.halfWidth;
  const flat = (
    x: number,
    h: number,
    s: number,
    yaw: number,
    sx: number,
    sz: number,
  ) =>
    local(
      placed(pointAt(track.path, x, h, s), frameQuat(frameAt(track.path, s))),
      0,
      0,
      0,
      E(-Math.PI / 2, 0, yaw),
      [sx, sz, 1],
    );
  // Footprints: trails of left/right prints.
  for (let t = 0; t < 26; t++) {
    let s = r() * (track.length - 10);
    let x = (r() * 2 - 1) * (W - 0.8);
    let heading = (r() - 0.5) * 0.8;
    const steps = 10 + Math.floor(r() * 18);
    for (let i = 0; i < steps; i++) {
      const foot = i % 2 === 0 ? -1 : 1;
      m.add(
        "footprint",
        new THREE.CircleGeometry(0.07, 8),
        flat(x + foot * 0.11, 0.012, s, heading, 1, 1.9),
      );
      s += 0.68 * Math.cos(heading);
      x = Math.max(-W + 0.4, Math.min(W - 0.4, x + 0.68 * Math.sin(heading)));
      heading += (r() - 0.5) * 0.25;
    }
  }
  // Ice patches: irregular glossy shapes.
  for (let p = 0; p < 34; p++) {
    const g = new THREE.CircleGeometry(1, 9);
    const pos = g.getAttribute("position");
    for (let i = 1; i < pos.count; i++) {
      const k = 0.7 + r() * 0.5;
      pos.setXY(i, pos.getX(i) * k, pos.getY(i) * k);
    }
    const s = 6 + r() * (track.length - 10);
    const size = 0.6 + r() * 1.4;
    m.add(
      "icePatch",
      g,
      flat(
        (r() * 2 - 1) * (W - 1),
        0.02,
        s,
        r() * Math.PI,
        size,
        size * (1 + r()),
      ),
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
    case "lamp-post": {
      // A gas lamp: round base, slim post, ladder bar, glazed lantern with
      // a pointed cap. The lantern sits where the halo is (h/2 + 0.25).
      m.add(
        "iron",
        new THREE.CylinderGeometry(o.w / 2, o.w / 2, 0.5, 8),
        local(M, 0, base + 0.25, 0),
      );
      m.add(
        "iron",
        new THREE.CylinderGeometry(0.045, 0.06, o.h - 0.5, 8),
        local(M, 0, base + 0.25 + (o.h - 0.5) / 2, 0),
      );
      m.add(
        "iron",
        new THREE.BoxGeometry(0.5, 0.04, 0.04),
        local(M, 0, o.h / 2 - 0.35, 0),
      );
      m.add(
        "iron",
        new THREE.BoxGeometry(0.34, 0.05, 0.34),
        local(M, 0, o.h / 2 - 0.02, 0),
      );
      m.add(
        "lamp",
        new THREE.CylinderGeometry(0.2, 0.15, 0.48, 4, 1),
        local(M, 0, o.h / 2 + 0.25, 0, E(0, Math.PI / 4)),
      );
      m.add(
        "iron",
        new THREE.ConeGeometry(0.3, 0.3, 4),
        local(M, 0, o.h / 2 + 0.64, 0, E(0, Math.PI / 4)),
      );
      m.add(
        "iron",
        new THREE.SphereGeometry(0.05, 6, 4),
        local(M, 0, o.h / 2 + 0.83, 0),
      );
      m.add(
        "snow",
        new THREE.ConeGeometry(0.24, 0.12, 4),
        local(M, 0, o.h / 2 + 0.74, 0, E(0, Math.PI / 4)),
      );
      break;
    }
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
    case "rickshaw": {
      // Parked rickshaw (人力車): two big wheels, a black hood, red seat
      // and blanket, shafts resting on the snow. Long side along z.
      for (const x of [-0.5, 0.5])
        m.add(
          "iron",
          new THREE.TorusGeometry(0.62, 0.05, 6, 20),
          local(M, x, base + 0.64, 0.2, E(0, Math.PI / 2)),
        );
      m.add(
        "woodDark",
        new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6),
        local(M, 0, base + 0.64, 0.2, E(0, 0, Math.PI / 2)),
      );
      m.add(
        "lanternRed",
        new THREE.BoxGeometry(0.9, 0.18, 0.6),
        local(M, 0, base + 0.9, 0.25),
      );
      m.add(
        "lanternRed",
        new THREE.BoxGeometry(0.9, 0.6, 0.12),
        local(M, 0, base + 1.15, 0.55),
      );
      m.add(
        "ink",
        new THREE.SphereGeometry(0.55, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        local(M, 0, base + 1.2, 0.45, E(-0.5), [0.9, 0.75, 0.7]),
      );
      for (const x of [-0.4, 0.4])
        m.add(
          "woodDark",
          new THREE.BoxGeometry(0.06, 0.06, 1.7),
          local(M, x, base + 0.45, -0.75, E(-0.25)),
        );
      m.add(
        "woodDark",
        new THREE.BoxGeometry(0.9, 0.06, 0.06),
        local(M, 0, base + 0.15, -1.55),
      );
      m.add(
        "snow",
        new THREE.BoxGeometry(0.8, 0.06, 0.5),
        local(M, 0, base + 1.02, 0.2),
      );
      break;
    }
    case "herring-crates": {
      // Stacked wooden fish crates (鰊箱), a little askew, snow on top.
      const n = 3 + Math.floor(r() * 2);
      for (let i = 0; i < n; i++) {
        const hgt = o.h / n;
        m.add(
          "wood",
          new THREE.BoxGeometry(o.w - 0.1, hgt - 0.03, o.d - 0.1),
          local(
            M,
            (r() - 0.5) * 0.1,
            base + hgt * (i + 0.5),
            (r() - 0.5) * 0.08,
            E(0, (r() - 0.5) * 0.12),
          ),
        );
        m.add(
          "woodDark",
          new THREE.BoxGeometry(o.w - 0.05, 0.04, o.d - 0.05),
          local(M, 0, base + hgt * (i + 1) - 0.03, 0),
        );
      }
      m.add(
        "snow",
        new THREE.BoxGeometry(o.w - 0.12, 0.1, o.d - 0.12),
        local(M, 0, o.h / 2 + 0.03, 0),
      );
      break;
    }
    case "sled": {
      // A child's wooden sled: two curled runners, slats, a red tow rope.
      for (const x of [-0.24, 0.24]) {
        m.add(
          "woodDark",
          new THREE.BoxGeometry(0.05, 0.05, o.d),
          local(M, x, base + 0.03, 0),
        );
        m.add(
          "woodDark",
          new THREE.TorusGeometry(0.1, 0.025, 4, 8, Math.PI),
          local(M, x, base + 0.13, -o.d / 2, E(0, Math.PI / 2, Math.PI / 2)),
        );
        m.add(
          "woodDark",
          new THREE.BoxGeometry(0.04, 0.2, 0.04),
          local(M, x, base + 0.13, o.d / 4),
        );
        m.add(
          "woodDark",
          new THREE.BoxGeometry(0.04, 0.2, 0.04),
          local(M, x, base + 0.13, -o.d / 4),
        );
      }
      m.add(
        "wood",
        new THREE.BoxGeometry(0.58, 0.05, o.d - 0.15),
        local(M, 0, base + 0.25, 0.05),
      );
      m.add(
        "lanternRed",
        new THREE.TorusGeometry(0.22, 0.02, 4, 12, Math.PI),
        local(M, 0, base + 0.08, -o.d / 2 - 0.2, E(-Math.PI / 2)),
      );
      m.add(
        "snow",
        new THREE.BoxGeometry(0.4, 0.05, 0.5),
        local(M, 0.05, base + 0.3, 0.15),
      );
      break;
    }
    case "snowman": {
      // Japanese snowman: two balls, charcoal eyes, a red bucket hat.
      m.add(
        "snow",
        new THREE.SphereGeometry(0.45, 12, 10),
        local(M, 0, base + 0.42, 0),
      );
      m.add(
        "snow",
        new THREE.SphereGeometry(0.32, 12, 10),
        local(M, 0, base + 0.98, 0),
      );
      for (const x of [-0.11, 0.11])
        m.add(
          "ink",
          new THREE.SphereGeometry(0.04, 6, 4),
          local(M, x, base + 1.03, -0.29),
        );
      m.add(
        "lanternRed",
        new THREE.CylinderGeometry(0.17, 0.22, 0.24, 10),
        local(M, 0, base + 1.32, 0, E(0.2)),
      );
      m.add(
        "woodDark",
        new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4),
        local(M, 0.42, base + 0.9, 0, E(0, 0, 1.0)),
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
      // Cameras are animated in the view (render/view.ts, core/tourists.ts).
      break;
    }
  }
}
