import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { useMemo } from "react";
import type * as THREE from "three";
import { applyLook, type LookId } from "./looks";
import { builders, type ObjectId } from "./models";

/** Offline studio light: no HDR download needed. */
export function Studio({ warm = true }: { warm?: boolean }) {
  return (
    <>
      <hemisphereLight args={[warm ? "#fff1d6" : "#e6efff", "#3b4a5a", 1.1]} />
      <directionalLight position={[3, 5, 3]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 4, 3]} scale={[6, 3, 1]} color="#fff3dd" />
        <Lightformer intensity={0.8} position={[-4, 1, -2]} scale={[3, 3, 1]} color="#9fb8d8" />
      </Environment>
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={8} blur={2.4} far={2} />
    </>
  );
}

export function useArtifact(id: ObjectId, look: LookId): THREE.Group {
  return useMemo(() => {
    const g = builders[id]();
    applyLook(g, look);
    return g;
  }, [id, look]);
}

export const label: React.CSSProperties = {
  position: "absolute",
  left: 12,
  top: 10,
  fontSize: 13,
  lineHeight: 1.35,
  background: "#0b121acc",
  padding: "6px 10px",
  borderRadius: 8,
  pointerEvents: "none",
};
