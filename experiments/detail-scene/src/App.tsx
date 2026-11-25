import { CameraControls, ContactShadows } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ARTIFACTS, type ArtifactId, Artifacts, artifactPoint } from "./room/Artifacts";
import { Dust, Hearth, WindowLight } from "./room/Hearth";
import { HouseStatic, Roof } from "./room/House";
import { MergeStatic } from "./room/MergeStatic";
import { SplatFromScene } from "./splat/SplatRoom";

type Variant = "lowpoly" | "splat" | "scan";
type RoofMode = "close" | "open";

const VARIANTS: { id: Variant; name: string; blurb: string }[] = [
  { id: "lowpoly", name: "A · Hand-built low-poly", blurb: "Procedural geometry, runtime textures, real-time light." },
  { id: "splat", name: "B · Gaussian splat (Spark)", blurb: "Room as splats with baked light; objects stay meshes." },
  { id: "scan", name: "C · Scan mesh in the room", blurb: "A CC0 photogrammetry scan placed in room A." },
];

const params = new URLSearchParams(location.search);
const HOME = { eye: [0.5, 1.75, 2.25] as const, target: [-0.1, 0.55, -1.0] as const };
const OUTSIDE = { eye: [10, 11, 12] as const, target: [0, 0.8, 0] as const };

type Stats = { fps: number; calls: number; tris: number; splats?: number; splatMb?: number; buildMs?: number };

function StatsProbe({ onStats }: { onStats: (s: Partial<Stats>) => void }) {
  const gl = useThree((s) => s.gl);
  const acc = useRef({ t: 0, f: 0 });
  const last = useRef({ calls: 0, tris: 0 });
  useEffect(() => {
    gl.info.autoReset = false;
  }, [gl]);
  useFrame((_, dt) => {
    // Runs before this frame renders, so info holds the whole last frame.
    last.current = { calls: gl.info.render.calls, tris: gl.info.render.triangles };
    gl.info.reset();
    acc.current.t += dt;
    acc.current.f += 1;
    if (acc.current.t > 0.5) {
      onStats({ fps: Math.round(acc.current.f / acc.current.t), ...last.current });
      acc.current = { t: 0, f: 0 };
    }
  });
  return null;
}

/**
 * One DOM overlay for all labels. Elements carry data-x/y/z world
 * coordinates; this projects them every frame. Cheaper and more robust than
 * one drei <Html> root per label.
 */
