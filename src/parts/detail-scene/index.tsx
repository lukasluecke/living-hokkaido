"use client";
// Detail scene part. 3D room from labs/detail-scene when WebGL works; the
// HTML panel below is the keyboard / no-WebGL path.
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { type DetailScenePartProps, SCALE } from "@/contracts";
import s from "../shared/Fallback.module.css";
import { Room } from "./Room";
import c from "./Scene.module.css";

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
  const [hovered, setHovered] = useState<string | null>(null);
  useKeys(props);
  if (!prefs.webgl) return <SceneList {...props} />;
  const label = (id: string) => artifacts.find((a) => a.id === id)?.label ?? id;
  const hoveredAt = scene.placements.find((p) => p.artifactId === hovered);
  return (
    <div className={c.stage}>
      <Canvas
        dpr={[1, SCALE.maxDpr]}
        camera={{
          fov: 45,
          near: 0.05,
          far: 120,
          position: scene.views.outside.eye,
        }}
        gl={{ antialias: false }}
      >
        <Suspense fallback={null}>
          <Room
            {...props}
            hovered={hovered}
            setHovered={setHovered}
            overlay={overlay}
          />
        </Suspense>
      </Canvas>
      <div ref={overlay} className={c.overlay} aria-hidden>
        {hoveredAt && hoveredAt.artifactId !== focusedArtifactId && (
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
      <nav className={c.bar} aria-label={`Objects in ${scene.title}`}>
        {scene.placements.map((p) => (
          <button
            key={p.artifactId}
            type="button"
            aria-pressed={p.artifactId === focusedArtifactId}
            onClick={() =>
              emit(
                p.artifactId === focusedArtifactId
                  ? { type: "artifact.blur" }
                  : { type: "artifact.focus", artifactId: p.artifactId },
              )
            }
          >
            {p.key ? `${p.key} · ` : ""}
            {label(p.artifactId)}
          </button>
        ))}
        {scene.activityIds
          .map((id) => props.content.activities.find((a) => a.id === id))
          .filter((a) => a && !a.artifactId)
          .map((a) =>
            a ? (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  emit({ type: "activity.start", activityId: a.id })
                }
              >
                Reflect: {a.title}
              </button>
            ) : null,
          )}
        <button
          type="button"
          onClick={() => emit({ type: "scene.exit", sceneId: scene.id })}
        >
          Back to the island
        </button>
      </nav>
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
      <div className={s.row}>
        {scene.activityIds.map((id) => {
          const a = content.activities.find((x) => x.id === id);
          return (
            <button
              key={id}
              type="button"
              className={s.button}
              onClick={() => emit({ type: "activity.start", activityId: id })}
            >
              {a?.title ?? id}
            </button>
          );
        })}
      </div>
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
