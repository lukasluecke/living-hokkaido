"use client";
// splat-look kind: look closer at a captured museum diorama (a Gaussian
// splat). The panel shows the prompt and the cited claims; "Look closer"
// opens a full-screen stage (portal on <body>, Esc closes the stage only).
// The stage asks the server first: with the demo password cookie the splat
// loads (Spark, see splatViewer.ts); without it, a password form; without a
// capture or WebGL2, the same spots as a list, so every claim stays
// readable. No score: the scene shows a colonial power ceremony.
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ui } from "@/design/tokens";
import g from "../games/games.module.css";
import { Cite, type KindProps } from "../kinds/shared";
import p from "../play/play.module.css";
import c from "./captures.module.css";
import {
  type AssetPhase,
  goalClaims,
  initialLook,
  isComplete,
  type LookState,
  openSpot,
  phaseForStatus,
} from "./splatLogic";
import type { SplatViewer } from "./splatViewer";
import { SHOW_DISCLAIMERS } from "@/design/disclaimers";

const stageVars = {
  "--lh-paper": ui.paper,
  "--lh-ink": ui.ink,
  "--lh-gold": ui.gold,
} as CSSProperties;

type Phase = "checking" | AssetPhase | "loading" | "shown" | "no-webgl";

const STATUS: Partial<Record<Phase, string>> = {
  checking: "Checking access to the capture…",
  missing:
    "Splat not available: the capture is not on this server yet. You can still open every spot in the list.",
  off: "Splat not available on this server. You can still open every spot in the list.",
  "no-webgl":
    "This device cannot show the 3D capture. You can still open every spot in the list.",
};

export function SplatLookActivity({
  activity: a,
  claims,
  prefs,
  emit,
}: KindProps<"splat-look">) {
  const [open, setOpen] = useState(false);
  const [look, setLook] = useState<LookState>(initialLook);
  const [current, setCurrent] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const known = (id: string) => !!claims[id];
  const goal = goalClaims(a, known);
  const readCount = goal.filter((id) => look.read.includes(id)).length;

  const reveal = (claimId: string) =>
    emit({ type: "reveal.open", knowledgeId: a.knowledgeId, claimId });

  const pick = (spotId: string) => {
    setCurrent(spotId);
    setLook((st) => openSpot(a, st, spotId));
  };

  // Complete once, when every spot claim was read.
  useEffect(() => {
    if (done || !isComplete(a, look, known)) return;
    setDone(true);
    emit({
      type: "activity.complete",
      result: {
        activityId: a.id,
        completed: true,
        at: new Date().toISOString(),
        found: look.opened,
      },
    });
  });

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => button.current?.focus());
  };

  const labels = [a.asset.label, ...(a.asset.gated ? ["Demo password"] : [])];

  return (
    <div className={p.root}>
      <p>{a.prompt}</p>
      <p className="small-note">
        Drag to turn, scroll or pinch to zoom, right-drag or two fingers to
        move. Every spot is also in the list next to the capture.
      </p>
      <div className={g.labels}>
        {labels.map((l) => (
          <span key={l} className={g.label}>
            {l}
          </span>
        ))}
      </div>
      <div className="row">
        <button
          ref={button}
          type="button"
          className="btn primary"
          onClick={() => setOpen(true)}
        >
          {done ? "Look again" : "Look closer"}
        </button>
      </div>
      <p className="small-note">
        Read {readCount} of {goal.length} panel notes.
      </p>
      {done && <p className="feedback">{a.completion}</p>}
      <details className={g.facts}>
        <summary>What the panel notes say ({a.claimIds.length})</summary>
        <ul>
          {a.claimIds.map((id) => {
            const cl = claims[id];
            if (!cl) return null;
            return (
              <li key={id}>
                <p>{cl.claim.text}</p>
                <Cite claim={cl} onReveal={() => reveal(id)} />
              </li>
            );
          })}
        </ul>
      </details>
      {open &&
        createPortal(
          <Stage
            activity={a}
            claims={claims}
            prefs={prefs}
            labels={labels}
            current={current}
            look={look}
            onPick={pick}
            onReveal={reveal}
            onClose={close}
          />,
          document.body,
        )}
    </div>
  );
}

