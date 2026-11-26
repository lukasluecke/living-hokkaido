"use client";
// Sequence: first a short "Learn" note from the cited claims, then put steps
// in order. A wrong step gives a gentle nudge and opens the note again.
import { useT } from "@/i18n";
import { useEffect, useRef, useState } from "react";
import type { ActivityOf, Emit, ResolvedClaim } from "@/contracts";
import s from "./Activities.module.css";
import { LearnAgain, LearnFirst } from "./Learn";
import { sequenceLesson } from "./logic";
import { Sources } from "./Sources";

export function Sequence({
  a,
  claims,
  emit,
}: {
  a: ActivityOf<"sequence">;
  claims: Record<string, ResolvedClaim>;
  emit: Emit;
}) {
  const t = useT();
  const [order, setOrder] = useState<string[]>([]);
  const [miss, setMiss] = useState<string | null>(null);
  const sent = useRef(false);
  const done = order.length === a.order.length;
  const next = a.order[order.length];
  const lesson = sequenceLesson(a, claims);
  const [ready, setReady] = useState(lesson.length === 0);
  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    if (!done || sent.current) return;
    sent.current = true;
    emit({
      type: "activity.complete",
      result: {
        activityId: a.id,
        completed: true,
        score: 1,
        at: new Date().toISOString(),
      },
    });
  }, [done, a.id, emit]);

  const label = (id: string) => a.steps.find((x) => x.id === id)?.label ?? id;

  if (!ready)
    return <LearnFirst lines={lesson} onReady={() => setReady(true)} />;

  return (
    <div className={s.quiz}>
      {!done && (
        <LearnAgain lines={lesson} open={noteOpen} onOpen={setNoteOpen} />
      )}
      <p className={s.prompt}>{a.prompt}</p>
      <ol className={s.sequence}>
        {order.map((id) => (
          <li key={id}>{label(id)}</li>
        ))}
      </ol>
      <div className={s.options}>
        {a.steps
          .filter((st) => !order.includes(st.id))
          .map((st) => (
            <button
              key={st.id}
              type="button"
              className={`${s.option} ${miss === st.id ? s.wrong : ""}`}
              onClick={() => {
                if (st.id !== next) {
                  setNoteOpen(true);
                  return setMiss(st.id);
                }
                setMiss(null);
                setOrder([...order, st.id]);
              }}
            >
              <span>{st.label}</span>
            </button>
          ))}
      </div>
      <div aria-live="polite" className={done ? s.result : s.hint}>
        <p>
          {done
            ? a.explanation
            : miss
              ? t(
                  lesson.length > 0
                    ? "Not this one yet. Read the note again and try another step."
                    : "Not this one yet. Try another step.",
                )
              : t("Step {n} of {total}.", {
                  n: order.length + 1,
                  total: a.order.length,
                })}
        </p>
      </div>
      {done && <Sources ids={a.claimIds} claims={claims} />}
    </div>
  );
}
