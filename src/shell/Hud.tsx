"use client";
// Compact HUD: title, a season segmented control with play, and icon buttons
// (journal, sound, contribute). Accessible names stay the same words as the
// old text buttons ("spring", "Timelapse", "Journal (n/m)", "Sound on").
import { type Emit, SEASON_IDS, type SeasonState, seasonAt } from "@/contracts";
import { SoundToggle, type Soundscape } from "@/audio/react";
import s from "./Hud.module.css";

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
  onOverTime,
}: {
  season: SeasonState;
  emit: Emit;
  stamps: number;
  total: number;
  sound: Soundscape;
  /** Shown inside a location that has an "Over time" timeline. */
  onOverTime?: () => void;
}) {
  const now = seasonAt(season.value);
  return (
    <header className={s.hud}>
      <strong className={s.title}>Living Hokkaido</strong>
      <div className={s.seasons} role="group" aria-label={`Season: ${now}`}>
        {SEASON_IDS.map((id, i) => (
          <button
            key={id}
            type="button"
            aria-label={id}
            title={id}
            aria-pressed={now === id}
            onClick={() => emit({ type: "season.set", value: i })}
          >
            <Icon d={P[id]} fill={id === "spring"} />
          </button>
        ))}
        <button
          type="button"
          aria-label={season.playing ? "Pause" : "Timelapse"}
          title={season.playing ? "Pause the seasons" : "Play the seasons"}
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
      <div className={s.tools}>
        {onOverTime && (
          <button
            type="button"
            className={s.round}
            aria-label="Over time"
            title="Over time"
            onClick={onOverTime}
          >
            <Icon d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9" />
          </button>
        )}
        <button
          type="button"
          className={s.round}
          aria-label={`Journal (${stamps}/${total})`}
          title="Heritage Journal"
          onClick={() => emit({ type: "journal.open" })}
        >
          <Icon d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm0 13a3 3 0 0 1 3-3h10" />
          <span className={s.badge} aria-hidden="true">
            {stamps}
          </span>
        </button>
        <SoundToggle sound={sound} className={s.round}>
          {(muted) => (
            <Icon
              d={
                muted
                  ? "M4 9h4l5-4v14l-5-4H4V9Zm13 1 4 4m0-4-4 4"
                  : "M4 9h4l5-4v14l-5-4H4V9Zm12 0a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12"
              }
            />
          )}
        </SoundToggle>
        <a
          className={s.round}
          href="/contribute"
          aria-label="Contribute a story"
          title="Contribute a story"
        >
          <Icon d="M4 20l4-1 11-11-3-3L5 16l-1 4Zm10-13 3 3" />
        </a>
      </div>
    </header>
  );
}
