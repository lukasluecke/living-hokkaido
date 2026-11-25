import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  bandMatTexture,
  matTexture,
  reedTexture,
  rng,
  thatchTexture,
  woodTexture,
} from "./textures";

// An illustrative lake-house interior in the toon look. Original geometry,
// MIT. It is NOT a reconstruction of a specific Ainu house (see PROJECT.md).
// The museum photos of the Hokkaido Museum's restored house were a visual
// reference only; no photo or texture from them is used.

export const ROOM = { w: 7.2, d: 5.2, h: 2.2, peak: 4.3 } as const;
const HW = ROOM.w / 2;
const HD = ROOM.d / 2;

// Layout (scene space, +Z toward the camera). After the Hokkaido Museum
// panels on its restored house (claims in src/content/bark-to-cloth/
// over-time.ts): entry area with bark, cattail and a mortar by the door
// (`panel-entry`), a long hearth in the centre with a pot on a hook
// (`panel-hearth`, `cise-hearth`), fish smoked on a rack above it
// (`panel-smoked-fish`), and lacquerware at the upper seat, on the wall
// opposite the entrance, with patterned mats (`panel-treasures`). The
// window that the panel names on that wall is NOT drawn (sacred; it needs
// an Ainu cultural reviewer). Shapes stay generic toy shapes, not copies
// of museum objects.
/** Door in the south wall (x range), inside the entry area. */
const DOOR = { x0: -3.05, x1: -2.15, h: 1.65 } as const;
/** Entry area: earth floor west of this x. */
export const ENTRY_X = -2.05;

type V3 = [number, number, number];
type Box = { p: V3; s: V3; r?: V3 };

function Boxes({
  items,
  material,
}: {
  items: Box[];
  material: THREE.Material;
}) {
  return (
    <>
      {items.map((b, i) => (
        <mesh
          key={i}
          position={b.p}
          rotation={b.r ?? [0, 0, 0]}
          material={material}
          castShadow
          receiveShadow
        >
          <boxGeometry args={b.s} />
        </mesh>
      ))}
    </>
  );
}

/** A round pole from a to b. */
export type Pole = { a: V3; b: V3; r: number };
const UP = new THREE.Vector3(0, 1, 0);
function poleTransform(p: Pole) {
  const a = new THREE.Vector3(...p.a);
  const b = new THREE.Vector3(...p.b);
  const d = b.clone().sub(a);
  const q = new THREE.Quaternion().setFromUnitVectors(
    UP,
    d.clone().normalize(),
  );
  return {
    pos: a.add(b).multiplyScalar(0.5),
    quat: q,
    len: d.length(),
  };
}
export function Poles({
  items,
  material,
  sides = 7,
}: {
  items: Pole[];
  material: THREE.Material;
  sides?: number;
}) {
  const t = useMemo(() => items.map(poleTransform), [items]);
  return (
    <>
      {t.map((x, i) => (
        <mesh
          key={i}
          position={x.pos}
          quaternion={x.quat}
          material={material}
          castShadow
          receiveShadow
        >
          <cylinderGeometry
            args={[items[i].r, items[i].r * 1.08, x.len, sides]}
          />
        </mesh>
      ))}
    </>
  );
}

