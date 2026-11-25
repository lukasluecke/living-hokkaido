"use client";
// Activities part: one renderer per activity kind, inside one paper panel.
// Plain DOM + inline SVG, so it works without WebGL and by keyboard.
import type { ActivityPartProps, Presentation } from "@/contracts";
import { seasonWeights } from "@/contracts";
import { PresentationBadge } from "../shared/Badges";
import s from "./Activities.module.css";
import { Quiz } from "./Quiz";
import { Sequence } from "./Sequence";
import { themeVars } from "./theme";
import { Weave } from "./Weave";

const KIND_LABEL: Record<ActivityPartProps["activity"]["kind"], string> = {
  quiz: "Quiz",
  weave: "Hands-on",
  sequence: "Order",
  story: "Story",
  words: "Words",
  trace: "Follow the thread",
};

export function ActivityPart({
  activity,
  claims,
  emit,
  season,
  prefs,
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
  const close = () => emit({ type: "activity.close", activityId: activity.id });

  return (
    <section
      className={`${s.panel} ${prefs.reducedMotion ? s.still : ""}`}
      style={themeVars(seasonWeights(season.value))}
      aria-labelledby={`${activity.id}-title`}
    >
      <div className={s.head}>
        <div className={s.badges}>
          <span className={s.kind}>{KIND_LABEL[activity.kind]}</span>
          {presentation && <PresentationBadge value={presentation} />}
          {activity.kind === "weave" && activity.illustrative && (
            <span className={s.illustrative}>
              Playful illustration · not a real technique
            </span>
          )}
        </div>
        <button
          type="button"
          className={s.close}
          aria-label="Close activity"
          title="Close (Esc)"
          onClick={close}
        >
          ×
        </button>
      </div>
      <h2 id={`${activity.id}-title`} className={s.title}>
        {activity.title}
      </h2>
      {activity.kind === "quiz" && (
        <Quiz a={activity} title={activity.title} claims={claims} emit={emit} />
      )}
      {activity.kind === "weave" && (
        <Weave a={activity} claims={claims} emit={emit} />
      )}
      {activity.kind === "sequence" && (
        <Sequence a={activity} claims={claims} emit={emit} />
      )}
      <div className={s.foot}>
        <button type="button" className={s.secondary} onClick={close}>
          Back
        </button>
      </div>
    </section>
  );
}
