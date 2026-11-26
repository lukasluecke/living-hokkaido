"use client";
// Words kind: listen (when a recording exists), say it aloud, match word to
// object. Terms come from cited claims. A term whose five review checks are
// not done shows a small "Draft" chip (docs/REVIEW.md). The device voice never
// reads an Ainu word; without a recording the visitor reads it aloud.
import { useMemo, useState } from "react";
import { termReviewed } from "@/contracts";
import { useT } from "@/i18n";
import { ObjectIcon } from "./icons";
import { Cite, complete, deviceVoice, type KindProps } from "./shared";
import k from "./kinds.module.css";
import { SHOW_DISCLAIMERS } from "@/design/disclaimers";

/** Stable shuffle so the match columns differ but do not jump on re-render. */
const shuffled = <T,>(xs: T[]) =>
  [...xs.slice(1), xs[0]].filter(Boolean) as T[];

export function Words({ activity: a, claims, emit }: KindProps<"words">) {
  const tr = useT();
  const [step, setStep] = useState<"listen" | "match">("listen");
  const [said, setSaid] = useState<Set<string>>(new Set());
  const [pick, setPick] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [misses, setMisses] = useState(0);
  const [note, setNote] = useState("");
  const objects = useMemo(() => shuffled(a.terms), [a.terms]);
  const canVoice = deviceVoice.available();
  /** Recording: always. Device voice: only for non-Ainu text. */
  const canListen = (kind: string, lang: string) =>
    kind === "recording" ||
    (kind === "device-voice-placeholder" && lang !== "ain" && canVoice);
  const reveal = (claimId: string) =>
    emit({ type: "reveal.open", knowledgeId: a.knowledgeId, claimId });

  const tryMatch = (termId: string, artifactId: string) => {
    const t = a.terms.find((x) => x.id === termId);
    if (!t) return;
    if (t.artifactId === artifactId) {
      const next = new Set(matched).add(termId);
      setMatched(next);
      setNote(
        tr("Matched: “{text}” · {gloss}.", { text: t.text, gloss: t.gloss }),
      );
      if (next.size === a.terms.length)
        complete(emit, a.id, a.terms.length / (a.terms.length + misses));
    } else {
      setMisses((m) => m + 1);
      setNote(tr("Not this one. Look at the shapes again."));
    }
    setPick(null);
  };

  return (
    <div className={k.root}>
      <div className="words">
        {a.standIn && (
          <p className="banner gate" role="note">
            {tr("English stand-in words.")}
          </p>
        )}
        <p>{a.prompt}</p>
        <div className="tabs" role="tablist">
          {(["listen", "match"] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={step === s}
              className={step === s ? "on" : ""}
              onClick={() => setStep(s)}
            >
              {s === "listen" ? tr("1 · Listen and repeat") : tr("2 · Match")}
            </button>
          ))}
        </div>

        {step === "listen" && (
          <div className="term-grid">
            {a.terms.map((t) => (
              <article key={t.id} className="term-card">
                <ObjectIcon id={t.artifactId} />
                <p className="term" lang={t.lang}>
                  {t.text}
                  {SHOW_DISCLAIMERS && !termReviewed(t.review) && (
                    <span className="draft">{tr("Draft")}</span>
                  )}
                </p>
                <p className="gloss">{t.gloss}</p>
                <div className="row">
                  <button
                    type="button"
                    className="btn"
                    disabled={!canListen(t.audio.kind, t.lang)}
                    onClick={() => deviceVoice.speak(t.text)}
                  >
                    ▶ {tr("Listen")}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    aria-pressed={said.has(t.id)}
                    onClick={() => setSaid(new Set(said).add(t.id))}
                  >
                    {said.has(t.id) ? tr("✓ Said it") : tr("I said it aloud")}
                  </button>
                </div>
                <p className="voice-label">
                  {t.audio.kind === "recording"
                    ? tr("Recorded speaker")
                    : canListen(t.audio.kind, t.lang)
                      ? tr("Device voice")
                      : tr("No recording yet · read it aloud")}
                </p>
                <Cite
                  claim={claims[t.claimId]}
                  onReveal={() => reveal(t.claimId)}
                />
              </article>
            ))}
          </div>
        )}

        {step === "match" && (
          <div className="match">
            <div className="match-col" aria-label={tr("Words")}>
              {a.terms.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`chip ${pick === t.id ? "picked" : ""} ${matched.has(t.id) ? "done" : ""}`}
                  disabled={matched.has(t.id)}
                  aria-pressed={pick === t.id}
                  lang={t.lang}
                  onClick={() => setPick(t.id)}
                >
                  {t.text}
                </button>
              ))}
            </div>
            <div className="match-objects" aria-label={tr("Objects")}>
              {objects.map((o) => {
                const done = [...matched].some(
                  (id) =>
                    a.terms.find((t) => t.id === id)?.artifactId ===
                    o.artifactId,
                );
                return (
                  <button
                    key={o.artifactId}
                    type="button"
                    className={`object ${done ? "done" : ""}`}
                    disabled={!pick || done}
                    aria-label={tr("Object: {gloss}", { gloss: o.gloss })}
                    onClick={() => pick && tryMatch(pick, o.artifactId)}
                  >
                    <ObjectIcon id={o.artifactId} size={88} />
                    <span>{done ? o.text : "?"}</span>
                  </button>
                );
              })}
            </div>
            <p className="feedback" aria-live="polite">
              {matched.size === a.terms.length
                ? SHOW_DISCLAIMERS
                  ? tr("All matched. Illustrative shapes, not museum objects.")
                  : tr("All matched.")
                : note ||
                  (pick
                    ? tr("Now pick the object.")
                    : tr("Pick a word first."))}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
