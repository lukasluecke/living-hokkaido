import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { LOOKS, type LookId } from "./looks";
import { OBJECT_IDS } from "./models";
import { label, Studio, useArtifact } from "./shared";

function Row({ look }: { look: LookId }) {
  const objs = OBJECT_IDS.map((id) => useArtifact(id, look)); // fixed order, safe
  return (
    <>
      {objs.map((o, i) => (
        <group key={o.name} position={[(i - 1) * 1.9, 0, 0]}>
          <primitive object={o} />
        </group>
      ))}
    </>
  );
}

export function LookView() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr 1fr", height: "100%", gap: 2 }}>
      {LOOKS.map((l) => (
        <div key={l.id} style={{ position: "relative", background: "#d9e2dc" }}>
          <Canvas shadows dpr={[1, 2]} camera={{ position: [0.4, 2.3, 6.6], fov: 34 }}>
            <color attach="background" args={[l.id === "toon" ? "#e9e1cf" : "#dfe6de"]} />
            <Studio />
            <Row look={l.id} />
            <OrbitControls target={[0, 0.75, 0]} />
          </Canvas>
          <div style={label}>
            <b>{l.title}</b>
            <br />
            <span style={{ opacity: 0.75 }}>{l.note}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
