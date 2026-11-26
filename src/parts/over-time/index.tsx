"use client";
// Over-time part: step one place through its eras. The visitor reads one
// era card, taps Next, and the diorama plays the time between the two eras;
// then the next card comes in, with the cards already read stacked above it.
// 3D diorama when WebGL works; the card and the era buttons are the
// keyboard / no-WebGL path and carry every fact (with sources) on their own.
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { MathUtils } from "three";
import { eraAt, SCALE, type TimelinePartProps } from "@/contracts";
import { useT } from "@/i18n";
import { PresentationBadge, RepresentationBadge } from "../shared/Badges";
import { ClipPlayer } from "../shared/Clip";
import { QualityGovernor, useQuality } from "../shared/QualityGovernor";
import { Diorama } from "./Diorama";
import c from "./OverTime.module.css";
import { SHOW_DISCLAIMERS, showModelLabels } from "@/design/disclaimers";

/** Seconds of time animation from one era to the next. */
const TRAVEL_SECONDS = 2.6;
/** Longest jump animation (era buttons, Start again). */
const MAX_TRAVEL_SECONDS = 4;

const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;

/** Damps the shown position toward the target inside the render loop. */
function Damper({
  target,
  shown,
  cut,
}: {
  target: React.RefObject<number>;
  shown: React.RefObject<number>;
  cut: boolean;
}) {
  useFrame((_, dt) => {
    shown.current = cut
      ? target.current
      : MathUtils.damp(shown.current, target.current, 4, dt);
  });
  return null;
}

