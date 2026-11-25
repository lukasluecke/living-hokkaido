"use client";
// Reveal part: F2 "how this was made". The card turns over to show the
// source, the claim and the human review. Show an AI step only when a real
// extraction produced the claim (never a mocked one as live). HTML stub.
import type { RevealPartProps } from "@/contracts";
import { PresentationBadge } from "../shared/Badges";
import s from "../shared/Fallback.module.css";

export function RevealPart({ claim, emit }: RevealPartProps) {
  return (
    <section className={s.panel} aria-label="How this was made">
      <h2>How this was made</h2>
      {claim ? (
        <>
          <PresentationBadge value={claim.presentation} />
          <ol>
            <li>
              Source:{" "}
              {claim.sources.map((src) => (
                <span key={src.id}>
                  {src.url ? <a href={src.url}>{src.title}</a> : src.title}{" "}
                </span>
              ))}
              <span className={s.muted}>
                ({claim.claim.citations.map((c) => c.locator).join("; ")})
              </span>
            </li>
            <li>Claim: “{claim.claim.text}”</li>
            <li>
              Review:{" "}
              {claim.presentation === "approved"
                ? "approved by a named reviewer"
                : "waiting for cultural and editorial review"}
            </li>
          </ol>
        </>
      ) : (
        <p>This content is not available.</p>
      )}
      <button
        type="button"
        className={s.button}
        onClick={() => emit({ type: "reveal.close" })}
      >
        Turn back
      </button>
    </section>
  );
}