const std = (color: string, roughness = 0.9, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

type Side = "n" | "s" | "e" | "w";
const SIDES: Side[] = ["n", "s", "e", "w"];
/** Outward normal and centre (room space) of each wall side. */
const SIDE_GEO: Record<Side, { n: V3; c: V3 }> = {
  n: { n: [0, 0, -1], c: [0, ROOM.h / 2, -HD] },
  s: { n: [0, 0, 1], c: [0, ROOM.h / 2, HD] },
  e: { n: [1, 0, 0], c: [HW, ROOM.h / 2, 0] },
  w: { n: [-1, 0, 0], c: [-HW, ROOM.h / 2, 0] },
};
/** Opacity of a wall that faces the camera in the explore views. */
const FADED = 0.14;
/** Post centre inside the wall centre line: half wall + post radius + gap. */
const P_IN = 0.09 + 0.1 + 0.01;

type WallMats = {
  reed: THREE.Material;
  reedLong: THREE.Material;
  pole: THREE.Material;
  rope: THREE.Material;
};
function wallMats(): WallMats {
  const t = (m: THREE.MeshStandardMaterial) => {
    m.transparent = false;
    return m;
  };
  return {
    reedLong: t(
      new THREE.MeshStandardMaterial({
        map: reedTexture([6, 1.4]),
        roughness: 0.95,
      }),
    ),
    reed: t(
      new THREE.MeshStandardMaterial({
        map: reedTexture([2, 1.4]),
        roughness: 0.95,
      }),
    ),
    pole: t(std("#b99466", 0.8)),
    rope: t(std("#6e5434", 1)),
  };
}

/** Wall pieces by side. Corner posts belong to a pair of sides and fade
 * only when both sides fade. */
function wallParts() {
  const t = 0.18;
  const h = ROOM.h;
  // East wall has a plain side window between z -0.6..0.6, y 0.9..1.6.
  const win = { z0: -0.6, z1: 0.6, y0: 0.9, y1: 1.6 };
  const southL = DOOR.x0 + HW;
  const southR = HW - DOOR.x1;
  type Part = { walls: Box[]; long: Box[]; poles: Pole[]; ties: Box[] };
  const part = (): Part => ({ walls: [], long: [], poles: [], ties: [] });
  const by: Record<string, Part> = {};
  const at = (k: string) => {
    by[k] ??= part();
    return by[k];
  };
  at("n").long.push({ p: [0, h / 2, -HD], s: [ROOM.w, h, t] });
  at("s").walls.push(
    { p: [-HW + southL / 2, h / 2, HD], s: [southL, h, t] },
    { p: [HW - southR / 2, h / 2, HD], s: [southR, h, t] },
    {
      p: [(DOOR.x0 + DOOR.x1) / 2, (h + DOOR.h) / 2, HD],
      s: [DOOR.x1 - DOOR.x0, h - DOOR.h, t],
    },
  );
  at("w").walls.push({ p: [-HW, h / 2, 0], s: [t, h, ROOM.d] });
  at("e").walls.push(
    { p: [HW, h / 2, (-HD + win.z0) / 2], s: [t, h, win.z0 + HD] },
    { p: [HW, h / 2, (HD + win.z1) / 2], s: [t, h, HD - win.z1] },
    { p: [HW, win.y0 / 2, 0], s: [t, win.y0, win.z1 - win.z0] },
    { p: [HW, (h + win.y1) / 2, 0], s: [t, h - win.y1, win.z1 - win.z0] },
  );
  const i = 0.12; // inside offset from the wall centre line
  const post = (x: number, z: number) => ({
    a: [x, 0, z] as V3,
    b: [x, h + 0.05, z] as V3,
    r: 0.1,
  });
  // Corner posts.
  // Posts stand just inside the reed walls. On the wall centre line their
  // round faces grazed the flat wall faces and flickered when the camera
  // turned (z-fighting).
  const px = HW - P_IN;
  const pz = HD - P_IN;
  at("ne").poles.push(post(px, -pz));
  at("nw").poles.push(post(-px, -pz));
  at("se").poles.push(post(px, pz));
  at("sw").poles.push(post(-px, pz));
  for (const x of [-HW / 2, 0, HW / 2]) {
    at("n").poles.push(post(x, -pz));
    at("s").poles.push(post(x, pz));
  }
  for (const z of [-HD / 2, HD / 2]) {
    at("w").poles.push(post(-px, z));
    at("e").poles.push(post(px, z));
  }
  for (const x of [DOOR.x0, DOOR.x1])
    at("s").poles.push({ a: [x, 0, HD - i], b: [x, DOOR.h, HD - i], r: 0.06 });
  // Horizontal poles tied across the reed walls, inside, with rope ties
  // where they cross the posts.
  const postsX = [-HW, -HW / 2, 0, HW / 2, HW];
  for (const y of [0.55, 1.15, 1.75]) {
    at("n").poles.push({ a: [-HW, y, -HD + i], b: [HW, y, -HD + i], r: 0.035 });
    at("s").poles.push({
      a: [-HW, y, HD - i],
      b: [DOOR.x0, y, HD - i],
      r: 0.035,
    });
    at("s").poles.push({
      a: [y > DOOR.h ? DOOR.x0 : DOOR.x1, y, HD - i],
      b: [HW, y, HD - i],
      r: 0.035,
    });
    at("w").poles.push({ a: [-HW + i, y, -HD], b: [-HW + i, y, HD], r: 0.035 });
    if (y < win.y0 || y > win.y1)
      at("e").poles.push({ a: [HW - i, y, -HD], b: [HW - i, y, HD], r: 0.035 });
    else
      at("e").poles.push(
        { a: [HW - i, y, -HD], b: [HW - i, y, win.z0], r: 0.035 },
        { a: [HW - i, y, win.z1], b: [HW - i, y, HD], r: 0.035 },
      );
    for (const x of postsX) {
      // Rope bands round the posts.
      const tx = Math.max(-px, Math.min(px, x));
      at("n").ties.push({ p: [tx, y, -pz], s: [0.23, 0.07, 0.23] });
      at("s").ties.push({ p: [tx, y, pz], s: [0.23, 0.07, 0.23] });
    }
    for (const z of [-HD / 2, HD / 2]) {
      at("w").ties.push({ p: [-px, y, z], s: [0.23, 0.07, 0.23] });
      at("e").ties.push({ p: [px, y, z], s: [0.23, 0.07, 0.23] });
    }
  }
  // Wall plates on top of the walls; window frame.
  at("n").poles.push({
    a: [-HW - 0.15, h, -HD],
    b: [HW + 0.15, h, -HD],
    r: 0.09,
  });
  at("s").poles.push({
    a: [-HW - 0.15, h, HD],
    b: [HW + 0.15, h, HD],
    r: 0.09,
  });
  at("w").poles.push({
    a: [-HW, h, -HD - 0.15],
    b: [-HW, h, HD + 0.15],
    r: 0.09,
  });
  at("e").poles.push(
    { a: [HW, h, -HD - 0.15], b: [HW, h, HD + 0.15], r: 0.09 },
    { a: [HW - 0.1, win.y0, -0.65], b: [HW - 0.1, win.y0, 0.65], r: 0.04 },
    { a: [HW - 0.1, win.y1, -0.65], b: [HW - 0.1, win.y1, 0.65], r: 0.04 },
  );
  return by;
}

/**
 * Reed walls on a pole frame. With `lift`, it is an explorable dollhouse:
 * once the roof is up, the walls whose outside faces the camera fade, and
 * they come back when the camera moves (all walls are solid when the
 * camera is inside the room, as in the focus views).
 */
export function Walls({ lift }: { lift?: { current: number } }) {
  const parts = useMemo(wallParts, []);
  const mats = useMemo(
    () => Object.fromEntries(Object.keys(parts).map((k) => [k, wallMats()])),
    [parts],
  );
  const ref = useRef<THREE.Group>(null);
  const fade = useRef<Record<Side, number>>({ n: 0, s: 0, e: 0, w: 0 });
  const tmp = useMemo(
    () => ({
      c: new THREE.Vector3(),
      n: new THREE.Vector3(),
      q: new THREE.Quaternion(),
    }),
    [],
  );
  useFrame(({ camera }, dt) => {
    const g = ref.current;
    if (!g || !lift) return;
    const open = lift.current > 0.6;
    g.getWorldQuaternion(tmp.q);
    for (const side of SIDES) {
      const { c, n } = SIDE_GEO[side];
      tmp.c.set(...c);
      g.localToWorld(tmp.c);
      tmp.n.set(...n).applyQuaternion(tmp.q);
      const facing = tmp.c.sub(camera.position).dot(tmp.n) < 0;
      fade.current[side] = THREE.MathUtils.damp(
        fade.current[side],
        open && facing ? 1 : 0,
        6,
        dt,
      );
    }
    for (const [k, m] of Object.entries(mats)) {
      // A corner fades only when both of its sides fade.
      const f = Math.min(...[...k].map((s) => fade.current[s as Side]));
      const op = 1 - (1 - FADED) * f;
      for (const mat of Object.values(m)) {
        mat.opacity = op;
        mat.depthWrite = op > 0.95;
        // Transparent only while fading: solid walls in the transparent
        // pass are depth-sorted per mesh, and the order flips as the
        // camera turns (pillars and walls flickered in front of each other).
        const clear = op < 0.995;
        if (mat.transparent !== clear) {
          mat.transparent = clear;
          mat.needsUpdate = true;
        }
      }
    }
  });
  return (
    <group name="walls" ref={ref}>
      {Object.entries(parts).map(([k, p]) => (
        <group key={k} name={`wall-${k}`}>
          <Boxes items={p.long} material={mats[k].reedLong} />
          <Boxes items={p.walls} material={mats[k].reed} />
          <Poles items={p.poles} material={mats[k].pole} />
          <Boxes items={p.ties} material={mats[k].rope} />
        </group>
      ))}
    </group>
  );
}

export function Floor() {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: matTexture([3, 3]),
        roughness: 1,
      }),
    [],
  );
  const earth = useMemo(() => std("#6b5a4c", 1), []);
  const sill = useMemo(() => std("#a88458", 0.8), []);
  // Mats on the living floor; bare earth in the entry area and in a strip
  // around the hearth (hearth: x -0.95..0.95, z -0.27..0.67).
  const e = ENTRY_X + 0.08;
  const mats: { p: V3; s: [number, number] }[] = [
    { p: [(e - 1.05) / 2, 0.012, 0], s: [-1.05 - e, ROOM.d - 0.3] },
    {
      p: [(1.05 + HW - 0.15) / 2, 0.012, 0],
      s: [HW - 0.15 - 1.05, ROOM.d - 0.3],
    },
    { p: [0, 0.012, -1.42], s: [2.1, 2.1] },
    { p: [0, 0.012, 1.6], s: [2.1, 1.7] },
  ];
  return (
    <group name="floor">
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        material={earth}
        receiveShadow
      >
        <planeGeometry args={[ROOM.w, ROOM.d]} />
      </mesh>
      {mats.map((m, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={m.p}
          material={mat}
          receiveShadow
        >
          <planeGeometry args={m.s} />
        </mesh>
      ))}
      {/* Log sill between the entry area and the matted floor. */}
      <Poles
        items={[
          {
            a: [ENTRY_X, 0.06, -HD + 0.1],
            b: [ENTRY_X, 0.06, HD - 0.1],
            r: 0.07,
          },
        ]}
        material={sill}
      />
    </group>
  );
}

