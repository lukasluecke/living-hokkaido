"use client";
// Artifact viewer part: the object card in the "field label" style. Title and
// honesty chips, the turn viewer (WebGL only), the summary claim, numbered
// hotspot rows that match the viewer dots, the activities, one primary action.
import { useEffect, useRef, useState } from "react";
import {
  activeModelSource,
  type ArtifactViewerProps,
  factHotspots,
  showsGenerated,
  memoriesForArtifact,
  modelNotes,
} from "@/contracts";
import { useT } from "@/i18n";
import { PresentationBadge, RepresentationBadge } from "../shared/Badges";
import c from "./Card.module.css";
import { Icon, KindIcon, UI_ICON } from "../shared/Icon";
import { kindLabel, primaryActivityId } from "./kinds";
import { Memories } from "./Memories";
import { Viewer3D } from "./Viewer3D";
import { SHOW_DISCLAIMERS, showModelLabels } from "@/design/disclaimers";

export function ArtifactViewer({
  artifact,
  claims,
  read,
  doneActivityIds = [],
  emit,
  prefs,
  content,
}: ArtifactViewerProps) {
  useEffect(() => {
    emit({ type: "artifact.inspected", artifactId: artifact.id });
  }, [artifact.id, emit]);

  // One hotspot text open at a time: the one the visitor opened last, from
  // a row or from a dot in the viewer (a new id in `read`).
  const t = useT();
  const [openId, setOpenId] = useState<string | null>(null);
  const seen = useRef<string[]>(read);
  useEffect(() => {
    const fresh = read.find((id) => !seen.current.includes(id));
    seen.current = read;
    if (fresh) setOpenId(fresh);
  }, [read]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset per artifact
  useEffect(() => {
    setOpenId(null);
  }, [artifact.id]);

  const summary = claims[artifact.summaryClaimId];
  const memories = memoriesForArtifact(content.memories, artifact.id);
  const activities = artifact.activityIds.map((id) => ({
    id,
    a: content.activities.find((x) => x.id === id),
  }));
  const primaryId = primaryActivityId(artifact.activityIds, doneActivityIds);
  const primary = activities.find((x) => x.id === primaryId);
  const primaryLabel =
    primary &&
    t(
      doneActivityIds.includes(primary.id)
        ? "Again: {title}"
        : "Start: {title}",
      { title: primary.a?.title ?? t("the activity") },
    );
  const spots = factHotspots(artifact);
  const generated = showsGenerated(artifact, prefs);
  // Generated model: its own "About this model" note replaces the sketch note.
  const labels = showModelLabels(prefs);
  const notes = !labels
    ? []
    : generated && artifact.generated
      ? [{ id: "about-generated", claimId: artifact.generated.noteClaimId }]
      : modelNotes(artifact);
  const readCount = spots.filter((h) => read.includes(h.id)).length;
  const start = (id: string) =>
    emit({ type: "activity.start", activityId: id });

  return (
    <article className={c.card} aria-label={artifact.title}>
      <div className={c.head}>
        <h2 className={c.title}>{artifact.title}</h2>
        <div className={c.meta}>
          {labels && (
            <span className={c.chip}>
              <RepresentationBadge
                value={artifact.model.representation}
                generated={generated}
              />
            </span>
          )}
          {summary &&
            (SHOW_DISCLAIMERS || summary.presentation === "approved") && (
              <span
                className={
                  summary.presentation === "approved" ? c.chip : c.chipDraft
                }
              >
                <PresentationBadge value={summary.presentation} />
              </span>
            )}
          <button
            type="button"
            className={c.how}
            onClick={() =>
              emit({
                type: "reveal.open",
                knowledgeId: artifact.knowledgeId,
                claimId: artifact.summaryClaimId,
                artifactId: artifact.id,
              })
            }
          >
            {t("How do we know?")}
          </button>
        </div>
      </div>

      {prefs.webgl && (
        <Viewer3D
          artifact={artifact}
          source={activeModelSource(artifact, prefs)}
          read={read}
          emit={emit}
        />
      )}
      <div className={c.modelToggle}>
        {prefs.webgl && artifact.generated && (
          <fieldset className={c.toggleGroup}>
            <legend className={c.cap}>{t("Model")}</legend>
            {[
              { sketch: false, label: t("AI-generated") },
              { sketch: true, label: t("Sketch") },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={!!prefs.sketchModels === o.sketch}
                className={c.modelOption}
                onClick={() => emit({ type: "models.set", sketch: o.sketch })}
              >
                {o.label}
              </button>
            ))}
          </fieldset>
        )}
        {SHOW_DISCLAIMERS && (
          <button
            type="button"
            aria-pressed={labels}
            className={c.modelOption}
            onClick={() => emit({ type: "models.labels", hidden: labels })}
          >
            {t("Model labels")}
          </button>
        )}
      </div>

      {summary && <p className={c.summary}>{summary.claim.text}</p>}

      {notes.map((h) => {
        const text = claims[h.claimId]?.claim.text;
        return text ? (
          <p key={h.id} className={c.modelNote}>
            <span aria-hidden="true">ⓘ</span> {text}
          </p>
        ) : null;
      })}

      {spots.length > 0 && (
        <section className={c.section} aria-labelledby={`${artifact.id}-look`}>
          <h3 id={`${artifact.id}-look`} className={c.cap}>
            {t("Look closer · {read} of {total}", {
              read: readCount,
              total: spots.length,
            })}
          </h3>
          <ol className={c.spots}>
            {spots.map((h, i) => {
              const isRead = read.includes(h.id);
              const open = isRead && openId === h.id;
              const text = claims[h.claimId]?.claim.text;
              return (
                <li key={h.id} className={c.spot}>
                  <button
                    type="button"
                    className={c.spotButton}
                    aria-expanded={open}
                    aria-controls={`${artifact.id}-${h.id}`}
                    onClick={() => {
                      setOpenId(open ? null : h.id);
                      emit({
                        type: "hotspot.open",
                        artifactId: artifact.id,
                        hotspotId: h.id,
                      });
                    }}
                  >
                    <span
                      className={isRead ? c.numRead : c.num}
                      aria-hidden="true"
                    >
                      {isRead ? "✓" : i + 1}
                    </span>
                    <span className={c.spotTitle}>{h.title}</span>
                    {isRead && !open && (
                      <span className={c.state}>{t("Read")}</span>
                    )}
                    <span
                      className={open ? c.chevOpen : c.chev}
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </button>
                  <div id={`${artifact.id}-${h.id}`} hidden={!open}>
                    {open && text && <p className={c.spotText}>{text}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {activities.length > 0 && (
        <section className={c.section} aria-labelledby={`${artifact.id}-try`}>
          <h3 id={`${artifact.id}-try`} className={c.cap}>
            {t("Try it")} · {activities.length}
          </h3>
          <ul className={c.acts}>
            {activities.map(({ id, a }) => {
              const done = doneActivityIds.includes(id);
              const kind = t(a ? kindLabel(a.kind) : "Try");
              const title = a?.title ?? t("Try the activity");
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={c.act}
                    aria-label={`${kind}: ${title}${done ? t(" (done)") : ""}`}
                    onClick={() => start(id)}
                  >
                    <span className={c.actIcon} title={kind}>
                      <KindIcon kind={a?.kind ?? "quiz"} size={20} />
                    </span>
                    <span className={c.actText}>
                      <span className={c.actTitle}>{title}</span>
                    </span>
                    {done ? (
                      <span className={c.done}>✓ {t("Done")}</span>
                    ) : (
                      <span className={c.chev} aria-hidden="true">
                        ›
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {memories.length > 0 && (
        <details className={c.memories}>
          <summary className={c.cap}>
            {t("Curator memories")} · {memories.length}
          </summary>
          <Memories memories={memories} />
        </details>
      )}

      {primary && (
        <div className={c.foot}>
          <button
            type="button"
            className={c.primary}
            title={primaryLabel}
            aria-label={primaryLabel}
            onClick={() => start(primary.id)}
          >
            {doneActivityIds.includes(primary.id) ? (
              <Icon d={UI_ICON.check} size={20} />
            ) : (
              <KindIcon kind={primary.a?.kind ?? "quiz"} size={20} />
            )}
            <span className={c.primaryText}>
              {primary.a?.title ?? t("Start the activity")}
            </span>
          </button>
        </div>
      )}
    </article>
  );
}
