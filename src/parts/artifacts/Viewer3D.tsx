"use client";
// C2 pick-up-and-turn viewer. Ported from labs/artifacts: procedural models
// (models.ts), toon look + ink outline (looks.ts). Drag to turn; arrow keys
// turn too. Hotspots are DOM buttons projected each frame and hidden when
// they face away from the camera.
import { ContactShadows, PresentationControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { type Artifact, type Emit, SCALE } from "@/contracts";
import { applyLook } from "./model/looks";
import { builders, type ObjectId } from "./model/models";
import c from "./Viewer.module.css";

function useModel(artifact: Artifact) {
  return useMemo(() => {
    const src = artifact.model.source;
    const build =
      src.kind === "procedural" ? builders[src.builder as ObjectId] : undefined;
    const g = build ? build() : new THREE.Group();
    applyLook(g, "toon");
    // Centre the model on its base so every object frames the same way.
    const box = new THREE.Box3().setFromObject(g);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const wrap = new THREE.Group();
    g.position.sub(centre);
    wrap.add(g);
    wrap.userData.radius = Math.max(size.x, size.y, size.z) / 2;
    return wrap;
  }, [artifact]);
}

function Model({
  artifact,
  yaw,
  hotspots,
}: {
  artifact: Artifact;
  yaw: React.RefObject<number>;
  hotspots: React.RefObject<HTMLDivElement | null>;
}) {
  const obj = useModel(artifact);
  const turn = useRef<THREE.Group>(null);
  const tmp = useMemo(
    () => ({
      p: new THREE.Vector3(),
      n: new THREE.Vector3(),
      v: new THREE.Vector3(),
    }),
    [],
  );
  const scale = (0.9 / (obj.userData.radius || 1)) * 1;
  useFrame(({ camera, size }, dt) => {
    const t = turn.current;
    if (t)
      t.rotation.y = THREE.MathUtils.damp(t.rotation.y, yaw.current, 8, dt);
    const root = hotspots.current;
    if (!root) return;
    obj.updateWorldMatrix(true, true);
    const inner = obj.children[0];
    for (const el of root.querySelectorAll<HTMLElement>("[data-hotspot]")) {
      const h = artifact.hotspots.find((x) => x.id === el.dataset.hotspot);
      if (!h || !inner) continue;
      tmp.p.set(...h.position);
      inner.localToWorld(tmp.p);
      tmp.n.set(...h.normal).transformDirection(inner.matrixWorld);
      tmp.v.copy(camera.position).sub(tmp.p).normalize();
      const facing = tmp.n.dot(tmp.v);
      tmp.p.project(camera);
      el.style.opacity = facing > -0.1 ? "1" : "0.25";
      el.style.transform = `translate(-50%, -50%) translate(${((tmp.p.x + 1) / 2) * size.width}px, ${((1 - tmp.p.y) / 2) * size.height}px)`;
    }
  });
  const [rx, ry, rz] = artifact.display.restRotation;
  return (
    <PresentationControls
      global
      snap={false}
      polar={[-artifact.display.pitchLimit, artifact.display.pitchLimit]}
      azimuth={[-Infinity, Infinity]}
    >
      <group ref={turn}>
        <group rotation={[rx, ry, rz]} scale={scale}>
          <primitive object={obj} />
        </group>
      </group>
    </PresentationControls>
  );
}

export function Viewer3D({
  artifact,
  read,
  emit,
}: {
  artifact: Artifact;
  read: string[];
  emit: Emit;
}) {
  const yaw = useRef(0);
  const hotspots = useRef<HTMLDivElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset per artifact
  useEffect(() => {
    yaw.current = 0;
  }, [artifact.id]);
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: arrow keys turn the model; buttons below are the main controls
    <div
      className={c.viewer}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") yaw.current -= 0.4;
        if (e.key === "ArrowRight") yaw.current += 0.4;
      }}
    >
      <Canvas
        dpr={[1, SCALE.maxDpr]}
        camera={{ position: [0, 0.35, 2.6], fov: 35 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#efe1c2"]} />
        <hemisphereLight args={["#fff1d6", "#5a6a7a", 1.3]} />
        <directionalLight position={[3, 5, 3]} intensity={2.2} />
        <directionalLight
          position={[-3, 2, -2]}
          intensity={0.6}
          color="#9fb8d8"
        />
        <Model artifact={artifact} yaw={yaw} hotspots={hotspots} />
        <ContactShadows
          position={[0, -0.95, 0]}
          opacity={0.35}
          scale={4}
          blur={2.4}
          far={2}
        />
      </Canvas>
      <div ref={hotspots} className={c.hotspots}>
        {artifact.hotspots.map((h, i) => (
          <button
            key={h.id}
            type="button"
            data-hotspot={h.id}
            className={`${c.hotspot} ${read.includes(h.id) ? c.read : ""}`}
            aria-label={h.title}
            title={h.title}
            onClick={() =>
              emit({
                type: "hotspot.open",
                artifactId: artifact.id,
                hotspotId: h.id,
              })
            }
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className={c.turn}>
        <button
          type="button"
          aria-label="Turn left"
          onClick={() => (yaw.current -= 0.6)}
        >
          ⟲
        </button>
        <span>Drag to turn</span>
        <button
          type="button"
          aria-label="Turn right"
          onClick={() => (yaw.current += 0.6)}
        >
          ⟳
        </button>
      </div>
    </div>
  );
}
