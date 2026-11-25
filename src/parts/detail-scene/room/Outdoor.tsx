// Outdoor sets for the listening grove and the makers' clearing, and the
// small memory cabin. Original illustrative geometry, MIT. Not a
// reconstruction of a real place, and no cultural objects: only trees, logs,
// stones, benches, shelves and poles.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { type SeasonState, seasonWeights } from "@/contracts";
import { type Season4, season as tone } from "@/design/tokens";
import { snowCap } from "../../shared/snowCap";
import { Floor, Walls } from "./House";
import { rng, woodTexture } from "./textures";

type V3 = [number, number, number];

const tmp = new THREE.Color();
const acc = new THREE.Color();
/** Season colour blend into `out` (same weights as the island). */
export function blend4(out: THREE.Color, c: Season4, value: number) {
  const w = seasonWeights(value);
  acc.setRGB(0, 0, 0);
  c.forEach((hex, i) => {
    tmp.set(hex);
    acc.r += tmp.r * (w[i] ?? 0);
    acc.g += tmp.g * (w[i] ?? 0);
    acc.b += tmp.b * (w[i] ?? 0);
  });
  return out.copy(acc);
}

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.95, ...extra });

/** Shared materials; ground and leaves follow the season clock. */
export function useOutdoorMats(season: SeasonState) {
  const m = useMemo(
    () => ({
      ground: std("#8fb06a"),
      path: std("#a58b62"),
      leaves: std("#4f7f45", { flatShading: true }),
      pine: std("#2f5a4a", { flatShading: true }),
      trunk: std("#5a4030"),
      bark: std("#8a8173"),
      wood: new THREE.MeshStandardMaterial({
        map: woodTexture(),
        roughness: 0.85,
      }),
      cut: std("#d9b98a"),
      stone: std("#a7a090", { flatShading: true }),
      fibre: std("#d9bb86", { side: THREE.DoubleSide }),
    }),
    [],
  );
  const s = useRef(season.value);
  s.current = season.value;
  useFrame(() => {
    blend4(m.ground.color, tone.ground, s.current);
    blend4(m.leaves.color, tone.foliage, s.current);
  });
  return m;
}
export type Mats = ReturnType<typeof useOutdoorMats>;

/** Snow on the top faces of these materials in winter (season weight 4). */
export function useSnow(
  season: SeasonState,
  mats: THREE.Material[],
  steep: THREE.Material[] = [],
) {
  const u = useMemo(() => ({ value: 0 }), []);
  const s = useRef(season.value);
  s.current = season.value;
  useMemo(() => {
    for (const mat of mats) snowCap(mat, u);
    for (const mat of steep) snowCap(mat, u, 0.7, 0.32);
  }, [mats, steep, u]);
  useFrame(() => {
    u.value = seasonWeights(s.current)[3] ?? 0;
  });
}

/** The outdoor materials that take snow (ground and leaves blend by season). */
export function useOutdoorSnow(season: SeasonState, m: Mats) {
  const mats = useMemo(
    () => [m.path, m.stone, m.trunk, m.wood, m.bark, m.cut, m.fibre],
    [m],
  );
  const steep = useMemo(() => [m.pine], [m]);
  useSnow(season, mats, steep);
}

function Tree({
  p,
  s,
  m,
  pine,
}: {
  p: V3;
  s: number;
  m: Mats;
  pine?: boolean;
}) {
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.7, 0]} material={m.trunk}>
        <cylinderGeometry args={[0.12, 0.18, 1.4, 6]} />
      </mesh>
      {pine ? (
        <>
          <mesh position={[0, 1.9, 0]} material={m.pine}>
            <coneGeometry args={[0.9, 2, 7]} />
          </mesh>
          <mesh position={[0, 2.8, 0]} material={m.pine}>
            <coneGeometry args={[0.6, 1.4, 7]} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 2, 0]} material={m.leaves}>
            <icosahedronGeometry args={[0.95, 0]} />
          </mesh>
          <mesh position={[0.45, 2.5, 0.2]} material={m.leaves}>
            <icosahedronGeometry args={[0.6, 0]} />
          </mesh>
        </>
      )}
    </group>
  );
}

