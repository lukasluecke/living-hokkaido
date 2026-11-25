"use client";
// Detail scene part. 3D room from labs/detail-scene when WebGL works; the
// HTML panel below is the keyboard / no-WebGL path.
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { type DetailScenePartProps, SCALE } from "@/contracts";
import s from "../shared/Fallback.module.css";
import { Room } from "./Room";
import attn from "../shared/Attention.module.css";
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

/** Bar prefix per activity kind. */
const VERB: Record<string, string> = {
  quiz: "Reflect",
  story: "Listen",
  words: "Learn",
  trace: "Trace",
  weave: "Weave",
  sequence: "Put in order",
  board: "Play",
  canon: "Sing along",
  pluck: "Pluck",
  map: "Explore",
};

/** Up to two activities show in the bar; more go in one "Activities" menu. */
function ActivityMenu({
  activities,
  onStart,
}: {
  activities: { id: string; kind: string; title: string }[];
  onStart: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", off);
    root.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    return () => document.removeEventListener("pointerdown", off);
  }, [open]);
  const item = (a: { id: string; kind: string; title: string }) =>
    `${VERB[a.kind] ?? "Try"}: ${a.title}`;
  if (activities.length <= 2)
    return (
      <>
        {activities.map((a) => (
          <button key={a.id} type="button" onClick={() => onStart(a.id)}>
            {item(a)}
          </button>
        ))}
      </>
    );
  return (
    <div
      ref={root}
      className={c.menuRoot}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          // Close the menu only; do not leave the scene.
          e.stopPropagation();
          setOpen(false);
          root.current?.querySelector<HTMLButtonElement>("button")?.focus();
        }
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Activities ({activities.length}) {open ? "▾" : "▴"}
      </button>
      {open && (
        <div className={c.menu} role="menu" aria-label="Activities">
          {activities.map((a) => (
            <button
              key={a.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onStart(a.id);
              }}
            >
              {item(a)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
      </Canvas>
      <div ref={overlay} className={c.overlay} aria-hidden>
        {ready &&
          !focusedArtifactId &&
          scene.placements.map((p) => (
            <button
              key={p.artifactId}
              type="button"
              tabIndex={-1}
              className={c.marker}
              data-hint={hint || undefined}
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
      <nav
        className={c.bar}
        aria-label={`Objects in ${scene.title}`}
        data-focused={focusedArtifactId ? "" : undefined}
      >
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
        <ActivityMenu
          activities={scene.activityIds
            .map((id) => props.content.activities.find((a) => a.id === id))
            // Activities of a placed object start from its card; the rest here.
            .filter(
              (a): a is NonNullable<typeof a> =>
                !!a &&
                !(
                  a.artifactId &&
                  scene.placements.some((pl) => pl.artifactId === a.artifactId)
                ),
            )}
          onStart={(id) => emit({ type: "activity.start", activityId: id })}
        />
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
