"use client";
// Object tray ("field label" style): a small label panel docked at the bottom
// with one card per placed object and a "Try here" card that opens the
// room's own activities, grouped by kind. Keyboard path of the room.
import { useEffect, useId, useRef, useState } from "react";
import type { ActivityDefinition, DetailScenePartProps } from "@/contracts";
import { groupActivities, kindCaption } from "../shared/activityGroups";
import t from "./Tray.module.css";

/** Scene activities not attached to a placed object (those start from the
 *  object's card). */
export function roomActivities({
  scene,
  content,
}: Pick<DetailScenePartProps, "scene" | "content">): ActivityDefinition[] {
  return scene.activityIds
    .map((id) => content.activities.find((a) => a.id === id))
    .filter(
      (a): a is ActivityDefinition =>
        !!a &&
        !(
          a.artifactId &&
          scene.placements.some((pl) => pl.artifactId === a.artifactId)
        ),
    );
}

/** Small line icon per activity kind (decorative; the caption names it). */
export function KindIcon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    // Woven grid.
    weave: "M4 7h16M4 12h16M4 17h16M8 4v16M12 4v16M16 4v16",
    // Folded map.
    map: "M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14",
    // Steps in order.
    sequence: "M4 6h2M4 12h2M4 18h2M9 6h11M9 12h11M9 18h11",
    // Headphones.
    story: "M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z",
    // Lines of words.
    words: "M4 7h16M4 12h11M4 17h14",
    // Question mark.
    quiz: "M9 9a3 3 0 1 1 4.5 2.6c-.9.5-1.5 1.2-1.5 2.4M12 18h.01",
    // Document with lines.
    trace: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
  };
  return (
    <svg
      className={t.icon}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={paths[kind] ?? "M12 4v16M4 12h16"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** "Try here" sheet: the room's activities by kind. Above the tray on a
 *  laptop, a bottom sheet on the phone. Esc or × closes it. */
function TryHere({
  title,
  activities,
  onStart,
  onClose,
}: {
  title: string;
  activities: ActivityDefinition[];
  onStart: (id: string) => void;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const head = useId();
  useEffect(() => {
    root.current?.querySelector<HTMLButtonElement>("[data-row]")?.focus();
  }, []);
  const groups = groupActivities(activities);
  return (
    // biome-ignore lint/a11y/useSemanticElements: non-modal panel, not <dialog>
    <div
      ref={root}
      className={t.sheet}
      role="dialog"
      aria-labelledby={head}
      data-sheet=""
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          // Close the sheet only; do not leave the scene.
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className={t.grab} aria-hidden="true" />
      <div className={t.sheetHead}>
        <div>
          <p className={t.cap}>{title}</p>
          <h2 id={head} className={t.sheetTitle}>
            Try here
          </h2>
        </div>
        <button
          type="button"
          className={t.close}
          aria-label="Close Try here"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <p className={t.sheetSub}>
        {activities.length} {activities.length === 1 ? "thing" : "things"} to
        try in the room. Activities about one object are on its card.
      </p>
      <div className={t.groups}>
        {groups.map((g) => (
          <section key={g.id} aria-label={g.label}>
            <h3 className={t.cap}>{g.label}</h3>
            <ul className={t.rows}>
              {g.items.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className={t.row}
                    data-row=""
                    onClick={() => onStart(a.id)}
                  >
                    <span className={t.iconWrap}>
                      <KindIcon kind={a.kind} />
                    </span>
                    <span className={t.rowText}>
                      <span className={t.kind}>{kindCaption(a.kind)}</span>
                      <span className={t.rowTitle}>{a.title}</span>
                    </span>
                    <span className={t.chev} aria-hidden="true">
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function Tray({
  scene,
  focusedArtifactId,
  inspectedArtifactIds,
  emit,
  label,
  activities,
}: DetailScenePartProps & {
  label: (artifactId: string) => string;
  activities: ActivityDefinition[];
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const tryCard = useRef<HTMLButtonElement>(null);
  const sheetId = useId();
  const n = scene.placements.length;
  const seen = scene.placements.filter((p) =>
    inspectedArtifactIds?.includes(p.artifactId),
  ).length;

  // A new room or a focused object closes the sheet.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on scene change
  useEffect(() => setOpen(false), [scene.id]);
  useEffect(() => {
    if (focusedArtifactId) setOpen(false);
  }, [focusedArtifactId]);
  // A tap outside the tray and sheet closes it.
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", off);
    return () => document.removeEventListener("pointerdown", off);
  }, [open]);

  const close = () => {
    setOpen(false);
    tryCard.current?.focus();
  };

  return (
    <div
      ref={wrap}
      className={t.wrap}
      data-focused={focusedArtifactId ? "" : undefined}
      data-open={open ? "" : undefined}
    >
      {open && (
        <div id={sheetId}>
          <TryHere
            title={scene.title}
            activities={activities}
            onClose={close}
            onStart={(id) => {
              setOpen(false);
              emit({ type: "activity.start", activityId: id });
            }}
          />
        </div>
      )}
      <nav className={t.tray} aria-label={`Objects in ${scene.title}`}>
        <div className={t.head}>
          <button
            type="button"
            className={t.back}
            aria-label="Back to the island"
            onClick={() => emit({ type: "scene.exit", sceneId: scene.id })}
          >
            <span aria-hidden="true">‹ </span>
            <span className={t.backLong}>Back to the island</span>
            <span className={t.backShort}>Island</span>
          </button>
          <span className={t.cap}>
            {scene.title} · {n} {n === 1 ? "object" : "objects"}
          </span>
          {inspectedArtifactIds && (
            <span className={t.progress}>
              <b>{seen}</b> of {n} looked at
            </span>
          )}
        </div>
        <ul className={t.cards}>
          {scene.placements.map((p) => {
            const on = p.artifactId === focusedArtifactId;
            const done = inspectedArtifactIds?.includes(p.artifactId);
            return (
              <li key={p.artifactId}>
                <button
                  type="button"
                  className={t.card}
                  aria-pressed={on}
                  data-done={done ? "" : undefined}
                  onClick={() =>
                    emit(
                      on
                        ? { type: "artifact.blur" }
                        : { type: "artifact.focus", artifactId: p.artifactId },
                    )
                  }
                >
                  {p.key !== undefined && (
                    <span className={t.num} aria-hidden="true">
                      {p.key}
                    </span>
                  )}
                  <span className={t.cardLabel}>
                    {label(p.artifactId)}
                    {done && <span className={t.srOnly}> (looked at)</span>}
                  </span>
                  {done && (
                    <span className={t.check} aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {activities.length > 0 && (
            <li>
              <button
                ref={tryCard}
                type="button"
                className={`${t.card} ${t.tryCard}`}
                aria-expanded={open}
                aria-controls={open ? sheetId : undefined}
                onClick={() => setOpen((v) => !v)}
              >
                <span className={t.tryCap}>Try here</span>
                <span className={t.cardLabel}>
                  {activities.length}{" "}
                  {activities.length === 1 ? "activity" : "activities"}
                </span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