/** A ring of trees around an open middle, seeded so it stays the same. */
export function TreeRing({
  m,
  seed,
  inner,
  count,
  pines,
}: {
  m: Mats;
  seed: number;
  inner: number;
  count: number;
  pines: number;
}) {
  const trees = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + r() * 0.3;
      // Keep the front (toward the camera, +z) open.
      const d = inner + r() * 5 + (Math.sin(a) > 0.3 ? 5 : 0);
      return {
        p: [Math.cos(a) * d, 0, Math.sin(a) * d - 1] as V3,
        s: 0.8 + r() * 0.7,
        pine: r() < pines,
      };
    });
  }, [seed, inner, count, pines]);
  return (
    <>
      {trees.map((t, i) => (
        <Tree key={i} p={t.p} s={t.s} m={m} pine={t.pine} />
      ))}
    </>
  );
}

export function Ground({ m, patch }: { m: Mats; patch: number }) {
  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        material={m.ground}
      >
        <circleGeometry args={[24, 40]} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, -0.4]}
        material={m.path}
      >
        <circleGeometry args={[patch, 24]} />
      </mesh>
    </>
  );
}

export function Log({
  p,
  r = 0,
  len = 1.4,
  m,
}: {
  p: V3;
  r?: number;
  len?: number;
  m: Mats;
}) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <mesh
        position={[0, 0.2, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={m.trunk}
      >
        <cylinderGeometry args={[0.2, 0.2, len, 8]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh
          key={sd}
          position={[(sd * len) / 2 + sd * 0.005, 0.2, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={m.cut}
        >
          <cylinderGeometry args={[0.18, 0.18, 0.01, 8]} />
        </mesh>
      ))}
    </group>
  );
}

export function Stump({
  p,
  h = 0.4,
  rad = 0.32,
  m,
}: {
  p: V3;
  h?: number;
  rad?: number;
  m: Mats;
}) {
  return (
    <group position={p}>
      <mesh position={[0, h / 2, 0]} material={m.trunk}>
        <cylinderGeometry args={[rad, rad * 1.15, h, 9]} />
      </mesh>
      <mesh position={[0, h + 0.005, 0]} material={m.cut}>
        <cylinderGeometry args={[rad * 0.95, rad * 0.95, 0.01, 9]} />
      </mesh>
    </group>
  );
}

