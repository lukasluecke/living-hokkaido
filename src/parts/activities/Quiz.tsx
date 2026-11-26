"use client";
// Quiz: first a short "Learn" note from the cited claims, so the answer can
// be known; then pick one option. Wrong picks stay marked and open the note
// again; the right pick shows the explanation and the claims it rests on.
import { useT } from "@/i18n";
import { useEffect, useRef, useState } from "react";
import type { ActivityOf, Emit, ResolvedClaim } from "@/contracts";
import s from "./Activities.module.css";
import { quizLesson, quizScore } from "./logic";
import { LearnAgain, LearnFirst } from "./Learn";
import { Sources } from "./Sources";

const LETTERS = "ABCDEFGHIJ";

export function Quiz({
  a,
  title,
  claims,
  emit,
}: {
  a: ActivityOf<"quiz">;
  title: string;
  claims: Record<string, ResolvedClaim>;
  emit: Emit;
}) {
  const t = useT();
  const [tried, setTried] = useState<number[]>([]);
  const solved = tried.includes(a.answer);
  const sent = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  const last = tried.at(-1);
  const lesson = quizLesson(a.claimIds, claims);
  // With nothing to read, go straight to the question.
  const [ready, setReady] = useState(lesson.length === 0);
  const [noteOpen, setNoteOpen] = useState(false);
  const question = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (ready && lesson.length > 0 && tried.length === 0)
      question.current?.focus();
  }, [ready, lesson.length, tried.length]);

  useEffect(() => {
    if (!solved || sent.current) return;
    sent.current = true;
    emit({
      type: "activity.complete",
      result: {
        activityId: a.id,
        completed: true,
        score: quizScore(tried.length - 1, a.options.length),
        at: new Date().toISOString(),
      },
    });
    feedback.current?.focus();
  }, [solved, tried.length, a.id, a.options.length, emit]);

  if (!ready)
    return <LearnFirst lines={lesson} onReady={() => setReady(true)} />;

  return (
    <div className={s.quiz}>
      {!solved && (
        <LearnAgain lines={lesson} open={noteOpen} onOpen={setNoteOpen} />
      )}
      <p
        ref={question}
        tabIndex={-1}
        className={a.question !== title ? s.prompt : s.srOnly}
      >
        {a.question}
      </p>
      <fieldset className={s.options}>
        <legend className={s.srOnly}>{a.question}</legend>
        {a.options.map((o, i) => {
          const wrong = tried.includes(i) && i !== a.answer;
          const right = solved && i === a.answer;
          return (
            <button
              key={o}
              type="button"
              className={`${s.option} ${wrong ? s.wrong : ""} ${right ? s.right : ""}`}
              aria-pressed={tried.includes(i)}
              aria-disabled={solved || wrong}
              onClick={() => {
                if (solved || tried.includes(i)) return;
                setTried([...tried, i]);
                if (i !== a.answer) setNoteOpen(true);
              }}
            >
              <span className={s.letter} aria-hidden="true">
                {right ? "✓" : wrong ? "✗" : LETTERS[i]}
              </span>
              <span>{o}</span>
              {wrong && (
                <span className={s.srOnly}>{t(" (not this one)")}</span>
              )}
              {right && <span className={s.srOnly}>{t(" (correct)")}</span>}
            </button>
          );
        })}
      </fieldset>
      <div
        ref={feedback}
        tabIndex={-1}
        aria-live="polite"
        className={solved ? s.result : s.hint}
      >
        {solved ? (
          <p>{a.explanation}</p>
        ) : last !== undefined ? (
          <p>
            {t(
              lesson.length > 0
                ? "Not quite. Read the note again and try another one."
                : "Not quite. Look again and try another one.",
            )}
          </p>
        ) : (
          <p>{t("Choose one answer.")}</p>
        )}
      </div>
      {solved && <Sources ids={a.claimIds} claims={claims} />}
    </div>
  );
}