/** Two-level pole rack over the hearth, hung from two tie beams. Fish hang
 * from it to smoke (`panel-smoked-fish`); the pot hangs on a hook pole
 * (`panel-hearth`). */
function Rack() {
  const wood = useMemo(() => std("#c49e6c", 0.8), []);
  const fish = useMemo(() => std("#7a5132", 0.7), []);
  const cord = useMemo(() => std("#5a4430", 1), []);
  const pot = useMemo(() => std("#2b2724", 0.6, 0.35), []);
  const z0 = -0.3;
  const z1 = 0.7;
  const zc = (z0 + z1) / 2;
  const y1 = 1.95; // upper rack
  const y0 = 1.5; // lower rack
  const poles = useMemo(() => {
    // Hung from the roof frame (lifted away in the home view).
    const out: Pole[] = [];
    for (const z of [z0, z1]) {
      out.push({ a: [-1.1, y1, z], b: [1.1, y1, z], r: 0.04 });
      out.push({ a: [-0.85, y0, z], b: [0.85, y0, z], r: 0.035 });
      for (const x of [-0.95, 0.95])
        out.push({ a: [x, y1, z], b: [x, ROOM.h + 0.5, z], r: 0.02 });
      for (const x of [-0.8, 0.8])
        out.push({ a: [x, y0, z], b: [x, y1, z], r: 0.022 });
    }
    // Slats on the upper rack.
    for (let x = -0.9; x <= 0.91; x += 0.225)
      out.push({
        a: [x, y1 + 0.04, z0 - 0.1],
        b: [x, y1 + 0.04, z1 + 0.1],
        r: 0.014,
      });
    // Lower frame ends and the cross bar for the pot hook.
    for (const x of [-0.8, 0, 0.8])
      out.push({ a: [x, y0, z0], b: [x, y0, z1], r: 0.03 });
    // Pot hook pole.
    out.push({ a: [0, y0, zc], b: [0, 0.78, zc], r: 0.022 });
    return out;
  }, [zc]);
  const fishes = useMemo(() => {
    const r = rng(14);
    const out: { p: V3; ry: number; s: number }[] = [];
    for (const x of [-0.65, -0.4, 0.4, 0.65])
      for (const z of [0.0, 0.42])
        if (r() > 0.2)
          out.push({
            p: [x, y1 - 0.32, z],
            ry: r() * 0.6,
            s: 0.85 + r() * 0.3,
          });
    return out;
  }, []);
  return (
    <group name="rack">
      <Poles items={poles} material={wood} />
      {fishes.map((f, i) => (
        <group key={i} position={f.p} rotation={[0, f.ry, 0]} scale={f.s}>
          {/* Body hangs head down; tail up at the cord. */}
          <mesh material={fish} scale={[0.35, 1, 0.75]} castShadow>
            <sphereGeometry args={[0.13, 10, 8]} />
          </mesh>
          <mesh material={fish} position={[0, 0.16, 0]}>
            <coneGeometry args={[0.06, 0.1, 6]} />
          </mesh>
          <mesh material={cord} position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.12, 4]} />
          </mesh>
        </group>
      ))}
      {/* Hook, bail and iron pot over the fire. */}
      <mesh
        material={pot}
        position={[0, 0.76, zc]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <torusGeometry args={[0.04, 0.008, 6, 12, Math.PI * 1.4]} />
      </mesh>
      <mesh material={pot} position={[0, 0.52, zc]}>
        <torusGeometry args={[0.2, 0.008, 6, 20, Math.PI]} />
      </mesh>
      <mesh material={pot} position={[0, 0.52, zc]} castShadow>
        <sphereGeometry
          args={[0.2, 18, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.42]}
        />
      </mesh>
    </group>
  );
}

