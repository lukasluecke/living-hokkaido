"use client";
// The "over time" diorama: one round tile of land with a river, the house
// and its surroundings. Shapes grow and shrink with the scrub position.
// Original sketch geometry (MIT). Not a reconstruction of one real place.
import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, SMAA, Vignette } from "@react-three/postprocessing";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { seasonWeights, type TimelineEra } from "@/contracts";
import { material, season as seasonTokens, ui } from "@/design/tokens";
import { InkEdgesEffect } from "../shared/InkEdges";
import { createToonUniforms, toonifyTree } from "../shared/toon";
import { ease, type Features, featuresAt } from "./features";

type V3 = [number, number, number];
type Ref<T> = React.RefObject<T>;

export type DioramaProps = {
  eras: TimelineEra[];
  /** Scrub position (0 … eras - 1), damped by the parent. */
  t: Ref<number>;
  seasonValue: number;
  reducedMotion: boolean;
  fx: boolean;
};

// ---------------------------------------------------------------- layout

const R = 9; // tile radius (m)
const RIVER: [number, number][] = [
  [-7.9, -3.1],
  [-5, -4.3],
  [-1, -3.5],
  [3, -4.4],
  [6.5, -3.8],
  [7.8, -3.3],
];
const HOUSE: V3 = [0, 0, 0.4];
const STORE: V3 = [3.4, 0, -1.5];
const VILLAGE: { p: V3; r: number }[] = [
  { p: [-5, 0, -1.1], r: 0.25 },
  { p: [-4.3, 0, 3.1], r: -0.35 },
];
const MUSEUM: V3 = [-5, 0, 0.4];
const FIELDS = [
  { x0: 2, x1: 7.6, z0: 1.3, z1: 3.9 },
  { x0: -7.8, x1: -2.2, z0: -1.9, z1: 3.3 },
];
const ROAD_Z = 5.2;
export const VIEW = {
  eye: [13, 14, 20] as V3,
  target: [-2.6, 0, 0.6] as V3,
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function distToRiver(x: number, z: number) {
  let d = Number.POSITIVE_INFINITY;
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, az] = RIVER[i];
    const [bx, bz] = RIVER[i + 1];
    const vx = bx - ax;
    const vz = bz - az;
    const k = Math.max(
      0,
      Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)),
    );
    d = Math.min(d, Math.hypot(x - ax - vx * k, z - az - vz * k));
  }
  return d;
}

const inField = (x: number, z: number) =>
  FIELDS.some(
    (f) => x > f.x0 - 0.3 && x < f.x1 + 0.3 && z > f.z0 - 0.3 && z < f.z1 + 0.3,
  );

type Tree = { x: number; z: number; s: number; r: number };

function makeTrees(): Tree[] {
  const rand = rng(7);
  const out: Tree[] = [];
  const keep: V3[] = [HOUSE, STORE, MUSEUM, ...VILLAGE.map((v) => v.p)];
  for (let n = 0; out.length < 190 && n < 4000; n++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * (R - 0.6);
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (distToRiver(x, z) < 1.3) continue;
    // Keep a view corridor from the camera to the house.
    if (x > -2.5 && x < 6 && z > 1.5 && z < 8 && x - z * 0.8 > -3.2) continue;
    if (keep.some((p) => Math.hypot(x - p[0], z - p[2]) < 2.1)) continue;
    // Trees where fields and the road come later are cleared first.
    const cleared = inField(x, z) || Math.abs(z - ROAD_Z) < 0.9;
    const r = cleared ? 0.5 + rand() * 0.5 : rand();
    out.push({ x, z, s: 0.42 + rand() * 0.32, r });
  }
  return out;
}

// ---------------------------------------------------------------- materials