function Projector({ overlay }: { overlay: React.RefObject<HTMLDivElement | null> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const root = overlay.current;
    if (!root) return;
    for (const el of root.querySelectorAll<HTMLElement>("[data-x]")) {
      v.set(Number(el.dataset.x), Number(el.dataset.y), Number(el.dataset.z)).project(camera);
      const behind = v.z > 1;
      el.style.visibility = behind ? "hidden" : "visible";
      el.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`;
    }
  });
  return null;
}

function Director({
  controls,
  lift,
  entryKey,
  roofMode,
  focus,
  onEntered,
}: {
  controls: React.RefObject<CameraControls | null>;
  lift: { current: number };
  entryKey: number;
  roofMode: RoofMode;
  focus: ArtifactId | null;
  onEntered: () => void;
}) {
  const liftTarget = useRef(0);
  const entered = useRef(false);
  useFrame((_, dt) => {
    lift.current = THREE.MathUtils.damp(lift.current, liftTarget.current, 2.2, dt);
  });

  // Entry: hover outside, lift the roof, fly in, optionally close the roof.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    entered.current = false;
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      if (entryKey === 0) {
        liftTarget.current = roofMode === "open" ? 1 : 0;
        lift.current = liftTarget.current;
        c.setLookAt(...HOME.eye, ...HOME.target, false);
        entered.current = true;
        onEntered();
        return;
      }
      c.smoothTime = 0.9;
      liftTarget.current = 0;
      lift.current = 0;
      await c.setLookAt(...OUTSIDE.eye, ...OUTSIDE.target, false);
      await wait(700);
      if (cancelled) return;
      liftTarget.current = 1;
      await wait(1100);
      if (cancelled) return;
      await c.setLookAt(4.5, 6.5, 6, 0, 0.6, -0.3, true);
      if (cancelled) return;
      await c.setLookAt(...HOME.eye, ...HOME.target, true);
      if (cancelled) return;
      if (roofMode === "close") liftTarget.current = 0;
      c.smoothTime = 0.45;
      entered.current = true;
      onEntered();
    })();
    return () => {
      cancelled = true;
    };
  }, [entryKey, roofMode, controls, lift, onEntered]);

  // Focus: frame one object; Esc or "Put it back" returns home.
  useEffect(() => {
    const c = controls.current;
    if (!c || !entered.current) return;
    const def = ARTIFACTS.find((a) => a.id === focus);
    if (def) c.setLookAt(...def.view.eye, ...def.view.target, true);
    else c.setLookAt(...HOME.eye, ...HOME.target, true);
  }, [focus, controls]);

  return null;
}

function Scene({
  variant,
  fx,
  merge,
  roofMode,
  entryKey,
  focus,
  setFocus,
  hovered,
  setHovered,
  overlay,
  onStats,
}: {
  variant: Variant;
  fx: boolean;
  merge: boolean;
  roofMode: RoofMode;
  entryKey: number;
  focus: ArtifactId | null;
  setFocus: (id: ArtifactId | null) => void;
  hovered: ArtifactId | null;
  setHovered: (id: ArtifactId | null) => void;
  overlay: React.RefObject<HTMLDivElement | null>;
  onStats: (s: Partial<Stats>) => void;
}) {
  const controls = useRef<CameraControls>(null);
  const lift = useRef(roofMode === "open" ? 1 : 0);
  const [inside, setInside] = useState(false);
  const onEntered = useCallback(() => setInside(true), []);
  const onSplatStats = useCallback(
    (s: { splats: number; buildMs: number; mb: number }) => onStats({ splats: s.splats, splatMb: s.mb, buildMs: s.buildMs }),
    [onStats],
  );
  useEffect(() => setInside(false), [entryKey]);

  const isSplat = variant === "splat";
  return (
    <>
      <color attach="background" args={["#1a1d24"]} />
      <fog attach="fog" args={["#1a1d24", 14, 40]} />
      <hemisphereLight args={["#9fb4e8", "#3a2418", isSplat ? 0.6 : 0.18]} />
      <directionalLight position={[8, 12, 6]} intensity={isSplat ? 0.8 : 0.25} color="#dfe8ff" />

      {isSplat ? (
        <SplatFromScene onStats={onSplatStats} maxSplats={Number(params.get("splats") ?? 400_000)}>
          <HouseStatic outside={false} />
          <Hearth light={false} />
        </SplatFromScene>
      ) : (
        <>
          <MergeStatic enabled={merge}>
            <HouseStatic />
          </MergeStatic>
          <Roof lift={lift} />
          <Hearth shadows={fx} />
          <WindowLight shadows={fx} />
          <Dust />
        </>
      )}
      {isSplat && (
        // Objects stay as meshes, lit by a light that matches the bake.
        <pointLight position={[0, 0.65, 0.2]} color="#ff9a4a" intensity={7} distance={8} decay={1.6} />
      )}
      <Suspense fallback={null}>
        <Artifacts
          hovered={inside ? hovered : null}
          focused={focus}
          onHover={setHovered}
          onSelect={(id) => inside && setFocus(focus === id ? null : id)}
          scanGarment={variant === "scan"}
        />
      </Suspense>
      {!fx && !isSplat && <ContactShadows position={[0, 0.015, 0]} scale={8} opacity={0.5} blur={2.5} far={2} />}

      <CameraControls
        ref={controls}
        makeDefault
        minDistance={0.3}
        maxDistance={inside ? 5 : 40}
        maxPolarAngle={inside ? Math.PI * 0.55 : Math.PI * 0.48}
        minPolarAngle={inside ? Math.PI * 0.2 : 0}
        smoothTime={0.45}
        truckSpeed={inside ? 0 : 1}
      />
      <Director controls={controls} lift={lift} entryKey={entryKey} roofMode={roofMode} focus={focus} onEntered={onEntered} />
      <StatsProbe onStats={onStats} />
      <Projector overlay={overlay} />

      {fx && (
        <EffectComposer multisampling={0}>
          <N8AO aoRadius={0.6} intensity={2.2} distanceFalloff={0.6} halfRes />
          <Bloom luminanceThreshold={0.85} intensity={0.7} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.AGX} />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
      )}
    </>
  );
}

export default function App() {
  const [variant, setVariant] = useState<Variant>((params.get("v") as Variant) ?? "lowpoly");
  const [fx, setFx] = useState(params.get("fx") !== "0");
  const [merge, setMerge] = useState(params.get("merge") !== "0");
  const [roofMode, setRoofMode] = useState<RoofMode>((params.get("roof") as RoofMode) ?? "close");
  const [entryKey, setEntryKey] = useState(params.get("entry") === "1" ? 1 : 0);
  const [focus, setFocus] = useState<ArtifactId | null>((params.get("focus") as ArtifactId) ?? null);
  const [hovered, setHovered] = useState<ArtifactId | null>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<Stats>({ fps: 0, calls: 0, tris: 0 });
  const onStats = useCallback((s: Partial<Stats>) => setStats((o) => ({ ...o, ...s })), []);
  const def = ARTIFACTS.find((a) => a.id === focus);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(null);
      const i = Number(e.key) - 1;
      if (ARTIFACTS[i]) setFocus(ARTIFACTS[i].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    (window as unknown as { __lab: unknown }).__lab = { stats, setFocus, replay: () => setEntryKey((k) => k + 1) };
  }, [stats]);

  const dpr = useMemo<[number, number]>(() => [1, 2], []);
  return (
    <div className="app">
      <Canvas key={variant} shadows dpr={dpr} camera={{ fov: 55, near: 0.05, far: 120, position: [0.5, 1.75, 2.25] }} gl={{ antialias: !fx }}>
        <Scene variant={variant} fx={fx} merge={merge} roofMode={roofMode} entryKey={entryKey} focus={focus} setFocus={setFocus} hovered={hovered} setHovered={setHovered} overlay={overlay} onStats={onStats} />
      </Canvas>

      <div ref={overlay} className="overlay" aria-hidden={!def}>
        {ARTIFACTS.map((a) => {
          if (a.id === hovered && a.id !== focus) {
            const p = artifactPoint(a, [0, a.id === "fiber" ? 0.45 : 1.75, 0]);
            return <span key={a.id} className="hover-label" data-x={p.x} data-y={p.y} data-z={p.z}>{a.label}</span>;
          }
          return null;
        })}
        {def?.notes.map((n, i) => {
          const p = artifactPoint(def, n.at);
          return (
            <button key={`${def.id}${i}`} type="button" className="hotspot" data-x={p.x} data-y={p.y} data-z={p.z} aria-label={n.text}>
              {i + 1}
              <span>{n.text}</span>
            </button>
          );
        })}
      </div>

      <header className="bar">
        <strong>Detail scene lab</strong>
        <nav>
          {VARIANTS.map((v) => (
            <button key={v.id} type="button" aria-pressed={variant === v.id} onClick={() => { setFocus(null); setVariant(v.id); }} title={v.blurb}>
              {v.name}
            </button>
          ))}
        </nav>
      </header>

      <aside className="panel">
        <p className="blurb">{VARIANTS.find((v) => v.id === variant)?.blurb}</p>
        <label><input type="checkbox" checked={fx} onChange={(e) => setFx(e.target.checked)} /> Effects (AO, bloom, soft shadows)</label>
        <label><input type="checkbox" checked={merge} onChange={(e) => setMerge(e.target.checked)} /> Merge static meshes</label>
        <label>
          Roof after entry{" "}
          <select value={roofMode} onChange={(e) => setRoofMode(e.target.value as RoofMode)}>
            <option value="close">closes (cosy)</option>
            <option value="open">stays open (diorama)</option>
          </select>
        </label>
        <button type="button" onClick={() => { setFocus(null); setEntryKey((k) => k + 1); }} disabled={variant === "splat"}>
          ▶ Replay entry (roof lift)
        </button>
        <div className="objects" role="group" aria-label="Objects">
          {ARTIFACTS.map((a, i) => (
            <button key={a.id} type="button" aria-pressed={focus === a.id} onClick={() => setFocus(focus === a.id ? null : a.id)}>
              {i + 1}. {a.label}
            </button>
          ))}
        </div>
        <dl className="stats">
          <dt>FPS</dt><dd>{stats.fps}</dd>
          <dt>Draw calls</dt><dd>{stats.calls}</dd>
          <dt>Triangles</dt><dd>{stats.tris.toLocaleString()}</dd>
          {variant === "splat" && stats.splats !== undefined && (
            <>
              <dt>Splats</dt><dd>{stats.splats.toLocaleString()}</dd>
              <dt>Splat memory</dt><dd>{stats.splatMb?.toFixed(1)} MB</dd>
              <dt>Build</dt><dd>{stats.buildMs} ms</dd>
            </>
          )}
          {variant === "scan" && (<><dt>Scan file</dt><dd>394 KB (was 13.5 MB)</dd></>)}
        </dl>
      </aside>

      {def && (
        <section className="card" aria-live="polite">
          <p className="eyebrow">Object {ARTIFACTS.indexOf(def) + 1} of 3 · {def.title}</p>
          <h2>{def.label}</h2>
          <p>{def.body}</p>
          <button type="button" onClick={() => setFocus(null)}>Put it back (Esc)</button>
        </section>
      )}
    </div>
  );
}
