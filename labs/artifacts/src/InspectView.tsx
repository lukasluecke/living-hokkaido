import { PresentationControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { claimText, objects } from "./data";
import { attachRim } from "./hover";
import type { LookId } from "./looks";
import type { ObjectId } from "./models";
import type { ArtifactObject } from "./schema";
import { Studio, useArtifact } from "./shared";

const params = new URLSearchParams(location.search);
const LOOK = (params.get("look") ?? "flat") as LookId;
type Mode = "turn" | "presentation";

/** Shared drag state for the custom turn viewer (yaw inertia, pitch spring). */
const drag = { down: false, x: 0, y: 0, yaw: Number(params.get("yaw") ?? 0), pitch: 0, vYaw: 0 };

function useTurnInput(active: boolean) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (!active) return;
      drag.down = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag.down) return;
      const dx = (e.clientX - drag.x) / el.clientWidth;
      const dy = (e.clientY - drag.y) / el.clientHeight;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.vYaw = dx * 6 * 60;
      drag.yaw += dx * 6;
      drag.pitch += dy * 4;
    };
    const up = () => {
      drag.down = false;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
  }, [gl, active]);
}

/** Screen positions of hotspots, written each frame, read by the DOM overlay. */
const screen: Record<string, { x: number; y: number; o: number }> = {};

/** One DOM layer for all hotspots (avoids one React root per drei <Html>). */
function HotspotLayer({ rec, read, onNote }: { rec: ArtifactObject; read: Set<string>; onNote: (id: string) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      rec.hotspots.forEach((h, k) => {
        const el = refs.current[k];
        const s = screen[h.id];
        if (!el || !s) return;
        el.style.transform = `translate(${s.x - 13}px, ${s.y - 13}px)`;
        el.style.opacity = String(s.o);
        el.style.pointerEvents = s.o > 0.5 ? "auto" : "none";
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [rec]);
  return (
    <>
      {rec.hotspots.map((h, k) => (
        <button
          key={h.id}
          type="button"
          ref={(el) => {
            refs.current[k] = el;
          }}
          onClick={() => onNote(h.id)}
          aria-label={h.title}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 26,
            height: 26,
            borderRadius: 99,
            border: "2px solid #fff",
            background: read.has(h.id) ? "#7fbf8f" : h.kind === "disclaimer" ? "#9aa7b4" : "#f2a649",
            color: "#1d1712",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 0 0 6px #ffd27a44",
            opacity: 0,
          }}
        >
          {k + 1}
        </button>
      ))}
    </>
  );
}

const SLOTS: Record<ObjectId, THREE.Vector3> = {
  fiber: new THREE.Vector3(-2, 0.62, 0),
  cloth: new THREE.Vector3(0, 0.62, 0),
  garment: new THREE.Vector3(2, 0.62, 0),
};

