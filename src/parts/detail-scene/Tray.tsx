"use client";
// Object tray ("field label" style): a small label panel docked at the bottom
// with one card per placed object and a "Try here" card that opens the
// room's own activities: highlights first, then by kind, quick questions
// folded. Keyboard path of the room.
import { useEffect, useId, useRef, useState } from "react";
import type {
  ActivityDefinition,
  DetailScenePartProps,
  Highlight,
} from "@/contracts";
import { useT } from "@/i18n";
import { kindCaption, tierActivities } from "../shared/activityGroups";
import { highlightIcon, Icon, KindIcon, UI_ICON } from "../shared/Icon";
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

/** "Try here" sheet: the room's activities by kind. Above the tray on a
 *  laptop, a bottom sheet on the phone. Esc or × closes it. */
function TryHere({
  title,
  activities,
  highlights,
  onStart,
  onHighlight,
  onClose,
}: {
  title: string;
  activities: ActivityDefinition[];
  /** This place's highlights (not the film: it is already on screen). */
  highlights: Highlight[];
  onStart: (id: string) => void;
  onHighlight: (id: string) => void;
  onClose: () => void;
}) {
  const tx = useT();
  const root = useRef<HTMLDivElement>(null);
  const head = useId();
  useEffect(() => {
    root.current?.querySelector<HTMLButtonElement>("[data-row]")?.focus();
  }, []);
  const tiers = tierActivities(
    activities.filter(
      (a) =>
        !highlights.some(
          (h) => h.open.kind === "activity" && h.open.activityId === a.id,
        ),
    ),
  );
  const row = (a: ActivityDefinition) => (
    <li key={a.id}>
      <button
        type="button"
        className={t.row}
        data-row=""
        onClick={() => onStart(a.id)}
      >
        <span className={t.iconWrap} title={tx(kindCaption(a.kind))}>
          <KindIcon kind={a.kind} className={t.icon} />
        </span>
        <span className={t.rowText}>
          <span className={t.srOnly}>{tx(kindCaption(a.kind))}: </span>
          <span className={t.rowTitle}>{a.title}</span>
        </span>
        <span className={t.chev} aria-hidden="true">
          ›
        </span>
      </button>
    </li>
  );
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
            {tx("Try here")}
          </h2>
        </div>
        <button
          type="button"
          className={t.close}
          aria-label={tx("Close Try here")}
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
        {tx("Activities about one object are on its card.")}
      </p>
      <div className={t.groups}>
        {highlights.length > 0 && (
          <section aria-label={tx("Highlights")} className={t.hero}>
            <h3 className={t.cap}>
              <Icon d={UI_ICON.star} size={14} /> {tx("Highlights")}
            </h3>
            <ul className={t.rows}>
              {highlights.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    className={`${t.row} ${t.heroRow}`}
                    data-row=""
                    onClick={() => onHighlight(h.id)}
                  >
                    <span className={t.iconWrap}>
                      <Icon d={highlightIcon(h.icon)} className={t.icon} />
                    </span>
                    <span className={t.rowText}>
                      <span className={t.rowTitle}>{tx(h.title)}</span>
                      <span className={t.heroTeaser}>{tx(h.teaser)}</span>
                    </span>
                    <span className={t.chev} aria-hidden="true">
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {tiers.groups.map((g) => (
          <section key={g.id} aria-label={tx(g.label)}>
            <h3 className={t.cap}>
              {tx(g.label)} · {g.items.length}
            </h3>
            <ul className={t.rows}>{g.items.map(row)}</ul>
          </section>
        ))}
        {tiers.quick.length > 0 && (
          <details className={t.quick}>
            <summary className={t.cap}>
              {tx("Quick questions")} · {tiers.quick.length}
            </summary>
            <ul className={t.rows}>{tiers.quick.map(row)}</ul>
          </details>
        )}
      </div>
    </div>
  );
}

export function Tray({
  scene,
  focusedArtifactId,
  inspectedArtifactIds,
  emit,
  content,
  label,
  activities,
}: DetailScenePartProps & {
  label: (artifactId: string) => string;
  activities: ActivityDefinition[];
}) {
  const tx = useT();
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

  // Keyboard path: when focus was lost (the card closed with Esc, or the
  // room just opened), put it on the object's card, else the first card.
  const lastFocused = useRef<string | null>(null);
  useEffect(() => {
    const prev = lastFocused.current;
    lastFocused.current = focusedArtifactId ?? null;
    if (focusedArtifactId) return;
    const lost =
      !document.activeElement || document.activeElement === document.body;
    if (!lost) return;
    const cards = wrap.current?.querySelectorAll<HTMLButtonElement>(
      "button[data-artifact]",
    );
    const target =
      (prev && [...(cards ?? [])].find((b) => b.dataset.artifact === prev)) ||
      cards?.[0];
    target?.focus({ preventScroll: true });
  }, [focusedArtifactId, scene.id]);

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
            highlights={content.highlights.filter(
              (h) =>
                h.locationId === scene.locationId && h.open.kind !== "film",
            )}
            onHighlight={(id) => {
              setOpen(false);
              emit({ type: "highlight.open", highlightId: id });
            }}
            onClose={close}
            onStart={(id) => {
              setOpen(false);
              emit({ type: "activity.start", activityId: id });
            }}
          />
        </div>
      )}
      <nav
        className={t.tray}
        aria-label={tx("Objects in {place}", { place: scene.title })}
      >
        <div className={t.head}>
          <button
            type="button"
            className={t.back}
            aria-label={tx("Back to the island")}
            onClick={() => emit({ type: "scene.exit", sceneId: scene.id })}
          >
            <span aria-hidden="true">‹ </span>
            <span className={t.backLong}>{tx("Back to the island")}</span>
            <span className={t.backShort}>{tx("Island")}</span>
          </button>
          <span className={t.cap}>
            {scene.title} · {tx(n === 1 ? "{n} object" : "{n} objects", { n })}
          </span>
          {inspectedArtifactIds && (
            <span className={t.progress}>
              <b>{seen}</b> {tx("of {n} looked at", { n })}
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
                  data-artifact={p.artifactId}
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
                    {done && (
                      <span className={t.srOnly}>{tx(" (looked at)")}</span>
                    )}
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
          {/* This place's highlights, so games and timelines with no object
              in the scene are visible in its own bar. */}
          {content.highlights
            .filter(
              (h) =>
                h.locationId === scene.locationId && h.open.kind !== "film",
            )
            .map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className={`${t.card} ${t.heroCard}`}
                  onClick={() =>
                    emit({ type: "highlight.open", highlightId: h.id })
                  }
                >
                  <Icon d={highlightIcon(h.icon)} size={20} />
                  <span className={t.cardLabel}>{tx(h.title)}</span>
                </button>
              </li>
            ))}
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
                <Icon d={UI_ICON.try} size={20} className={t.tryIcon} />
                <span className={t.cardLabel}>{tx("Try here")}</span>
                <span className={t.tryCount}>
                  {activities.length}
                  <span className={t.srOnly}>
                    {tx(activities.length === 1 ? " activity" : " activities")}
                  </span>
                </span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