export function Stones({
  m,
  seed,
  n,
  r0,
}: {
  m: Mats;
  seed: number;
  n: number;
  r0: number;
}) {
  const st = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: n }, () => {
      const a = r() * Math.PI * 2;
      const d = r0 + r() * 1.5;
      return {
        p: [Math.cos(a) * d, 0.06, Math.sin(a) * d - 0.4] as V3,
        s: 0.12 + r() * 0.16,
      };
    });
  }, [seed, n, r0]);
  return (
    <>
      {st.map((x, i) => (
        <mesh
          key={i}
          position={x.p}
          scale={[x.s * 1.4, x.s, x.s]}
          material={m.stone}
        >
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </>
  );
}

/** Listening grove: a quiet ring of trees, log seats, one wide old tree. */
export function GroveStatic({ season }: { season: SeasonState }) {
  const m = useOutdoorMats(season);
  useOutdoorSnow(season, m);
  return (
    <group name="grove">
      <Ground m={m} patch={3.4} />
      <TreeRing m={m} seed={11} inner={5.2} count={22} pines={0.25} />
      {/* The old tree at the back of the grove. */}
      <group position={[0.4, 0, -3]}>
        <mesh position={[0, 1.1, 0]} material={m.trunk}>
          <cylinderGeometry args={[0.32, 0.5, 2.2, 8]} />
        </mesh>
        <mesh position={[0, 2.9, 0]} material={m.leaves}>
          <icosahedronGeometry args={[1.6, 0]} />
        </mesh>
        <mesh position={[-1, 2.5, 0.4]} material={m.leaves}>
          <icosahedronGeometry args={[1, 0]} />
        </mesh>
        <mesh position={[1.1, 2.6, -0.2]} material={m.leaves}>
          <icosahedronGeometry args={[1.05, 0]} />
        </mesh>
      </group>
      {/* Log seats in an arc, facing the old tree. */}
      <Log p={[-1.9, 0, 0.6]} r={0.9} m={m} />
      <Log p={[0, 0, 1.3]} r={0} m={m} />
      <Log p={[1.9, 0, 0.6]} r={-0.9} m={m} />
      <Stump p={[-1.4, 0, -1.3]} m={m} />
      <Stones m={m} seed={5} n={9} r0={3} />
    </group>
  );
}

/** Makers' clearing: a workbench, a drying rack and a chopping stump. */
export function ClearingStatic({ season }: { season: SeasonState }) {
  const m = useOutdoorMats(season);
  useOutdoorSnow(season, m);
  const strands = useMemo(() => {
    const r = rng(23);
    return Array.from({ length: 14 }, (_, i) => ({
      x: -1 + i * 0.15 + r() * 0.04,
      len: 0.7 + r() * 0.35,
    }));
  }, []);
  return (
    <group name="clearing">
      <Ground m={m} patch={3.8} />
      <TreeRing m={m} seed={31} inner={5.6} count={20} pines={0.6} />
      {/* Workbench. Top at 0.75 m. */}
      <group position={[-1.5, 0, -1.2]} rotation={[0, 0.25, 0]}>
        <mesh position={[0, 0.72, 0]} material={m.wood}>
          <boxGeometry args={[1.8, 0.07, 0.7]} />
        </mesh>
        {[-0.8, 0.8].flatMap((x) =>
          [-0.28, 0.28].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.35, z]} material={m.wood}>
              <boxGeometry args={[0.08, 0.7, 0.08]} />
            </mesh>
          )),
        )}
        <mesh position={[0, 0.18, 0]} material={m.wood}>
          <boxGeometry args={[1.6, 0.04, 0.5]} />
        </mesh>
      </group>
      {/* Drying rack: two posts, one pole, plain fibre strands. */}
      <group position={[0.2, 0, -2.8]}>
        {[-1.2, 1.2].map((x) => (
          <mesh key={x} position={[x, 0.8, 0]} material={m.trunk}>
            <cylinderGeometry args={[0.05, 0.06, 1.6, 6]} />
          </mesh>
        ))}
        <mesh
          position={[0, 1.55, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={m.trunk}
        >
          <cylinderGeometry args={[0.04, 0.04, 2.6, 6]} />
        </mesh>
        {strands.map((s, i) => (
          <mesh
            key={i}
            position={[s.x + 0.2, 1.55 - s.len / 2, 0]}
            material={m.fibre}
          >
            <boxGeometry args={[0.05, s.len, 0.01]} />
          </mesh>
        ))}
      </group>
      <Stump p={[2.6, 0, 0.4]} h={0.45} rad={0.36} m={m} />
      <Log p={[2.4, 0, -1.6]} r={1.3} len={1.2} m={m} />
      <Log p={[2.7, 0.34, -1.5]} r={1.4} len={1.0} m={m} />
      <Stones m={m} seed={8} n={7} r0={3.4} />
    </group>
  );
}

/** Land around the lake house and the cabin: season ground and a ring of
 * mostly pine trees (snow on them in winter). Replaces the old always-snowy
 * `Outside` of House.tsx. */
