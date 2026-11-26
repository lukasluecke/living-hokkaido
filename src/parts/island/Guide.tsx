"use client";
// "What can I do here?" for the main screen: per-place activity lists for the
// place cards, and an all-activities sheet grouped by place or by kind. Pure
// view of the content pack; picking an entry flies to that place.
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ActivityDefinition,
  IslandPartProps,
  Location,
} from "@/contracts";
import { english, type Translate, useT } from "@/i18n";
import {
  groupActivities,
  kindCaption,
  QUICK_KINDS,
} from "../shared/activityGroups";
import {
  highlightIcon,
  Icon,
  KIND_ICON,
  KindIcon,
  UI_ICON,
} from "../shared/Icon";

const GROUP_ICON: Record<string, string> = {
  "hands-on": UI_ICON.try,
  listen: KIND_ICON.story,
  think: KIND_ICON.quiz,
  behind: KIND_ICON.trace,
  more: KIND_ICON.board,
};
import c from "./Island.module.css";

type Pack = IslandPartProps["content"];

/** Activities of every scene at a place, in pack order, without repeats. */
export function placeActivities(
  content: Pack,
  locationId: string,
): ActivityDefinition[] {
  const ids = new Set(
    content.scenes
      .filter((s) => s.locationId === locationId)
      .flatMap((s) => s.activityIds),
  );
  return content.activities.filter((a) => ids.has(a.id));
}

/** Distinct kinds, in order of first use. */
export function placeKinds(acts: ActivityDefinition[]): string[] {
  return [...new Set(acts.map((a) => a.kind))];
}

/** Distinct kind captions for a screen reader: "Think, Listen, Words". */
export function kindSummary(
  acts: ActivityDefinition[],
  t: Translate = english,
): string {
  return [...new Set(acts.map((a) => t(kindCaption(a.kind))))].join(t(", "));
}

/**
 * One home place per activity, for the "All activities" sheet. Some
 * activities are offered at more than one place (the lake house repeats the
 * other places' activities); the sheet lists each once, at the open place
 * with the fewest activities (the most specific one), pack order on a tie.
 */
export function activityHomes(
  content: Pack,
  open: readonly Location[],
): { activity: ActivityDefinition; place: Location }[] {
  const per = open.map((l) => ({ l, acts: placeActivities(content, l.id) }));
  const out: { activity: ActivityDefinition; place: Location }[] = [];
  for (const a of content.activities) {
    let home: (typeof per)[number] | undefined;
    for (const p of per)
      if (
        p.acts.some((x) => x.id === a.id) &&
        (!home || p.acts.length < home.acts.length)
      )
        home = p;
    if (home) out.push({ activity: a, place: home.l });
  }
  // Group by place in pack order, keeping pack order inside a place.
  return open.flatMap((l) => out.filter((r) => r.place.id === l.id));
}

export function ActivitySheet({
  content,
  done = [],
  onSelect,
  onHighlight,
  onClose,
}: {
  content: Pack;
  done?: string[];
  onSelect: (l: Location) => void;
  onHighlight: (id: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [by, setBy] = useState<"place" | "kind">("place");
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  const open = content.island.locations.filter((l) => l.status === "open");
  // Each activity with the open place it belongs to (first match).
  const rows = useMemo(
    () =>
      activityHomes(content, open).map((r) => ({
        ...r.activity,
        place: r.place,
      })),
    [content, open],
  );
  const highlights = content.highlights.filter((h) =>
    open.some((l) => l.id === h.locationId),
  );
  const heroActs = new Set(
    highlights.flatMap((h) =>
      h.open.kind === "activity" ? [h.open.activityId] : [],
    ),
  );
  // Highlight activities are listed once, at the top.
  const rest = rows.filter((r) => !heroActs.has(r.id));
  const sections =
    by === "place"
      ? open
          .map((l) => ({
            key: l.id,
            icon: undefined as string | undefined,
            label: l.title,
            items: rest.filter((r) => r.place.id === l.id),
          }))
          .filter((s) => s.items.length > 0)
      : groupActivities(rest).map((g) => ({
          key: g.id,
          icon: GROUP_ICON[g.id],
          label: t(g.label),
          items: g.items,
        }));
  return (
    <section
      className={c.sheet}
      role="dialog"
      aria-modal="false"
      aria-label={t("All activities")}
    >
      <div className={c.sheetHead}>
        <span className={c.cap}>
          {t("All activities")} · {rows.length}
        </span>
        <div className={c.seg} role="group" aria-label={t("Group activities")}>
          {(["place", "kind"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={by === k}
              onClick={() => setBy(k)}
            >
              {t(k === "place" ? "By place" : "By kind")}
            </button>
          ))}
        </div>
        <button
          ref={close}
          type="button"
          className={c.sheetClose}
          aria-label={t("Close all activities")}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className={c.sheetBody}>
        {highlights.length > 0 && (
          <div className={`${c.group} ${c.heroGroup}`}>
            <h3 className={c.groupTitle}>
              <Icon d={UI_ICON.star} size={16} className={c.groupIcon} />
              {t("Highlights")}
            </h3>
            <ul className={c.heroList}>
              {highlights.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    className={`${c.act} ${c.heroAct}`}
                    data-done={done.includes(h.id) || undefined}
                    onClick={() => onHighlight(h.id)}
                  >
                    <span className={c.actIcon}>
                      <Icon d={highlightIcon(h.icon)} size={20} />
                    </span>
                    <span className={c.actTitle}>
                      {t(h.title)}
                      {done.includes(h.id) && (
                        <span className={c.sr}>, {t("done")}</span>
                      )}
                    </span>
                    <span className={c.actPlace}>
                      {t(h.teaser)} ·{" "}
                      {open.find((l) => l.id === h.locationId)?.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {sections.map((s) => {
          const main = s.items.filter((a) => !QUICK_KINDS.includes(a.kind));
          const quick = s.items.filter((a) => QUICK_KINDS.includes(a.kind));
          const row = (a: (typeof s.items)[number]) => (
            <li key={`${s.key}-${a.place.id}-${a.id}`}>
              <button
                type="button"
                className={c.act}
                onClick={() => onSelect(a.place)}
              >
                <span className={c.actIcon} title={t(kindCaption(a.kind))}>
                  <KindIcon kind={a.kind} size={20} />
                  <span className={c.sr}>{t(kindCaption(a.kind))}: </span>
                </span>
                <span className={c.actTitle}>{a.title}</span>
                {by === "kind" && (
                  <span className={c.actPlace}>{a.place.title}</span>
                )}
              </button>
            </li>
          );
          return (
            <div key={s.key} className={c.group}>
              <h3 className={c.groupTitle}>
                {s.icon && (
                  <Icon d={s.icon} size={16} className={c.groupIcon} />
                )}
                {s.label}
              </h3>
              {main.length > 0 && <ul>{main.map(row)}</ul>}
              {quick.length > 0 &&
                (main.length > 0 || by === "kind" ? (
                  <details className={c.quick}>
                    <summary>
                      {t("Quick questions")} · {quick.length}
                    </summary>
                    <ul>{quick.map(row)}</ul>
                  </details>
                ) : (
                  <ul>{quick.map(row)}</ul>
                ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
