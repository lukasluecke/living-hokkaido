// Outdoor sets for the island's themed areas, by `scene.setting`:
// "area-coast" (herring yard), "area-forest" (1890 survey line and forest
// plants), "area-hills" (animal path), "area-mountains" (coal mine mouth).
// Toy sets after the Hokkaido Museum dioramas (theme 2 and theme 4, Lukas's
// photos; visual reference only). Original geometry, MIT. Not reconstructions
// of real places. Claims: knowledge "land-and-sea". Scene space, metres;
// the camera looks from +z, so the open side of each set faces +z.
import { useMemo } from "react";
import * as THREE from "three";
import type { SeasonState } from "@/contracts";
import {
  Ground,
  Log,
  type Mats,
  Stones,
  Stump,
  TreeRing,
  useOutdoorMats,
} from "./Outdoor";

type V3 = [number, number, number];

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    flatShading: true,
    ...extra,
  });

/** One material per colour, so MergeStatic merges each into one mesh. */
function useAreaMats() {
  return useMemo(
    () => ({
      sand: std("#e3cf9e"),
      sea: std("#2f7f9c", { roughness: 0.4 }),
      plank: std("#b48a5a"),
      woodDark: std("#5e3f2a"),
      shingle: std("#c9a25e"),
      stone: std("#a7a090"),
      herring: std("#c9d6de"),
      canvas: std("#efe4c8"),
      coal: std("#24252a"),
      rock: std("#6f6a62"),
      rail: std("#55575c"),
      horse: std("#7a4e30"),
      deer: std("#b07a45"),
      bear: std("#4a3326"),
      white: std("#f1efe4"),
      garlic: std("#6fae55"),
      katakuri: std("#c98bd0"),
      lamp: std("#ffd27a", { emissive: "#ffb347", emissiveIntensity: 1.2 }),
    }),
    [],
  );
}
type A = ReturnType<typeof useAreaMats>;

function Box({
  s,
  p,
  m,
  r = [0, 0, 0],
}: {
  s: V3;
  p: V3;
  m: THREE.Material;
  r?: V3;
}) {
  return (
    <mesh position={p} rotation={r} material={m} castShadow receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  );
}

/** A plain standing person, about 1.6 m (diorama figure, no costume). */
function Person({ p, a, r = 0 }: { p: V3; a: A; r?: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box s={[0.3, 0.75, 0.22]} p={[0, 0.38, 0]} m={a.rail} />
      <Box s={[0.38, 0.55, 0.26]} p={[0, 1.02, 0]} m={a.canvas} />
      <mesh position={[0, 1.45, 0]} material={a.sand}>
        <icosahedronGeometry args={[0.15, 0]} />
      </mesh>
    </group>
  );
}

/** A four-legged animal from boxes: body, neck, head (horse or deer). */
function Beast({
  p,
  r,
  m,
  size = 1,
  load,
}: {
  p: V3;
  r: number;
  m: THREE.Material;
  size?: number;
  load?: THREE.Material;
}) {
  return (
    <group position={p} rotation={[0, r, 0]} scale={size}>
      <Box s={[1.3, 0.5, 0.45]} p={[0, 1.0, 0]} m={m} />
      {[-0.5, 0.5].flatMap((x) =>
        [-0.15, 0.15].map((z) => (
          <Box key={`${x}${z}`} s={[0.12, 0.8, 0.12]} p={[x, 0.4, z]} m={m} />
        )),
      )}
      <Box s={[0.3, 0.6, 0.25]} p={[0.75, 1.4, 0]} m={m} r={[0, 0, -0.5]} />
      <Box s={[0.45, 0.22, 0.22]} p={[1.0, 1.65, 0]} m={m} />
      {load && <Box s={[0.7, 0.4, 0.75]} p={[-0.05, 1.45, 0]} m={load} />}
    </group>
  );
}

/** A tent: a triangular prism along x. */
function Tent({ p, r, m }: { p: V3; r: number; m: THREE.Material }) {
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 2, 3, 1).rotateZ(Math.PI / 2);
    g.rotateX(-Math.PI / 2).scale(1, 1.3 / 1.5, 1.6 / Math.sqrt(3));
    return g.translate(0, 1.3 / 3, 0);
  }, []);
  return (
    <mesh
      position={p}
      rotation={[0, r, 0]}
      geometry={geo}
      material={m}
      castShadow
      receiveShadow
    />
  );
}

