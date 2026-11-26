"use client";
// Place kind (Build the scene, labs/activities-scene): a guided story, one
// step at a time. Each step says one cited fact, then hands over one figure
// or thing with a clue; the visitor puts it on a ring (drag, or press a
// ring) and, for people, picks a pose from the pose sheet (buttons or keys
// 1–4). Facts only come from the step's claims and `why`.
import {
  type PointerEvent as RPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PlacePose } from "@/contracts";
import { useT } from "@/i18n";
import { Cite, complete, type KindProps, narrator } from "../kinds/shared";
import { Person, POSES, StageArt, ThingArt } from "./PlaceArt";
import { placeScore, startPlace, stepPlace } from "./placeLogic";
import p from "./play.module.css";
import { SHOW_DISCLAIMERS } from "@/design/disclaimers";

export function PlaceActivity({
  activity: a,
  claims,
  prefs,
  emit,
}: KindProps<"place">) {
  const tr = useT();
  const [st, setSt] = useState(() => startPlace(a));
  const [voice, setVoice] = useState(true);
  const [over, setOver] = useState<number | null>(null);
  const misses = useRef(0);
  const sent = useRef(false);
  const ghostRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const step = a.steps[st.step];
  const fig = step.figure;
  const people = a.subject === "people";

  const act = (x: Parameters<typeof stepPlace>[2]) =>
    setSt((cur) => {
      const next = stepPlace(a, cur, x);
      if (next.tries > cur.tries) misses.current += 1;
      return next;
    });

  const speak = (i: number) => {
    const s = a.steps[i];
    narrator.speak(a.id, s.id, s.ask ? `${s.say} ${s.ask}` : s.say);
  };

  useEffect(() => () => narrator.stop(), []);

  useEffect(() => {
    if (!st.finished || sent.current) return;
    sent.current = true;
    complete(emit, a.id, placeScore(misses.current, a.steps.length));
  }, [st.finished, emit, a.id, a.steps.length]);

  useEffect(() => {
    if (st.phase !== "pose") return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      const pose = step.poses[n - 1];
      if (pose) act({ type: "pose", pose });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const reveal = (claimId: string) =>
    emit({ type: "reveal.open", knowledgeId: a.knowledgeId, claimId });

  const next = () => {
    const i = st.step + 1;
    act({ type: "next" });
    if (voice) speak(i);
  };

  const ringAt = (cx: number, cy: number) => {
    const el = document.elementFromPoint(cx, cy)?.closest("[data-ring]");
    return el instanceof HTMLElement ? Number(el.dataset.ring) : null;
  };

  const onDown = (e: RPointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: RPointerEvent) => {
    const d = drag.current;
    const g = ghostRef.current;
    if (!d || !g) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6)
      d.moved = true;
    if (!d.moved) return;
    g.style.display = "block";
    const box = rootRef.current?.getBoundingClientRect();
    g.style.left = `${e.clientX - (box?.left ?? 0)}px`;
    g.style.top = `${e.clientY - (box?.top ?? 0)}px`;
    g.style.visibility = "hidden";
    const r = ringAt(e.clientX, e.clientY);
    g.style.visibility = "visible";
    setOver(r);
  };
  const onUp = (e: RPointerEvent) => {
    const d = drag.current;
    drag.current = null;
    const g = ghostRef.current;
    if (g) g.style.display = "none";
    setOver(null);
    if (!d?.moved) return;
    const r = ringAt(e.clientX, e.clientY);
    if (r !== null) act({ type: "ring", index: r });
  };

  const figureArt = (pose: PlacePose) =>
    fig?.thing ? (
      <ThingArt thing={fig.thing} />
    ) : (
      <Person pose={pose} colour={fig?.colour} hat={fig?.hat} />
    );

  const stepClaim = claims[step.claimIds[0]];
  const done = st.phase === "done";
  const last = st.step === a.steps.length - 1;

  return (
    <div
      ref={rootRef}
      className={`${p.root} ${p.place} ${prefs.reducedMotion ? "still" : ""}`}
    >
      <ol
        className="rail"
        aria-label={tr("Step {n} of {total}", {
          n: st.step + 1,
          total: a.steps.length,
        })}
      >
        {a.steps.map((s, i) => (
          <li
            key={s.id}
            className={
              i < st.step || st.finished ? "done" : i === st.step ? "now" : ""
            }
          >
            <i />
          </li>
        ))}
      </ol>

      {/* The guide comes first, above the stage, so the step line, the
          voice controls, the figure to place and the next action are seen
          without scrolling (desktop side panel and phone sheet). */}
      <div className="stepcard">
        <div className="stepno">
          <span>
            {tr("Step {n} of {total}", {
              n: st.step + 1,
              total: a.steps.length,
            })}
          </span>
          <span className="voice">
            <button
              type="button"
              className="toggle listen"
              onClick={() => speak(st.step)}
            >
              <span aria-hidden="true">▶ </span>
              {tr("Listen")}
            </button>
            <button
              type="button"
              className="toggle"
              aria-pressed={voice}
              onClick={() => {
                if (voice) narrator.stop();
                setVoice(!voice);
              }}
            >
              {voice ? tr("Voice on") : tr("Voice off")}
            </button>
          </span>
        </div>
        <div className="caption">
          {step.say}
          {step.observed && (
            <small>
              {tr(
                "Seen in the museum diorama, not in the panel text · weaker source",
              )}
            </small>
          )}
        </div>

        {fig && st.phase === "place" ? (
          <div className="hand">
            <button
              type="button"
              className="card"
              aria-label={tr("{label}: drag to a ring, or press a ring", {
                label: fig.label,
              })}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              {figureArt("stand")}
            </button>
            <div>
              <p className="ask">{step.ask}</p>
              <p className="small">
                <b>{fig.label}</b>
                {fig.note ? tr("{note}. ", { note: fig.note }) : ""}
                {tr("Drag to a ring, or press a ring.")}
              </p>
            </div>
          </div>
        ) : (
          fig && <p className="ask">{step.ask}</p>
        )}
        {/* Screen readers hear the hint and the result as they change. */}
        <div aria-live="polite">
          {st.hint && <p className="msg no">{tr(st.hint)}</p>}
          {fig && st.phase === "pose" && !st.hint && (
            <p className="msg ok">{tr("Good place. Now pick a pose.")}</p>
          )}
          {fig && done && step.why && <p className="msg ok">{step.why}</p>}
        </div>

        {((!done && st.tries >= 2) || (done && !st.finished)) && (
          <div className="row">
            {!done && st.tries >= 2 && (
              <button
                type="button"
                className="btn"
                onClick={() => act({ type: "show" })}
              >
                {tr("Show me")}
              </button>
            )}
            {done && !last && (
              <button type="button" className="btn primary" onClick={next}>
                {tr("Next step")}
              </button>
            )}
            {done && last && !st.finished && (
              <button
                type="button"
                className="btn primary"
                onClick={() => act({ type: "finish" })}
              >
                {tr("See the whole scene")}
              </button>
            )}
          </div>
        )}
        {st.finished && (
          <div className="recap">
            <p>
              <b>{tr("Scene rebuilt.")}</b> {a.completion}
            </p>
            <ol>
              {a.steps
                .filter((s) => s.why)
                .map((s) => (
                  <li key={s.id}>
                    {s.why}
                    {s.observed ? tr(" (seen in the diorama)") : ""}
                  </li>
                ))}
            </ol>
          </div>
        )}
      </div>

      <div className="stage">
        <StageArt stage={a.stage} winter={st.season === "winter"} />
        {st.placed.map((pl, i) => {
          const f = a.steps[pl.step].figure;
          const now = i === st.placed.length - 1 && !done && !st.finished;
          return (
            <div
              key={a.steps[pl.step].id}
              className={`placed ${people ? "" : "thing"} ${now ? "now" : ""}`}
              style={{ left: `${pl.x * 100}%`, top: `${pl.y * 100}%` }}
              role="img"
              aria-label={f?.label}
            >
              {f?.thing ? (
                <ThingArt thing={f.thing} />
              ) : (
                <Person pose={pl.pose} colour={f?.colour} hat={f?.hat} />
              )}
            </div>
          );
        })}
        {st.phase === "place" &&
          step.options.map((o, k) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: rings are positional
              key={k}
              type="button"
              data-ring={k}
              className={`ring ${people ? "" : "thing"} ${st.wrong === k ? "bad" : ""} ${over === k ? "over" : ""}`}
              style={{ left: `${o.x * 100}%`, top: `${o.y * 100}%` }}
              aria-label={tr("Put {label} at ring {n}", {
                label: fig?.label ?? tr("it"),
                n: k + 1,
              })}
              onClick={() => act({ type: "ring", index: k })}
            >
              <span className="q">{k + 1}</span>
            </button>
          ))}
      </div>

      {people && (
        <div className="sheet">
          <div className="sheet-head">
            <b>{tr("Pose sheet")}</b>
            <span>
              {st.phase === "pose"
                ? tr("{label}: what does this person do here? (keys 1–{n})", {
                    label: fig?.label ?? "",
                    n: step.poses.length,
                  })
                : st.phase === "place"
                  ? tr("First put {label} in place.", {
                      label: fig?.label ?? "",
                    })
                  : tr("Pick a pose after placing.")}
            </span>
          </div>
          <div className="frames">
            {(step.poses.length
              ? step.poses
              : (["stand", "watch", "carry", "saw"] as PlacePose[])
            ).map((pose, k) => (
              <button
                key={pose}
                type="button"
                className={`frame ${st.phase === "pose" && st.wrong === pose ? "bad" : ""} ${done && step.pose === pose ? "good" : ""}`}
                disabled={st.phase !== "pose"}
                onClick={() => act({ type: "pose", pose })}
              >
                <em>{k + 1}</em>
                <Person
                  pose={pose}
                  colour={fig?.colour ?? "#7d8a96"}
                  hat={fig?.hat}
                />
                {tr(POSES[pose].label)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="source">
        <Cite claim={stepClaim} onReveal={() => reveal(step.claimIds[0])} />
        {SHOW_DISCLAIMERS && (
          <p className="muted small">
            {tr(
              "Device voice · placeholder. Figures and scenes are illustrative sketches after museum dioramas.",
            )}
          </p>
        )}
      </div>

      <div className="ghost" ref={ghostRef} aria-hidden="true">
        {fig && figureArt("stand")}
      </div>
    </div>
  );
}