export function Surroundings({
  season,
  children,
}: {
  season: SeasonState;
  children?: (m: Mats) => React.ReactNode;
}) {
  const m = useOutdoorMats(season);
  useOutdoorSnow(season, m);
  return (
    <group name="outside">
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        material={m.ground}
        receiveShadow
      >
        <circleGeometry args={[22, 48]} />
      </mesh>
      <TreeRing m={m} seed={42} inner={7} count={26} pines={0.8} />
      {children?.(m)}
    </group>
  );
}

/** Scale of the memory cabin against the lake house shell. */
export const CABIN_SCALE = 0.72;

/** Memory cabin: the house shell at a smaller scale, with plain shelves. */
export function CabinStatic({
  lift,
  season,
}: {
  lift?: { current: number };
  season: SeasonState;
}) {
  const wood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.85 }),
    [],
  );
  const box = useMemo(() => std("#b78f5e"), []);
  const roll = useMemo(() => std("#e6d6b4"), []);
  const shelves = useMemo(() => {
    const r = rng(61);
    const out: { p: V3; s: V3; roll: boolean }[] = [];
    for (const y of [0.45, 0.95, 1.45])
      for (let x = -1.9; x < 1.9; x += 0.42 + r() * 0.2)
        if (r() > 0.3)
          out.push({
            p: [x, y + 0.13, -1.62],
            s: [0.26 + r() * 0.1, 0.2 + r() * 0.08, 0.26],
            roll: r() < 0.35,
          });
    return out;
  }, []);
  return (
    <group name="cabin">
      <group scale={CABIN_SCALE}>
        <Floor />
        <Walls lift={lift} />
        <Surroundings season={season} />
      </group>
      {/* Plain storage shelves along the back wall. */}
      {[0.45, 0.95, 1.45].map((y) => (
        <mesh key={y} position={[0, y, -1.65]} material={wood}>
          <boxGeometry args={[4.2, 0.05, 0.4]} />
        </mesh>
      ))}
      {[-2.1, 0, 2.1].map((x) => (
        <mesh key={x} position={[x, 0.8, -1.65]} material={wood}>
          <boxGeometry args={[0.06, 1.6, 0.4]} />
        </mesh>
      ))}
      {shelves.map((b, i) =>
        b.roll ? (
          <mesh
            key={i}
            position={b.p}
            rotation={[0, 0, Math.PI / 2]}
            material={roll}
          >
            <cylinderGeometry args={[0.07, 0.07, b.s[0] + 0.1, 8]} />
          </mesh>
        ) : (
          <mesh key={i} position={b.p} material={box}>
            <boxGeometry args={b.s} />
          </mesh>
        ),
      )}
      {/* A bench and a low table with a lantern. */}
      <mesh position={[-0.2, 0.22, 0.9]} material={wood}>
        <boxGeometry args={[1.6, 0.06, 0.4]} />
      </mesh>
      {[-0.9, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.1, 0.9]} material={wood}>
          <boxGeometry args={[0.08, 0.2, 0.36]} />
        </mesh>
      ))}
      <mesh position={[0.15, 0.38, -0.3]} material={wood}>
        <boxGeometry args={[0.8, 0.05, 0.5]} />
      </mesh>
      {[-0.3, 0.6].flatMap((x) =>
        [-0.5, -0.1].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.18, z]} material={wood}>
            <boxGeometry args={[0.05, 0.36, 0.05]} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Warm lantern for the cabin (one live light, no fire). */
export function Lantern() {
  const glass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a1a0a",
        emissive: "#ffb347",
        emissiveIntensity: 2.4,
      }),
    [],
  );
  return (
    <group position={[0.15, 0.4, -0.3]}>
      <mesh position={[0, 0.1, 0]} material={glass}>
        <cylinderGeometry args={[0.06, 0.07, 0.18, 8]} />
      </mesh>
      <pointLight
        position={[0, 0.4, 0]}
        intensity={6}
        distance={6}
        decay={1.6}
        color="#ffbe78"
      />
    </group>
  );
}
