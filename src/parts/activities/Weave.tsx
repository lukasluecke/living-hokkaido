"use client";
// D2 weave: a small 2D loom. Per row the visitor passes the thread across
// (drag the shuttle, arrow keys or button), then presses the row down.
// A playful observation game: it does not teach a real technique.
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type { ActivityOf, Emit, ResolvedClaim } from "@/contracts";
import { useT } from "@/i18n";
import { material, ui } from "@/design/tokens";
import s from "./Activities.module.css";
import {
  activeRow,
  isOver,
  type LoomState,
  passDirection,
  startLoom,
  stepLoom,
} from "./logic";
import { Sources } from "./Sources";

// SVG geometry (viewBox units).
const W = 480;
const H = 330;
const LEFT = 76;
const RIGHT = 404;
const TOP = 44;
const CLOTH = 286;
const LIFT = 30;

const weftColor = (row: number) =>
  row % 2 === 0 ? material.fiber : material.cloth;

export function Weave({
  a,
  claims,
  emit,
}: {
  a: ActivityOf<"weave">;
  claims: Record<string, ResolvedClaim>;
  emit: Emit;
}) {
  const tr = useT();
  const [loom, act] = useReducer(stepLoom, a.rows, startLoom);
  const [drag, setDrag] = useState<number | null>(null);
  const sent = useRef(false);
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (loom.phase !== "done" || sent.current) return;
    sent.current = true;
    emit({
      type: "activity.complete",
      result: {
        activityId: a.id,
        completed: true,
        score: 1,
        at: new Date().toISOString(),
      },
    });
  }, [loom.phase, a.id, emit]);

  const cols = a.columns;
  const colX = (c: number) => LEFT + ((RIGHT - LEFT) * c) / (cols - 1);
  const rowH = Math.min(26, (CLOTH - TOP - LIFT - 40) / a.rows);
  const rowY = (r: number) => CLOTH - 6 - rowH * (r + 0.5);
  const row = activeRow(loom);
  const dir = passDirection(row);
  const startX = dir === "ltr" ? LEFT - 34 : RIGHT + 34;
  const endX = dir === "ltr" ? RIGHT + 34 : LEFT - 34;
  const looseY = rowY(row) - LIFT;

  const toSvgX = (clientX: number) => {
    const box = svg.current?.getBoundingClientRect();
    if (!box) return startX;
    return ((clientX - box.left) / box.width) * W;
  };

  const onPointerDown = (ev: PointerEvent<SVGGElement>) => {
    if (loom.phase !== "pass") return;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    setDrag(toSvgX(ev.clientX));
  };
  const onPointerMove = (ev: PointerEvent<SVGGElement>) => {
    if (drag === null) return;
    const x = toSvgX(ev.clientX);
    const lo = Math.min(startX, endX);
    const hi = Math.max(startX, endX);
    setDrag(Math.max(lo, Math.min(hi, x)));
    const crossed = dir === "ltr" ? x > RIGHT - 8 : x < LEFT + 8;
    if (crossed) {
      setDrag(null);
      act("pass");
    }
  };
  const onPointerUp = () => setDrag(null);

  const main = () => act(loom.phase === "pass" ? "pass" : "beat");
  const onKeyDown = (ev: KeyboardEvent<HTMLDivElement>) => {
    const k = ev.key;
    if (loom.phase === "pass" && (k === "ArrowLeft" || k === "ArrowRight")) {
      ev.preventDefault();
      act("pass");
    } else if (loom.phase === "beat" && k === "ArrowDown") {
      ev.preventDefault();
      act("beat");
    } else if (loom.phase !== "done" && (k === " " || k === "Enter")) {
      ev.preventDefault();
      main();
    }
  };

  const shuttleX =
    drag ??
    (loom.phase === "beat" ? endX : loom.phase === "done" ? -60 : startX);
  const status =
    loom.phase === "done"
      ? tr("All {n} rows woven.", { n: a.rows })
      : tr(
          loom.phase === "pass"
            ? "Row {n} of {total}: pass the thread across."
            : "Row {n} of {total}: press the row down.",
          { n: row + 1, total: a.rows },
        );

  return (
    <div className={s.weave}>
      <p className={s.prompt}>{a.prompt}</p>
      {/* biome-ignore lint/a11y/useSemanticElements: interactive figure */}
      <div
        className={s.loomWrap}
        role="group"
        aria-label={`Loom, ${status}`}
        aria-describedby={`${a.id}-keys`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard loom
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className={s.loom}
          aria-hidden="true"
          role="presentation"
        >
          {/* Seasonal backdrop */}
          <rect x="0" y="0" width={W} height={H} rx="14" className={s.sky} />
          <rect x="0" y={H - 44} width={W} height="44" className={s.ground} />

          {/* Frame posts */}
          <Beam x={22} y={18} w={24} h={H - 40} />
          <Beam x={W - 46} y={18} w={24} h={H - 40} />
          {/* Top warp beam and cloth beam */}
          <Beam x={14} y={TOP - 26} w={W - 28} h={22} />
          <Beam x={14} y={CLOTH} w={W - 28} h={22} />

          {/* Warp threads */}
          {Array.from({ length: cols }, (_, c) => {
            const lifted = loom.phase === "pass" && !isOver(row, c) ? -1.5 : 0;
            return (
              <g key={`warp-${colX(c)}`}>
                <line
                  x1={colX(c)}
                  x2={colX(c) + lifted}
                  y1={TOP - 4}
                  y2={CLOTH}
                  stroke={ui.ink}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                <line
                  x1={colX(c)}
                  x2={colX(c) + lifted}
                  y1={TOP - 4}
                  y2={CLOTH}
                  stroke={material.thread}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* Woven rows */}
          {Array.from({ length: loom.woven }, (_, r) => (
            <WeftRow
              // biome-ignore lint/suspicious/noArrayIndexKey: rows only grow
              key={r}
              row={r}
              y={rowY(r)}
              h={rowH}
              cols={cols}
              colX={colX}
              settle={r === loom.woven - 1}
              lift={LIFT}
            />
          ))}

          {/* Passed but not pressed yet: loose row above */}
          {loom.phase === "beat" && (
            <WeftRow
              row={row}
              y={looseY}
              h={rowH}
              cols={cols}
              colX={colX}
              settle={false}
              lift={0}
            />
          )}

          {/* Thread trailing the shuttle while dragging */}
          {loom.phase === "pass" && drag !== null && (
            <line
              x1={startX}
              x2={drag}
              y1={looseY}
              y2={looseY}
              stroke={weftColor(row)}
              strokeWidth={rowH * 0.6}
              strokeLinecap="round"
            />
          )}

          {/* Guide for the next pass */}
          {loom.phase === "pass" && drag === null && (
            <line
              x1={LEFT - 10}
              x2={RIGHT + 10}
              y1={looseY}
              y2={looseY}
              className={s.guide}
            />
          )}

          {/* Beater (reed): presses the row down */}
          {loom.phase !== "done" && (
            <g
              key={`beater-${loom.woven}`}
              className={loom.woven > 0 ? s.press : undefined}
              onClick={() => loom.phase === "beat" && act("beat")}
              style={{ cursor: loom.phase === "beat" ? "pointer" : "default" }}
            >
              <rect
                x={LEFT - 22}
                y={looseY - rowH - 12}
                width={RIGHT - LEFT + 44}
                height={10}
                rx={5}
                fill={material.woodDark}
                stroke={ui.ink}
                strokeWidth={2.5}
                className={loom.phase === "beat" ? s.hot : undefined}
              />
            </g>
          )}

          {/* Shuttle */}
          {loom.phase !== "done" && (
            <g
              className={`${s.shuttle} ${drag !== null ? s.dragging : ""} ${loom.phase === "pass" ? s.hot : ""}`}
              style={{ transform: `translate(${shuttleX}px, ${looseY}px)` }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <path
                d="M -30 0 Q -18 -11 0 -11 Q 18 -11 30 0 Q 18 11 0 11 Q -18 11 -30 0 Z"
                fill={material.wood}
                stroke={ui.ink}
                strokeWidth={2.5}
              />
              <rect
                x={-11}
                y={-5}
                width={22}
                height={10}
                rx={4}
                fill={weftColor(row)}
                stroke={ui.ink}
                strokeWidth={1.5}
              />
              {/* Larger invisible hit area for touch */}
              <rect x={-40} y={-22} width={80} height={44} fill="transparent" />
            </g>
          )}
        </svg>
        <Progress loom={loom} />
      </div>

      <p id={`${a.id}-keys`} className={s.hint}>
        {tr(
          "Drag the shuttle across, or use the arrow keys. Then press the row down (↓, or click the bar).",
        )}
      </p>
      <output className={s.srOnly} aria-live="polite">
        {status}
      </output>

      {loom.phase !== "done" ? (
        <div className={s.actions}>
          <button type="button" className={s.primary} onClick={main}>
            {loom.phase === "pass"
              ? `${tr("Pass the thread")} ${dir === "ltr" ? "→" : "←"}`
              : tr("Press the row down ↓")}
          </button>
          <span className={s.muted}>
            {tr("Row {n} of {total}", { n: row + 1, total: a.rows })}
          </span>
        </div>
      ) : (
        <div className={s.result}>
          <p>{a.completion}</p>
          <div className={s.actions}>
            <button
              type="button"
              className={s.secondary}
              onClick={() => act("reset")}
            >
              {tr("Weave again")}
            </button>
          </div>
        </div>
      )}
      <Sources ids={a.claimIds} claims={claims} />
    </div>
  );
}

function Beam({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill={material.wood}
        stroke={ui.ink}
        strokeWidth={2.5}
      />
      <rect
        x={x + 3}
        y={y + h - 6}
        width={w - 6}
        height={3}
        rx={1.5}
        fill={material.woodDark}
        opacity={0.6}
      />
    </g>
  );
}

function WeftRow({
  row,
  y,
  h,
  cols,
  colX,
  settle,
  lift,
}: {
  row: number;
  y: number;
  h: number;
  cols: number;
  colX: (c: number) => number;
  settle: boolean;
  lift: number;
}) {
  const x0 = colX(0) - 10;
  const x1 = colX(cols - 1) + 10;
  return (
    <g
      className={settle ? s.settle : undefined}
      style={settle ? ({ "--lift": `${-lift}px` } as CSSProperties) : undefined}
    >
      <rect
        x={x0}
        y={y - h / 2 + 1}
        width={x1 - x0}
        height={h - 2}
        rx={(h - 2) / 2}
        fill={weftColor(row)}
        stroke={ui.ink}
        strokeWidth={1.5}
      />
      {Array.from({ length: cols }, (_, c) =>
        isOver(row, c) ? null : (
          <g key={`over-${colX(c)}`}>
            <line
              x1={colX(c)}
              x2={colX(c)}
              y1={y - h / 2 - 1}
              y2={y + h / 2 + 1}
              stroke={ui.ink}
              strokeWidth={6}
              strokeLinecap="round"
            />
            <line
              x1={colX(c)}
              x2={colX(c)}
              y1={y - h / 2 - 1}
              y2={y + h / 2 + 1}
              stroke={material.thread}
              strokeWidth={3.5}
              strokeLinecap="round"
            />
          </g>
        ),
      )}
    </g>
  );
}

function Progress({ loom }: { loom: LoomState }) {
  return (
    <ol className={s.progress} aria-hidden="true">
      {Array.from({ length: loom.rows }, (_, i) => (
        <li
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed count
          key={i}
          className={
            i < loom.woven ? s.dotOn : i === loom.woven ? s.dotNow : ""
          }
        />
      ))}
    </ol>
  );
}
