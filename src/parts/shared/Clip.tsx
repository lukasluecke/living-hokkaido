"use client";
// "Watch" button for an AI-generated clip (contract Clip). Nothing loads
// until the visitor taps it; then the clip streams from /api/media/<key>.
// Reduced motion: no autoplay, the visitor presses play.
import { useState } from "react";
import type { Clip } from "@/contracts";
import { useT } from "@/i18n";
import s from "./Clip.module.css";

export function ClipPlayer({
  clip,
  reducedMotion,
  hideLabels = false,
}: {
  clip: Clip;
  reducedMotion: boolean;
  hideLabels?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className={s.wrap}>
      <button
        type="button"
        className={s.watch}
        aria-expanded={open}
        onClick={() => setOpen((x) => !x)}
      >
        <span aria-hidden="true">{open ? "■" : "▶"}</span>
        {open ? t("Close the clip") : t(clip.title)}
        <span aria-hidden="true">· {clip.seconds} s</span>
      </button>
      {open && (
        // biome-ignore lint/a11y/useMediaCaption: ambient clip, no speech
        <video
          className={s.video}
          src={`/api/media/${clip.key}`}
          controls
          playsInline
          preload="metadata"
          autoPlay={!reducedMotion}
          muted={!clip.audio}
          aria-label={t(clip.title)}
        />
      )}
      {open && !hideLabels && <p className={s.note}>ⓘ {t(clip.note)}</p>}
    </div>
  );
}
