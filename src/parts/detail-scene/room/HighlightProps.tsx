"use client";
// Highlight signposts (content `highlight.marker`): a small code-built prop
// in the place's scene for a highlight that has no object there (the slope
// game, Out of Place, the house over time). A click opens the highlight. The
// props are illustrative signposts, not objects with facts. A GLB in
// `marker.model` (Hyper3D, public/models/prop-*.glb) replaces the code prop;
// the code prop shows while it loads.
import { useCursor } from "@react-three/drei";
import { Suspense, useMemo, useState } from "react";
import * as THREE from "three";
import type { Emit, Highlight } from "@/contracts";
import { useGlbClone } from "../../shared/Glb";

const WOOD = "#9a6a43";
const WOOD_DARK = "#6e4a2f";
const GLASS = "#cfe3ea";
const SAND = "#e8c27a";

function Sled() {
  return (
    <group>
      {[-0.17, 0.17].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.03, 0]}>
            <boxGeometry args={[0.04, 0.04, 0.9]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
          <mesh position={[x, 0.1, 0.47]} rotation={[-0.9, 0, 0]}>
            <boxGeometry args={[0.04, 0.04, 0.18]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
          {[-0.3, 0, 0.3].map((z) => (
            <mesh key={z} position={[x, 0.1, z]}>
              <boxGeometry args={[0.04, 0.12, 0.04]} />
              <meshStandardMaterial color={WOOD_DARK} />
            </mesh>
          ))}
        </group>
      ))}
      {[-0.3, -0.15, 0, 0.15, 0.3].map((z) => (
        <mesh key={z} position={[0, 0.18, z]}>
          <boxGeometry args={[0.44, 0.03, 0.11]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      ))}
    </group>
  );
}

function Crates() {
  const boxes: [number, number, number, number][] = [
    [-0.22, 0.15, 0, 0.05],
    [0.22, 0.15, 0.02, -0.08],
    [0, 0.45, 0, 0.12],
  ];
  return (
    <group>
      {boxes.map(([x, y, z, r]) => (
        <group key={`${x}-${y}`} position={[x, y, z]} rotation={[0, r, 0]}>
          <mesh>
            <boxGeometry args={[0.42, 0.3, 0.32]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
          {[-0.08, 0.08].map((dy) => (
            <mesh key={dy} position={[0, dy, 0.162]}>
              <boxGeometry args={[0.43, 0.02, 0.01]} />
              <meshStandardMaterial color={WOOD_DARK} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Hourglass() {
  return (
    <group>
      {[0.03, 0.67].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {[0, 2.09, 4.19].map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.16, 0.35, Math.sin(a) * 0.16]}>
          <cylinderGeometry args={[0.018, 0.018, 0.6, 6]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.12, 0.26, 16]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.12, 0.26, 16]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.02, 0.09, 0.1, 16]} />
        <meshStandardMaterial color={SAND} />
      </mesh>
    </group>
  );
}

/** Generated GLBs come centred at the origin in any size: scale the
 *  largest side to `size` metres and stand the model on the ground. */
function Model({ url, size }: { url: string; size: number }) {
  const o = useGlbClone(url);
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(o);
    const dim = box.getSize(new THREE.Vector3());
    const k = size / Math.max(dim.x, dim.y, dim.z, 1e-6);
    const c = box.getCenter(new THREE.Vector3());
    return { k, pos: [-c.x * k, -box.min.y * k, -c.z * k] as const };
  }, [o, size]);
  return (
    <group position={[...fit.pos]} scale={fit.k}>
      <primitive object={o} />
    </group>
  );
}

/** Largest side of each prop, in metres (matches the code-built props). */
const SIZE = { sled: 0.9, crates: 0.75, hourglass: 0.7 };

const PROPS = { sled: Sled, crates: Crates, hourglass: Hourglass };

export function HighlightProps({
  highlights,
  emit,
}: {
  highlights: Highlight[];
  emit: Emit;
}) {
  const [hover, setHover] = useState<string | null>(null);
  useCursor(hover !== null);
  return (
    <>
      {highlights.map((h) => {
        const m = h.marker;
        if (!m) return null;
        const Prop = PROPS[m.prop];
        return (
          <group
            key={h.id}
            position={m.position}
            rotation={[0, m.rotationY, 0]}
            scale={hover === h.id ? 1.06 : 1}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHover(h.id);
            }}
            onPointerOut={() => setHover((x) => (x === h.id ? null : x))}
            onClick={(e) => {
              e.stopPropagation();
              emit({ type: "highlight.open", highlightId: h.id });
            }}
          >
            {m.model ? (
              <Suspense fallback={<Prop />}>
                <Model url={m.model} size={SIZE[m.prop]} />
              </Suspense>
            ) : (
              <Prop />
            )}
          </group>
        );
      })}
    </>
  );
}
