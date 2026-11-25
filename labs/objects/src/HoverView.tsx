import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Outline, Select, Selection } from "@react-three/postprocessing";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { attachHoverHull, attachRim, setEmissive } from "./hover";
import type { LookId } from "./looks";
import { OBJECT_IDS, type ObjectId } from "./models";
import { label, Studio, useArtifact } from "./shared";

type Variant = "lift" | "hull" | "post" | "rim";
const VARIANTS: { id: Variant; title: string; note: string }[] = [
  { id: "lift", title: "1 · Lift + warm glow", note: "spring scale/raise + emissive. No extra pass." },
  { id: "hull", title: "2 · Gold outline (hull)", note: "inverted hull per mesh. Cheap, crisp, any look." },
  { id: "post", title: "3 · Post-process outline", note: "@react-three/postprocessing Outline. Extra full-screen pass." },
  { id: "rim", title: "4 · Rim light + ring + label", note: "fresnel pass, idle pulse ring (touch!), name tag." },
];

const params = new URLSearchParams(location.search);
const LOOK = (params.get("look") ?? "flat") as LookId;
const FORCE = (params.get("force") ?? "garment") as ObjectId | "none";

function Item({ id, variant, x }: { id: ObjectId; variant: Variant; x: number }) {
  const obj = useArtifact(id, LOOK);
  const [hover, setHover] = useState(false);
  const on = hover || FORCE === id;
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const fx = useMemo(() => {
    if (variant === "hull") return { hull: attachHoverHull(obj) };
    if (variant === "rim") return { rim: attachRim(obj) };
    return {};
  }, [obj, variant]);
  const t = useRef(0);
  useFrame((s, dt) => {
    t.current = THREE.MathUtils.damp(t.current, on ? 1 : 0, 10, dt);
    const k = t.current;
    if (variant === "lift" && group.current) {
      group.current.scale.setScalar(1 + 0.07 * k);
      group.current.position.y = 0.08 * k;
      setEmissive(obj, 0.18 * k);
    }
    fx.hull?.(on);
    if (fx.rim) fx.rim(0.15 + 0.85 * k);
    if (ring.current) {
      const pulse = 0.5 + 0.5 * Math.sin(s.clock.elapsedTime * 2.2 + x);
      ring.current.scale.setScalar(1 + 0.08 * pulse + 0.15 * k);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.2 * pulse + 0.5 * k;
    }
  });
  const body = (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
    >
      <primitive object={obj} />
    </group>
  );
  return (
    <group position={[x, 0, 0]}>
      {variant === "post" ? <Select enabled={on}>{body}</Select> : body}
      {variant === "rim" && (
        <>
          <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.01}>
            <ringGeometry args={[0.62, 0.68, 48]} />
            <meshBasicMaterial color="#ffd27a" transparent depthWrite={false} />
          </mesh>
          {on && (
            <Html position={[0, 1.75, 0]} center>
              <div style={{ background: "#fff7e6", color: "#2a1d17", padding: "4px 10px", borderRadius: 999, fontSize: 12, whiteSpace: "nowrap", boxShadow: "0 2px 8px #0004" }}>
                A garment · click to pick up
              </div>
            </Html>
          )}
        </>
      )}
    </group>
  );
}

function Scene({ variant }: { variant: Variant }) {
  const items = OBJECT_IDS.map((id, i) => <Item key={id} id={id} variant={variant} x={(i - 1) * 1.9} />);
  if (variant !== "post") return <>{items}</>;
  return (
    <Selection>
      <EffectComposer multisampling={4} autoClear={false}>
        <Outline blur visibleEdgeColor={0xffcf6b} hiddenEdgeColor={0xffcf6b} edgeStrength={6} width={1000} />
      </EffectComposer>
      {items}
    </Selection>
  );
}

export function HoverView() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", height: "100%", gap: 2 }}>
      {VARIANTS.map((v) => (
        <div key={v.id} style={{ position: "relative" }}>
          <Canvas shadows dpr={[1, 2]} camera={{ position: [0.4, 2.3, 6.6], fov: 34 }}>
            <color attach="background" args={["#dfe6de"]} />
            <Studio />
            <Scene variant={v.id} />
            <OrbitControls target={[0, 0.55, 0]} />
          </Canvas>
          <div style={label}>
            <b>{v.title}</b>
            <br />
            <span style={{ opacity: 0.75 }}>{v.note}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
