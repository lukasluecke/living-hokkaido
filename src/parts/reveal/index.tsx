"use client";
// Reveal part: F2 "how this was made". The card turns over to show the
// source and locator, the claim and the human review, all from the content
// pack. There is no AI step: no claim in the pack records a real
// extraction, so none is shown (and a mock would have to say so).
// Pure CSS: works without WebGL. Reduced motion = no turn, back face at once.
import type { CSSProperties } from "react";
import { useEffect, useId, useRef, useState } from "react";
import type { RevealPartProps } from "@/contracts";
import { motion, type as font, ui } from "@/design/tokens";
import { PresentationBadge } from "../shared/Badges";
import { buildReveal, kindLabel, type RevealModel, rightsLabel } from "./model";
import s from "./Reveal.module.css";

/** Delay before the card turns, so the visitor sees which card it is. */
const TURN_DELAY_MS = 450;

const vars = {
  "--rv-paper": ui.paper,
  "--rv-edge": ui.paperEdge,
  "--rv-ink": ui.ink,
  "--rv-ink-soft": ui.inkSoft,
  "--rv-gold": ui.gold,
  "--rv-gold-deep": ui.goldDeep,
  "--rv-night": ui.night,
  "--rv-body": font.body,
  "--rv-heading": font.heading,
  "--rv-min": `${font.minSize}px`,
  "--rv-turn": `${motion.overlayMs * 3}ms`,
  "--rv-fade": `${motion.overlayMs}ms`,
} as CSSProperties;

export function RevealPart({
  content,
  knowledgeId,
  claim,
  artifact,
  prefs,
  emit,
}: RevealPartProps) {
  const model = buildReveal({ content, knowledgeId, claim, artifact });
  const reduced = prefs.reducedMotion;
  const [side, setSide] = useState<"front" | "back">(
    reduced ? "back" : "front",
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Focus moves into the reveal, and back to the opener when it closes.
  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialogRef.current?.focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  // Turn the card once after opening. Never wait on the animation for state.
  useEffect(() => {
    if (reduced) {
      setSide("back");
      return;
    }
    const t = setTimeout(() => setSide("back"), TURN_DELAY_MS);
    return () => clearTimeout(t);
  }, [reduced]);

  const close = () => emit({ type: "reveal.close" });
  const flipped = side === "back";

  return (
    <div className={s.backdrop} style={vars}>
      <div
        ref={dialogRef}
        className={s.stage}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-reduced={reduced ? "" : undefined}
      >
        <div className={s.card} data-flipped={flipped ? "" : undefined}>
          <section
            className={`${s.face} ${s.front}`}
            aria-hidden={flipped}
            inert={flipped}
          >
            <Front model={model} titleId={flipped ? undefined : titleId} />
            <div className={s.actions}>
              <button
                type="button"
                className={s.button}
                onClick={() => setSide("back")}
              >
                Turn over
              </button>
            </div>
          </section>
          <section
            className={`${s.face} ${s.back}`}
            aria-hidden={!flipped}
            inert={!flipped}
          >
            <Back model={model} titleId={flipped ? titleId : undefined} />
            <div className={s.actions}>
              <button
                type="button"
                className={s.button}
                onClick={() => setSide("front")}
              >
                Show the front
              </button>
              <button
                type="button"
                className={`${s.button} ${s.primary}`}
                onClick={close}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Front({
  model,
  titleId,
}: {
  model: RevealModel | null;
  titleId: string | undefined;
}) {
  if (!model || model.review.kind === "withdrawn")
    return (
      <h2 id={titleId} className={s.title}>
        This content is not available.
      </h2>
    );
  return (
    <>
      <p className={s.eyebrow}>{model.subject ?? model.title}</p>
      <h2 id={titleId} className={s.title}>
        {model.title}
      </h2>
      {model.claimText && (
        <blockquote className={s.quote}>{model.claimText}</blockquote>
      )}
      <PresentationBadge value={model.presentation} />
      <p className={s.hint}>How do we know? Turn the card over.</p>
    </>
  );
}

function Back({
  model,
  titleId,
}: {
  model: RevealModel | null;
  titleId: string | undefined;
}) {
  if (!model || model.review.kind === "withdrawn")
    return (
      <>
        <h2 id={titleId} className={s.title}>
          How this was made
        </h2>
        <p>
          This content is not available. It may have been withdrawn by its
          community or source.
        </p>
      </>
    );
  const { review } = model;
  return (
    <>
      <p className={s.eyebrow}>From the Living Hokkaido knowledge platform</p>
      <h2 id={titleId} className={s.title}>
        How this was made
      </h2>
      <ol className={s.steps}>
        <li className={s.step}>
          <span className={s.stepNo} aria-hidden="true">
            1
          </span>
          <div>
            <h3 className={s.stepTitle}>Source</h3>
            {model.sources.length === 0 ? (
              <p className={s.muted}>No source is recorded.</p>
            ) : (
              <ul className={s.sources}>
                {model.sources.map(({ source, locators }) => (
                  <li key={source.id}>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                    ) : (
                      <span>{source.title}</span>
                    )}
                    <span className={s.meta}>
                      {kindLabel[source.kind]} · {rightsLabel(source)}
                    </span>
                    {locators.length > 0 && (
                      <span className={s.locator}>
                        Where: {locators.join("; ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
        <li className={s.step}>
          <span className={s.stepNo} aria-hidden="true">
            2
          </span>
          <div>
            <h3 className={s.stepTitle}>Claim</h3>
            {model.claimText ? (
              <p className={s.claim}>“{model.claimText}”</p>
            ) : (
              <p className={s.muted}>
                No single claim is selected. These are the sources for this
                story.
              </p>
            )}
          </div>
        </li>
        <li className={s.step}>
          <span className={s.stepNo} aria-hidden="true">
            3
          </span>
          <div>
            <h3 className={s.stepTitle}>Human review</h3>
            {review.kind === "approved" ? (
              <p>
                Approved by {review.reviewer} on{" "}
                <time dateTime={review.reviewedAt}>{review.reviewedAt}</time>.
              </p>
            ) : (
              <p>
                Research preview. Cultural and editorial review is pending. No
                reviewer has approved this yet.
              </p>
            )}
          </div>
        </li>
      </ol>
      <p className={s.note}>
        A link shows where a fact comes from. It is not permission to reuse the
        media.
      </p>
    </>
  );
}
