"use client";
// "Learn first": the text of the cited claims, shown before a quiz or an
// order task, so the visitor is taught before they are asked (Lukas,
// 2026-11-26). `LearnAgain` keeps the same note one tap away during the task.
import { useT } from "@/i18n";
import { useEffect, useRef } from "react";
import s from "./Activities.module.css";

function Note({ lines }: { lines: readonly string[] }) {
  return (
    <ul className={s.lessonList}>
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

export function LearnFirst({
  lines,
  onReady,
}: {
  lines: readonly string[];
  onReady: () => void;
}) {
  const t = useT();
  const start = useRef<HTMLButtonElement>(null);
  useEffect(() => start.current?.focus({ preventScroll: true }), []);
  return (
    <div className={s.quiz}>
      <div className={s.lesson}>
        <p className={s.lessonHead}>{t("Learn first")}</p>
        <Note lines={lines} />
      </div>
      <div className={s.actions}>
        <button
          ref={start}
          type="button"
          className={s.primary}
          onClick={onReady}
        >
          {t("I'm ready: ask me")}
        </button>
      </div>
    </div>
  );
}

export function LearnAgain({
  lines,
  open,
  onOpen,
}: {
  lines: readonly string[];
  open: boolean;
  onOpen: (open: boolean) => void;
}) {
  const t = useT();
  if (lines.length === 0) return null;
  return (
    <details
      className={s.lessonAgain}
      open={open}
      onToggle={(e) => onOpen(e.currentTarget.open)}
    >
      <summary>{t("Read the note again")}</summary>
      <Note lines={lines} />
    </details>
  );
}
