"use client";
// React glue for the shell: one engine per page, fed by ExperienceState.
//
//   const sound = useSoundscape(state);   // in the shell
//   sound.onEvent(e);                     // inside the shell's emit
//   <SoundToggle sound={sound} />         // in the HUD
import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { ExperienceEvent, ExperienceState } from "@/contracts";
import { SoundEngine } from "./engine";
import { soundManifest } from "./manifest";
import { soundManifestSchema } from "./types";

let engine: SoundEngine | null = null;

/** The page's sound engine (client only). */
export function getSoundEngine(): SoundEngine | null {
  if (typeof window === "undefined") return null;
  if (!engine) {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {}
    engine = new SoundEngine(soundManifestSchema.parse(soundManifest), storage);
  }
  return engine;
}

export type Soundscape = {
  onEvent: (e: ExperienceEvent) => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
};

export function useSoundscape(
  state: Pick<ExperienceState, "view" | "overlay" | "season" | "sceneId">,
): Soundscape {
  useEffect(() => getSoundEngine()?.attach(), []);

  const { view, overlay, sceneId } = state;
  const season = state.season.value;
  useEffect(() => {
    getSoundEngine()?.setScene({ view, overlay, season, sceneId });
  }, [view, overlay, season, sceneId]);

  const muted = useSyncExternalStore(
    (fn) => getSoundEngine()?.subscribe(fn) ?? (() => {}),
    () => getSoundEngine()?.muted ?? false,
    () => false,
  );
  const onEvent = useCallback((e: ExperienceEvent) => {
    getSoundEngine()?.onEvent(e);
  }, []);
  const setMuted = useCallback((m: boolean) => {
    const e = getSoundEngine();
    e?.unlock();
    e?.setMuted(m);
  }, []);
  return { onEvent, muted, setMuted };
}

export function SoundToggle({
  sound,
  className,
  children,
}: {
  sound: Soundscape;
  className?: string;
  /** Custom content (for example an icon); the label stays accessible. */
  children?: (muted: boolean) => React.ReactNode;
}) {
  const label = sound.muted ? "Sound off" : "Sound on";
  return (
    <button
      type="button"
      className={className}
      aria-pressed={!sound.muted}
      aria-label={children ? label : undefined}
      title={children ? label : undefined}
      data-sound="off"
      onClick={() => sound.setMuted(!sound.muted)}
    >
      {children ? children(sound.muted) : label}
    </button>
  );
}