function useMats(seasonValue: number) {
  const mats = useMemo(() => {
    const m = (color: string, rough = 0.9) =>
      new THREE.MeshStandardMaterial({ color, roughness: rough });
    // Ribbons on the ground: both sides, and pulled forward against z-fight.
    const flat = (color: string) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 1,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      });
    return {
      ground: m(seasonTokens.ground[1], 1),
      side: m(material.bark, 1),
      earth: m(material.woodDark, 1),
      water: new THREE.MeshStandardMaterial({
        color: seasonTokens.sea[1],
        roughness: 0.35,
        side: THREE.DoubleSide,
      }),
      foliage: m(seasonTokens.foliage[1]),
      trunk: m(material.bark),
      thatch: m(material.fiber, 1),
      thatchDark: m(material.cloth, 1),
      wood: m(material.wood),
      stump: m(material.cloth),
      furrow: m(material.woodDark, 1),
      crop: m(seasonTokens.accent[0]),
      road: flat(material.stone),
      path: flat(ui.paperEdge),
      wall: m(ui.paper),
      glass: m(ui.night, 0.3),
      rope: m(material.tie),
      smoke: new THREE.MeshStandardMaterial({
        color: "#f4f1ea",
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
      door: m(ui.ink),
    };
  }, []);
  // Season tints the land and foliage (winter = snow), like the island.
  useLayoutEffect(() => {
    const w = seasonWeights(seasonValue);
    const mix = (arr: readonly string[], out: THREE.Color) => {
      out.setRGB(0, 0, 0);
      const c = new THREE.Color();
      arr.forEach((hex, i) => {
        c.set(hex);
        out.r += c.r * w[i];
        out.g += c.g * w[i];
        out.b += c.b * w[i];
      });
    };
    mix(seasonTokens.ground, mats.ground.color);
    mix(seasonTokens.foliage, mats.foliage.color);
    mix(seasonTokens.sea, mats.water.color);
  }, [seasonValue, mats]);
  return mats;
}
type Mats = ReturnType<typeof useMats>;

// ---------------------------------------------------------------- helpers

/** Scales its children by an eased feature weight (grow from the ground). */
function Grow({
  pick,
  feats,
  position,
  rotation = 0,
  children,
}: {
  pick: (f: Features) => number;
  feats: Ref<Features>;
  position?: V3;
  rotation?: number;
  children: React.ReactNode;
}) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const o = g.current;
    if (!o) return;
    const w = ease(pick(feats.current));
    o.visible = w > 0.01;
    o.scale.set(0.7 + 0.3 * w, Math.max(w, 0.001), 0.7 + 0.3 * w);
  });
  return (
    <group ref={g} position={position} rotation={[0, rotation, 0]}>
      {children}
    </group>
  );
}