export function TimelinePart(props: TimelinePartProps) {
  const { timeline, claims, prefs, emit, season, initialEra = 0 } = props;
  const eras = timeline.eras;
  const last = eras.length - 1;
  const tr = useT();
  const start = Math.min(Math.max(initialEra, 0), last);
  const [t, setT] = useState(start);
  /** The era the visitor is at, or travelling to. */
  const [stop, setStop] = useState(start);
  const [moving, setMoving] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const target = useRef(t);
  const shown = useRef(t);
  const tRef = useRef(t);
  const raf = useRef(0);
  const q = useQuality(SCALE.maxDpr);
  target.current = t;
  tRef.current = t;
  const index = moving ? stop : eraAt(eras.length, t);
  const era = eras[index];

  // Open / close events, once per timeline.
  useEffect(() => {
    emit({ type: "timeline.open", timelineId: timeline.id });
    return () => emit({ type: "timeline.close", timelineId: timeline.id });
  }, [timeline.id, emit]);

  // Report the era the visitor settles on (not every scrub frame, not while
  // the time animation plays).
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (moving) return;
    const id = setTimeout(() => {
      if (reported.current === era.id) return;
      reported.current = era.id;
      emit({ type: "timeline.era", timelineId: timeline.id, eraId: era.id });
    }, 400);
    return () => clearTimeout(id);
  }, [era.id, moving, timeline.id, emit]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /** Play the time from here to era `i`. A cut with reduced motion. */
  const travel = (i: number) => {
    const to = Math.min(Math.max(i, 0), last);
    cancelAnimationFrame(raf.current);
    setSourcesOpen(false);
    setStop(to);
    const from = tRef.current;
    if (prefs.reducedMotion || from === to) {
      setMoving(false);
      setT(to);
      return;
    }
    const secs = Math.min(
      TRAVEL_SECONDS * Math.abs(to - from),
      MAX_TRAVEL_SECONDS,
    );
    const t0 = performance.now();
    setMoving(true);
    const step = (now: number) => {
      // rAF time can be a little before t0: clamp to [0, 1].
      const k = Math.min(Math.max((now - t0) / 1000 / secs, 0), 1);
      setT(from + (to - from) * easeInOut(k));
      if (k < 1) raf.current = requestAnimationFrame(step);
      else setMoving(false);
    };
    raf.current = requestAnimationFrame(step);
  };
  /** Finish the time animation now. */
  const skip = () => {
    cancelAnimationFrame(raf.current);
    setMoving(false);
    setT(stop);
  };
  /** Scrub directly (range input): stops any time animation. */
  const scrub = (x: number) => {
    cancelAnimationFrame(raf.current);
    setMoving(false);
    setT(x);
    setStop(eraAt(eras.length, x));
  };

  // Keep the current era tick in view on narrow screens.
  const ticks = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = ticks.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [index]);

  // Year shown while the time animation plays (between two era years).
  const lo = Math.min(Math.max(Math.floor(t), 0), last);
  const hi = Math.min(lo + 1, last);
  const year = Math.round(
    eras[lo].year + (eras[hi].year - eras[lo].year) * (t - lo),
  );
  const atEnd = !moving && index === last;
  const eraClaims = era.claimIds
    .map((id) => claims[id])
    .filter((x) => x !== undefined);
  const notes = timeline.claimIds
    .map((id) => claims[id])
    .filter((x) => x !== undefined);
  const presentation =
    eraClaims[0]?.presentation ?? notes[0]?.presentation ?? "research-preview";

  return (
    <div className={c.stage}>
      {prefs.webgl ? (
        <Canvas
          shadows={q.shadows}
          dpr={q.dpr}
          camera={{
            position: [15, 14, 19],
            fov: SCALE.defaultFov,
            near: 0.5,
            far: 120,
          }}
          gl={{ antialias: false, powerPreference: "high-performance" }}
          aria-hidden
        >
          <Suspense fallback={null}>
            <Damper
              target={target}
              shown={shown}
              cut={prefs.reducedMotion || moving}
            />
            <Diorama
              eras={eras}
              t={shown}
              seasonValue={season.value}
              reducedMotion={prefs.reducedMotion}
              fx
              extraFx={q.extraFx}
            />
          </Suspense>
          <QualityGovernor />
        </Canvas>
      ) : (
        <div className={c.noGl} aria-hidden>
          {era.label}
        </div>
      )}

      <section className={c.card} aria-labelledby="ot-title">
        {index > 0 && (
          <ol className={c.stack} aria-label={tr("Read before")}>
            {eras.slice(0, index).map((e, i) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => travel(i)}
                  title={tr("Go back to {label}", { label: e.label })}
                >
                  <span className={c.stackPeriod}>{e.period}</span>
                  <span>{e.title}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
        {moving ? (
          <div className={c.transit} aria-hidden>
            <p className={c.kicker}>{tr("Time passes")}</p>
            <p className={c.year}>{tr("About {year}", { year })}</p>
            <p className={c.toward}>
              {eras[stop].label} · {eras[stop].period}
            </p>
          </div>
        ) : (
          <div key={era.id} className={c.page} aria-live="polite">
            {SHOW_DISCLAIMERS && (
              <div className={c.badges}>
                <PresentationBadge value={presentation} />
                <RepresentationBadge value={timeline.representation} />
              </div>
            )}
            <p className={c.kicker}>
              {timeline.title} · {era.period}
            </p>
            <h2 id="ot-title" className={c.title}>
              {era.title}
            </h2>
            <p className={c.summary}>{era.summary}</p>
            {era.clip && (
              <ClipPlayer
                key={era.id}
                clip={era.clip}
                reducedMotion={prefs.reducedMotion}
                hideLabels={!showModelLabels(prefs)}
              />
            )}
            <button
              type="button"
              className={c.link}
              aria-expanded={sourcesOpen}
              onClick={() => setSourcesOpen((x) => !x)}
            >
              {sourcesOpen
                ? tr("Hide sources")
                : tr("How do we know? ({n})", { n: eraClaims.length })}
            </button>
            {sourcesOpen && (
              <ol className={c.claims}>
                {eraClaims.map((r) => (
                  <li key={r.claim.id}>
                    <span>{r.claim.text}</span>
                    <span className={c.cite}>
                      {r.claim.citations.map((ct, i) => {
                        const src = r.sources.find((s) => s.id === ct.sourceId);
                        return (
                          <span key={i}>
                            {src?.url ? (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {src.attribution}
                              </a>
                            ) : (
                              (src?.attribution ?? ct.sourceId)
                            )}
                            {` · ${ct.locator}`}
                          </span>
                        );
                      })}
                    </span>
                    <button
                      type="button"
                      className={c.reveal}
                      onClick={() =>
                        emit({
                          type: "reveal.open",
                          knowledgeId: r.knowledgeId,
                          claimId: r.claim.id,
                        })
                      }
                    >
                      {tr("How this was made")}
                    </button>
                  </li>
                ))}
              </ol>
            )}
            {notes.map((r) => (
              <p key={r.claim.id} className={c.note}>
                {r.claim.text}
              </p>
            ))}
          </div>
        )}
        <div className={c.steps}>
          <button
            type="button"
            className={c.back}
            onClick={() => travel(stop - 1)}
            disabled={stop === 0}
          >
            {tr("Back")}
          </button>
          <span className={c.count}>
            {tr("{n} of {total}", { n: stop + 1, total: eras.length })}
          </span>
          <button
            type="button"
            className={c.next}
            onClick={() =>
              moving ? skip() : atEnd ? travel(0) : travel(stop + 1)
            }
          >
            {moving
              ? tr("Skip")
              : atEnd
                ? tr("Start again")
                : tr("Next: {label}", { label: eras[index + 1].label })}
          </button>
        </div>
      </section>

      <nav
        className={c.bar}
        aria-label={tr("{title}: eras", { title: timeline.title })}
      >
        <div className={c.controls}>
          <input
            className={c.range}
            type="range"
            min={0}
            max={last}
            step={0.01}
            value={t}
            aria-label={tr("Time")}
            aria-valuetext={`${era.label}, ${era.period}`}
            onChange={(e) => scrub(Number(e.target.value))}
            onKeyDown={(e) => {
              // Arrow keys jump a whole era; Home/End go to the ends.
              const k = e.key;
              if (k === "ArrowRight" || k === "ArrowUp") travel(stop + 1);
              else if (k === "ArrowLeft" || k === "ArrowDown") travel(stop - 1);
              else if (k === "Home") travel(0);
              else if (k === "End") travel(last);
              else return;
              e.preventDefault();
            }}
            onPointerUp={() => {
              if (!moving) travel(Math.round(t));
            }}
          />
        </div>
        <ol className={c.ticks} ref={ticks}>
          {eras.map((e, i) => (
            <li key={e.id}>
              <button
                type="button"
                aria-pressed={i === index}
                onClick={() => travel(i)}
              >
                <strong>{e.label}</strong>
                <span>{e.period}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
