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
import { groupActivities, kindCaption } from "../shared/activityGroups";
import { Icon, KIND_ICON, KindIcon, UI_ICON } from "../shared/Icon";

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
export function kindSummary(acts: ActivityDefinition[]): string {
  return [...new Set(acts.map((a) => kindCaption(a.kind)))].join(", ");
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
  onSelect,
  onClose,
}: {
  content: Pack;
  onSelect: (l: Location) => void;
  onClose: () => void;
}) {
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
  const sections =
    by === "place"
      ? open
          .map((l) => ({
            key: l.id,
            icon: undefined as string | undefined,
            label: l.title,
            items: rows.filter((r) => r.place.id === l.id),
          }))
          .filter((s) => s.items.length > 0)
      : groupActivities(rows).map((g) => ({
          key: g.id,
          icon: GROUP_ICON[g.id],
          label: g.label,
          items: g.items,
        }));
  return (
    <section
      className={c.sheet}
      role="dialog"
      aria-modal="false"
      aria-label="All activities"
    >
      <div className={c.sheetHead}>
        <span className={c.cap}>All activities · {rows.length}</span>
        <div className={c.seg} role="group" aria-label="Group activities">
          {(["place", "kind"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={by === k}
              onClick={() => setBy(k)}
            >
              By {k}
            </button>
          ))}
        </div>
        <button
          ref={close}
          type="button"
          className={c.sheetClose}
          aria-label="Close all activities"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className={c.sheetBody}>
        {sections.map((s) => (
          <div key={s.key} className={c.group}>
            <h3 className={c.groupTitle}>
              {s.icon && <Icon d={s.icon} size={16} className={c.groupIcon} />}
              {s.label}
            </h3>
            <ul>
              {s.items.map((a) => (
                <li key={`${s.key}-${a.place.id}-${a.id}`}>
                  <button
                    type="button"
                    className={c.act}
                    onClick={() => onSelect(a.place)}
                  >
                    <span className={c.actIcon} title={kindCaption(a.kind)}>
                      <KindIcon kind={a.kind} size={20} />
                      <span className={c.sr}>{kindCaption(a.kind)}: </span>
                    </span>
                    <span className={c.actTitle}>{a.title}</span>
                    {by === "kind" && (
                      <span className={c.actPlace}>{a.place.title}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
