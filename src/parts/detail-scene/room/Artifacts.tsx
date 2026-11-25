// Room versions of the three objects, placed by the content pack.
// Ported from labs/detail-scene (src/room/Artifacts.tsx). Illustrative
// geometry only.
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { type ReactNode, Suspense, useEffect, useRef } from "react";
import { useMemo } from "react";
import * as THREE from "three";
import type { Artifact, ArtifactPlacement } from "@/contracts";
import { GlbObject } from "../../shared/Glb";
import { type AreaObjectId, areaObjects } from "../../shared/areaObjects";
import { clothTexture, rng, woodTexture } from "./textures";

function useHoverGlow(group: React.RefObject<THREE.Group | null>, on: boolean) {
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as
        | THREE.MeshStandardMaterial
        | undefined;
      if (!m || !("emissive" in m) || m.userData.keepEmissive) return;
      const target = on ? 0.22 : 0;
      m.emissive.set("#ffc98a");
      m.emissiveIntensity = THREE.MathUtils.damp(
        m.emissiveIntensity,
        target,
        10,
        dt,
      );
    });
  });
}

function FiberBundle() {
  const mats = useMemo(() => {
    const r = rng(31);
    return Array.from(
      { length: 9 },
      () =>
        new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(
            0.09 + r() * 0.03,
            0.4,
            0.45 + r() * 0.15,
          ),
          roughness: 1,
        }),
    );
  }, []);
  const tie = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#4a3420", roughness: 1 }),
    [],
  );
  return (
    <group>
      {mats.map((m, i) => (
        <mesh
          key={i}
          material={m}
          position={[0, 0.03 + (i % 3) * 0.025, (i - 4) * 0.03]}
          rotation={[0, (i - 4) * 0.03, (i % 2) * 0.04]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.95, 0.018, 0.035]} />
        </mesh>
      ))}
      {[-0.3, 0.3].map((x) => (
        <mesh
          key={x}
          material={tie}
          position={[x, 0.06, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
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
  const wood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.7 }),
    [],
  );
  const thread = useMemo(
    () => new THREE.LineBasicMaterial({ color: "#d8c49a" }),
    [],
  );
  const cloth = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: clothTexture(),
        roughness: 0.95,
        side: THREE.DoubleSide,
      }),
    [],
  );
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
        <mesh
          key={y}
          material={wood}
          position={[0, y, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.035, 0.035, 1.1, 8]} />
        </mesh>
      ))}
      <lineSegments geometry={warp} material={thread} />
      <mesh
        material={cloth}
        position={[0, 0.22 + wovenH / 2, 0.004]}
        castShadow
      >
        <planeGeometry args={[0.86, wovenH]} />
      </mesh>
      {/* Shed stick. */}
      <mesh
        material={wood}
        position={[0, 0.3 + wovenH, 0.03]}
        rotation={[0, 0, Math.PI / 2]}
      >
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
  const cloth = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: clothTexture(),
        roughness: 0.95,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const wood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.7 }),
    [],
  );
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
      <mesh
        material={wood}
        position={[0, 1.55, -0.02]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.025, 0.025, 1.6, 8]} />
      </mesh>
      <mesh
        material={cloth}
        geometry={body}
        position={[0, 0.95, 0]}
        castShadow
        receiveShadow
      />
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          material={cloth}
          position={[s * 0.58, 1.42, 0]}
          rotation={[0, 0, s * -0.08]}
          castShadow
        >
          <boxGeometry args={[0.44, 0.24, 0.05]} />
        </mesh>
      ))}
    </group>
  );
}

/** Themed-area objects, shared with the artifacts viewer. */
function AreaObject({ id }: { id: AreaObjectId }) {
  const obj = useMemo(() => areaObjects[id](), [id]);
  return <primitive object={obj} />;
}

/** Room model by artifact id. Unknown ids get a neutral plinth. */
export function RoomModel({ artifactId }: { artifactId: string }) {
  if (artifactId in areaObjects)
    return <AreaObject id={artifactId as AreaObjectId} />;
  if (artifactId === "fiber") return <FiberBundle />;
  if (artifactId === "cloth") return <Loom />;
  if (artifactId === "garment") return <GarmentOnStand />;
  return (
    <mesh position={[0, 0.25, 0]} castShadow>
      <boxGeometry args={[0.4, 0.5, 0.4]} />
      <meshStandardMaterial color="#a7a090" />
    </mesh>
  );
}

/** Code model now; a GLB replaces it by changing artifact.model.source only. */
export function RoomObject({
  artifactId,
  source,
}: {
  artifactId: string;
  source?: Artifact["model"]["source"];
}) {
  if (source?.kind === "glb")
    return (
      <Suspense fallback={<RoomModel artifactId={artifactId} />}>
        <GlbObject url={source.url} />
      </Suspense>
    );
  return <RoomModel artifactId={artifactId} />;
}

export function ArtifactShell({
  placement,
  hovered,
  focused,
  onHover,
  onSelect,
  children,
}: {
  placement: ArtifactPlacement;
  hovered: boolean;
  focused: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useHoverGlow(ref, hovered && !focused);
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);
  return (
    <group
      ref={ref}
      position={placement.position}
      rotation={[0, placement.rotationY, 0]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(placement.artifactId);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(placement.artifactId);
      }}
    >
      {children}
    </group>
  );
}
