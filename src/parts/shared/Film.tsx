"use client";
// Story film card (contract Film): the "story hall" of a place. A small
// poster with a play button; nothing loads until the visitor taps play.
// R2 films stream from /api/museum-assets/<key> (worker.ts fast path);
// YouTube films load a youtube-nocookie embed only then. With no source yet,
// the poster says "coming soon". Reduced motion: no autoplay.
import { useState } from "react";
import type { Film } from "@/contracts";
import { useT } from "@/i18n";
import s from "./Film.module.css";

export function FilmPlayer({
  film,
  reducedMotion,
}: {
  film: Film;
  reducedMotion: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ready = film.source.kind !== "none";
  return (
    <section
      className={s.hall}
      data-open={open || undefined}
      aria-label={t("Story film")}
    >
      <div className={s.head}>
        <span className={s.icon} aria-hidden="true">
          🎞
        </span>
        <div className={s.text}>
          <span className={s.kicker}>{t("Story film")}</span>
          <strong className={s.title}>{t(film.title)}</strong>
          <span className={s.teaser}>{t(film.teaser)}</span>
        </div>
        {ready ? (
          <button
            type="button"
            className={s.play}
            aria-expanded={open}
            aria-label={open ? t("Close the film") : t("Play the film")}
            title={open ? t("Close the film") : t("Play the film")}
            onClick={() => setOpen((x) => !x)}
          >
            <span aria-hidden="true">{open ? "■" : "▶"}</span>
          </button>
        ) : (
          <span className={s.soon}>{t("Coming soon")}</span>
        )}
      </div>
      {open && film.source.kind === "r2" && (
        // biome-ignore lint/a11y/useMediaCaption: subtitles are burned into the film
        <video
          className={s.screen}
          src={`/api/museum-assets/${film.source.key}`}
          controls
          playsInline
          preload="metadata"
          autoPlay={!reducedMotion}
          aria-label={t(film.title)}
        />
      )}
      {open && film.source.kind === "youtube" && (
        <iframe
          className={s.screen}
          src={`https://www.youtube-nocookie.com/embed/${film.source.id}?rel=0&playsinline=1${reducedMotion ? "" : "&autoplay=1"}`}
          title={t(film.title)}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
      <p className={s.note}>
        ⓘ {t(film.credit)}. {t(film.note)}
      </p>
    </section>
  );
}