/** Flat ribbon along a polyline (river, paths). */
function ribbon(points: [number, number][], width: number, y: number) {
  const pos: number[] = [];
  const idx: number[] = [];
  points.forEach(([x, z], i) => {
    const [px, pz] = points[Math.max(i - 1, 0)];
    const [nx, nz] = points[Math.min(i + 1, points.length - 1)];
    const dx = nx - px;
    const dz = nz - pz;
    const l = Math.hypot(dx, dz) || 1;
    const ox = (-dz / l) * width * 0.5;
    const oz = (dx / l) * width * 0.5;
    pos.push(x + ox, y, z + oz, x - ox, y, z - oz);
    if (i > 0) {
      const a = (i - 1) * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Smooth a polyline with Catmull-Rom so ribbons do not look jagged. */
function smooth(points: [number, number][], steps = 8): [number, number][] {
  const c = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  );
  return c.getPoints(points.length * steps).map((v) => [v.x, v.z]);
}

/** Pyramid roof: 4-sided cone, rotated so the edges line up with walls. */
function Pyramid({
  w,
  d,
  h,
  y,
  mat,
}: {
  w: number;
  d: number;
  h: number;
  y: number;
  mat: THREE.Material;
}) {
  return (
    <mesh
      position={[0, y + h / 2, 0]}
      rotation={[0, Math.PI / 4, 0]}
      scale={[w / Math.SQRT2, 1, d / Math.SQRT2]}
      material={mat}
      castShadow
      receiveShadow
    >
      <coneGeometry args={[1, h, 4, 1]} />
    </mesh>
  );
}

// ---------------------------------------------------------------- houses

/** Pit dwelling: shallow pit, earth bank, thatched roof down to the ground. */
function PitHouse({ m, s = 1 }: { m: Mats; s?: number }) {
  return (
    <group scale={s}>
      <mesh position={[0, 0.06, 0]} material={m.earth} receiveShadow>
        <cylinderGeometry args={[2.1, 2.3, 0.12, 20]} />
      </mesh>
      <Pyramid w={3.4} d={3.4} h={2.3} y={0} mat={m.thatch} />
      <Pyramid w={2.1} d={2.1} h={1.45} y={0.85} mat={m.thatchDark} />
      {/* Entrance */}
      <mesh
        position={[0, 0.35, 1.25]}
        rotation={[-0.62, 0, 0]}
        material={m.door}
      >
        <planeGeometry args={[0.6, 0.7]} />
      </mesh>
    </group>
  );
}

/** Early house on flat ground: low walls, simple gable roof. */
function FlatHouse({ m, s = 1 }: { m: Mats; s?: number }) {
  return (
    <group scale={s}>
      <mesh
        position={[0, 0.4, 0]}
        material={m.thatchDark}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2.8, 0.8, 2.1]} />
      </mesh>
      <mesh
        position={[0, 1.25, 0]}
        rotation={[0, 0, Math.PI / 2]}
        scale={[1, 1, 1]}
        material={m.thatch}
        castShadow
        receiveShadow
      >
        {/* Triangular prism: cylinder with 3 sides, laid along X. */}
        <cylinderGeometry args={[1.05, 1.05, 3.2, 3, 1]} />
      </mesh>
      <mesh position={[0, 0.35, 1.06]} material={m.door}>
        <planeGeometry args={[0.55, 0.7]} />
      </mesh>
    </group>
  );
}

/** Thatched house of wood, grass and bark, with a hip roof. */
function ThatchedHouse({ m, s = 1 }: { m: Mats; s?: number }) {
  const posts: V3[] = [
    [-1.55, 0.5, -1.1],
    [1.55, 0.5, -1.1],
    [-1.55, 0.5, 1.1],
    [1.55, 0.5, 1.1],
  ];
  return (
    <group scale={s}>
      <mesh
        position={[0, 0.5, 0]}
        material={m.thatchDark}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[3.1, 1, 2.2]} />
      </mesh>
      {posts.map((p, i) => (
        <mesh key={i} position={p} material={m.wood} castShadow>
          <boxGeometry args={[0.14, 1.04, 0.14]} />
        </mesh>
      ))}
      <Pyramid w={4} d={3.1} h={1.9} y={0.9} mat={m.thatch} />
      <Pyramid w={2.6} d={2} h={1.25} y={1.62} mat={m.thatchDark} />
      <mesh
        position={[-1.56, 0.42, 0.3]}
        rotation={[0, -Math.PI / 2, 0]}
        material={m.door}
      >
        <planeGeometry args={[0.6, 0.8]} />
      </mesh>
    </group>
  );
}

/** Storehouse on raised posts, log walls, small thatched roof. */
function Storehouse({ m }: { m: Mats }) {
  const legs: V3[] = [
    [-0.45, 0.5, -0.4],
    [0.45, 0.5, -0.4],
    [-0.45, 0.5, 0.4],
    [0.45, 0.5, 0.4],
  ];
  return (
    <group>
      {legs.map((p, i) => (
        <mesh key={i} position={p} material={m.wood} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 1, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 1.02, 0]} material={m.wood} castShadow>
        <boxGeometry args={[1.25, 0.08, 1.1]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[0, 1.15 + i * 0.15, 0]}
          material={i % 2 ? m.trunk : m.wood}
          castShadow
        >
          <boxGeometry args={[1.05, 0.15, 0.9]} />
        </mesh>
      ))}
      <Pyramid w={1.6} d={1.4} h={0.9} y={1.72} mat={m.thatch} />
    </group>
  );
}

/** Museum building in a park: long, low, flat roof, glass band. */
function Museum({ m }: { m: Mats }) {
  return (
    <group rotation={[0, 0.35, 0]}>
      <mesh position={[0, 0.7, 0]} material={m.wall} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.4, 4.2]} />
      </mesh>
      <mesh position={[1.11, 0.55, 0]} material={m.glass}>
        <boxGeometry args={[0.02, 0.5, 3.6]} />
      </mesh>
      <mesh position={[0, 1.45, 0]} material={m.road} castShadow>
        <boxGeometry args={[2.5, 0.1, 4.5]} />
      </mesh>
    </group>
  );
}

