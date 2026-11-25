import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { Field } from "./field";
import type { Place } from "./places";

export function placePos(field: Field, p: Place): [number, number, number] {
  const [x, z] = field.toWorld(p.lon, p.lat);
  return [x, field.groundY(x, z), z];
}

function House({ open, active, glow }: { open: boolean; active: boolean; glow: boolean }) {
  const roof = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!roof.current) return;
    const ty = open ? 0.55 : 0, tr = open ? -0.35 : 0;
    roof.current.position.y += (0.42 + ty - roof.current.position.y) * Math.min(1, dt * 3);
    roof.current.rotation.z += (tr - roof.current.rotation.z) * Math.min(1, dt * 3);
  });
  const wall = active ? "#c99a63" : "#a7a090";
  return (
    <group scale={1.3}>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.75, 0.8, 0.06, 20]} />
        <meshStandardMaterial color="#cdb791" />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.36, 0.5]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[0, 0.24, 0.252]}>
        <planeGeometry args={[0.14, 0.18]} />
        <meshStandardMaterial color="#ffe1a0" emissive="#ffb347" emissiveIntensity={glow ? 2.2 : 0.5} />
      </mesh>
      <group ref={roof} position={[0, 0.42, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 0.1, s * 0.16]} rotation={[s * 0.75, 0, 0]} castShadow>
            <boxGeometry args={[0.86, 0.04, 0.44]} />
            <meshStandardMaterial color={active ? "#8f4f34" : "#6e6a60"} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function PlaceMarker({ field, place, open, active, onSelect, labels }: {
  field: Field; place: Place; open: boolean; active: boolean; onSelect: () => void; labels: boolean;
}) {
  const p = placePos(field, place);
  return (
    <group position={p} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <House open={open} active={active} glow={!!place.open} />
      {labels && (
        <Html position={[0, 1.7, 0]} center distanceFactor={18} zIndexRange={[10, 0]}>
          <button type="button" className="pin" onClick={onSelect} aria-label={`Fly to ${place.name}`}>
            {place.name}{place.open ? "" : " · soon"}
          </button>
        </Html>
      )}
    </group>
  );
}