/** Things by the door (`panel-entry`): cattail for mats, bark for cloth,
 * a mortar and pestle, plus rope and firewood. */
function EntryArea() {
  const wood = useMemo(() => std("#b88a58", 0.85), []);
  const split = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: woodTexture(),
        color: "#e6c9a0",
        roughness: 0.85,
      }),
    [],
  );
  const rope = useMemo(() => std("#a78a5c", 1), []);
  const bark = useMemo(() => std("#d1b07a", 1), []);
  const cattail = useMemo(() => std("#a59a62", 1), []);
  const mortar = useMemo(() => {
    const pts = [
      [0.21, 0],
      [0.22, 0.06],
      [0.15, 0.24],
      [0.2, 0.5],
      [0.27, 0.66],
      [0.21, 0.67],
      [0.1, 0.46],
      [0, 0.44],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 14);
  }, []);
  const r = useMemo(() => rng(21), []);
  const strips = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        p: [-HW + 0.16, 1.3 - r() * 0.15, -1.15 + i * 0.035] as V3,
        h: 0.7 + r() * 0.35,
        rx: (r() - 0.5) * 0.15,
      })),
    [r],
  );
  const logs = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        p: [-HW + 0.28 + r() * 0.06, 0.42, -0.35 + i * 0.13] as V3,
        r: [0, r() * 0.5, -0.18 - r() * 0.08] as V3,
      })),
    [r],
  );
  return (
    <group name="entry">
      <mesh
        geometry={mortar}
        material={wood}
        position={[-2.75, 0, 0.85]}
        castShadow
      />
      <Poles
        items={[{ a: [-2.72, 0.5, 0.85], b: [-3.2, 1.55, 0.6], r: 0.04 }]}
        material={wood}
      />
      {/* Hanging bark strips. */}
      {strips.map((s, i) => (
        <mesh
          key={i}
          material={bark}
          position={[s.p[0], s.p[1] - s.h / 2 + 0.45, s.p[2]]}
          rotation={[s.rx, 0, 0]}
        >
          <boxGeometry args={[0.008, s.h, 0.03]} />
        </mesh>
      ))}
      {/* Rope coils on the wall. */}
      {[-1.7, -1.5].map((z, i) => (
        <mesh
          key={z}
          material={rope}
          position={[-HW + 0.17, 1.42 - i * 0.08, z]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[1, 1.7, 1]}
        >
          <torusGeometry args={[0.1, 0.03, 6, 14]} />
        </mesh>
      ))}
      {/* Cattail bundle, tied, leaning on the wall. */}
      <group position={[-HW + 0.3, 0, 1.15]} rotation={[0.08, 0, -0.08]}>
        <mesh material={cattail} position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 1.6, 9]} />
        </mesh>
        {[0.45, 1.15].map((y) => (
          <mesh key={y} material={rope} position={[0, y, 0]}>
            <torusGeometry args={[0.115, 0.015, 5, 12]} />
          </mesh>
        ))}
      </group>
      {/* Split firewood stood against the wall. */}
      {logs.map((l, i) => (
        <mesh key={i} material={split} position={l.p} rotation={l.r} castShadow>
          <boxGeometry args={[0.11, 0.85, 0.1]} />
        </mesh>
      ))}
    </group>
  );
}

