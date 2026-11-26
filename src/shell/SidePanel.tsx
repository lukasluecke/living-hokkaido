"use client";
// Frame for the side slot (object card, activity): a header with previous /
// next, the title, "n of m" and a close X. On phone the header is a drag
// handle: drag down to close, swipe sideways for the previous / next object.
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useT } from "@/i18n";
import { Icon } from "@/parts/shared/Icon";
import s from "./SidePanel.module.css";

const CLOSE_PX = 90;
const SWIPE_PX = 60;

export function SidePanel({
  title,
  closeLabel,
  onClose,
  onPrev,
  onNext,
  index,
  total,
  header = true,
  children,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  index?: number;
  total?: number;
  /** false: the child has its own header; keep only the phone drag grip. */
  header?: boolean;
  children: ReactNode;
}) {
  const t = useT();
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const box = useRef<HTMLElement>(null);
  // Keyboard: move focus into the panel when it opens (so Tab reaches the
  // card or activity next), and back to where it was when it closes.
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const el = box.current;
    if (el && !el.contains(document.activeElement))
      el.focus({ preventScroll: true });
    return () => {
      const a = document.activeElement;
      if (
        back?.isConnected &&
        back !== document.body &&
        (!a || a === document.body || el?.contains(a))
      )
        back.focus({ preventScroll: true });
    };
  }, []);
  const [dy, setDy] = useState(0);
  const end = (x: number, y: number) => {
    const p = start.current;
    start.current = null;
    setDy(0);
    if (!p) return;
    const ddx = x - p.x;
    const ddy = y - p.y;
    if (ddy > CLOSE_PX && ddy > Math.abs(ddx)) onClose();
    else if (Math.abs(ddx) > SWIPE_PX && Math.abs(ddx) > Math.abs(ddy))
      (ddx < 0 ? onNext : onPrev)?.();
  };
  return (
    <section
      ref={box}
      className={s.panel}
      tabIndex={-1}
      data-arrow-steps={onPrev || onNext ? "" : undefined}
      // With header={false} the child is the named region (no duplicate).
      aria-label={header ? title : undefined}
      style={
        dy
          ? { transform: `translateY(${dy}px)`, transition: "none" }
          : undefined
      }
    >
      <div
        className={header ? s.head : s.bare}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const p = start.current;
          if (p && p.id === e.pointerId) setDy(Math.max(0, e.clientY - p.y));
        }}
        onPointerUp={(e) => end(e.clientX, e.clientY)}
        onPointerCancel={() => {
          start.current = null;
          setDy(0);
        }}
      >
        <span className={s.grip} aria-hidden="true" />
        {header && onPrev && (
          <button
            type="button"
            className={s.nav}
            aria-label={t("Previous object")}
            title={t("Previous object")}
            onClick={onPrev}
          >
            <Icon d="M15 5l-7 7 7 7" size={20} />
          </button>
        )}
        {header && (
          <span className={s.title}>
            {title}
            {index !== undefined && total !== undefined && total > 1 && (
              <span className={s.count}>
                {" "}
                {index + 1}/{total}
              </span>
            )}
          </span>
        )}
        {header && onNext && (
          <button
            type="button"
            className={s.nav}
            aria-label={t("Next object")}
            title={t("Next object")}
            onClick={onNext}
          >
            <Icon d="M9 5l7 7-7 7" size={20} />
          </button>
        )}
        {header && (
          <button
            type="button"
            className={s.close}
            aria-label={closeLabel}
            title={`${closeLabel} (Esc)`}
            onClick={onClose}
          >
            <Icon d="M6 6l12 12M18 6L6 18" size={20} />
          </button>
        )}
      </div>
      <div className={s.body}>{children}</div>
    </section>
  );
}