/** Coast: a herring yard by the sea, with a work house and a boat. */
function Coast({ m, a }: { m: Mats; a: A }) {
  return (
    <group name="area-coast">
      <Ground m={m} patch={3.6} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.0, -1]}
        material={a.sand}
      >
        <planeGeometry args={[30, 8]} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, -17]}
        material={a.sea}
      >
        <planeGeometry args={[60, 24]} />
      </mesh>
      {/* Work house on a stone base, left. */}
      <group position={[-3.4, 0, -2.6]} rotation={[0, 0.25, 0]}>
        <Box s={[4.2, 0.4, 2.4]} p={[0, 0.2, 0]} m={a.stone} />
        <Box s={[4, 1.6, 2.2]} p={[0, 1.2, 0]} m={a.plank} />
        <Box
          s={[4.4, 0.12, 1.5]}
          p={[0, 2.35, 0.6]}
          m={a.shingle}
          r={[0.65, 0, 0]}
        />
        <Box
          s={[4.4, 0.12, 1.5]}
          p={[0, 2.35, -0.6]}
          m={a.shingle}
          r={[-0.65, 0, 0]}
        />
        {[-1.4, -0.7, 0.7, 1.4].map((x) => (
          <Box
            key={x}
            s={[0.4, 0.35, 0.03]}
            p={[x, 1.45, 1.11]}
            m={a.woodDark}
          />
        ))}
        <Box s={[0.7, 1.1, 0.03]} p={[0, 0.95, 1.11]} m={a.woodDark} />
      </group>
      {/* Drying rack with hanging herring, right. */}
      <group position={[2.6, 0, -1.8]} rotation={[0, -0.3, 0]}>
        {[-1, 1].map((x) => (
          <Box key={x} s={[0.08, 1.7, 0.08]} p={[x, 0.85, 0]} m={a.woodDark} />
        ))}
        <Box s={[2.2, 0.07, 0.07]} p={[0, 1.65, 0]} m={a.woodDark} />
        {Array.from({ length: 8 }, (_, i) => (
          <Box
            key={i}
            s={[0.08, 0.4, 0.04]}
            p={[-0.85 + i * 0.24, 1.35, 0]}
            m={a.herring}
          />
        ))}
      </group>
      {/* Herring in square trays, middle. */}
      {[-1.2, -0.3, 0.6].flatMap((x) =>
        [0.6, 1.5].map((z) => (
          <Box
            key={`${x}${z}`}
            s={[0.7, 0.06, 0.7]}
            p={[x, 0.03, z]}
            m={a.herring}
          />
        )),
      )}
      {/* A crate to set the basket on. */}
      <Box s={[0.7, 0.42, 0.55]} p={[0.9, 0.21, -0.6]} m={a.plank} />
      {/* Boat on the sea. */}
      <group position={[1.5, 0.05, -7]} rotation={[0, 0.3, 0]}>
        <Box s={[3.2, 0.35, 0.9]} p={[0, 0.15, 0]} m={a.plank} />
        <Box s={[2.4, 0.15, 0.65]} p={[0, 0.38, 0]} m={a.herring} />
      </group>
      <Person p={[-1.6, 0, 0.2]} a={a} r={0.6} />
      <Person p={[1.9, 0, 0.8]} a={a} r={-0.8} />
    </group>
  );
}