/** Upper seat on the wall opposite the entrance: lacquerware and treasures
 * on a low platform, mats with plain bands (`panel-treasures`). */
function UpperSeat() {
  const band = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: bandMatTexture([1, 1]),
        roughness: 1,
      }),
    [],
  );
  const band2 = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: bandMatTexture([3, 1]),
        roughness: 1,
      }),
    [],
  );
  const base = useMemo(() => std("#9c7a4c", 1), []);
  const black = useMemo(() => std("#241a16", 0.35, 0.1), []);
  const red = useMemo(() => std("#8a2e20", 0.4, 0.05), []);
  const gold = useMemo(() => std("#c49a46", 0.35, 0.6), []);
  const x0 = 0.2;
  const x1 = 1.78;
  const zb = -HD + 0.12;
  const ht = 0.3;
  const zf = zb + 0.62;
  const zm = (zb + zf) / 2;
  const cx = (x0 + x1) / 2;
  const w = x1 - x0;
  type Ware = { p: V3; kind: "tub" | "bowl" | "box" | "jar"; s?: number };
  const wares: Ware[] = [
    { p: [0.45, ht, zm], kind: "tub" },
    { p: [0.92, ht, zm], kind: "bowl" },
    { p: [1.38, ht, zm - 0.04], kind: "tub", s: 1.15 },
    { p: [1.62, ht, zm + 0.16], kind: "jar" },
    { p: [0.2 + 0.14, ht, zm + 0.2], kind: "box" },
  ];
  return (
    <group name="upper-seat">
      {/* Low platform along the north wall. */}
      <mesh
        material={base}
        position={[cx, ht / 2, zm]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w, ht, zf - zb]} />
      </mesh>
      {/* Banded mats: on the wall, on the platform, over its edge and on
          the floor in front. */}
      <mesh material={band2} position={[cx, ht + 0.55, zb + 0.005]}>
        <planeGeometry args={[w, 1.1]} />
      </mesh>
      {[x0 + 0.02, x0 + 0.52, x0 + 1.02].map((x) => (
        <group key={x}>
          <mesh
            material={band}
            position={[x + 0.26, ht + 0.004, zf - 0.22]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.5, 0.44]} />
          </mesh>
          <mesh material={band} position={[x + 0.26, ht - 0.13, zf + 0.004]}>
            <planeGeometry args={[0.5, 0.26]} />
          </mesh>
        </group>
      ))}
      <mesh
        material={band2}
        position={[cx, 0.016, zf + 0.3]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[w, 0.6]} />
      </mesh>
      {wares.map((it, i) => (
        <group key={i} position={it.p} scale={it.s ?? 1}>
          {it.kind === "tub" && (
            <>
              {[-0.11, 0.11].map((x) =>
                [-0.09, 0.09].map((z) => (
                  <mesh
                    key={`${x}${z}`}
                    material={black}
                    position={[x, 0.06, z]}
                  >
                    <boxGeometry args={[0.03, 0.12, 0.03]} />
                  </mesh>
                )),
              )}
              <mesh material={black} position={[0, 0.27, 0]} castShadow>
                <cylinderGeometry args={[0.16, 0.16, 0.3, 14]} />
              </mesh>
              {[0.17, 0.27, 0.37].map((y) => (
                <mesh
                  key={y}
                  material={y === 0.27 ? gold : red}
                  position={[0, y, 0]}
                >
                  <torusGeometry args={[0.163, 0.008, 4, 18]} />
                </mesh>
              ))}
            </>
          )}
          {it.kind === "bowl" && (
            <>
              <mesh material={black} position={[0, 0.08, 0]}>
                <cylinderGeometry args={[0.08, 0.11, 0.16, 12]} />
              </mesh>
              <mesh material={black} position={[0, 0.3, 0]} castShadow>
                <sphereGeometry
                  args={[
                    0.2,
                    16,
                    8,
                    0,
                    Math.PI * 2,
                    Math.PI * 0.5,
                    Math.PI * 0.5,
                  ]}
                />
              </mesh>
              <mesh
                material={gold}
                position={[0, 0.295, 0]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <torusGeometry args={[0.198, 0.01, 4, 20]} />
              </mesh>
            </>
          )}
          {it.kind === "jar" && (
            <>
              <mesh material={black} position={[0, 0.12, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.09, 0.24, 12]} />
              </mesh>
              <mesh material={red} position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.095, 0.095, 0.03, 12]} />
              </mesh>
            </>
          )}
          {it.kind === "box" && (
            <mesh material={red} position={[0, 0.1, 0]} castShadow>
              <boxGeometry args={[0.24, 0.2, 0.2]} />
            </mesh>
          )}
        </group>
      ))}
      {/* A lidded lacquer container on the floor in front. */}
      <mesh material={black} position={[-0.05, 0.22, -2.05]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.44, 16]} />
      </mesh>
      <mesh material={black} position={[-0.05, 0.46, -2.05]}>
        <cylinderGeometry args={[0.215, 0.215, 0.05, 16]} />
      </mesh>
    </group>
  );
}

