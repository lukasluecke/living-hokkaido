"use client";
// Board kind: the stick game on a 田 grid (rules in boardLogic.ts). Pick one
// of your sticks, then a free point next to it. Every point is a button, so
// the game works by keyboard; arrow keys move the focus between points.
import { useEffect, useRef, useState } from "react";
import { Cite, complete, type KindProps } from "../kinds/shared";
import {
  type Game,
  neighbours,
  owlMove,
  play,
  SIZE,
  type Side,
  startGame,
} from "./boardLogic";
import p from "./play.module.css";

const PAD = 14;
const STEP = 36;
const VIEW = PAD * 2 + STEP * (SIZE - 1);
const pos = (i: number) => ({
  x: PAD + (i % SIZE) * STEP,
  y: PAD + Math.floor(i / SIZE) * STEP,
});
const pct = (v: number) => `${(v / VIEW) * 100}%`;

export function BoardActivity({
  activity: a,
  claims,
  prefs,
  emit,
}: KindProps<"board">) {
  const vsOwl = a.opponent === "owl";
  const [g, setG] = useState<Game>(startGame);
  const [held, setHeld] = useState<number | null>(null);
  const [games, setGames] = useState({ you: 0, owl: 0 });
  const sent = useRef(false);
  const points = useRef<(HTMLButtonElement | null)[]>([]);
  const name = (s: Side) =>
    s === "you" ? (vsOwl ? "You" : "Player 1") : vsOwl ? "The owl" : "Player 2";
  const owner = (s: Side) =>
    s === "you" && vsOwl ? "your stick" : `${name(s)}’s stick`;
  const reveal = (claimId: string) =>
    emit({ type: "reveal.open", knowledgeId: a.knowledgeId, claimId });

  // The owl's turn.
  useEffect(() => {
    if (!vsOwl || g.winner || g.turn !== "owl") return;
    const t = setTimeout(
      () => {
        const m = owlMove(g.board);
        if (m) setG((cur) => play(cur, m));
      },
      prefs.reducedMotion ? 150 : 650,
    );
    return () => clearTimeout(t);
  }, [g, vsOwl, prefs.reducedMotion]);

  // A finished game completes the activity (once).
  useEffect(() => {
    if (!g.winner) return;
    setGames((x) => ({ ...x, [g.winner as Side]: x[g.winner as Side] + 1 }));
    if (sent.current) return;
    sent.current = true;
    complete(emit, a.id, g.winner === "you" || !vsOwl ? 1 : 0.5);
  }, [g.winner, emit, a.id, vsOwl]);

  const mine = (i: number) =>
    g.board[i] === g.turn && (!vsOwl || g.turn === "you");
  const targets =
    held === null ? [] : neighbours(held).filter((i) => g.board[i] === null);

  const onPoint = (i: number) => {
    if (g.winner) return;
    if (mine(i)) return setHeld(held === i ? null : i);
    if (held !== null && targets.includes(i)) {
      setG(play(g, { from: held, to: i }));
      setHeld(null);
    }
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    const to: Record<string, number | null> = {
      ArrowUp: r > 0 ? i - SIZE : null,
      ArrowDown: r < SIZE - 1 ? i + SIZE : null,
      ArrowLeft: c > 0 ? i - 1 : null,
      ArrowRight: c < SIZE - 1 ? i + 1 : null,
    };
    if (!(e.key in to)) return;
    e.preventDefault();
    const n = to[e.key];
    if (n !== null) points.current[n]?.focus();
  };

  const status = g.winner
    ? `${name(g.winner)} ${g.winner === "you" && vsOwl ? "win" : "wins"}!`
    : g.turn === "owl" && vsOwl
      ? "The owl is thinking…"
      : held === null
        ? `${name(g.turn)}: pick one of your sticks.`
        : "Now pick a free point next to it.";

  return (
    <div className={p.root}>
      <p>{a.prompt}</p>
      <div className="board-wrap">
        <div className="board">
          <svg viewBox={`0 0 ${VIEW} ${VIEW}`} aria-hidden="true">
            <rect
              x={PAD}
              y={PAD}
              width={STEP * 2}
              height={STEP * 2}
              className="grid-line"
            />
            <line
              x1={PAD + STEP}
              y1={PAD}
              x2={PAD + STEP}
              y2={PAD + STEP * 2}
              className="grid-line"
            />
            <line
              x1={PAD}
              y1={PAD + STEP}
              x2={PAD + STEP * 2}
              y2={PAD + STEP}
              className="grid-line"
            />
            {g.board.map((v, i) => {
              if (!v) return null;
              const { x, y } = pos(i);
              return (
                <g
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed points
                  key={i}
                  className={`stick ${v} ${held === i ? "held" : ""}`}
                >
                  <rect x={x - 2.2} y={y - 11} width={4.4} height={22} rx={2} />
                </g>
              );
            })}
          </svg>
          {g.board.map((v, i) => {
            const { x, y } = pos(i);
            const r = Math.floor(i / SIZE) + 1;
            const c = (i % SIZE) + 1;
            const target = targets.includes(i);
            return (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed points
                key={i}
                ref={(el) => {
                  points.current[i] = el;
                }}
                type="button"
                className={`point ${target ? "target" : ""} ${held === i ? "held" : ""}`}
                style={{ left: pct(x), top: pct(y) }}
                aria-label={`Row ${r}, column ${c}: ${
                  v ? owner(v) : "free"
                }${target ? ", you can move here" : ""}`}
                aria-pressed={held === i}
                onClick={() => onPoint(i)}
                onKeyDown={(e) => onKey(e, i)}
              />
            );
          })}
        </div>
        <ul className="board-key">
          <li>
            <span className="swatch you" /> {name("you")}: start at the bottom,
            reach the top
          </li>
          <li>
            <span className="swatch owl" /> {name("owl")}: start at the top,
            reach the bottom
          </li>
          <li className="small-note">
            Games: {name("you")} {games.you} · {name("owl")} {games.owl}
          </li>
        </ul>
      </div>
      <p className="feedback" aria-live="polite">
        {status}
      </p>
      {g.winner && <p>{a.completion}</p>}
      <Cite
        claim={claims[a.rulesClaimId]}
        onReveal={() => reveal(a.rulesClaimId)}
      />
      <div className="row">
        <button
          type="button"
          className={`btn ${g.winner ? "primary" : ""}`}
          onClick={() => {
            setG(startGame());
            setHeld(null);
          }}
        >
          {g.winner ? "Play again" : "Start again"}
        </button>
      </div>
    </div>
  );
}