/** Forest: the 1890 survey line, a camp, and forest-floor plants. */
function Forest({ m, a }: { m: Mats; a: A }) {
  const plants = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: -2.6 + (i % 7) * 0.32 + (i > 6 ? 0.15 : 0),
        z: 1.2 + (i > 6 ? 0.4 : 0),
        k: i % 3,
      })),
    [],
  );
  return (
    <group name="area-forest">
      <Ground m={m} patch={3.4} />
      <TreeRing m={m} seed={41} inner={4.6} count={30} pines={0.35} />
      {/* The cut survey line: a straight row of stakes, left to right. */}
      {Array.from({ length: 9 }, (_, i) => (
        <group key={i} position={[-4 + i, 0, -0.1]}>
          <Box s={[0.06, 0.8, 0.06]} p={[0, 0.4, 0]} m={a.woodDark} />
          <Box s={[0.16, 0.06, 0.01]} p={[0.08, 0.72, 0.03]} m={a.white} />
        </group>
      ))}
      {/* Camp: canvas tents at the back right. */}
      <Tent p={[2.2, 0, -2.6]} r={0.3} m={a.canvas} />
      <Tent p={[3.6, 0, -1.6]} r={-0.2} m={a.canvas} />
      {/* Pack horses with loads, back left. */}
      <Beast p={[-2.4, 0, -2.4]} r={0.3} m={a.horse} load={a.canvas} />
      <Beast p={[-3.8, 0, -1.9]} r={0.3} m={a.horse} load={a.canvas} />
      {/* A tree cut because it stood on the line, and two sawyers. */}
      <Stump p={[1.2, 0, -0.1]} m={m} />
      <Log p={[1.8, 0, 0.7]} r={0.6} len={2.4} m={m} />
      <Person p={[0.6, 0, 0.25]} a={a} r={0.4} />
      <Person p={[-1.2, 0, -1.2]} a={a} r={0.2} />
      {/* Forest plants: wild garlic, katakuri, giant lily (wild-plants). */}
      {plants.map((pl, i) =>
        pl.k === 0 ? (
          <mesh key={i} position={[pl.x, 0.15, pl.z]} material={a.garlic}>
            <coneGeometry args={[0.08, 0.3, 5]} />
          </mesh>
        ) : pl.k === 1 ? (
          <mesh key={i} position={[pl.x, 0.08, pl.z]} material={a.katakuri}>
            <icosahedronGeometry args={[0.08, 0]} />
          </mesh>
        ) : (
          <group key={i} position={[pl.x, 0, pl.z]}>
            <Box s={[0.03, 0.8, 0.03]} p={[0, 0.4, 0]} m={a.garlic} />
            <mesh position={[0, 0.85, 0]} material={a.white}>
              <icosahedronGeometry args={[0.09, 0]} />
            </mesh>
          </group>
        ),
      )}
      <Stones m={m} seed={9} n={6} r0={3.2} />
    </group>
  );
}

/** Hills: a meadow with an animal path, deer at the edge, a bear on rocks. */
function Hills({ m, a }: { m: Mats; a: A }) {
  return (
    <group name="area-hills">
      <Ground m={m} patch={3.2} />
      <TreeRing m={m} seed={57} inner={5.4} count={18} pines={0.3} />
      <Beast p={[-3.2, 0, -2.6]} r={0.5} m={a.deer} size={0.75} />
      <Beast p={[-1.9, 0, -3.4]} r={1.1} m={a.deer} size={0.7} />
      <Beast p={[-4.2, 0, -1.2]} r={-0.4} m={a.deer} size={0.65} />
      {/* Rocks and a brown bear, back right. */}
      {(
        [
          [3, -3, 1],
          [4, -2.2, 0.8],
          [2.3, -3.8, 0.7],
        ] as const
      ).map(([x, z, r]) => (
        <mesh
          key={`${x}${z}`}
          position={[x, r * 0.45, z]}
          scale={[1, 0.7, 1]}
          material={a.stone}
        >
          <icosahedronGeometry args={[r, 0]} />
        </mesh>
      ))}
      <group position={[2.6, 0, -1.8]} rotation={[0, 2.6, 0]}>
        <mesh
          position={[0, 0.65, 0]}
          scale={[1.3, 0.8, 0.85]}
          material={a.bear}
        >
          <icosahedronGeometry args={[0.6, 0]} />
        </mesh>
        <mesh position={[0.75, 0.75, 0]} material={a.bear}>
          <icosahedronGeometry args={[0.33, 0]} />
        </mesh>
        {[-0.45, 0.45].flatMap((x) =>
          [-0.25, 0.25].map((z) => (
            <Box
              key={`${x}${z}`}
              s={[0.22, 0.4, 0.22]}
              p={[x, 0.2, z]}
              m={a.bear}
            />
          )),
        )}
      </group>
      <Stones m={m} seed={3} n={8} r0={3} />
      <Log p={[-1.6, 0, 1.4]} r={0.3} m={m} />
    </group>
  );
}

/** Mountains: the mouth of a coal mine, rails, a cart, a coal heap, and a
 * horse sleigh with logs from the winter woods. */
