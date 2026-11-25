"use client";
// Detail scene part. 3D room from labs/detail-scene when WebGL works; the
// HTML panel below is the keyboard / no-WebGL path.
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { type DetailScenePartProps, SCALE } from "@/contracts";
import s from "../shared/Fallback.module.css";
import { QualityGovernor, useQuality } from "../shared/Quality";
import { Room } from "./Room";
import attn from "../shared/Attention.module.css";
import c from "./Scene.module.css";
import t from "./Tray.module.css";
import { groupActivities, kindCaption } from "../shared/activityGroups";
import { roomActivities, Tray } from "./Tray";

function useKeys({ scene, emit }: DetailScenePartProps) {
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLInputElement) return;
      const p = scene.placements.find((x) => String(x.key) === ev.key);
      if (p) emit({ type: "artifact.focus", artifactId: p.artifactId });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scene, emit]);
}

export function DetailScenePart(props: DetailScenePartProps) {
  const { scene, artifacts, focusedArtifactId, emit, prefs } = props;
  const overlay = useRef<HTMLDivElement>(null);
  // Tap outside the objects puts the focused object back; a drag (look
  // around) does not.
  const down = useRef<[number, number] | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  // Tap markers appear once the entry is done; labels show for a few
  // seconds as a hint. The dots stay and pulse (no hover on touch screens).
  const [ready, setReady] = useState(false);
  const q = useQuality(SCALE.maxDpr);
  const [hint, setHint] = useState(false);
  useEffect(() => {
    setReady(false);
    setHint(false);
  }, [scene.id]);
  useEffect(() => {
    if (!ready) return;
    setHint(true);
    const t = setTimeout(() => setHint(false), 6000);
    return () => clearTimeout(t);
  }, [ready]);
  const roomEmit: typeof emit = (e) => {
    if (e.type === "scene.ready") setReady(true);
    emit(e);
  };
  useKeys(props);
  if (!prefs.webgl) return <SceneList {...props} />;
  const label = (id: string) => artifacts.find((a) => a.id === id)?.label ?? id;
  const hoveredAt = scene.placements.find((p) => p.artifactId === hovered);
  const markers = ready && !focusedArtifactId;
  return (
    <div className={c.stage}>
      <Canvas
        dpr={q.dpr}
        camera={{
          fov: 45,
          near: 0.05,
          far: 120,
          position: scene.views.outside.eye,
        }}
        gl={{ antialias: false }}
        onPointerDown={(e) => {
          down.current = [e.clientX, e.clientY];
        }}
        onPointerMissed={(e) => {
          const d = down.current;
          const still =
            !d || Math.hypot(e.clientX - d[0], e.clientY - d[1]) < 8;
          if (still && focusedArtifactId) emit({ type: "artifact.blur" });
        }}
      >
        <Suspense fallback={null}>
          <Room
            {...props}
            emit={roomEmit}
            hovered={hovered}
            setHovered={setHovered}
            overlay={overlay}
          />
        </Suspense>
        <QualityGovernor />
      </Canvas>
      <div ref={overlay} className={c.overlay} aria-hidden>
        {markers &&
          scene.placements.map((p) => (
            <button
              key={p.artifactId}
              type="button"
              tabIndex={-1}
              className={c.marker}
              data-hint={hint || hovered === p.artifactId || undefined}
              data-x={p.focusView.target[0]}
              data-y={p.focusView.target[1] + 0.85}
              data-z={p.focusView.target[2]}
              onClick={() =>
                emit({ type: "artifact.focus", artifactId: p.artifactId })
              }
            >
              <span
                className={`${c.dot} ${attn.pulse}`}
                data-still={prefs.reducedMotion || undefined}
              />
              <span className={c.markerLabel}>{label(p.artifactId)}</span>
            </button>
          ))}
        {/* One label per object: while the tap markers show, a hovered
            object lights its own marker label instead of a second label. */}
        {!markers &&
          hoveredAt &&
          hoveredAt.artifactId !== focusedArtifactId && (
            <span
              className={c.label}
              data-x={hoveredAt.position[0]}
              data-y={hoveredAt.position[1] + 1.8}
              data-z={hoveredAt.position[2]}
            >
              {label(hoveredAt.artifactId)}
            </span>
          )}
      </div>
      <Tray {...props} label={label} activities={roomActivities(props)} />
    </div>
  );
}

function SceneList({
  scene,
  artifacts,
  content,
  focusedArtifactId,
  emit,
}: DetailScenePartProps) {
  useEffect(() => {
    emit({ type: "scene.ready", sceneId: scene.id });
  }, [scene.id, emit]);

  const title = (id: string) => artifacts.find((a) => a.id === id)?.label ?? id;
  return (
    <section className={s.panel} aria-label={scene.title}>
      <h2>{scene.title}</h2>
      <div className={s.row}>
        {scene.placements.map((p) => (
          <button
            key={p.artifactId}
            type="button"
            className={s.button}
            aria-pressed={p.artifactId === focusedArtifactId}
            onClick={() =>
              emit({ type: "artifact.focus", artifactId: p.artifactId })
            }
          >
            {p.key ? `${p.key} · ` : ""}
            {title(p.artifactId)}
          </button>
        ))}
      </div>
      {groupActivities(
        scene.activityIds
          .map((id) => content.activities.find((x) => x.id === id))
          .filter((a) => a !== undefined),
      ).map((g) => (
        <section key={g.id} aria-label={g.label}>
          <h3 className={t.cap}>{g.label}</h3>
          <div className={s.row}>
            {g.items.map((a) => (
              <button
                key={a.id}
                type="button"
                className={s.button}
                onClick={() =>
                  emit({ type: "activity.start", activityId: a.id })
                }
              >
                {kindCaption(a.kind)}: {a.title}
              </button>
            ))}
          </div>
        </section>
      ))}
      <button
        type="button"
        className={s.button}
        onClick={() => emit({ type: "scene.exit", sceneId: scene.id })}
      >
        Back to the island
      </button>
    </section>
  );
}
