"use client";
// Field-label HUD: brand, the line rail (route stations), a stamp counter
// that opens the journal, and one menu for seasons, timelapse, over time,
// sound and contribute. Accessible names keep the old words ("spring",
// "Timelapse", "Journal (n/m)", "Sound on") so scripts and tests still work.
import { useEffect, useRef, useState } from "react";
import { type Emit, SEASON_IDS, type SeasonState, seasonAt } from "@/contracts";
import { SoundToggle, type Soundscape } from "@/audio/react";
import { Icon as LineIcon, UI_ICON } from "@/parts/shared/Icon";
import { type Locale, LOCALE_NAMES, useI18n } from "@/i18n";
import s from "./Hud.module.css";
import type { Station } from "./route";

const P = {
  spring:
    "M12 4c1.4 2 1.4 4 0 6-1.4-2-1.4-4 0-6Zm0 16c-1.4-2-1.4-4 0-6 1.4 2 1.4 4 0 6ZM4 12c2-1.4 4-1.4 6 0-2 1.4-4 1.4-6 0Zm16 0c-2 1.4-4 1.4-6 0 2-1.4 4-1.4 6 0Z",
  summer:
    "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-6v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1",
  autumn: "M5 19C5 10 11 5 19 5c0 8-5 14-14 14Zm0 0 8-8",
  winter: "M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2",
} as const;

function Icon({ d, fill = false }: { d: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={s.icon}>
      <path
        d={d}
        fill={fill ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Hud({
  season,
  emit,
  stamps,
  total,
  sound,
  stations,
  locale,
  onLocale,
  onOverTime,
  inert,
}: {
  /** An overlay covers the page: take the HUD out of focus order. */
  inert?: boolean;
  season: SeasonState;
  emit: Emit;
  stamps: number;
  total: number;
  sound: Soundscape;
  stations: Station[];
  locale: Locale;
  onLocale: (locale: Locale) => void;
  /** Shown inside a location that has an "Over time" timeline. */
  onOverTime?: () => void;
}) {
  const now = seasonAt(season.value);
  const { t, draft } = useI18n();
  const other: Locale = locale === "ja" ? "en" : "ja";
  const [menu, setMenu] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuBox = useRef<HTMLDivElement>(null);

  // Close the menu on Esc (before the shell steps back) or an outside click.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      setMenu(false);
      menuBtn.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuBox.current?.contains(t) && !menuBtn.current?.contains(t))
        setMenu(false);
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [menu]);

  return (
    <header className={s.hud} inert={inert}>
      <strong className={s.title}>
        {t("Living Hokkaido")}
        {draft && (
          <small className={s.draft} title={t("Draft translation note")}>
            {t("Draft translation")}
          </small>
        )}
      </strong>
      <nav className={s.rail} aria-label={t("Your route")}>
        <ol>
          {stations.map((st, i) => {
            const text = `${st.label}${st.sub ? ` ${st.sub}` : ""}`;
            return (
              <li key={st.id} data-status={st.status}>
                {i > 0 && <span className={s.seg} aria-hidden="true" />}
                <button
                  type="button"
                  className={s.station}
                  title={text}
                  disabled={!st.event}
                  aria-current={st.status === "now" ? "step" : undefined}
                  aria-label={`${text}${st.status === "done" ? t(", done") : ""}`}
                  onClick={() => st.event && emit(st.event)}
                >
                  <i aria-hidden="true">
                    {st.status === "done" ? (
                      <LineIcon d={UI_ICON.check} size={14} />
                    ) : (
                      <LineIcon d={UI_ICON[st.id]} size={14} />
                    )}
                  </i>
                  <span className={s.stationLabel}>
                    {st.label}
                    {st.sub && st.status === "now" && (
                      <span className={s.sub}> {st.sub}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className={s.tools}>
        <button
          type="button"
          className={`${s.round} ${s.lang}`}
          lang={other}
          aria-label={
            other === "ja" ? "日本語で表示 (Japanese)" : "Show in English"
          }
          title={LOCALE_NAMES[other]}
          onClick={() => onLocale(other)}
        >
          {other === "ja" ? "あ" : "EN"}
        </button>
        <button
          type="button"
          className={s.counter}
          aria-label={t("Journal ({stamps}/{total})", { stamps, total })}
          title={t("Heritage Journal")}
          onClick={() => emit({ type: "journal.open" })}
        >
          <b aria-hidden="true">{stamps}</b>
          <span className={s.counterText} aria-hidden="true">
            {t("of {total} stamps", { total })}
          </span>
        </button>
        <button
          ref={menuBtn}
          type="button"
          className={s.round}
          aria-label={t("Menu: seasons, sound and more")}
          aria-expanded={menu}
          aria-controls="hud-menu"
          onClick={() => setMenu((m) => !m)}
        >
          <Icon d={P[now]} fill={now === "spring"} />
        </button>
        {menu && (
          <div id="hud-menu" ref={menuBox} className={s.menu}>
            <p className={s.cap}>{t("Season")}</p>
            <div
              className={s.seasons}
              role="group"
              aria-label={t("Season: {season}", { season: t(now) })}
            >
              {SEASON_IDS.map((id, i) => (
                <button
                  key={id}
                  type="button"
                  aria-label={t(id)}
                  title={t(id)}
                  aria-pressed={now === id}
                  onClick={() => emit({ type: "season.set", value: i })}
                >
                  <Icon d={P[id]} fill={id === "spring"} />
                </button>
              ))}
              <button
                type="button"
                aria-label={season.playing ? t("Pause") : t("Timelapse")}
                title={
                  season.playing
                    ? t("Pause the seasons")
                    : t("Play the seasons")
                }
                aria-pressed={season.playing}
                onClick={() =>
                  emit({ type: "season.play", playing: !season.playing })
                }
              >
                <Icon
                  d={season.playing ? "M8 5v14M16 5v14" : "M8 5l11 7-11 7Z"}
                  fill={!season.playing}
                />
              </button>
            </div>
            <div className={s.items}>
              {onOverTime && (
                <button
                  type="button"
                  className={s.item}
                  onClick={() => {
                    setMenu(false);
                    onOverTime();
                  }}
                >
                  <Icon d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9" />
                  {t("Over time")}
                </button>
              )}
              <SoundToggle sound={sound} className={s.item}>
                {(muted) => (
                  <>
                    <Icon
                      d={
                        muted
                          ? "M4 9h4l5-4v14l-5-4H4V9Zm13 1 4 4m0-4-4 4"
                          : "M4 9h4l5-4v14l-5-4H4V9Zm12 0a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12"
                      }
                    />
                    {muted ? t("Sound off") : t("Sound on")}
                  </>
                )}
              </SoundToggle>
              <a className={s.item} href="/contribute">
                <Icon d="M4 20l4-1 11-11-3-3L5 16l-1 4Zm10-13 3 3" />
                {t("Contribute a story")}
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
