"use client";
// Artifact viewer part: the object card in the "field label" style. Title and
// honesty chips, the turn viewer (WebGL only), the summary claim, numbered
// hotspot rows that match the viewer dots, the activities, one primary action.
import { useEffect, useRef, useState } from "react";
import { type ArtifactViewerProps, memoriesForArtifact } from "@/contracts";
import { PresentationBadge, RepresentationBadge } from "../shared/Badges";
import c from "./Card.module.css";
import { activitySize, kindLabel, primaryActivityId } from "./kinds";
import { Memories } from "./Memories";
import { Viewer3D } from "./Viewer3D";

/** Small line icons per activity kind (decorative, 20 px, currentColor). */
const ICON: Record<string, string> = {
  quiz: "M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.2v.1",
  sequence: "M5 7h14M5 12h10M5 17h6",
  weave: "M4 8c4 0 4 8 8 8s4-8 8-8M4 16c4 0 4-8 8-8s4 8 8 8",
  story: "M5 10v4M9 7v10M13 4v16M17 8v8M21 11v2",
  words: "M5 6h9M9.5 6v12M14 12h5M16.5 12v6",
  trace: "M6 4h8l4 4v12H6zM14 4v4h4M9 13h6M9 16h4",
  map: "M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2zM9 4v14M15 6v14",
  board: "M5 5h14v14H5zM5 12h14M12 5v14",
  canon:
    "M9 18V6l10-2v12M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0z",
  pluck: "M6 4v16M10 4v16M14 4v16M18 4v16",
};

function KindIcon({ kind }: { kind: string }) {
  return (
    <svg
      className={c.icon}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON[kind] ?? ICON.quiz} />
    </svg>
  );
}

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
    `${doneActivityIds.includes(primary.id) ? "Again" : "Start"}: ${primary.a?.title ?? "the activity"}`;
  const readCount = artifact.hotspots.filter((h) => read.includes(h.id)).length;
  const start = (id: string) =>
    emit({ type: "activity.start", activityId: id });

  return (
    <article className={c.card} aria-label={artifact.title}>
      <div className={c.head}>
        <h2 className={c.title}>{artifact.title}</h2>
        <div className={c.meta}>
          <span className={c.chip}>
            <RepresentationBadge value={artifact.model.representation} />
          </span>
          {summary && (
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
            How do we know?
          </button>
        </div>
      </div>

      {prefs.webgl && <Viewer3D artifact={artifact} read={read} emit={emit} />}

      {summary && <p className={c.summary}>{summary.claim.text}</p>}

      {artifact.hotspots.length > 0 && (
        <section className={c.section} aria-labelledby={`${artifact.id}-look`}>
          <h3 id={`${artifact.id}-look`} className={c.cap}>
            Look closer · {readCount} of {artifact.hotspots.length}
          </h3>
          <ol className={c.spots}>
            {artifact.hotspots.map((h, i) => {
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
                    {isRead && !open && <span className={c.state}>Read</span>}
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
            Try with this object
          </h3>
          <ul className={c.acts}>
            {activities.map(({ id, a }) => {
              const done = doneActivityIds.includes(id);
              const size = a && activitySize(a);
              const kind = a ? kindLabel(a.kind) : "Try";
              const title = a?.title ?? "Try the activity";
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={c.act}
                    aria-label={`${kind}: ${title}${done ? " (done)" : ""}`}
                    onClick={() => start(id)}
                  >
                    <span className={c.actIcon}>
                      <KindIcon kind={a?.kind ?? "quiz"} />
                    </span>
                    <span className={c.actText}>
                      <span className={c.kind}>
                        {kind}
                        {size && ` · ${size}`}
                      </span>
                      <span className={c.actTitle}>{title}</span>
                    </span>
                    {done ? (
                      <span className={c.done}>✓ Done</span>
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
            Curator memories · {memories.length}
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
            onClick={() => start(primary.id)}
          >
            <span className={c.primaryText}>{primaryLabel}</span>
          </button>
        </div>
      )}
    </article>
  );
}