function Mountains({ m, a }: { m: Mats; a: A }) {
  return (
    <group name="area-mountains">
      <Ground m={m} patch={3.6} />
      <TreeRing m={m} seed={73} inner={5.8} count={16} pines={0.9} />
      {/* Rock face with the adit and its timber frame. */}
      <mesh position={[0, 1.4, -4.6]} scale={[2.2, 1.1, 1]} material={a.rock}>
        <icosahedronGeometry args={[2.6, 0]} />
      </mesh>
      <Box s={[1.8, 1.9, 1.2]} p={[0, 0.95, -2.5]} m={a.coal} />
      <Box s={[0.22, 2.1, 0.22]} p={[-1, 1.05, -1.9]} m={a.plank} />
      <Box s={[0.22, 2.1, 0.22]} p={[1, 1.05, -1.9]} m={a.plank} />
      <Box s={[2.5, 0.25, 0.3]} p={[0, 2.15, -1.9]} m={a.plank} />
      {/* Rails and sleepers out of the adit. */}
      {Array.from({ length: 10 }, (_, i) => (
        <Box
          key={i}
          s={[1.1, 0.06, 0.16]}
          p={[0, 0.03, -1.8 + i * 0.55]}
          m={a.woodDark}
        />
      ))}
      {[-0.35, 0.35].map((x) => (
        <Box key={x} s={[0.06, 0.08, 5.6]} p={[x, 0.1, 0.7]} m={a.rail} />
      ))}
      {/* A coal cart on the rails (the coal lump sits on top). */}
      <group position={[0, 0, -0.6]}>
        <Box s={[1, 0.55, 1.3]} p={[0, 0.5, 0]} m={a.rail} />
        {[-0.4, 0.4].flatMap((x) =>
          [-0.45, 0.45].map((z) => (
            <mesh
              key={`${x}${z}`}
              position={[x, 0.18, z]}
              rotation={[0, 0, Math.PI / 2]}
              material={a.coal}
            >
              <cylinderGeometry args={[0.16, 0.16, 0.08, 10]} />
            </mesh>
          )),
        )}
      </group>
      {/* Coal heap, left; shed, right. */}
      <mesh position={[-2.6, 0.6, -1]} material={a.coal}>
        <coneGeometry args={[1.3, 1.2, 7]} />
      </mesh>
      <group position={[3, 0, -1.6]} rotation={[0, -0.3, 0]}>
        <Box s={[2, 1.6, 1.6]} p={[0, 0.8, 0]} m={a.plank} />
        <Box
          s={[2.3, 0.12, 1.1]}
          p={[0, 1.8, 0.4]}
          m={a.woodDark}
          r={[0.5, 0, 0]}
        />
        <Box
          s={[2.3, 0.12, 1.1]}
          p={[0, 1.8, -0.4]}
          m={a.woodDark}
          r={[-0.5, 0, 0]}
        />
      </group>
      {/* Miners with head lamps. */}
      <Person p={[-1.1, 0, -0.9]} a={a} r={0.5} />
      <Person p={[1.3, 0, 0.1]} a={a} r={-0.6} />
      <Box s={[0.1, 0.08, 0.06]} p={[-1.03, 1.55, -0.78]} m={a.lamp} />
      <Box s={[0.1, 0.08, 0.06]} p={[1.22, 1.55, 0.22]} m={a.lamp} />
      {/* Winter logging: a horse sleigh with logs, front right. */}
      <group position={[2.6, 0, 1.6]} rotation={[0, -0.2, 0]}>
        <Box s={[2.2, 0.1, 0.8]} p={[0, 0.12, 0]} m={a.woodDark} />
        {(
          [
            [0.32, -0.2],
            [0.32, 0.2],
            [0.62, 0],
          ] as const
        ).map(([y, z]) => (
          <mesh
            key={`${y}${z}`}
            position={[0, y, z]}
            rotation={[0, 0, Math.PI / 2]}
            material={a.plank}
          >
            <cylinderGeometry args={[0.17, 0.17, 2.3, 8]} />
          </mesh>
        ))}
        <Beast p={[2, 0, 0]} r={0} m={a.horse} size={0.85} />
      </group>
    </group>
  );
}

export const AREA_SETTINGS = [
  "area-coast",
  "area-forest",
  "area-hills",
  "area-mountains",
] as const;

export function isAreaSetting(kind: string) {
  return (AREA_SETTINGS as readonly string[]).includes(kind);
}

export function AreaStatic({
  kind,
  season,
}: {
  kind: string;
  season: SeasonState;
}) {
  const m = useOutdoorMats(season);
  const a = useAreaMats();
  if (kind === "area-coast") return <Coast m={m} a={a} />;
  if (kind === "area-forest") return <Forest m={m} a={a} />;
  if (kind === "area-hills") return <Hills m={m} a={a} />;
  return <Mountains m={m} a={a} />;
}