/** Low rope fence around the rebuilt house. */
function RopeFence({ m }: { m: Mats }) {
  const n = 14;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 2.9, 0.25, Math.sin(a) * 2.4]}
            material={m.wood}
          >
            <cylinderGeometry args={[0.04, 0.04, 0.5, 5]} />
          </mesh>
        );
      })}
      <mesh
        position={[0, 0.42, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1, 2.4 / 2.9, 1]}
        material={m.rope}
      >
        <torusGeometry args={[2.9, 0.018, 4, 48]} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- instanced

type Inst = { p: V3; s: V3; ry?: number; weight: (f: Features) => number };

/** Many small shapes in one draw call; scale = eased weight per item. */
function Instances({
  items,
  feats,
  geometry,
  mat,
  shadows = true,
}: {
  items: Inst[];
  feats: Ref<Features>;
  geometry: THREE.BufferGeometry;
  mat: THREE.Material;
  shadows?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const last = useRef("");
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const key = JSON.stringify(feats.current);
    if (key === last.current) return;
    last.current = key;
    items.forEach((it, i) => {
      const w = ease(it.weight(feats.current));
      o.position.set(...it.p);
      o.rotation.set(0, it.ry ?? 0, 0);
      o.scale.set(it.s[0] * w, it.s[1] * w, it.s[2] * w);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, mat, items.length]}
      castShadow={shadows}
      receiveShadow
      frustumCulled={false}
    />
  );
}

/** Weight for a tree that stands while forest density > its rank. */
const stand = (r: number) => (f: Features) =>
  Math.min(Math.max((f.forest - r) / 0.08, 0), 1);

