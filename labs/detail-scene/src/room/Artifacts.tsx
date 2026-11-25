import { useGLTF } from "@react-three/drei";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { type ReactNode, Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clothTexture, rng, woodTexture } from "./textures";

export type ArtifactId = "fiber" | "cloth" | "garment";

export type ArtifactDef = {
  id: ArtifactId;
  label: string;
  title: string;
  body: string;
  position: [number, number, number];
  rotationY: number;
  /** Where the camera goes on focus, in world space. */
  view: { eye: [number, number, number]; target: [number, number, number] };
  notes: { at: [number, number, number]; text: string }[];
};

// Text mirrors src/data/story.ts in the main app. Notes only describe the
// prototype itself, so no new cultural claims are introduced here.
export const ARTIFACTS: ArtifactDef[] = [
  {
    id: "fiber",
    label: "Inner bark fibers",
    title: "A material",
    body: "The museum describes inner bark fibers used to weave cloth.",
    position: [-2.3, 0.4, -2.1],
    rotationY: 0.25,
    view: { eye: [-1.6, 1.25, -0.9], target: [-2.3, 0.5, -2.1] },
    notes: [
      { at: [0.2, 0.12, 0], text: "Placeholder bundle. A scanned object can replace it." },
      { at: [-0.35, 0.18, 0.05], text: "Source: Hokkaido Digital Museum, ‘Bark clothes’." },
    ],
  },
  {
    id: "cloth",
    label: "From fiber to cloth",
    title: "A woven surface",
    body: "This abstract grid invites close observation. It does not teach an authenticated weaving technique.",
    position: [2.3, 0, -1.55],
    rotationY: -0.55,
    view: { eye: [0.75, 1.3, 0.25], target: [2.3, 0.8, -1.55] },
    notes: [
      { at: [0, 1.0, 0.05], text: "The weave activity (D2) starts here." },
      { at: [0, 0.45, 0.05], text: "Woven part grows as the visitor completes rows." },
    ],
  },
  {
    id: "garment",
    label: "More than one story",
    title: "A garment",
    body: "The museum describes variation in clothing by region, material and occasion.",
    position: [0.95, 0, -2.15],
    rotationY: 0,
    view: { eye: [0.55, 1.35, 0.35], target: [0.95, 0.95, -2.15] },
    notes: [
      { at: [0, 1.2, 0.12], text: "Plain band only. Real patterns need a source and a reviewer." },
      { at: [0.45, 1.45, 0.1], text: "Region, material and occasion matter." },
    ],
  },
];

function useHoverGlow(group: React.RefObject<THREE.Group | null>, on: boolean) {
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (!m || !("emissive" in m) || m.userData.keepEmissive) return;
      const target = on ? 0.22 : 0;
      m.emissive.set("#ffc98a");
      m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, target, 10, dt);
    });
  });
}

function FiberBundle() {
  const mats = useMemo(() => {
    const r = rng(31);
    return Array.from({ length: 9 }, () =>
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.09 + r() * 0.03, 0.4, 0.45 + r() * 0.15), roughness: 1 }),
    );
  }, []);
  const tie = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4a3420", roughness: 1 }), []);
  return (
    <group>
      {mats.map((m, i) => (
        <mesh key={i} material={m} position={[0, 0.03 + (i % 3) * 0.025, (i - 4) * 0.03]} rotation={[0, (i - 4) * 0.03, (i % 2) * 0.04]} castShadow receiveShadow>
          <boxGeometry args={[0.95, 0.018, 0.035]} />
        </mesh>
      ))}
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} material={tie} position={[x, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.16, 0.012, 6, 16]} />
        </mesh>
      ))}
      {/* A small ball of twisted thread next to the bundle. */}
      <mesh material={mats[2]} position={[0.62, 0.08, 0.12]} castShadow>
        <sphereGeometry args={[0.08, 14, 10]} />
      </mesh>
    </group>
  );
}