function Stage({
  activity: a,
  claims,
  prefs,
  labels,
  current,
  look,
  onPick,
  onReveal,
  onClose,
}: Pick<KindProps<"splat-look">, "activity" | "claims" | "prefs"> & {
  labels: string[];
  current: string | null;
  look: LookState;
  onPick: (id: string) => void;
  onReveal: (claimId: string) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [progress, setProgress] = useState<string>("");
  const [attempt, setAttempt] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<SplatViewer | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const url = `/api/museum-assets/${a.asset.key}`;

  // Esc closes the stage, not the activity (same as GameStage).
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      ev.stopPropagation();
      ev.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  // Ask the server, then mount the viewer. Re-runs after an unlock.
  useEffect(() => {
    let live = true;
    let v: SplatViewer | null = null;
    (async () => {
      setPhase("checking");
      const status = await fetch(url, { method: "HEAD" })
        .then((r) => r.status)
        .catch(() => 0);
      if (!live) return;
      const next = phaseForStatus(status);
      if (next !== "ready") return setPhase(next);
      const mod = await import("./splatViewer");
      if (!live) return;
      if (!prefs.webgl || !mod.canRenderSplats() || !host.current)
        return setPhase("no-webgl");
      setPhase("loading");
      try {
        v = await mod.mountSplatViewer(host.current, {
          url,
          flip: a.asset.flip,
          view: a.view,
          spots: a.spots,
          reducedMotion: prefs.reducedMotion,
          onPick: (id) => pickRef.current(id),
          onProgress: (l, t) =>
            setProgress(
              `${(l / 1048576).toFixed(1)} / ${(t / 1048576).toFixed(1)} MB`,
            ),
        });
        if (!live) return v.destroy();
        viewer.current = v;
        await v.ready;
        if (live) setPhase("shown");
      } catch {
        // Not a readable splat: drop the canvas and markers, keep the list.
        v?.destroy();
        viewer.current = null;
        if (live) setPhase("missing");
      }
    })();
    return () => {
      live = false;
      v?.destroy();
      viewer.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    viewer.current?.select(current);
  }, [current]);

  const choose = (id: string) => {
    onPick(id);
    viewer.current?.focus(id);
  };

  const groups = [
    { id: "figure", title: "Figures" },
    { id: "scene", title: "The scene" },
  ] as const;
  const spot = a.spots.find((s) => s.id === current);

  return (
    <div
      className={g.stage}
      style={stageVars}
      role="dialog"
      aria-modal="true"
      aria-label={a.title}
    >
      <div className={g.bar}>
        <strong className={g.barTitle}>{a.title}</strong>
        {labels.map((l) => (
          <span key={l} className={g.barLabel}>
            {l}
          </span>
        ))}
        {SHOW_DISCLAIMERS && <span className={g.barLabel}>Draft</span>}
        <button type="button" className={g.closeGame} onClick={onClose}>
          Close <kbd>Esc</kbd>
        </button>
      </div>
      <div className={c.body}>
        <div className={c.view}>
          <div ref={host} className={g.host} />
          {phase === "locked" && (
            <Unlock onDone={() => setAttempt((n) => n + 1)} />
          )}
          {phase === "loading" && (
            <p className={c.status} role="status">
              Loading the capture… {progress}
            </p>
          )}
          {STATUS[phase] && (
            <p className={c.status} role="status">
              {STATUS[phase]}
            </p>
          )}
        </div>
        <aside className={c.side} aria-label="Spots in the diorama">
          {spot && (
            <div className={c.card} aria-live="polite">
              <strong>{spot.label}</strong>
              {spot.claimIds.length === 0 && (
                <p className={c.gap}>Not described yet.</p>
              )}
              {spot.claimIds.map((id) => {
                const cl = claims[id];
                if (!cl) return null;
                return (
                  <div key={id}>
                    <p>{cl.claim.text}</p>
                    <Cite claim={cl} onReveal={() => onReveal(id)} />
                  </div>
                );
              })}
            </div>
          )}
          {groups.map((gr) => (
            <section key={gr.id}>
              <h3>{gr.title}</h3>
              <ul className={c.spots}>
                {a.spots
                  .filter((s) => s.group === gr.id)
                  .map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={`${c.spot} ${look.opened.includes(s.id) && s.id !== current ? c.seen : ""}`}
                        aria-pressed={s.id === current}
                        onClick={() => choose(s.id)}
                      >
                        {look.opened.includes(s.id) ? "✓ " : ""}
                        {s.label}
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </aside>
      </div>
    </div>
  );
}

function Unlock({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch("/api/museum-assets/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    setBusy(false);
    if (r?.ok) return onDone();
    setError(r?.status === 401 ? "Wrong password." : "Could not check now.");
  };
  return (
    <div className={c.unlock}>
      <form onSubmit={submit}>
        <strong>Demo password</strong>
        <span>
          This capture of a museum diorama is only for the demo team until the
          museum agrees to more. The spots in the list work without it.
        </span>
        <input
          type="password"
          aria-label="Demo password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={busy || !password}>
          Show the capture
        </button>
        {error && <span role="alert">{error}</span>}
      </form>
    </div>
  );
}
