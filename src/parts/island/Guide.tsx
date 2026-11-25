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

/** Distinct kind captions, in order: "Build the scene · Game · Listen". */
export function kindSummary(acts: ActivityDefinition[], max = 3): string {
  const caps = [...new Set(acts.map((a) => kindCaption(a.kind)))];
  return caps.length > max
    ? `${caps.slice(0, max).join(" · ")} · +${caps.length - max}`
    : caps.join(" · ");
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
      open.flatMap((l) =>
        placeActivities(content, l.id).map((a) => ({ ...a, place: l })),
      ),
    [content, open],
  );
  const sections =
    by === "place"
      ? open
          .map((l) => ({
            key: l.id,
            label: l.title,
            items: rows.filter((r) => r.place.id === l.id),
          }))
          .filter((s) => s.items.length > 0)
      : groupActivities(rows).map((g) => ({
          key: g.id,
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
            <h3 className={c.groupTitle}>{s.label}</h3>
            <ul>
              {s.items.map((a) => (
                <li key={`${s.key}-${a.place.id}-${a.id}`}>
                  <button
                    type="button"
                    className={c.act}
                    onClick={() => onSelect(a.place)}
                  >
                    <span className={c.actKind}>
                      {by === "place" ? kindCaption(a.kind) : a.place.title}
                    </span>
                    <span className={c.actTitle}>{a.title}</span>
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
