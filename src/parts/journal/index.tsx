"use client";
// Journal part: E1 Heritage Journal stamp book (HTML, no WebGL needed).
// Read-only: renders `journal` against `content.stamps`. Emits
// `journal.close`, and `reveal.open` from a stamp's claim reminders.
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { JournalPartProps } from "@/contracts";
import { type Locale, useI18n } from "@/i18n";
import { material, type as font, ui } from "@/design/tokens";
import { PresentationBadge } from "../shared/Badges";
import { hintOf, progressOf, remindersOf, SECTIONS, sectionOf } from "./book";
import s from "./Journal.module.css";
import { StampIcon } from "./StampIcon";

const vars = {
  "--paper": ui.paper,
  "--paper-edge": ui.paperEdge,
  "--ink": ui.ink,
  "--ink-soft": ui.inkSoft,
  "--gold": ui.gold,
  "--gold-deep": ui.goldDeep,
  // Station-stamp ink follows the season (the shell sets --fl-season).
  "--seal": `var(--fl-season, ${material.tie})`,
  "--locked": ui.inkSoft,
  "--cover": ui.ink,
  "--font-body": font.body,
  "--font-heading": font.heading,
} as CSSProperties;

function earnedDate(iso: string, locale?: Locale): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

export function JournalPart({
  content,
  journal,
  prefs,
  emit,
}: JournalPartProps) {
  const earnedAt = useMemo(
    () => new Map(journal.stamps.map((x) => [x.stampId, x.earnedAt])),
    [journal.stamps],
  );
  const bySection = useMemo(
    () =>
      SECTIONS.map((sec) => ({
        ...sec,
        stamps: content.stamps.filter(
          (st) => sectionOf(content, st) === sec.id,
        ),
      })),
    [content],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    () => journal.stamps.at(-1)?.stampId ?? content.stamps[0]?.id ?? null,
  );
  const selected = content.stamps.find((st) => st.id === selectedId) ?? null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const total = content.stamps.length;
  const have = content.stamps.filter((st) => earnedAt.has(st.id)).length;

  return (
    <section
      className={`${s.book} ${prefs.reducedMotion ? s.still : ""}`}
      style={vars}
      role="dialog"
      aria-labelledby="journal-title"
    >
      <header className={s.header}>
        <div>
          <h2 id="journal-title" className={s.title}>
            {t("Heritage Journal")}
          </h2>
          <p className={s.count}>
            {t("{have} of {total} stamps", { have, total })}
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          className={s.close}
          onClick={() => emit({ type: "journal.close" })}
        >
          {t("Close")}
        </button>
      </header>

      <div className={s.spread}>
        {bySection.map((sec) => (
          <section
            key={sec.id}
            className={s.section}
            aria-labelledby={`journal-${sec.id}`}
          >
            <h3 id={`journal-${sec.id}`} className={s.sectionTitle}>
              {t(sec.title)}
            </h3>
            <p className={s.blurb}>{t(sec.blurb)}</p>
            {sec.stamps.length === 0 ? (
              <p className={s.empty}>{t("No stamps here yet.")}</p>
            ) : (
              <ul className={s.stamps}>
                {sec.stamps.map((st) => {
                  const earned = earnedAt.has(st.id);
                  return (
                    <li key={st.id}>
                      <button
                        type="button"
                        className={`${s.stamp} ${earned ? s.earned : s.locked}`}
                        aria-pressed={st.id === selectedId}
                        onClick={() => setSelectedId(st.id)}
                      >
                        <StampIcon icon={st.icon} earned={earned} />
                        <span className={s.stampTitle}>{st.title}</span>
                        <span className={s.stampState}>
                          {earned ? t("Earned") : t("Not yet found")}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>

      {selected && (
        <StampDetail
          key={selected.id}
          content={content}
          journal={journal}
          stamp={selected}
          earnedAt={earnedAt.get(selected.id) ?? null}
          emit={emit}
        />
      )}
    </section>
  );
}

function StampDetail({
  content,
  journal,
  stamp,
  earnedAt,
  emit,
}: Pick<JournalPartProps, "content" | "journal" | "emit"> & {
  stamp: JournalPartProps["content"]["stamps"][number];
  earnedAt: string | null;
}) {
  const { t, locale } = useI18n();
  const earned = earnedAt !== null;
  const p = progressOf(content, journal, stamp);
  const reminders = earned ? remindersOf(content, stamp) : [];
  return (
    <aside
      className={s.detail}
      aria-live="polite"
      aria-label={t("Selected stamp")}
    >
      <StampIcon icon={stamp.icon} earned={earned} size={64} />
      <div className={s.detailBody}>
        <h3 className={s.detailTitle}>{stamp.title}</h3>
        {earned ? (
          <p>
            {stamp.description}
            {earnedDate(earnedAt, locale) && (
              <span className={s.date}>
                {" · "}
                {t("Earned {date}", { date: earnedDate(earnedAt, locale) })}
              </span>
            )}
          </p>
        ) : (
          <>
            <p>{hintOf(content, stamp, t)}</p>
            {p.need > 1 && (
              <p className={s.progress}>
                <progress value={p.have} max={p.need} />{" "}
                {t("{have} of {need}", { have: p.have, need: p.need })}
              </p>
            )}
          </>
        )}
        {reminders.map((r) => (
          <div key={r.claimId} className={s.reminder}>
            <PresentationBadge value={r.presentation} />
            <p>{r.text}</p>
            <button
              type="button"
              className={s.link}
              onClick={() =>
                emit({
                  type: "reveal.open",
                  knowledgeId: r.knowledgeId,
                  claimId: r.claimId,
                })
              }
            >
              {t("Where this comes from")}
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
