"use client";
// React glue for the quality step-down (./quality.ts). A part reads the tier
// with useQuality() and passes `dpr` to its <Canvas>; <QualityGovernor />
// inside the canvas measures the frame rate and steps the tier down.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  createMonitor,
  FULL,
  parseTier,
  type QualitySettings,
  settingsFor,
  type Tier,
} from "./quality";

const STORAGE_KEY = "lh-quality-v1";
let tier: Tier = FULL;
/** True when the URL fixes the tier (?quality=…): no automatic steps. */
let pinned = false;
let started = false;
const listeners = new Set<() => void>();

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const fromUrl = parseTier(
    new URLSearchParams(window.location.search).get("quality"),
  );
  if (fromUrl !== null) {
    tier = fromUrl;
    pinned = true;
    return;
  }
  try {
    const saved = parseTier(sessionStorage.getItem(STORAGE_KEY));
    if (saved !== null) tier = saved;
  } catch {}
}

const NAMES = ["low", "mid", "high", "full"] as const;

function setTier(next: Tier) {
  if (next === tier) return;
  tier = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, NAMES[next]);
  } catch {}
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  start();
  listeners.add(l);
  return () => listeners.delete(l);
}

/** The current tier and what it keeps. Full on the server. */
export function useQuality(maxDpr: number): QualitySettings & { tier: Tier } {
  const t = useSyncExternalStore(
    subscribe,
    () => tier,
    () => FULL,
  );
  return useMemo(() => ({ tier: t, ...settingsFor(t, maxDpr) }), [t, maxDpr]);
}

/**
 * Put one inside each <Canvas>. Steps the shared tier down when this canvas
 * stays slow, and turns shadow maps off when the tier drops them.
 */
export function QualityGovernor() {
  const { tier: t, shadows } = useQuality(1);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const monitor = useMemo(() => createMonitor(), []);
  useEffect(() => monitor.reset(), [monitor, t]);
  useEffect(() => {
    if (shadows || !gl.shadowMap.enabled) return;
    gl.shadowMap.enabled = false;
    // Materials compiled with shadows need a new program.
    scene.traverse((o) => {
      const m = (o as { material?: unknown }).material;
      for (const x of Array.isArray(m) ? m : m ? [m] : [])
        (x as { needsUpdate: boolean }).needsUpdate = true;
    });
  }, [shadows, gl, scene]);
  useFrame((_, delta) => {
    if (pinned || tier === 0) return;
    if (document.hidden) return monitor.reset();
    if (monitor.frame(delta * 1000)) setTier((tier - 1) as Tier);
  });
  return null;
}
