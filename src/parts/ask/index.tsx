"use client";
// "Ask the owl" (docs/ASK.md). A small text box: the visitor asks, the owl
// answers only from cited claims, shows them with "How do we know?", and can
// take the visitor to the place or object. Live mode uses /api/ask (server
// key); without a server (static demo link) the scripted fallback answers.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  type AskAction,
  type AskAnswer,
  type AskPartProps,
  type AskRequest,
  ASK_MAX_QUESTION,
  askAnswerSchema,
  askSuggestionsFor,
  type ContentPack,
  resolveClaim,
} from "@/contracts";
import { checkAnswer, scriptedAnswer } from "@/domain/ask";
import { PresentationBadge } from "@/parts/shared/Badges";
import s from "./Ask.module.css";

type Turn = { id: number; question: string; answer: AskAnswer | null };

const NO_SERVER =
  "Scripted answer: no server on this link (keyword match over the museum claims, no AI).";

async function askOwl(pack: ContentPack, req: AskRequest): Promise<AskAnswer> {
  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(25_000),
    });
    if (res.ok) {
      const a = askAnswerSchema.safeParse(await res.json());
      if (a.success) return checkAnswer(pack, a.data);
    }
  } catch {}
  return scriptedAnswer(pack, req, NO_SERVER);
}

function actionLabel(pack: ContentPack, a: AskAction): string {
  if (a.kind === "timeline")
    return `Open ${pack.timelines.find((t) => t.id === a.timelineId)?.title ?? "the timeline"}`;
  const loc = pack.island.locations.find((l) => l.id === a.locationId);
  if (a.kind === "location") return `Fly to the ${loc?.title ?? "place"}`;
  const art = pack.artifacts.find((x) => x.id === a.artifactId);
  return `Show me: ${art?.label ?? "the object"}`;
}

function OwlIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={s.icon}>
      <path
        d="M6 4l2.5 2.2A7 7 0 0 1 12 5.5a7 7 0 0 1 3.5.7L18 4v7a6 6 0 0 1-12 0V4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="10" r="1.4" fill="currentColor" />
      <circle cx="14.5" cy="10" r="1.4" fill="currentColor" />
      <path
        d="M11 13l1 1.4 1-1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AskPart({
  content: pack,
  emit,
  prefs,
  view,
  locationId,
  sceneId,
  artifactId,
  covered,
}: AskPartProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{
    sceneId: string;
    artifactId: string;
  } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const titleId = useId();

  useEffect(() => {
    if (open && !covered) input.current?.focus();
  }, [open, covered]);

  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  // Fly first, then pick up the object once the room is there.
  useEffect(() => {
    if (!pending) return;
    if (view === "island") return setPending(null);
    if (view !== "scene" || sceneId !== pending.sceneId) return;
    const t = setTimeout(
      () => {
        emit({ type: "artifact.focus", artifactId: pending.artifactId });
        setPending(null);
      },
      prefs.reducedMotion ? 0 : 1200,
    );
    return () => clearTimeout(t);
  }, [pending, view, sceneId, emit, prefs.reducedMotion]);

  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);

  // While the box is open, Esc closes the box only (top layer first); it
  // does not step the scene back. Capture runs before the shell's listener.
  useEffect(() => {
    if (!open || covered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, covered, close]);

  const ask = async (question: string) => {
    const q = question.trim().slice(0, ASK_MAX_QUESTION);
    if (q.length < 2 || busy) return;
    const id = nextId.current++;
    setText("");
    setBusy(true);
    input.current?.focus();
    setTurns((t) => [...t.slice(-3), { id, question: q, answer: null }]);
    const answer = await askOwl(pack, {
      question: q,
      context: { locationId, sceneId, artifactId },
    });
    setTurns((t) => t.map((x) => (x.id === id ? { ...x, answer } : x)));
    setBusy(false);
  };

  const go = (a: AskAction) => {
    setOpen(false);
    if (a.kind === "timeline")
      return emit({ type: "timeline.open", timelineId: a.timelineId });
    const loc = pack.island.locations.find((l) => l.id === a.locationId);
    if (!loc) return;
    if (a.kind === "artifact" && loc.sceneId) {
      const inside =
        (view === "scene" || view === "focus") && sceneId === loc.sceneId;
      if (inside)
        return emit({ type: "artifact.focus", artifactId: a.artifactId });
      setPending({ sceneId: loc.sceneId, artifactId: a.artifactId });
    }
    emit({ type: "location.select", locationId: loc.id });
  };

  if (covered) return null;
  const sheet = view === "focus" || view === "activity";

  if (!open)
    return (
      <button
        ref={trigger}
        type="button"
        className={s.trigger}
        data-sheet={sheet || undefined}
        onClick={() => setOpen(true)}
        aria-expanded={false}
      >
        <OwlIcon />
        <span>Ask the owl</span>
      </button>
    );

  // Example questions for where the visitor is now (object, place, island),
  // minus the ones already asked.
  const inside = view === "scene" || view === "focus" || view === "activity";
  const asked = new Set(turns.map((t) => t.question));
  const suggestions = askSuggestionsFor(pack.ask, {
    locationId: inside ? locationId : null,
    artifactId: view === "focus" ? artifactId : null,
  })
    .filter((q) => !asked.has(q))
    .slice(0, turns.length ? 2 : 4);
  return (
    <section
      className={s.panel}
      aria-labelledby={titleId}
      data-still={prefs.reducedMotion || undefined}
    >
      <div className={s.head}>
        <OwlIcon />
        <h2 id={titleId} className={s.title}>
          Ask the owl
        </h2>
        <button
          type="button"
          className={s.x}
          aria-label="Close Ask the owl"
          title="Close (Esc)"
          onClick={close}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className={s.icon}>
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className={s.log} ref={log} aria-live="polite">
        {turns.length === 0 && (
          <p className={s.intro}>
            I answer only from the museum sources in this demo, and I show you
            where each answer comes from.
          </p>
        )}
        {turns.map((t) => (
          <article key={t.id} className={s.turn}>
            <p className={s.q}>{t.question}</p>
            {t.answer ? (
              <Answer
                pack={pack}
                answer={t.answer}
                onGo={go}
                onReveal={(knowledgeId, claimId) =>
                  emit({ type: "reveal.open", knowledgeId, claimId })
                }
              />
            ) : (
              <p className={s.thinking}>The owl is thinking…</p>
            )}
          </article>
        ))}
      </div>
      {suggestions.length > 0 && !busy && (
        <ul className={s.chips} aria-label="Example questions">
          {suggestions.map((q) => (
            <li key={q}>
              <button type="button" onClick={() => ask(q)} disabled={busy}>
                {q}
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          ask(text);
        }}
      >
        <input
          ref={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={ASK_MAX_QUESTION}
          placeholder="Ask a question about what you see…"
          aria-label="Your question"
          enterKeyHint="send"
        />
        <button type="submit" disabled={busy || text.trim().length < 2}>
          Ask
        </button>
      </form>
    </section>
  );
}

function Answer({
  pack,
  answer,
  onGo,
  onReveal,
}: {
  pack: ContentPack;
  answer: AskAnswer;
  onGo: (a: AskAction) => void;
  onReveal: (knowledgeId: string, claimId: string) => void;
}) {
  const claims = answer.citations
    .map((c) => resolveClaim(pack, c.knowledgeId, c.claimId))
    .filter((c) => c !== null);
  return (
    <div className={s.a} data-known={answer.known}>
      <p>{answer.text}</p>
      {claims.length > 0 && (
        <ul className={s.claims} aria-label="From the sources">
          {claims.map((c) => (
            <li key={c.claim.id}>
              <span className={s.claimText}>{c.claim.text}</span>
              <span className={s.claimMeta}>
                <PresentationBadge value={c.presentation} />
                <button
                  type="button"
                  className={s.how}
                  onClick={() => onReveal(c.knowledgeId, c.claim.id)}
                >
                  How do we know?
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {answer.action && (
        <button
          type="button"
          className={s.go}
          onClick={() => answer.action && onGo(answer.action)}
        >
          {actionLabel(pack, answer.action)}
        </button>
      )}
      <p className={s.notice} data-mode={answer.mode}>
        {answer.notice}
      </p>
    </div>
  );
}
