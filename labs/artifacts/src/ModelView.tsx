// Loads optimised GLB files from /public to prove the pipeline output renders.
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { label, Studio } from "./shared";

const FILES = (new URLSearchParams(location.search).get("files") ?? "garment.flat.meshopt.glb,cloth.flat.meshopt.glb,fiber.flat.meshopt.glb").split(",");

function Model({ url, x }: { url: string; x: number }) {
  const { scene } = useGLTF(url, "/draco/", true, (loader) => loader.setMeshoptDecoder(MeshoptDecoder));
  return <primitive object={scene} position={[x, 0, 0]} />;
}

export function ModelView() {
  const [sizes, setSizes] = useState<Record<string, number>>({});
  useEffect(() => {
    for (const f of FILES)
      fetch(`/gen/${f}`, { method: "HEAD" }).then((r) => setSizes((s) => ({ ...s, [f]: Number(r.headers.get("content-length")) })));
  }, []);
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <Canvas shadows camera={{ position: [0.4, 2.3, 6.6], fov: 34 }}>
        <color attach="background" args={["#dfe6de"]} />
        <Studio />
        <Suspense fallback={null}>
          {FILES.map((f, i) => (
            <Model key={f} url={`/gen/${f}`} x={(i - 1) * 1.9} />
          ))}
        </Suspense>
        <OrbitControls target={[0, 0.55, 0]} />
      </Canvas>
      <div style={label}>
        <b>Pipeline output loaded with useGLTF + Meshopt decoder</b>
        {FILES.map((f) => (
          <div key={f}>
            {f}: {sizes[f] ? `${(sizes[f] / 1024).toFixed(1)} KB` : "…"}
          </div>
        ))}
      </div>
    </div>
  );
}
