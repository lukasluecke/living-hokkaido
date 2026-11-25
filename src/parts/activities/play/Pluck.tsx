"use client";
// Pluck kind (tonkori mechanics): pluck each open string once, then try the
// short tab. Keys 1–n pluck the strings. Tones are synthetic and
// illustrative: the strings are not in order of pitch, as on the
// instrument, but these pitches are not its tuning.
import { useCallback, useEffect, useRef, useState } from "react";
import { Cite, complete, type KindProps } from "../kinds/shared";
import { pluckPhase, pluckString, startPluck } from "./musicLogic";
import p from "./play.module.css";
import { pluck } from "./synth";

/** Illustrative pitches (semitones) by gauge, so strings are not in order. */
const PITCH = { thick: [0, 2], medium: [5, 3], thin: [12, 10] } as const;

const STROKE = { thick: 3.2, medium: 2.2, thin: 1.3 } as const;

export function PluckActivity({
  activity: a,
  claims,
  prefs,
  emit,
}: KindProps<"pluck">) {
  const [s, setS] = useState(startPluck);
  const [ringing, setRinging] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const sent = useRef(false);
  const tune = a.tune ? a.tune.notes.map((n) => n.string) : null;
  const phase = pluckPhase(s, a.strings.length, tune);
  const reveal = (claimId: string) =>
    emit({ type: "reveal.open", knowledgeId: a.knowledgeId, claimId });

  // Pitch per string: by gauge, alternating within a gauge.
  const pitches = a.strings.map((st, i) => {
    const same = a.strings.slice(0, i).filter((x) => x.gauge === st.gauge);
    return PITCH[st.gauge][same.length % 2];
  });

  const hit = useCallback(
    (n: number) => {
      const st = a.strings[n - 1];
      if (!st) return;
      if (sound) pluck(pitches[n - 1], st.gauge);
      setRinging(n);
      setS((cur) => pluckString(cur, n, a.strings.length, tune));
    },
    [a.strings, pitches, sound, tune],
  );

  useEffect(() => {
    if (ringing === null) return;
    const t = setTimeout(() => setRinging(null), 380);
    return () => clearTimeout(t);
  }, [ringing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= a.strings.length) hit(n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [a.strings.length, hit]);

  useEffect(() => {
    if (phase !== "done" || sent.current) return;
    sent.current = true;
    complete(emit, a.id, tune ? tune.length / (tune.length + s.misses) : 1);
  }, [phase, emit, a.id, tune, s.misses]);

  const target = phase === "tune" && tune ? tune[s.next] : null;
  const w = 40 + a.strings.length * 34;
  const x = (i: number) => 40 + i * 34;

  // Tab, grouped in phrases.
  const phrases: { string: number; hand: string; i: number }[][] = [];
  if (a.tune) {
    let i = 0;
    const groups = a.tune.groups.length ? a.tune.groups : [a.tune.notes.length];
    for (const g of groups) {
      phrases.push(
        a.tune.notes.slice(i, i + g).map((n, k) => ({ ...n, i: i + k })),
      );
      i += g;
    }
  }

  return (
    <div className={p.root}>
      <p>{a.prompt}</p>
      <div className="tonkori-wrap">
        <div className="tonkori" style={{ width: w }}>
          <svg viewBox={`0 0 ${w} 300`} aria-hidden="true">
            <path
              d={`M${w / 2 - 6} 6 L${w / 2 + 6} 6 L${w - 14} 70 L${w - 18} 286 Q${w / 2} 298 18 286 L14 70 Z`}
              className="body"
            />
            <rect
              x={w / 2 - 26}
              y={238}
              width={52}
              height={7}
              className="bridge"
            />
            {a.strings.map((st, i) => (
              <line
                key={st.id}
                x1={x(i)}
                y1={40}
                x2={x(i)}
                y2={262}
                strokeWidth={STROKE[st.gauge]}
                className={`string ${ringing === i + 1 && !prefs.reducedMotion ? "ring" : ""} ${target === i + 1 ? "target" : ""}`}
              />
            ))}
          </svg>
          {a.strings.map((st, i) => (
            <button
              key={st.id}
              type="button"
              className={`string-hit ${target === i + 1 ? "target" : ""} ${s.tried.includes(i + 1) ? "tried" : ""}`}
              style={{ left: x(i) - 15 }}
              aria-label={`String ${i + 1}, ${st.gauge}, ${st.hands.join(" or ")} hand`}
              onClick={() => hit(i + 1)}
            >
              <span className="string-num">{i + 1}</span>
              <span className="string-hand">
                {st.hands.map((h) => (h === "left" ? "L" : "R")).join("/")}
              </span>
            </button>
          ))}
        </div>
        <div className="tonkori-side">
          <ol className="steps">
            <li className={phase === "explore" ? "on" : "seen"}>
              Pluck each string once ({s.tried.length} of {a.strings.length}).
              Keys 1–{a.strings.length} work too.
            </li>
            {a.tune && (
              <li
                className={
                  phase === "tune" ? "on" : phase === "done" ? "seen" : ""
                }
              >
                Try the opening of “{a.tune.title}”:
                <span className="tab">
                  {phrases.map((ph) => (
                    <span key={ph[0].i} className="phrase">
                      {ph.map((n) => (
                        <span
                          key={n.i}
                          className={`tab-note ${n.i < s.next || phase === "done" ? "played" : ""} ${n.i === s.next && phase === "tune" ? "now" : ""}`}
                          title={`${n.hand} hand`}
                        >
                          {n.string}
                          <small>{n.hand === "left" ? "L" : "R"}</small>
                        </span>
                      ))}
                    </span>
                  ))}
                </span>
              </li>
            )}
          </ol>
          <p className="feedback" aria-live="polite">
            {phase === "done"
              ? a.completion
              : phase === "tune"
                ? `Next: string ${target}.`
                : "Thick and thin strings alternate. Play them open."}
          </p>
          <label className="toggle">
            <input
              type="checkbox"
              checked={sound}
              onChange={(e) => setSound(e.target.checked)}
            />
            Sound
          </label>
          <p className="small-note">
            Synthetic tones. The strings are not in order of pitch, as on a
            tonkori, but these pitches are not its tuning.
          </p>
          <Cite
            claim={claims[a.stringsClaimId]}
            onReveal={() => reveal(a.stringsClaimId)}
          />
          {a.tune && (
            <Cite
              claim={claims[a.tune.claimId]}
              onReveal={() => a.tune && reveal(a.tune.claimId)}
            />
          )}
          {phase === "done" && (
            <div className="row">
              <button
                type="button"
                className="btn"
                onClick={() => setS(startPluck())}
              >
                Play again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