function Loom({ progress = 0.45 }: { progress?: number }) {
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.7 }), []);
  const thread = useMemo(() => new THREE.LineBasicMaterial({ color: "#d8c49a" }), []);
  const cloth = useMemo(() => new THREE.MeshStandardMaterial({ map: clothTexture(), roughness: 0.95, side: THREE.DoubleSide }), []);
  const warp = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 28; i++) {
      const x = -0.42 + (i / 27) * 0.84;
      pts.push(x, 0.22, 0, x, 1.32, 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const wovenH = 1.1 * progress;
  return (
    <group>
      {[-0.52, 0.52].map((x) => (
        <mesh key={x} material={wood} position={[x, 0.75, 0]} castShadow>
          <boxGeometry args={[0.07, 1.5, 0.07]} />
        </mesh>
      ))}
      {[0.2, 1.34].map((y) => (
        <mesh key={y} material={wood} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 1.1, 8]} />
        </mesh>
      ))}
      <lineSegments geometry={warp} material={thread} />
      <mesh material={cloth} position={[0, 0.22 + wovenH / 2, 0.004]} castShadow>
        <planeGeometry args={[0.86, wovenH]} />
      </mesh>
      {/* Shed stick. */}
      <mesh material={wood} position={[0, 0.3 + wovenH, 0.03]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.025, 1.0, 0.05]} />
      </mesh>
      {/* Feet. */}
      {[-0.52, 0.52].map((x) => (
        <mesh key={`f${x}`} material={wood} position={[x, 0.03, 0]}>
          <boxGeometry args={[0.1, 0.06, 0.5]} />
        </mesh>
      ))}
    </group>
  );
}

function GarmentOnStand() {
  const cloth = useMemo(() => new THREE.MeshStandardMaterial({ map: clothTexture(), roughness: 0.95, side: THREE.DoubleSide }), []);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.7 }), []);
  const body = useMemo(() => {
    // A flat robe silhouette, slightly bent like hanging cloth.
    const g = new THREE.PlaneGeometry(0.78, 1.15, 12, 12);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      p.setX(i, x * (1 + (0.575 - y) * 0.12));
      p.setZ(i, Math.cos(x * 4) * 0.04 + Math.sin(y * 6 + x * 3) * 0.008);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh material={wood} position={[0, 0.8, -0.08]} castShadow>
        <boxGeometry args={[0.06, 1.6, 0.06]} />
      </mesh>
      <mesh material={wood} position={[0, 0.02, -0.08]}>
        <boxGeometry args={[0.5, 0.04, 0.4]} />
      </mesh>
      <mesh material={wood} position={[0, 1.55, -0.02]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 1.6, 8]} />
      </mesh>
      <mesh material={cloth} geometry={body} position={[0, 0.95, 0]} castShadow receiveShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} material={cloth} position={[s * 0.58, 1.42, 0]} rotation={[0, 0, s * -0.08]} castShadow>
          <boxGeometry args={[0.44, 0.24, 0.05]} />
        </mesh>
      ))}
    </group>
  );
}

/** A real photogrammetry scan (CC0, Khronos sample "Corset", optimized). */
export function ScanStandIn() {
  const { scene } = useGLTF("/assets/corset-opt.glb");
  const obj = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const s = 1.35 / size.y;
    c.scale.setScalar(s);
    box.setFromObject(c);
    c.position.y -= box.min.y;
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.material = (m.material as THREE.Material).clone();
      }
    });
    return c;
  }, [scene]);
  return <primitive object={obj} />;
}

function ArtifactShell({
  def,
  hovered,
  focused,
  onHover,
  onSelect,
  children,
}: {
  def: ArtifactDef;
  hovered: boolean;
  focused: boolean;
  onHover: (id: ArtifactId | null) => void;
  onSelect: (id: ArtifactId) => void;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useHoverGlow(ref, hovered && !focused);
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
  }, [hovered]);
  return (
    <group
      ref={ref}
      position={def.position}
      rotation={[0, def.rotationY, 0]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(def.id);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(def.id);
      }}
    >
      {children}
    </group>
  );
}

/** World position of a point given in an artifact's local space. */
export function artifactPoint(def: ArtifactDef, local: [number, number, number]) {
  return new THREE.Vector3(...local)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), def.rotationY)
    .add(new THREE.Vector3(...def.position));
}

export function Artifacts({
  hovered,
  focused,
  onHover,
  onSelect,
  scanGarment,
}: {
  hovered: ArtifactId | null;
  focused: ArtifactId | null;
  onHover: (id: ArtifactId | null) => void;
  onSelect: (id: ArtifactId) => void;
  scanGarment: boolean;
}) {
  return (
    <group name="artifacts">
      {ARTIFACTS.map((def) => (
        <ArtifactShell
          key={def.id}
          def={def}
          hovered={hovered === def.id}
          focused={focused === def.id}
          onHover={onHover}
          onSelect={onSelect}
        >
          {def.id === "fiber" && <FiberBundle />}
          {def.id === "cloth" && <Loom />}
          {def.id === "garment" &&
            (scanGarment ? (
              <Suspense fallback={<GarmentOnStand />}>
                <ScanStandIn />
              </Suspense>
            ) : (
              <GarmentOnStand />
            ))}
        </ArtifactShell>
      ))}
    </group>
  );
}
