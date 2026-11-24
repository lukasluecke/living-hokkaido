"use client";
import { Canvas } from "@react-three/fiber";
import { Component, Suspense, type ReactNode } from "react";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { destinations, story } from "@/data/story";
function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 0.8, 6]} />
        <meshStandardMaterial color="#755c47" />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.65, 1.8, 7]} />
        <meshStandardMaterial color="#477568" />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <coneGeometry args={[0.45, 1.2, 7]} />
        <meshStandardMaterial color="#739887" />
      </mesh>
    </group>
  );
}
function Cabin({ active = false }: { active?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.5, 1.1, 1.2]} />
        <meshStandardMaterial color={active ? "#d4ac78" : "#9caa99"} />
      </mesh>
      <mesh position={[0, 1.3, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.3, 0.8, 4]} />
        <meshStandardMaterial color={active ? "#a36048" : "#687d78"} />
      </mesh>
      <mesh position={[0, 0.5, 0.61]}>
        <boxGeometry args={[0.4, 0.65, 0.04]} />
        <meshStandardMaterial
          color="#ffe3a3"
          emissive="#b27c31"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}
function Owl() {
  return (
    <group position={[-1.5, 1.1, 1.4]}>
      <mesh>
        <sphereGeometry args={[0.43, 20, 20]} />
        <meshStandardMaterial color="#ebd7b2" />
      </mesh>
      {[-0.15, 0.15].map((x) => (
        <group key={x} position={[x, 0.1, 0.35]}>
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#fff9e6" />
          </mesh>
          <mesh position={[0, 0, 0.12]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            <meshStandardMaterial color="#244c46" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.08, 0.43]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.07, 0.16, 3]} />
        <meshStandardMaterial color="#c78640" />
      </mesh>
    </group>
  );
}
function RoomModel() {
  const { scene } = useGLTF("/models/room.glb");
  return <primitive object={scene} />;
}
function Shell() {
  return (
    <>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[9, 0.3, 7]} />
        <meshStandardMaterial color="#c2a984" />
      </mesh>
      <mesh position={[0, 1.5, -3.5]}>
        <boxGeometry args={[9, 3, 0.15]} />
        <meshStandardMaterial color="#728d83" />
      </mesh>
    </>
  );
}
class ModelBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Shell /> : this.props.children;
  }
}
function Room({ onArtifact }: { onArtifact: (id: string) => void }) {
  return (
    <>
      <ModelBoundary>
        <Suspense fallback={<Shell />}>
          <RoomModel />
        </Suspense>
      </ModelBoundary>
      {story.artifacts.map((a, i) => (
        <group
          key={a.id}
          position={[(i - 1) * 2.7, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onArtifact(a.id);
          }}
        >
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[1.8, 0.9, 1.5]} />
            <meshStandardMaterial color="#eadbc1" />
          </mesh>
          <mesh position={[0, 1.2, 0]} rotation={[0, 0, i === 0 ? 0.6 : 0]}>
            {i === 0 ? (
              <cylinderGeometry args={[0.18, 0.18, 1.2, 12]} />
            ) : (
              <boxGeometry
                args={i === 1 ? [1.25, 0.12, 1] : [0.8, 1.4, 0.18]}
              />
            )}
            <meshStandardMaterial
              color={["#ae784a", "#d4ae71", "#526d7b"][i]}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
export default function World({
  room,
  onEnter,
  onArtifact,
}: {
  room: boolean;
  onEnter: () => void;
  onArtifact: (id: string) => void;
}) {
  return (
    <Canvas
      key={room ? "room" : "island"}
      camera={{ position: room ? [7, 6, 8] : [10, 9, 12], fov: 38 }}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={["#dce8df"]} />
      <ambientLight intensity={1.8} />
      <directionalLight position={[5, 9, 4]} intensity={2.5} />
      {room ? (
        <Room onArtifact={onArtifact} />
      ) : (
        <>
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[5.5, 4.6, 0.9, 9]} />
            <meshStandardMaterial color="#88a78a" />
          </mesh>
          <mesh position={[1, -0.03, -1]} rotation={[-Math.PI / 2, 0, 0.5]}>
            <circleGeometry args={[2.2, 32]} />
            <meshStandardMaterial color="#a4cbd0" />
          </mesh>
          {destinations.map((d) => (
            <group
              key={d.id}
              position={[...d.position]}
              onClick={(e) => {
                e.stopPropagation();
                if (d.open) onEnter();
              }}
            >
              <Cabin active={d.open} />
            </group>
          ))}
          {[
            [-4, 0],
            [-3, 2],
            [-2, -3],
            [3, 2],
            [4, 0],
            [0, -4],
            [-4, -2],
          ].map(([x, z]) => (
            <Tree key={`${x}:${z}`} x={x} z={z} />
          ))}
          <Owl />
        </>
      )}
      <OrbitControls
        makeDefault
        minDistance={room ? 4 : 9}
        maxDistance={room ? 17 : 22}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 0.4, 0]}
      />
    </Canvas>
  );
}
