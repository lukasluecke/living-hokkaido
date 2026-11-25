"use client";
// Over-time part: scrub one place through its eras. 3D diorama when WebGL
// works; the card and the era buttons are the keyboard / no-WebGL path and
// carry every fact (with sources) on their own.
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { MathUtils } from "three";
import { eraAt, SCALE, type TimelinePartProps } from "@/contracts";
import { useT } from "@/i18n";
import { PresentationBadge, RepresentationBadge } from "../shared/Badges";
import { QualityGovernor, useQuality } from "../shared/Quality";
import { Diorama } from "./Diorama";
import c from "./OverTime.module.css";

/** Seconds per era in play mode. */
const PLAY_SECONDS = 3.2;

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
  const [t, setT] = useState(Math.min(Math.max(initialEra, 0), last));
  const [playing, setPlaying] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const target = useRef(t);
  const shown = useRef(t);
  const q = useQuality(SCALE.maxDpr);
  target.current = t;
  const index = eraAt(eras.length, t);
  const era = eras[index];

  // Open / close events, once per timeline.
  useEffect(() => {
    emit({ type: "timeline.open", timelineId: timeline.id });
    return () => emit({ type: "timeline.close", timelineId: timeline.id });
  }, [timeline.id, emit]);

  // Report the era the visitor settles on (not every scrub frame).
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (playing) return;
    const id = setTimeout(() => {
      if (reported.current === era.id) return;
      reported.current = era.id;
      emit({ type: "timeline.era", timelineId: timeline.id, eraId: era.id });
    }, 400);
    return () => clearTimeout(id);
  }, [era.id, playing, timeline.id, emit]);

  // Play: a slow timelapse through the eras. Never with reduced motion.
  useEffect(() => {
    if (!playing || prefs.reducedMotion) return;
    let raf = 0;
    let prev = performance.now();
    const step = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      let stop = false;
      setT((x) => {
        const n = x + dt / PLAY_SECONDS;
        if (n >= last) {
          stop = true;
          return last;
        }
        return n;
      });
      if (stop) setPlaying(false);
      else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, prefs.reducedMotion, last]);

  // Keep the current era tick in view on narrow screens.
  const ticks = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = ticks.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [index]);

  const go = (i: number) => {
    setPlaying(false);
    setT(Math.min(Math.max(i, 0), last));
  };
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
            <Damper target={target} shown={shown} cut={prefs.reducedMotion} />
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

      <section className={c.card} aria-live="polite" aria-labelledby="ot-title">
        <div className={c.badges}>
          <PresentationBadge value={presentation} />
          <RepresentationBadge value={timeline.representation} />
        </div>
        <p className={c.kicker}>
          {timeline.title} · {era.period}
        </p>
        <h2 id="ot-title" className={c.title}>
          {era.title}
        </h2>
        <p className={c.summary}>{era.summary}</p>
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
                          <a href={src.url} target="_blank" rel="noreferrer">
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
      </section>

      <nav
        className={c.bar}
        aria-label={tr("{title}: eras", { title: timeline.title })}
      >
        <div className={c.controls}>
          <button
            type="button"
            className={c.play}
            onClick={() => {
              if (t >= last) setT(0);
              setPlaying((p) => !p);
            }}
            disabled={prefs.reducedMotion}
            aria-pressed={playing}
            title={
              prefs.reducedMotion ? tr("Off with reduced motion") : undefined
            }
          >
            {playing ? tr("Pause") : tr("Play")}
          </button>
          <input
            className={c.range}
            type="range"
            min={0}
            max={last}
            step={0.01}
            value={t}
            aria-label={tr("Time")}
            aria-valuetext={`${era.label}, ${era.period}`}
            onChange={(e) => {
              setPlaying(false);
              setT(Number(e.target.value));
            }}
            onKeyDown={(e) => {
              // Arrow keys jump a whole era; Home/End go to the ends.
              const k = e.key;
              if (k === "ArrowRight" || k === "ArrowUp") go(index + 1);
              else if (k === "ArrowLeft" || k === "ArrowDown") go(index - 1);
              else if (k === "Home") go(0);
              else if (k === "End") go(last);
              else return;
              e.preventDefault();
            }}
            onPointerUp={() => go(Math.round(t))}
          />
        </div>
        <ol className={c.ticks} ref={ticks}>
          {eras.map((e, i) => (
            <li key={e.id}>
              <button
                type="button"
                aria-pressed={i === index}
                onClick={() => go(i)}
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
