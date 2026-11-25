"use client";
// First-load screen for the island. It is in the server HTML, so it shows
// before any script runs; then it follows the real steps: code loaded
// (hydrated), 3D assets (drei's loading manager), first island frame. It
// fades out on the first frame, or after a time limit, whichever is first.
// Visual only: pointer-events none, so the HTML place controls stay usable.
import { useProgress } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n";
import c from "./LoadScreen.module.css";

/** Hide the screen after this, even with no frame (very slow GPU, errors). */
const LIMIT_MS = 20_000;
/** Once per page: coming back to the island shows no load screen. */
let shownOnce = false;

export function LoadScreen({ drawn }: { drawn: boolean }) {
  const t = useT();
  const [hydrated, setHydrated] = useState(false);
  const [gone, setGone] = useState(() => shownOnce);
  const [timedOut, setTimedOut] = useState(false);
  const { progress, active } = useProgress();
  useEffect(() => {
    setHydrated(true);
    const t = setTimeout(() => setTimedOut(true), LIMIT_MS);
    return () => clearTimeout(t);
  }, []);
  const done = drawn || timedOut;
  if (done) shownOnce = true;
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setGone(true), 600);
    return () => clearTimeout(t);
  }, [done]);
  if (gone) return null;

  // 0–35 %: page code; 35–85 %: 3D assets; 85–100 %: first frame.
  const pct = !hydrated
    ? 15
    : done
      ? 100
      : 35 + Math.round((active || progress > 0 ? progress : 100) * 0.5);
  const step = t(
    !hydrated
      ? "Loading the page…"
      : done
        ? "Ready"
        : active
          ? "Loading the island’s models…"
          : "Building the island…",
  );
  return (
    <div className={c.screen} data-done={done || undefined} aria-hidden={done}>
      <div className={c.card}>
        <p className={c.title}>{t("Living Hokkaido")}</p>
        <div
          className={c.bar}
          role="progressbar"
          aria-label={t("Loading the island")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          data-js={hydrated || undefined}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className={c.step} role="status">
          {step}
        </p>
      </div>
    </div>
  );
}

/** Inside the canvas, after the world: calls back on the second frame. */
export function FirstFrame({ onDrawn }: { onDrawn: () => void }) {
  const n = useRef(0);
  useFrame(() => {
    n.current++;
    if (n.current === 2) onDrawn();
  });
  return null;
}