function Land({ m, feats }: { m: Mats; feats: Ref<Features> }) {
  const trees = useMemo(makeTrees, []);
  const geo = useMemo(
    () => ({
      cone: new THREE.ConeGeometry(0.55, 1.6, 7).translate(0, 1.3, 0),
      trunk: new THREE.CylinderGeometry(0.08, 0.1, 0.6, 5).translate(0, 0.3, 0),
      stump: new THREE.CylinderGeometry(0.12, 0.14, 0.18, 6).translate(
        0,
        0.09,
        0,
      ),
      box: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
      post: new THREE.CylinderGeometry(0.04, 0.05, 0.6, 5).translate(0, 0.3, 0),
    }),
    [],
  );
  const inst = useMemo(() => {
    const foliage: Inst[] = trees.map((t) => ({
      p: [t.x, 0, t.z],
      s: [t.s, t.s, t.s],
      weight: stand(t.r),
    }));
    const trunk = foliage.map((x) => ({ ...x }));
    // Stumps where trees stood in the forest but not on cleared land now.
    const stumps: Inst[] = trees
      .filter((t) => t.r > 0.12 && t.r < 0.95)
      .map((t) => ({
        p: [t.x, 0, t.z],
        s: [t.s, 1, t.s],
        weight: (f: Features) => f.stumps * (1 - stand(t.r)(f)),
      }));
    const furrows: Inst[] = [];
    for (const fld of FIELDS)
      for (let z = fld.z0; z <= fld.z1; z += 0.42)
        furrows.push({
          p: [(fld.x0 + fld.x1) / 2, 0, z],
          s: [fld.x1 - fld.x0, 0.14, 0.2],
          weight: (f) => f.farmland,
        });
    const crops: Inst[] = [];
    const rand = rng(11);
    for (const fld of FIELDS)
      for (let z = fld.z0; z <= fld.z1; z += 0.42)
        for (let x = fld.x0 + 0.2; x < fld.x1; x += 0.5)
          crops.push({
            p: [x + rand() * 0.1, 0.12, z],
            s: [0.18, 0.28 + rand() * 0.12, 0.18],
            weight: (f) => f.farmland,
          });
    // Small millet patches near the river mouth (estuary era).
    const millet: Inst[] = [];
    for (const [cx, cz] of [
      [4.6, 1.6],
      [6.4, 0.2],
    ])
      for (let i = 0; i < 18; i++)
        millet.push({
          p: [cx + (rand() - 0.5) * 1.6, 0, cz + (rand() - 0.5) * 1.1],
          s: [0.12, 0.35 + rand() * 0.2, 0.12],
          weight: (f) => f.estuary,
        });
    const fence: Inst[] = [];
    for (const fld of FIELDS)
      for (let x = fld.x0 - 0.25; x <= fld.x1 + 0.25; x += 0.7)
        fence.push({
          p: [x, 0, fld.z1 + 0.35],
          s: [1, 1, 1],
          weight: (f) => f.farmland,
        });
    return { foliage, trunk, stumps, furrows, crops, millet, fence };
  }, [trees]);
  const river = useMemo(() => ribbon(smooth(RIVER), 1.5, 0.03), []);
  const mouth = useMemo(
    () =>
      ribbon(
        smooth([
          [3, -4.4],
          [6.3, -3.4],
          [7.9, -2.4],
        ]),
        3.4,
        0.025,
      ),
    [],
  );
  const road = useMemo(
    () =>
      ribbon(
        [
          [-7.2, ROAD_Z + 0.2],
          [7.2, ROAD_Z - 0.4],
        ],
        1.0,
        0.02,
      ),
    [],
  );
  const paths = useMemo(
    () => [
      ribbon(
        smooth([
          [0.6, ROAD_Z],
          [0.9, 3.4],
          [0.4, 2.2],
        ]),
        0.55,
        0.022,
      ),
      ribbon(
        smooth([
          [-1.6, 1.6],
          [-3, 1.4],
          [-4.2, 1.1],
        ]),
        0.55,
        0.022,
      ),
    ],
    [],
  );
  const g = (pick: (f: Features) => number) => pick;
  return (
    <>
      {/* Tile: ground disk on an earth plinth. */}
      <mesh position={[0, -0.6, 0]} material={m.side} receiveShadow>
        <cylinderGeometry args={[R, R - 0.3, 1.2, 64]} />
      </mesh>
      <mesh
        position={[0, 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={m.ground}
        receiveShadow
      >
        <circleGeometry args={[R, 64]} />
      </mesh>
      <mesh geometry={river} material={m.water} receiveShadow />
      <Grow feats={feats} pick={g((f) => f.estuary)}>
        <mesh geometry={mouth} material={m.water} receiveShadow />
      </Grow>
      <Grow feats={feats} pick={g((f) => f.road)}>
        <mesh geometry={road} material={m.road} receiveShadow />
      </Grow>
      <Grow feats={feats} pick={g((f) => f.park)}>
        {paths.map((p, i) => (
          <mesh key={i} geometry={p} material={m.path} receiveShadow />
        ))}
      </Grow>
      <Instances
        items={inst.foliage}
        feats={feats}
        geometry={geo.cone}
        mat={m.foliage}
      />
      <Instances
        items={inst.trunk}
        feats={feats}
        geometry={geo.trunk}
        mat={m.trunk}
      />
      <Instances
        items={inst.stumps}
        feats={feats}
        geometry={geo.stump}
        mat={m.stump}
      />
      <Instances
        items={inst.furrows}
        feats={feats}
        geometry={geo.box}
        mat={m.furrow}
        shadows={false}
      />
      <Instances
        items={inst.crops}
        feats={feats}
        geometry={geo.box}
        mat={m.crop}
      />
      <Instances
        items={inst.millet}
        feats={feats}
        geometry={geo.box}
        mat={m.crop}
      />
      <Instances
        items={inst.fence}
        feats={feats}
        geometry={geo.post}
        mat={m.wood}
      />
    </>
  );
}

/** A few puffs of hearth smoke over the roof (off with reduced motion). */
function Smoke({
  m,
  feats,
  still,
}: {
  m: Mats;
  feats: Ref<Features>;
  still: boolean;
}) {
  const puffs = useRef<THREE.Mesh[]>([]);
  useFrame(({ clock }) => {
    const f = feats.current;
    const w = ease(f.smoke) * (still ? 0 : 1);
    // Roof top height follows the house form.
    const top = 2.3 * f.pit + 2.1 * f.flat + 3.2 * f.thatched;
    puffs.current.forEach((p, i) => {
      if (!p) return;
      const k = (clock.elapsedTime * 0.25 + i / puffs.current.length) % 1;
      p.visible = w > 0.02;
      p.position.set(
        HOUSE[0] + Math.sin(k * 5 + i) * 0.15 + k * 0.6,
        top + k * 1.6,
        HOUSE[2],
      );
      p.scale.setScalar((0.12 + k * 0.3) * w);
    });
  });
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) puffs.current[i] = el;
          }}
          material={m.smoke}
        >
          <icosahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </>
  );
}

