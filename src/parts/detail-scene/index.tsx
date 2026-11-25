"use client";
// Detail scene part: HTML fallback stub. Replace with the 3D room (port from
// labs/detail-scene). Keep the buttons as the keyboard / no-WebGL path.
import { useEffect } from "react";
import type { DetailScenePartProps } from "@/contracts";
import s from "../shared/Fallback.module.css";

export function DetailScenePart({
  scene,
  artifacts,
  content,
  focusedArtifactId,
  emit,
}: DetailScenePartProps) {
  useEffect(() => {
    emit({ type: "scene.ready", sceneId: scene.id });
  }, [scene.id, emit]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const p = scene.placements.find((x) => String(x.key) === ev.key);
      if (p) emit({ type: "artifact.focus", artifactId: p.artifactId });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scene, emit]);

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