/** Things around the hearth (`panel-hearth`): bowls and a board. */
function HearthSide() {
  const red = useMemo(() => std("#8a2e20", 0.4), []);
  const board = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: woodTexture(),
        color: "#e3c69a",
        roughness: 0.8,
      }),
    [],
  );
  return (
    <group name="hearth-side">
      {[
        [-0.55, 0.95],
        [-0.3, 1.02],
      ].map(([x, z]) => (
        <mesh key={x} material={red} position={[x, 0.07, z]}>
          <sphereGeometry
            args={[0.08, 12, 6, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]}
          />
        </mesh>
      ))}
      <mesh
        material={board}
        position={[0.55, 0.03, 0.98]}
        rotation={[0, 0.2, 0]}
      >
        <boxGeometry args={[0.45, 0.04, 0.22]} />
      </mesh>
    </group>
  );
}

function Furniture() {
  const wood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.75 }),
    [],
  );
  // Low work platform in the entry corner for the bark fiber.
  const items: Box[] = [{ p: [-2.82, 0.2, -2.15], s: [1.3, 0.4, 0.75] }];
  return (
    <group name="furniture">
      <Boxes items={items} material={wood} />
      <Rack />
      <EntryArea />
      <UpperSeat />
      <HearthSide />
    </group>
  );
}

