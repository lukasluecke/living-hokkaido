import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  matTexture,
  reedTexture,
  rng,
  thatchTexture,
  woodTexture,
} from "./textures";

// An illustrative lake-house workshop interior. Original geometry, MIT.
// It is NOT a reconstruction of a specific Ainu house (see PROJECT.md).

export const ROOM = { w: 7.2, d: 5.2, h: 2.2, peak: 4.3 } as const;
const HW = ROOM.w / 2;
const HD = ROOM.d / 2;

type Box = {
  p: [number, number, number];
  s: [number, number, number];
  r?: [number, number, number];
};

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

function Walls() {
  const wall = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: reedTexture([6, 1.4]),
        roughness: 0.95,
      }),
    [],
  );
  const wallShort = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: reedTexture([2, 1.4]),
        roughness: 0.95,
      }),
    [],
  );
  const wood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.8 }),
    [],
  );
  const t = 0.18;
  const h = ROOM.h;
  // East wall has a window gap between z -0.6..0.6, y 0.9..1.6.
  const win = { z0: -0.6, z1: 0.6, y0: 0.9, y1: 1.6 };
  const walls: Box[] = [
    { p: [0, h / 2, -HD], s: [ROOM.w, h, t] }, // north
    { p: [-1.9, h / 2, HD], s: [ROOM.w / 2 - 0.4 + 0.3, h, t] }, // south left of door
    { p: [2.1, h / 2, HD], s: [ROOM.w / 2 - 0.6 + 0.1, h, t] }, // south right of door
    { p: [0.15, h - 0.3, HD], s: [1.1, 0.6, t] }, // above door
    { p: [-HW, h / 2, 0], s: [t, h, ROOM.d] }, // west
    // east, around window
    { p: [HW, h / 2, (-HD + win.z0) / 2], s: [t, h, win.z0 + HD] },
    { p: [HW, h / 2, (HD + win.z1) / 2], s: [t, h, HD - win.z1] },
    { p: [HW, win.y0 / 2, 0], s: [t, win.y0, win.z1 - win.z0] },
    { p: [HW, (h + win.y1) / 2, 0], s: [t, h - win.y1, win.z1 - win.z0] },
  ];
  const posts: Box[] = [];
  for (const x of [-HW, -HW / 2, 0, HW / 2, HW]) {
    for (const z of [-HD, HD])
      posts.push({ p: [x, h / 2, z], s: [0.22, h + 0.1, 0.22] });
  }
  for (const z of [-HD / 2, HD / 2]) {
    posts.push({ p: [-HW, h / 2, z], s: [0.22, h + 0.1, 0.22] });
    posts.push({ p: [HW, h / 2, z], s: [0.22, h + 0.1, 0.22] });
  }
  // Wall plates on top of the walls.
  const plates: Box[] = [
    { p: [0, h, -HD], s: [ROOM.w + 0.3, 0.16, 0.26] },
    { p: [0, h, HD], s: [ROOM.w + 0.3, 0.16, 0.26] },
    { p: [-HW, h, 0], s: [0.26, 0.16, ROOM.d + 0.3] },
    { p: [HW, h, 0], s: [0.26, 0.16, ROOM.d + 0.3] },
    // Window frame.
    { p: [HW - 0.02, win.y0, 0], s: [0.26, 0.06, 1.3] },
    { p: [HW - 0.02, win.y1, 0], s: [0.26, 0.06, 1.3] },
  ];
  return (
    <group name="walls">
      <Boxes items={walls.slice(0, 1)} material={wall} />
      <Boxes items={walls.slice(1)} material={wallShort} />
      <Boxes items={[...posts, ...plates]} material={wood} />
    </group>
  );
}

function Floor() {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: matTexture([5, 3.5]),
        roughness: 1,
      }),
    [],
  );
  const earth = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#5d4632", roughness: 1 }),
    [],
  );
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
      {/* Mats leave a strip of earth floor around the hearth. */}
      {[
        { p: [-2.25, 0.012, 0], s: [2.6, ROOM.d - 0.4] },
        { p: [2.25, 0.012, 0], s: [2.6, ROOM.d - 0.4] },
        { p: [0, 0.012, -1.75], s: [1.9, 1.3] },
      ].map((m, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={m.p as [number, number, number]}
          material={mat}
          receiveShadow
        >
          <planeGeometry args={m.s as [number, number]} />
        </mesh>
      ))}
    </group>
  );
}

