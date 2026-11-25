"use client";
// Map kind: words on a stylised figure. "explore" opens each spot (one
// greeting, many places); "match" puts each word on its spot (parts of a
// house plan). Spots are real buttons, so it works by keyboard.
import { useEffect, useRef, useState } from "react";
import type { MapSpot } from "@/contracts";
import { Cite, complete, type KindProps } from "../kinds/shared";
import { FIGURE_BOX, FigureArt } from "./Figures";
import { mapFinished, mapScore, startMap, stepMap } from "./mapLogic";
import p from "./play.module.css";

export function MapActivity({ activity: a, claims, emit }: KindProps<"map">) {
  const [s, setS] = useState(startMap);
  const [shown, setShown] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const sent = useRef(false);
  const finished = mapFinished(s, a.spots.length);
  const [w, h] = FIGURE_BOX[a.figure];
  const spot = (id: string | null) => a.spots.find((x) => x.id === id);
  const reveal = (claimId: string) =>
    emit({ type: "reveal.open", knowledgeId: a.knowledgeId, claimId });

  useEffect(() => {
    if (!finished || sent.current) return;
    sent.current = true;
    complete(emit, a.id, mapScore(s, a.spots.length));
  }, [finished, emit, a.id, a.spots.length, s]);

  const onSpot = (x: MapSpot) => {
    if (a.mode === "explore") {
      setS(stepMap(s, "explore", { type: "open", spotId: x.id }));
      setShown(x.id);
      return;
    }
    if (s.done.includes(x.id)) return setShown(x.id);
    if (!s.held) return setNote("First pick a word below.");
    const next = stepMap(s, "match", { type: "place", spotId: x.id });
    setNote(
      next.misses > s.misses
        ? "Not there. Look at the plan again."
        : `${x.romanised ?? x.text}: ${x.gloss}.`,
    );
    if (next.done.length > s.done.length) setShown(x.id);
    setS(next);
  };

  const current = spot(shown);
  const left = a.spots.filter((x) => !s.done.includes(x.id));

  return (
    <div className={p.root}>
      <p>{a.prompt}</p>
      <div
        className="figure"
        style={{
          aspectRatio: `${w} / ${h}`,
          width: `min(100%, ${Math.round((380 * w) / h)}px)`,
        }}
      >
        <FigureArt figure={a.figure} />
        {a.spots.map((x, i) => {
          const done = s.done.includes(x.id);
          return (
            <button
              key={x.id}
              type="button"
              className={`spot ${done ? "done" : ""} ${shown === x.id ? "on" : ""}`}
              style={{ left: `${x.x * 100}%`, top: `${x.y * 100}%` }}
              aria-label={
                done
                  ? `${x.romanised ?? x.text}, ${x.gloss}`
                  : a.mode === "match"
                    ? `Spot ${i + 1}`
                    : `Place ${i + 1}${x.region ? `: ${x.region}` : ""}`
              }
              onClick={() => onSpot(x)}
            >
              {done && (shown === x.id || a.mode === "match") ? (
                <span className="spot-word">{x.romanised ?? x.text}</span>
              ) : (
                <span aria-hidden="true">{done ? "✓" : i + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      {a.mode === "explore" && s.done.length > 0 && (
        <ul className="legend" aria-label="Opened">
          {a.spots
            .filter((x) => s.done.includes(x.id))
            .map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  className={`chip ${shown === x.id ? "held" : ""}`}
                  onClick={() => setShown(x.id)}
                >
                  <span lang={x.lang}>{x.romanised ?? x.text}</span>
                  <small>{x.region}</small>
                </button>
              </li>
            ))}
        </ul>
      )}

      {a.mode === "match" && !finished && (
        <fieldset className="chips">
          <legend>Pick a word, then its place on the plan</legend>
          {left.map((x) => (
            <button
              key={x.id}
              type="button"
              className={`chip ${s.held === x.id ? "held" : ""}`}
              aria-pressed={s.held === x.id}
              onClick={() => {
                setS(stepMap(s, "match", { type: "hold", spotId: x.id }));
                setNote(s.held === x.id ? "" : `Where is “${x.gloss}”?`);
              }}
            >
              <span lang={x.lang}>{x.text}</span>
              {x.romanised && <small lang={x.lang}>{x.romanised}</small>}
              <small>{x.gloss}</small>
            </button>
          ))}
        </fieldset>
      )}

      {current && (
        <div className="word-card" aria-live="polite">
          <p className="word-big">
            <span lang={current.lang}>{current.text}</span>
            {current.romanised && (
              <span lang={current.lang} className="word-roman">
                {current.romanised}
              </span>
            )}
          </p>
          <p>
            {current.gloss}
            {current.region ? ` · ${current.region}` : ""}
          </p>
          <span className="draft">Draft · spelling not yet reviewed</span>
          <Cite
            claim={claims[current.claimId]}
            onReveal={() => reveal(current.claimId)}
          />
        </div>
      )}

      <p className="feedback" aria-live="polite">
        {finished
          ? a.completion
          : note ||
            (a.mode === "explore"
              ? `Open every place: ${s.done.length} of ${a.spots.length}.`
              : `${s.done.length} of ${a.spots.length} placed.`)}
      </p>
      {a.placeholder && (
        <p className="small-note">
          The figure and the places on it are sketches made for this demo.
        </p>
      )}
      {finished && (
        <div className="row">
          <button
            type="button"
            className="btn"
            onClick={() => {
              sent.current = true;
              setS(startMap());
              setShown(null);
              setNote("");
            }}
          >
            Start again
          </button>
        </div>
      )}
    </div>
  );
}