function Artifact({
  rec,
  selected,
  anySelected,
  mode,
  onPick,
  onNote,
  readNotes,
}: {
  rec: ArtifactObject;
  selected: boolean;
  anySelected: boolean;
  mode: Mode;
  onPick: () => void;
  onNote: (id: string) => void;
  readNotes: Set<string>;
}) {
  const obj = useArtifact(rec.id as ObjectId, LOOK);
  const rim = useMemo(() => attachRim(obj), [obj]);
  // Pivot at the visual centre so turning feels natural.
  const center = useMemo(() => new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()), [obj]);
  // Hotspot anchors are authored in the object's own frame; map them into the pivot frame.
  const spots = useMemo(() => {
    obj.updateMatrix();
    return rec.hotspots.map((h) => ({
      p: new THREE.Vector3(...h.position).applyMatrix4(obj.matrix).sub(center),
      n: new THREE.Vector3(...h.normal).applyQuaternion(obj.quaternion).normalize(),
    }));
  }, [obj, rec.hotspots, center]);
  const slot = useMemo(() => SLOTS[rec.id as ObjectId].clone().add(center), [rec.id, center]);
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const size = useThree((s) => s.size);
  const [hover, setHover] = useState(false);
  const camera = useThree((s) => s.camera);
  const tmp = useMemo(() => ({ target: new THREE.Vector3(), dir: new THREE.Vector3(), n: new THREE.Vector3(), p: new THREE.Vector3(), q: new THREE.Quaternion() }), []);

  useFrame((s, dt) => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    // Fly between table slot and a point in front of the camera.
    if (selected) {
      camera.getWorldDirection(tmp.dir);
      tmp.target.copy(camera.position).addScaledVector(tmp.dir, 2.7).add(new THREE.Vector3(-0.45, 0.1, 0));
    } else tmp.target.copy(slot);
    o.position.x = THREE.MathUtils.damp(o.position.x, tmp.target.x, 6, dt);
    o.position.y = THREE.MathUtils.damp(o.position.y, tmp.target.y, 6, dt);
    o.position.z = THREE.MathUtils.damp(o.position.z, tmp.target.z, 6, dt);
    const sc = selected ? rec.display.inspectScale * 0.8 : hover ? 1.06 : 1;
    o.scale.setScalar(THREE.MathUtils.damp(o.scale.x, sc, 8, dt));
    // Custom turn: yaw keeps inertia, pitch springs back and is clamped.
    if (selected && mode === "turn") {
      if (!drag.down) {
        drag.yaw += drag.vYaw * dt;
        drag.vYaw = THREE.MathUtils.damp(drag.vYaw, 0, 3, dt);
        drag.pitch = THREE.MathUtils.damp(drag.pitch, 0, 4, dt);
      }
      const lim = rec.display.pitchLimit;
      drag.pitch = THREE.MathUtils.clamp(drag.pitch, -lim, lim);
      i.rotation.set(rec.display.restRotation[0] + drag.pitch, rec.display.restRotation[1] + drag.yaw, 0);
    } else {
      i.rotation.x = THREE.MathUtils.damp(i.rotation.x, selected ? rec.display.restRotation[0] : 0, 6, dt);
      i.rotation.y = THREE.MathUtils.damp(i.rotation.y, selected ? rec.display.restRotation[1] : 0, 6, dt);
    }
    // Idle affordance: soft pulse; strong rim on hover.
    const pulse = 0.5 + 0.5 * Math.sin(s.clock.elapsedTime * 2 + o.position.x);
    rim(selected ? 0 : anySelected ? 0 : hover ? 1 : 0.12 + 0.18 * pulse);
    // Hotspots fade when their normal faces away from the camera.
    rec.hotspots.forEach((h, k) => {
      i.getWorldQuaternion(tmp.q);
      tmp.n.copy(spots[k].n).applyQuaternion(tmp.q).normalize();
      i.localToWorld(tmp.p.copy(spots[k].p));
      const facing = tmp.n.dot(camera.position.clone().sub(tmp.p).normalize());
      const ndc = tmp.p.clone().project(camera);
      screen[h.id] = {
        x: (ndc.x * 0.5 + 0.5) * size.width,
        y: (-ndc.y * 0.5 + 0.5) * size.height,
        o: selected ? THREE.MathUtils.clamp((facing + 0.1) * 3, 0, 1) : 0,
      };
    });
  });

  const content = (
    <group ref={inner}>
      <group position={[-center.x, -center.y, -center.z]}>
        <primitive object={obj} />
      </group>
    </group>
  );
  return (
    <group
      ref={outer}
      position={slot}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!anySelected) setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (!anySelected) onPick();
      }}
    >
      {mode === "presentation" ? (
        <PresentationControls enabled={selected} global={false} snap polar={[-0.4, 0.4]} azimuth={[-Infinity, Infinity]} cursor>
          {content}
        </PresentationControls>
      ) : (
        content
      )}
    </group>
  );
}