function Furniture() {
  const wood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.75 }),
    [],
  );
  const dark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3e2a1b", roughness: 0.8 }),
    [],
  );
  const rope = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#a88b5e", roughness: 1 }),
    [],
  );
  const pot = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a332c",
        roughness: 0.85,
        metalness: 0.1,
      }),
    [],
  );
  const basket = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#9a7a48", roughness: 1 }),
    [],
  );
  const r = useMemo(() => rng(5), []);
  // Low platform along the north wall, shelves along the west wall.
  const items: Box[] = [
    { p: [-2.3, 0.2, -2.15], s: [2.4, 0.4, 0.75] },
    { p: [-3.3, 0.9, -0.6], s: [0.5, 0.06, 1.8] },
    { p: [-3.3, 1.45, -0.6], s: [0.5, 0.06, 1.8] },
    // Hanging rack above the hearth.
    { p: [0, 1.85, 0.2], s: [1.6, 0.06, 0.06] },
    { p: [0, 1.85, -0.3], s: [1.6, 0.06, 0.06] },
    { p: [0, 1.85, 0.7], s: [1.6, 0.06, 0.06] },
    { p: [-0.75, 1.85, 0.2], s: [0.06, 0.06, 1.1] },
    { p: [0.75, 1.85, 0.2], s: [0.06, 0.06, 1.1] },
  ];
  const ropes: Box[] = [
    { p: [-0.75, 2.6, -0.3], s: [0.02, 1.5, 0.02] },
    { p: [0.75, 2.6, -0.3], s: [0.02, 1.5, 0.02] },
    { p: [-0.75, 2.6, 0.7], s: [0.02, 1.5, 0.02] },
    { p: [0.75, 2.6, 0.7], s: [0.02, 1.5, 0.02] },
  ];
  const baskets = Array.from({ length: 5 }, (_, i) => ({
    p: [
      -3.3,
      0.93 + (i > 2 ? 0.55 : 0) + 0.12,
      -1.3 + (i % 3) * 0.6 + r() * 0.1,
    ] as [number, number, number],
    rad: 0.14 + r() * 0.06,
  }));
  return (
    <group name="furniture">
      <Boxes items={items} material={wood} />
      <Boxes items={ropes} material={rope} />
      {baskets.map((b, i) => (
        <mesh key={i} position={b.p} material={basket} castShadow receiveShadow>
          <cylinderGeometry args={[b.rad, b.rad * 0.8, 0.24, 10]} />
        </mesh>
      ))}
      {/* Pot hung over the hearth. */}
      <mesh position={[0, 1.3, 0.2]} material={pot} castShadow>
        <sphereGeometry
          args={[0.19, 16, 12, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.75]}
        />
      </mesh>
      <mesh position={[0, 1.6, 0.2]} material={rope}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 4]} />
      </mesh>
      {/* Firewood stack in the corner. */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={`log${i}`}
          position={[
            2.9 - (i % 3) * 0.02,
            0.09 + Math.floor(i / 3) * 0.15,
            1.6 + (i % 3) * 0.16,
          ]}
          rotation={[0, 0, Math.PI / 2]}
          material={dark}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.075, 0.075, 0.9, 7]} />
        </mesh>
      ))}
    </group>
  );
}

/** Gable roof. Its group is exposed so the director can lift it. */
export function Roof({ lift }: { lift: { current: number } }) {
  const ref = useRef<THREE.Group>(null);
  const thatch = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: thatchTexture([4, 2]),
        roughness: 1,
        side: THREE.DoubleSide,
        transparent: true,
      }),
    [],
  );
  const wood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: woodTexture(),
        roughness: 0.8,
        transparent: true,
      }),
    [],
  );
  const rise = ROOM.peak - ROOM.h;
  const span = HD + 0.6;
  const slope = Math.hypot(span, rise);
  const angle = Math.atan2(rise, span);
  const gable = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-HD, 0);
    s.lineTo(HD, 0);
    s.lineTo(0, rise);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, [rise]);

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
      <group position={[0, ROOM.h, 0]}>
        {[1, -1].map((side) => (
          <group key={side}>
            {[0, 1, 2].map((layer) => (
              <mesh
                key={layer}
                material={thatch}
                position={[
                  0,
                  rise / 2 + 0.08 + layer * 0.07,
                  (side * span) / 2,
                ]}
                rotation={[side * angle, 0, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry
                  args={[
                    ROOM.w + 1.2 - layer * 0.15,
                    0.12,
                    slope - layer * 0.25,
                  ]}
                />
              </mesh>
            ))}
          </group>
        ))}
        {/* Ridge and rafters seen from inside. */}
        <mesh
          position={[0, rise + 0.1, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={wood}
          castShadow
        >
          <cylinderGeometry args={[0.1, 0.1, ROOM.w + 1.3, 8]} />
        </mesh>
        {[-HW + 0.3, -HW / 2, 0, HW / 2, HW - 0.3].map((x) =>
          [1, -1].map((side) => (
            <mesh
              key={`${x}${side}`}
              position={[x, rise / 2, (side * HD) / 2]}
              rotation={[side * Math.atan2(rise, HD), 0, 0]}
              material={wood}
            >
              <boxGeometry args={[0.1, 0.1, Math.hypot(HD, rise)]} />
            </mesh>
          )),
        )}
        {[-HW, HW].map((x) => (
          <mesh
            key={x}
            geometry={gable}
            material={thatch}
            position={[x, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
          />
        ))}
      </group>
    </group>
  );
}

function Outside() {
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
export function HouseStatic({ outside = true }: { outside?: boolean }) {
  return (
    <group name="house">
      <Floor />
      <Walls />
      <Furniture />
      {outside && <Outside />}
    </group>
  );
}
