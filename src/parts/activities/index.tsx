"use client";
// Activities part: one renderer per activity kind, inside one paper panel.
// Plain DOM + inline SVG, so it works without WebGL and by keyboard.
import { useT } from "@/i18n";
import type { ActivityPartProps, Presentation } from "@/contracts";
import { seasonWeights } from "@/contracts";
import { PresentationBadge } from "../shared/Badges";
import s from "./Activities.module.css";
import { SplatLookActivity } from "./captures/SplatLook";
import { HideSeekActivity } from "./games/HideSeek";
import { SlopeRunActivity } from "./games/SlopeRun";
import { Quiz } from "./Quiz";
import { Story } from "./kinds/Story";
import { Trace } from "./kinds/Trace";
import { Words } from "./kinds/Words";
import { BoardActivity } from "./play/Board";
import { CanonActivity } from "./play/Canon";
import { MapActivity } from "./play/Map";
import { PlaceActivity } from "./play/Place";
import { PluckActivity } from "./play/Pluck";
import { Sequence } from "./Sequence";
import { themeVars } from "./theme";
import { Weave } from "./Weave";
import { SHOW_DISCLAIMERS } from "@/design/disclaimers";

const KIND_LABEL: Record<ActivityPartProps["activity"]["kind"], string> = {
  quiz: "Quiz",
  weave: "Hands-on",
  sequence: "Order",
  story: "Story",
  words: "Words",
  trace: "Follow the thread",
  map: "Map",
  board: "Game",
  canon: "Listen",
  pluck: "Play",
  "hide-seek": "Game",
  "slope-run": "Game",
  place: "Build the scene",
  "splat-look": "Look closer",
};

export function ActivityPart({
  activity,
  claims,
  emit,
  season,
  prefs,
  found,
}: ActivityPartProps) {
  const presentations = new Set<Presentation>(
    activity.claimIds.flatMap((id) =>
      claims[id] ? [claims[id].presentation] : [],
    ),
  );
  const presentation: Presentation | null = presentations.has(
    "research-preview",
  )
    ? "research-preview"
    : presentations.has("approved")
      ? "approved"
      : null;
  const t = useT();
  const close = () => emit({ type: "activity.close", activityId: activity.id });

  return (
    <section
      // Number keys belong to the activity while it is open (tonkori
      // strings, pose sheet): the scene skips its object shortcuts.
      data-own-keys=""
      className={`${s.panel} ${prefs.reducedMotion ? s.still : ""}`}
      style={themeVars(seasonWeights(season.value))}
      aria-labelledby={`${activity.id}-title`}
    >
      <div className={s.head}>
        <div className={s.badges}>
          <span className={s.kind}>{t(KIND_LABEL[activity.kind])}</span>
          {presentation && <PresentationBadge value={presentation} />}
          {SHOW_DISCLAIMERS && activity.kind === "place" && (
            <span className={s.illustrative}>{t("Illustrative sketch")}</span>
          )}
          {SHOW_DISCLAIMERS &&
            activity.kind === "weave" &&
            activity.illustrative && (
              <span className={s.illustrative}>
                {t("Playful illustration · not a real technique")}
              </span>
            )}
        </div>
        <button
          type="button"
          className={s.close}
          aria-label={t("Close activity")}
          title={t("Close (Esc)")}
          onClick={close}
        >
          ×
        </button>
      </div>
      <h2 id={`${activity.id}-title`} className={s.title}>
        {activity.title}
      </h2>
      {activity.kind === "quiz" && (
        <Quiz
          key={activity.id}
          a={activity}
          title={activity.title}
          claims={claims}
          emit={emit}
        />
      )}
      {activity.kind === "weave" && (
        <Weave a={activity} claims={claims} emit={emit} />
      )}
      {activity.kind === "sequence" && (
        <Sequence key={activity.id} a={activity} claims={claims} emit={emit} />
      )}
      {activity.kind === "story" && (
        <Story activity={activity} claims={claims} prefs={prefs} emit={emit} />
      )}
      {activity.kind === "words" && (
        <Words activity={activity} claims={claims} prefs={prefs} emit={emit} />
      )}
      {activity.kind === "trace" && (
        <Trace activity={activity} claims={claims} prefs={prefs} emit={emit} />
      )}
      {activity.kind === "map" && (
        <MapActivity
          activity={activity}
          claims={claims}
          prefs={prefs}
          emit={emit}
        />
      )}
      {activity.kind === "board" && (
        <BoardActivity
          activity={activity}
          claims={claims}
          prefs={prefs}
          emit={emit}
        />
      )}
      {activity.kind === "canon" && (
        <CanonActivity
          activity={activity}
          claims={claims}
          prefs={prefs}
          emit={emit}
        />
      )}
      {activity.kind === "pluck" && (
        <PluckActivity
          activity={activity}
          claims={claims}
          prefs={prefs}
          emit={emit}
        />
      )}
      {activity.kind === "hide-seek" && (
        <HideSeekActivity
          activity={activity}
          claims={claims}
          prefs={prefs}
          emit={emit}
        />
      )}
      {activity.kind === "slope-run" && (
        <SlopeRunActivity
          activity={activity}
          claims={claims}
          prefs={prefs}
          emit={emit}
          found={found}
        />
      )}
      {activity.kind === "place" && (
        <PlaceActivity
          activity={activity}
          claims={claims}
          prefs={prefs}
          emit={emit}
        />
      )}
      {activity.kind === "splat-look" && (
        <SplatLookActivity
          activity={activity}
          claims={claims}
          prefs={prefs}
          emit={emit}
        />
      )}
      <div className={s.foot}>
        <button type="button" className={s.secondary} onClick={close}>
          {t("Back")}
        </button>
      </div>
    </section>
  );
}
