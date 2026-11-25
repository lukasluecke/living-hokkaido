"use client";
// Activities part: one renderer per activity kind. Stubs in plain HTML.
import { useState } from "react";
import type { ActivityOf, ActivityPartProps, Emit } from "@/contracts";
import s from "../shared/Fallback.module.css";

const done = (emit: Emit, activityId: string, score?: number) =>
  emit({
    type: "activity.complete",
    result: {
      activityId,
      completed: true,
      score,
      at: new Date().toISOString(),
    },
  });

function Quiz({ a, emit }: { a: ActivityOf<"quiz">; emit: Emit }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <>
      <p>{a.question}</p>
      <div className={s.row}>
        {a.options.map((o, i) => (
          <button
            key={o}
            type="button"
            className={s.button}
            aria-pressed={pick === i}
            onClick={() => {
              setPick(i);
              if (i === a.answer) done(emit, a.id, 1);
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {pick !== null && (
        <p className={s.muted}>
          {pick === a.answer ? a.explanation : "Not quite. Try again."}
        </p>
      )}
    </>
  );
}

function Weave({ a, emit }: { a: ActivityOf<"weave">; emit: Emit }) {
  const [filled, setFilled] = useState(0);
  const total = a.rows * a.columns;
  return (
    <>
      <p>{a.prompt}</p>
      <div
        className={s.grid}
        style={{ gridTemplateColumns: `repeat(${a.columns}, 22px)` }}
      >
        {Array.from({ length: total }, (_, i) => (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed grid
            key={i}
            type="button"
            aria-label={`Row ${Math.floor(i / a.columns) + 1}, column ${(i % a.columns) + 1}`}
            className={`${s.cell} ${i < filled ? s.cellOn : ""}`}
            disabled={i !== filled}
            onClick={() => {
              setFilled(i + 1);
              if (i + 1 === total) done(emit, a.id, 1);
            }}
          />
        ))}
      </div>
      {filled === total && <p>{a.completion}</p>}
    </>
  );
}

function Sequence({ a, emit }: { a: ActivityOf<"sequence">; emit: Emit }) {
  const [order, setOrder] = useState<string[]>([]);
  const next = a.order[order.length];
  return (
    <>
      <p>{a.prompt}</p>
      <div className={s.row}>
        {a.steps.map((st) => (
          <button
            key={st.id}
            type="button"
            className={s.button}
            disabled={order.includes(st.id)}
            onClick={() => {
              if (st.id !== next) return;
              const o = [...order, st.id];
              setOrder(o);
              if (o.length === a.order.length) done(emit, a.id, 1);
            }}
          >
            {st.label}
          </button>
        ))}
      </div>
      {order.length === a.order.length && <p>{a.explanation}</p>}
    </>
  );
}

export function ActivityPart({ activity, emit }: ActivityPartProps) {
  return (
    <section className={s.panel} aria-label={activity.title}>
      <h2>{activity.title}</h2>
      {activity.kind === "quiz" && <Quiz a={activity} emit={emit} />}
      {activity.kind === "weave" && <Weave a={activity} emit={emit} />}
      {activity.kind === "sequence" && <Sequence a={activity} emit={emit} />}
      <button
        type="button"
        className={s.button}
        onClick={() =>
          emit({ type: "activity.close", activityId: activity.id })
        }
      >
        Close
      </button>
    </section>
  );
}
