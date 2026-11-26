"use client";
// C2 pick-up-and-turn viewer. Ported from labs/artifacts: procedural models
// (models.ts), toon look + ink outline (looks.ts). Drag to turn; arrow keys
// turn too. Hotspots are DOM buttons projected each frame and hidden when
// they face away from the camera.
import { ContactShadows, PresentationControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { type Artifact, type Emit, factHotspots, SCALE } from "@/contracts";
import { toonify, useGlbClone } from "../shared/Glb";
import { QualityGovernor, useQuality } from "../shared/QualityGovernor";
import { applyLook } from "./model/looks";
import { builders, type ObjectId } from "./model/models";
import { useT } from "@/i18n";
import attn from "../shared/Attention.module.css";
import c from "./Viewer.module.css";

/** Centre a model on its base so every object frames the same way. */
function frame(g: THREE.Object3D) {
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g);
  // Bounds in the model's own space, where hotspot positions live.
  const local = box.clone().applyMatrix4(g.matrix.clone().invert());
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const wrap = new THREE.Group();
  g.position.sub(centre);
  wrap.add(g);
  wrap.userData.radius = Math.max(size.x, size.y, size.z) / 2;
  wrap.userData.halfHeight = size.y / 2;
  wrap.userData.localBox = local;
  return wrap;
}

const toonFrame = (o: THREE.Object3D) => frame(toonify(o));

type ModelProps = {
  artifact: Artifact;
  /** The model to show (generated GLB or the sketch). */
  source: Artifact["model"]["source"];
  yaw: React.RefObject<number>;
  hotspots: React.RefObject<HTMLDivElement | null>;
};

/**
 * Hotspot positions are authored on the sketch. A generated GLB has other
 * bounds (origin on its base, other proportions), so map each position from
 * the sketch's box to the same relative place in the GLB's box. Without this,
 * low hotspots (the garment's "patterns") land outside the viewer frame.
 */
function boxMapper(from: THREE.Box3, to: THREE.Box3) {
  const fs = from.getSize(new THREE.Vector3());
  const ts = to.getSize(new THREE.Vector3());
  const axis = (v: number, f0: number, fl: number, t0: number, tl: number) =>
    fl > 1e-6 ? t0 + ((v - f0) / fl) * tl : t0 + tl / 2;
  return (v: THREE.Vector3) =>
    v.set(
      axis(v.x, from.min.x, fs.x, to.min.x, ts.x),
      axis(v.y, from.min.y, fs.y, to.min.y, ts.y),
      axis(v.z, from.min.z, fs.z, to.min.z, ts.z),
    );
}

function ProceduralModel(p: ModelProps & { builder: string }) {
  const obj = useMemo(() => {
    const build = builders[p.builder as ObjectId];
    const g = build ? build() : new THREE.Group();
    applyLook(g, "toon");
    return frame(g);
  }, [p.builder]);
  return <Model {...p} obj={obj} />;
}

function GlbModel(p: ModelProps & { url: string }) {
  const obj = useGlbClone(p.url, toonFrame);
  const builder = sketchBuilder(p.artifact);
  const map = useMemo(() => {
    const build = builders[builder as ObjectId];
    if (!build) return undefined;
    const sketch = frame(build()).userData.localBox as THREE.Box3;
    return boxMapper(sketch, obj.userData.localBox as THREE.Box3);
  }, [builder, obj]);
  return <Model {...p} obj={obj} map={map} />;
}

/** The sketch builder, shown while a generated GLB loads. */
function sketchBuilder(a: Artifact) {
  return a.model.source.kind === "procedural" ? a.model.source.builder : "";
}

/** Code model now; a GLB replaces it by changing artifact.model.source only. */
function ModelFromSource(p: ModelProps) {
  const src = p.source;
  if (src.kind === "glb")
    return (
      <Suspense
        fallback={
          <ProceduralModel {...p} builder={sketchBuilder(p.artifact)} />
        }
      >
        <GlbModel {...p} url={src.url} />
      </Suspense>
    );
  return <ProceduralModel {...p} builder={src.builder} />;
}

function Model({
  artifact,
  yaw,
  hotspots,
  obj,
  map,
}: ModelProps & {
  obj: THREE.Object3D;
  map?: (v: THREE.Vector3) => THREE.Vector3;
}) {
  const turn = useRef<THREE.Group>(null);
  const tmp = useMemo(
    () => ({
      p: new THREE.Vector3(),
      n: new THREE.Vector3(),
      v: new THREE.Vector3(),
    }),
    [],
  );
  // Fit the longest side, but keep tall objects (a stake, a post) inside the
  // short height of the card viewer (about 0.8 units visible above centre).
  const scale = Math.min(
    0.9 / (obj.userData.radius || 1),
    0.68 / (obj.userData.halfHeight || 1),
  );
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
      map?.(tmp.p);
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
  source,
  read,
  emit,
}: {
  artifact: Artifact;
  source: Artifact["model"]["source"];
  read: string[];
  emit: Emit;
}) {
  const t = useT();
  const q = useQuality(SCALE.maxDpr);
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
        // Screen readers use the HTML buttons over and beside the canvas.
        aria-hidden
        dpr={q.dpr}
        camera={{ position: [0, 0.35, 2.6], fov: 35 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#f3e6c9"]} />
        <hemisphereLight args={["#fff1d6", "#5a6a7a", 1.3]} />
        <directionalLight position={[3, 5, 3]} intensity={2.2} />
        <directionalLight
          position={[-3, 2, -2]}
          intensity={0.6}
          color="#9fb8d8"
        />
        <ModelFromSource
          key={source.kind === "glb" ? source.url : "sketch"}
          artifact={artifact}
          source={source}
          yaw={yaw}
          hotspots={hotspots}
        />
        <QualityGovernor />
        <ContactShadows
          position={[0, -0.95, 0]}
          opacity={0.35}
          scale={4}
          blur={2.4}
          far={2}
        />
      </Canvas>
      <div ref={hotspots} className={c.hotspots}>
        {factHotspots(artifact).map((h, i) => (
          <button
            key={h.id}
            type="button"
            data-hotspot={h.id}
            className={`${c.hotspot} ${read.includes(h.id) ? c.read : attn.pulse}`}
            aria-label={read.includes(h.id) ? `${h.title}, read` : h.title}
            title={h.title}
            onClick={() =>
              emit({
                type: "hotspot.open",
                artifactId: artifact.id,
                hotspotId: h.id,
              })
            }
          >
            {read.includes(h.id) ? "✓" : i + 1}
          </button>
        ))}
      </div>
      <div className={c.turn}>
        <button
          type="button"
          aria-label={t("Turn left")}
          onClick={() => (yaw.current -= 0.6)}
        >
          ⟲
        </button>
        <span>{t("Drag to turn")}</span>
        <button
          type="button"
          aria-label={t("Turn right")}
          onClick={() => (yaw.current += 0.6)}
        >
          ⟳
        </button>
      </div>
    </div>
  );
}