function Dimmer({ on }: { on: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const d = new THREE.Vector3();
    camera.getWorldDirection(d);
    m.position.copy(camera.position).addScaledVector(d, 3.7);
    m.quaternion.copy(camera.quaternion);
    const mat = m.material as THREE.MeshBasicMaterial;
    mat.opacity = THREE.MathUtils.damp(mat.opacity, on ? 0.62 : 0, 6, dt);
    m.visible = mat.opacity > 0.01;
  });
  return (
    <mesh ref={ref} renderOrder={5}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial color="#0d1620" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function Room() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[9, 6]} />
        <meshStandardMaterial color="#a8774a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.6, -2]} receiveShadow>
        <boxGeometry args={[9, 3.2, 0.1]} />
        <meshStandardMaterial color="#c99a68" roughness={0.95} />
      </mesh>
      {[-2, 0, 2].map((x) => (
        <mesh key={x} position={[x, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.6, 1.1]} />
          <meshStandardMaterial color="#e8d5b3" flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ pick, setPick, mode, onNote, readNotes }: { pick: string | null; setPick: (id: string | null) => void; mode: Mode; onNote: (id: string) => void; readNotes: Set<string> }) {
  useTurnInput(pick !== null && mode === "turn");
  return (
    <>
      <Room />
      <Dimmer on={pick !== null} />
      {objects.map((rec) => (
        <Artifact
          key={rec.id}
          rec={rec}
          selected={pick === rec.id}
          anySelected={pick !== null}
          mode={mode}
          onPick={() => {
            drag.yaw = 0;
            drag.vYaw = 0;
            setPick(rec.id);
          }}
          onNote={onNote}
          readNotes={readNotes}
        />
      ))}
    </>
  );
}

export function InspectView() {
  const [pick, setPick] = useState<string | null>(params.get("pick"));
  const [mode, setMode] = useState<Mode>((params.get("mode") as Mode) ?? "turn");
  const [note, setNote] = useState<string | null>(params.get("note"));
  const [read, setRead] = useState<Set<string>>(new Set(note ? [note] : []));
  const rec = objects.find((o) => o.id === pick);
  const hs = rec?.hotspots.find((h) => h.id === note);
  const claim = hs ? claimText(hs.claimId) : undefined;
  const total = objects.reduce((n, o) => n + o.hotspots.length, 0);
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2.6, 5.4], fov: 38 }} onCreated={({ camera }) => camera.lookAt(0, 0.8, 0)}>
        <color attach="background" args={["#2b3a46"]} />
        <Studio />
        <Scene
          pick={pick}
          setPick={setPick}
          mode={mode}
          readNotes={read}
          onNote={(id) => {
            setNote(id);
            setRead((r) => new Set(r).add(id));
          }}
        />
      </Canvas>
      <div style={{ position: "absolute", left: 16, top: 12, background: "#0b121acc", padding: "8px 12px", borderRadius: 10, fontSize: 13 }}>
        <b>C2 · Pick up and turn</b> · notes read {read.size} / {total}
        <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
          {(["turn", "presentation"] as Mode[]).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{ background: m === mode ? "#ffd27a" : "#2c3a48", color: m === mode ? "#1d1712" : "#eee", border: 0, borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
              {m === "turn" ? "Custom turn (inertia)" : "drei PresentationControls"}
            </button>
          ))}
        </div>
      </div>
      {rec && (
        <HotspotLayer
          rec={rec}
          read={read}
          onNote={(id) => {
            setNote(id);
            setRead((r) => new Set(r).add(id));
          }}
        />
      )}
      {rec && (
        <div style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", width: 330, background: "#fbf3e2", color: "#2a1d17", borderRadius: 14, padding: 18, boxShadow: "0 10px 30px #0006" }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#9c6a2e" }}>
            {rec.title} · {rec.model.representation}
          </div>
          <h2 style={{ margin: "4px 0 10px", fontSize: 22 }}>{rec.label}</h2>
          {claim && hs ? (
            <>
              <b>{hs.title}</b>
              <p style={{ margin: "6px 0" }}>{claim.text}</p>
              <p style={{ fontSize: 12, color: "#6b5a48", margin: 0 }}>Source: {claim.source}</p>
            </>
          ) : (
            <p style={{ margin: 0 }}>Drag to turn the object. Click a glowing point to read a note.</p>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 12 }}>
            <span>
              {rec.hotspots.filter((h) => read.has(h.id)).length} of {rec.hotspots.length} notes
            </span>
            <button
              type="button"
              onClick={() => {
                setPick(null);
                setNote(null);
              }}
              style={{ border: "1px solid #2a1d17", background: "transparent", borderRadius: 99, padding: "4px 12px", cursor: "pointer" }}
            >
              Put it back
            </button>
          </div>
        </div>
      )}
      {!rec && (
        <div style={{ position: "absolute", left: 16, bottom: 16, background: "#0b121acc", padding: "10px 14px", borderRadius: 10 }}>
          Three objects tell one story. Click one to pick it up.
        </div>
      )}
    </div>
  );
}
