"use client";
// Journal part: E1 stamp book. HTML stub; replace with the book design.
import type { JournalPartProps } from "@/contracts";
import s from "../shared/Fallback.module.css";

export function JournalPart({ content, journal, emit }: JournalPartProps) {
  const earned = new Set(journal.stamps.map((x) => x.stampId));
  return (
    <section className={s.panel} aria-label="Heritage Journal">
      <h2>Heritage Journal</h2>
      <ul>
        {content.stamps.map((st) => (
          <li key={st.id}>
            <strong>
              {earned.has(st.id) ? "★" : "☆"} {st.title}
            </strong>{" "}
            <span className={s.muted}>
              {earned.has(st.id) ? st.description : "Not yet found"}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={s.button}
        onClick={() => emit({ type: "journal.close" })}
      >
        Close
      </button>
    </section>
  );
}
