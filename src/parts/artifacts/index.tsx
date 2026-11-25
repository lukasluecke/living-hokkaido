"use client";
// Artifact viewer part: HTML fallback stub for the card and hotspots.
// Replace with the C2 turn viewer (port from labs/artifacts).
import { useEffect } from "react";
import type { ArtifactViewerProps } from "@/contracts";
import { PresentationBadge, RepresentationBadge } from "../shared/Badges";
import s from "../shared/Fallback.module.css";

export function ArtifactViewer({
  artifact,
  claims,
  read,
  emit,
}: ArtifactViewerProps) {
  useEffect(() => {
    emit({ type: "artifact.inspected", artifactId: artifact.id });
  }, [artifact.id, emit]);
  const summary = claims[artifact.summaryClaimId];
  return (
    <article className={s.panel} aria-label={artifact.title}>
      <h2>{artifact.title}</h2>
      <p>
        <RepresentationBadge value={artifact.model.representation} />
        {summary && <PresentationBadge value={summary.presentation} />}
      </p>
      <p>{summary?.claim.text}</p>
      <ul>
        {artifact.hotspots.map((h) => (
          <li key={h.id}>
            <button
              type="button"
              className={s.button}
              aria-pressed={read.includes(h.id)}
              onClick={() =>
                emit({
                  type: "hotspot.open",
                  artifactId: artifact.id,
                  hotspotId: h.id,
                })
              }
            >
              {h.title}
            </button>
            {read.includes(h.id) && (
              <span className={s.muted}> {claims[h.claimId]?.claim.text}</span>
            )}
          </li>
        ))}
      </ul>
      <div className={s.row}>
        {artifact.activityIds.map((id) => (
          <button
            key={id}
            type="button"
            className={s.button}
            onClick={() => emit({ type: "activity.start", activityId: id })}
          >
            Try the activity
          </button>
        ))}
        <button
          type="button"
          className={s.button}
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
        <button
          type="button"
          className={s.button}
          onClick={() => emit({ type: "artifact.blur" })}
        >
          Put it back
        </button>
      </div>
    </article>
  );
}