/** Hip roof of thatch on a pole frame. Its group is exposed so the director
 * can lift it. */
export function Roof({ lift }: { lift: { current: number } }) {
  const ref = useRef<THREE.Group>(null);
  const thatch = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: thatchTexture([1, 1]),
        roughness: 1,
        side: THREE.DoubleSide,
        transparent: true,
      }),
    [],
  );
  const wood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#a8845a",
        roughness: 0.8,
        transparent: true,
      }),
    [],
  );
  const rise = ROOM.peak - ROOM.h;
  const o = 0.55; // eave overhang
  const ex = HW + o;
  const ez = HD + o;
  const rx = ex - ez; // ridge half length (45° hips)
  const { shell, edge, poles } = useMemo(() => {
    // Eave corners (y = 0 in roof space) and ridge ends.
    const A: V3 = [-ex, 0, ez];
    const B: V3 = [ex, 0, ez];
    const C: V3 = [ex, 0, -ez];
    const D: V3 = [-ex, 0, -ez];
    const R0: V3 = [-rx, rise, 0];
    const R1: V3 = [rx, rise, 0];
    const tris: V3[] = [
      A,
      B,
      R1,
      A,
      R1,
      R0, // south
      C,
      D,
      R0,
      C,
      R0,
      R1, // north
      B,
      C,
      R1, // east
      D,
      A,
      R0, // west
    ];
    const pos: number[] = [];
    const uv: number[] = [];
    tris.forEach((p, i) => {
      pos.push(...p);
      // South/north faces map u to x, east/west to z; v follows the height.
      const along = i < 12 ? p[0] : p[2];
      uv.push(along * 0.45, p[1] * 0.75);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    // Thick thatch edge along the eaves.
    const edge: Box[] = [
      { p: [0, 0.05, ez], s: [2 * ex + 0.1, 0.26, 0.3] },
      { p: [0, 0.05, -ez], s: [2 * ex + 0.1, 0.26, 0.3] },
      { p: [ex, 0.05, 0], s: [0.3, 0.26, 2 * ez] },
      { p: [-ex, 0.05, 0], s: [0.3, 0.26, 2 * ez] },
    ];
    const poles: Pole[] = [
      { a: R0, b: R1, r: 0.09 },
      { a: A, b: R0, r: 0.07 },
      { a: D, b: R0, r: 0.07 },
      { a: B, b: R1, r: 0.07 },
      { a: C, b: R1, r: 0.07 },
    ];
    // Rafters under the long faces and the hip ends.
    for (let x = -rx; x <= rx + 0.01; x += rx / 2)
      for (const z of [ez, -ez])
        poles.push({ a: [x, 0, z * 0.98], b: [x, rise - 0.05, 0], r: 0.045 });
    for (const sx of [-1, 1])
      poles.push({
        a: [sx * ex * 0.98, 0, 0],
        b: [sx * rx, rise - 0.05, 0],
        r: 0.045,
      });
    // Purlins: rings of poles round the slope at two heights.
    for (const k of [0.33, 0.66]) {
      const px = ex - (ex - rx) * k;
      const pz = ez * (1 - k);
      const y = rise * k - 0.06;
      const corners: V3[] = [
        [-px, y, pz],
        [px, y, pz],
        [px, y, -pz],
        [-px, y, -pz],
      ];
      for (let i = 0; i < 4; i++)
        poles.push({ a: corners[i], b: corners[(i + 1) % 4], r: 0.03 });
    }
    return { shell: g, edge, poles };
  }, [ex, ez, rx, rise]);

  useFrame(() => {
    if (!ref.current) return;
    const k = lift.current;
    ref.current.position.y = k * 5.5;
    ref.current.rotation.z = k * 0.08;
    const op = 1 - THREE.MathUtils.smoothstep(k, 0.35, 0.95);
    thatch.opacity = op;
    wood.opacity = op;
    ref.current.visible = op > 0.01;
    thatch.depthWrite = op > 0.98;
  });

  return (
    <group ref={ref} name="roof">
      <group position={[0, ROOM.h + 0.05, 0]}>
        {[0, 0.09].map((y) => (
          <mesh
            key={y}
            geometry={shell}
            material={thatch}
            position={[0, y, 0]}
            castShadow
            receiveShadow
          />
        ))}
        <Boxes items={edge} material={thatch} />
        {/* Ridge bundle. */}
        <mesh
          position={[0, rise + 0.12, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={thatch}
          castShadow
        >
          <cylinderGeometry args={[0.2, 0.2, 2 * rx + 0.6, 10]} />
        </mesh>
        <Poles items={poles} material={wood} />
      </group>
    </group>
  );
}

export function Outside() {
  const snow = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#e9eef2", roughness: 0.9 }),
    [],
  );
  const trunk = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#5a4030", roughness: 1 }),
    [],
  );
  const pine = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2f5a4a",
        roughness: 0.9,
        flatShading: true,
      }),
    [],
  );
  const trees = useMemo(() => {
    const r = rng(42);
    const out: { x: number; z: number; s: number }[] = [];
    while (out.length < 26) {
      const a = r() * Math.PI * 2;
      const d = 7 + r() * 9;
      out.push({
        x: Math.cos(a) * d,
        z: Math.sin(a) * d - 2,
        s: 0.8 + r() * 0.9,
      });
    }
    return out;
  }, []);
  return (
    <group name="outside">
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        material={snow}
        receiveShadow
      >
        <circleGeometry args={[22, 48]} />
      </mesh>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 0.5, 0]} material={trunk} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 1, 6]} />
          </mesh>
          <mesh position={[0, 1.6, 0]} material={pine} castShadow>
            <coneGeometry args={[0.9, 2, 7]} />
          </mesh>
          <mesh position={[0, 2.5, 0]} material={pine} castShadow>
            <coneGeometry args={[0.6, 1.4, 7]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Static shell of the room. Splat mode samples these meshes. */
export function HouseStatic({
  outside = true,
  lift,
}: {
  outside?: boolean;
  lift?: { current: number };
}) {
  return (
    <group name="house">
      <Floor />
      <Walls lift={lift} />
      <Furniture />
      {outside && <Outside />}
    </group>
  );
}