// ---------------------------------------------------------------- scene

function Look() {
  const { scene } = useThree();
  const T = useMemo(() => createToonUniforms(), []);
  const n = useRef(0);
  useFrame(() => {
    if (n.current++ % 20 === 0) toonifyTree(scene, T);
  });
  return null;
}

export function Diorama({
  eras,
  t,
  seasonValue,
  reducedMotion,
  fx,
}: DioramaProps) {
  const m = useMats(seasonValue);
  const feats = useRef<Features>(featuresAt(eras, t.current));
  useFrame(() => {
    feats.current = featuresAt(eras, t.current);
  });
  const ink = useMemo(() => new InkEdgesEffect(), []);
  const cc = useRef<CameraControls>(null);
  const aspect = useThree((s) => s.size.width / Math.max(s.size.height, 1));
  // Wide screens: look a little left of the centre so the card does not hide
  // the tile. Tall (phone) screens: centre and step back to fit the tile.
  useEffect(() => {
    const tall = aspect < 1;
    const k = tall ? 1.65 : 1;
    const [ex, ey, ez] = VIEW.eye;
    const target: V3 = tall ? [0, 3.5, 0] : VIEW.target;
    cc.current?.setLookAt(ex * k, ey * k, ez * k, ...target, false);
  }, [aspect]);
  const sky = useMemo(() => {
    const w = seasonWeights(seasonValue);
    const c = new THREE.Color(0, 0, 0);
    const x = new THREE.Color();
    seasonTokens.sky.forEach((hex, i) => {
      x.set(hex);
      c.r += x.r * w[i];
      c.g += x.g * w[i];
      c.b += x.b * w[i];
    });
    return c;
  }, [seasonValue]);
  const g = (pick: (f: Features) => number) => pick;
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 50, 120]} />
      <hemisphereLight args={["#dfe9ff", "#6b5440", 0.9]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={2.2}
        color={seasonTokens.sun[1]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-bias={-0.0005}
      />
      <Land m={m} feats={feats} />
      <group position={HOUSE}>
        <Grow feats={feats} pick={g((f) => f.pit)}>
          <PitHouse m={m} />
        </Grow>
        <Grow feats={feats} pick={g((f) => f.flat)}>
          <FlatHouse m={m} />
        </Grow>
        <Grow feats={feats} pick={g((f) => f.thatched)}>
          <ThatchedHouse m={m} />
        </Grow>
        <Grow feats={feats} pick={g((f) => f.rebuilt)}>
          <RopeFence m={m} />
        </Grow>
      </group>
      {VILLAGE.map((v, i) => (
        <group key={i} position={v.p} rotation={[0, v.r, 0]}>
          <Grow feats={feats} pick={g((f) => f.village * f.pit)}>
            <PitHouse m={m} s={0.8} />
          </Grow>
          <Grow feats={feats} pick={g((f) => f.village * f.flat)}>
            <FlatHouse m={m} s={0.8} />
          </Grow>
          <Grow feats={feats} pick={g((f) => f.village * f.thatched)}>
            <ThatchedHouse m={m} s={0.75} />
          </Grow>
        </group>
      ))}
      <Grow
        feats={feats}
        pick={g((f) => f.storehouse)}
        position={STORE}
        rotation={-0.2}
      >
        <Storehouse m={m} />
      </Grow>
      <Grow feats={feats} pick={g((f) => f.park)} position={MUSEUM}>
        <Museum m={m} />
      </Grow>
      <Smoke m={m} feats={feats} still={reducedMotion} />
      <Look />
      <CameraControls
        ref={cc}
        makeDefault
        minDistance={10}
        maxDistance={60}
        minPolarAngle={0.35}
        maxPolarAngle={1.2}
        truckSpeed={0}
      />
      {fx && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <primitive object={ink} />
          <Vignette offset={0.28} darkness={0.4} />
          <SMAA />
        </EffectComposer>
      )}
    </>
  );
}
