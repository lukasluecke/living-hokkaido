"use client";
// Thin adapter for the vendored teammate games (vendor/*, see
// vendor/README.md). The activity panel shows the prompt, the cited claims
// and a Play button. Play opens a full-screen stage (a portal on
// document.body, so the side panel's size and transforms do not apply) and
// mounts the game there once per activity. Esc or "Close game" closes the
// stage only; the panel's × still closes the activity.
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import type { Emit, ResolvedClaim } from "@/contracts";
import { useT } from "@/i18n";
import { ui } from "@/design/tokens";
import { Cite } from "../kinds/shared";
import p from "../play/play.module.css";
import g from "./games.module.css";

const stageVars = {
  "--lh-paper": ui.paper,
  "--lh-ink": ui.ink,
  "--lh-gold": ui.gold,
} as CSSProperties;

/** What a vendored game's mount function returns. */
export type GameHandle = { ready: Promise<void>; destroy(): void };

/**
 * Mounts the game into `host`. Called once per stage open. `emit` is stable
 * for the whole mount and always forwards to the latest host emit.
 */
export type MountGame = (host: HTMLElement, emit: Emit) => GameHandle;

/**
 * Wraps a game that loads on demand (a dynamic `import()`), so its code
 * (Phaser, Rapier, three) is not part of the first page load. The handle
 * is ready when the code has loaded and the game is ready. Destroy before
 * the load ends destroys the game as soon as it arrives.
 */
/** A phone held upright: a landscape game's stage turns a quarter turn. */
const TURN_QUERY = "(orientation: portrait) and (max-width: 600px)";

export function deferMount(load: Promise<GameHandle>): GameHandle {
  let handle: GameHandle | null = null;
  let dead = false;
  const ready = load.then((h) => {
    if (dead) {
      h.destroy();
      return;
    }
    handle = h;
    return h.ready;
  });
  return {
    ready,
    destroy() {
      dead = true;
      handle?.destroy();
    },
  };
}

export function GameStage({
  activityId,
  knowledgeId,
  title,
  prompt,
  claimIds,
  claims,
  labels,
  completion,
  done,
  emit,
  mount,
  fit,
  controls,
  notes,
  preload,
  landscape = false,
}: {
  activityId: string;
  knowledgeId: string;
  title: string;
  prompt: string;
  claimIds: string[];
  claims: Record<string, ResolvedClaim>;
  /** Honesty labels shown on the panel and on the stage bar. */
  labels: string[];
  completion: string;
  /** True once the game has emitted activity.complete. */
  done: boolean;
  emit: Emit;
  mount: MountGame;
  /** "wide": a 16:9 game, letterboxed. "fill": the whole stage. */
  fit: "wide" | "fill";
  /** Short keyboard help, shown under the prompt. */
  controls: ReactNode;
  /** Optional extra panel content under the Play button (progress). */
  notes?: ReactNode;
  /** Fetch the game's code (engine, physics) while the panel is open, so
   *  Play starts quickly. Called once, in idle time. */
  preload?: () => Promise<unknown>;
  /** A landscape game: on a phone held upright, the stage turns a quarter
   *  turn to fill the screen (data-rotate="90"; the game maps the pointer). */
  landscape?: boolean;
}) {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turned, setTurned] = useState(false);
  useEffect(() => {
    if (!landscape || !open) return;
    const mq = window.matchMedia(TURN_QUERY);
    const sync = () => setTurned(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [landscape, open]);
  const [loading, setLoading] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const play = useRef<HTMLButtonElement>(null);
  // The shell rebuilds `claims` and may rebuild `emit` on every render
  // (season clock). Keep the latest in refs; mount only on open.
  const emitRef = useRef(emit);
  emitRef.current = emit;
  const mountRef = useRef(mount);
  mountRef.current = mount;
  const preloadRef = useRef(preload);
  preloadRef.current = preload;

  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    const run = () => {
      preloadRef.current?.().catch(() => {});
    };
    const t = setTimeout(() => {
      if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 2000 });
      else run();
    }, 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open || !host.current) return;
    setError(null);
    setLoading(true);
    let handle: GameHandle | null = null;
    let live = true;
    try {
      handle = mountRef.current(host.current, (e) => emitRef.current(e));
      handle.ready
        .catch((err: unknown) => {
          if (live) setError(err instanceof Error ? err.message : String(err));
        })
        .finally(() => {
          if (live) setLoading(false);
        });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
    return () => {
      live = false;
      handle?.destroy();
    };
  }, [open]);

  // Esc closes the stage, not the whole activity: catch it on the way
  // down (window, capture phase), before the shell's window listener and
  // before the game (which leaves Esc to the host).
  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      ev.stopPropagation();
      ev.preventDefault();
      setOpen(false);
      requestAnimationFrame(() => play.current?.focus());
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => play.current?.focus());
  };
  const reveal = (claimId: string) =>
    emit({ type: "reveal.open", knowledgeId, claimId });

  return (
    <div className={p.root}>
      <p>{prompt}</p>
      <p className="small-note">{controls}</p>
      <div className={g.labels}>
        {labels.map((l) => (
          <span key={l} className={g.label}>
            {tr(l)}
          </span>
        ))}
      </div>
      <div className="row">
        <button
          ref={play}
          type="button"
          className="btn primary"
          onClick={() => {
            // Turn before the game mounts, so it measures the turned stage.
            setTurned(landscape && window.matchMedia(TURN_QUERY).matches);
            setOpen(true);
          }}
        >
          {done ? tr("Play again") : tr("Play")}
        </button>
      </div>
      {done && <p className="feedback">{completion}</p>}
      {notes}
      <details className={g.facts}>
        <summary>
          {tr("What the game is based on ({n})", { n: claimIds.length })}
        </summary>
        <ul>
          {claimIds.map((id) => {
            const c = claims[id];
            if (!c) return null;
            return (
              <li key={id}>
                <p>{c.claim.text}</p>
                <Cite claim={c} onReveal={() => reveal(id)} />
              </li>
            );
          })}
        </ul>
      </details>
      {open &&
        createPortal(
          <div
            className={`${g.stage} ${turned ? g.turned : ""}`}
            style={stageVars}
            data-rotate={turned ? "90" : undefined}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className={g.bar}>
              <strong className={g.barTitle}>{title}</strong>
              {labels.map((l) => (
                <span key={l} className={g.barLabel}>
                  {tr(l)}
                </span>
              ))}
              <button type="button" className={g.closeGame} onClick={close}>
                {tr("Close game")} <kbd>Esc</kbd>
              </button>
            </div>
            <div className={g.area}>
              <div
                ref={host}
                className={`${g.host} ${fit === "wide" ? g.wide : ""}`}
                data-activity={activityId}
              />
              {loading && !error && (
                <p className={g.loading} role="status">
                  {tr("Loading the game…")}
                </p>
              )}
              {error && (
                <p className={g.error} role="alert">
                  The game could not start: {error}
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
