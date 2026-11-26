// Props for one proposed activity kind. Same shape as ActivityPartProps
// (src/contracts/parts.ts), narrowed to one kind.
import type {
  ActivityKind,
  ActivityOf,
  Emit,
  Prefs,
  ResolvedClaim,
  VoiceIndex,
} from "@/contracts";
import { voiceIndexSchema } from "@/contracts";
import { useEffect, useMemo, useState } from "react";

export type KindProps<K extends ActivityKind> = {
  activity: ActivityOf<K>;
  claims: Record<string, ResolvedClaim>;
  prefs: Prefs;
  emit: Emit;
  /** Ids found in this activity before (from the journal). */
  found?: string[];
};

export const complete = (emit: Emit, activityId: string, score?: number) =>
  emit({
    type: "activity.complete",
    result: {
      activityId,
      completed: true,
      score,
      at: new Date().toISOString(),
    },
  });

/** Small citation chip: claim → first source + locator. */
export function Cite({
  claim,
  onReveal,
}: {
  claim: ResolvedClaim | undefined;
  onReveal: () => void;
}) {
  if (!claim) return null;
  const c = claim.claim.citations[0];
  const src = claim.sources.find((s) => s.id === c?.sourceId);
  return (
    <button type="button" className="cite" onClick={onReveal}>
      <span aria-hidden="true">❦</span> {src?.title ?? c?.sourceId}
      {c ? ` · ${c.locator}` : ""}
    </button>
  );
}

/** The browser speech engine, as a clearly labelled placeholder. */
export const deviceVoice = {
  available: () =>
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    window.speechSynthesis.getVoices().length > 0,
  speak(
    text: string,
    on: { word?: (charIndex: number) => void; end?: () => void } = {},
  ) {
    if (!("speechSynthesis" in window)) return on.end?.();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // Read in the page language (the shell sets <html lang>).
    u.lang = document.documentElement.lang === "ja" ? "ja-JP" : "en";
    u.rate = 0.95;
    u.onboundary = (e) => {
      if (e.name === "word") on.word?.(e.charIndex);
    };
    u.onend = () => on.end?.();
    u.onerror = () => on.end?.();
    window.speechSynthesis.speak(u);
  },
  stop() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  },
};

const voiceIndexes = new Map<string, Promise<VoiceIndex | null>>();

/**
 * Pre-generated AI voice lines of one group (scripts/audio/voices.ts).
 * Null while loading, when the files are missing, or when the page is not
 * in English (the voices are English only).
 */
export function useAiVoice(group: string | undefined) {
  const [index, setIndex] = useState<VoiceIndex | null>(null);
  useEffect(() => {
    if (!group || document.documentElement.lang === "ja") return;
    let live = true;
    let p = voiceIndexes.get(group);
    if (!p) {
      p = fetch(`/audio/voice/${group}/index.json`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => voiceIndexSchema.safeParse(j).data ?? null)
        .catch(() => null);
      voiceIndexes.set(group, p);
    }
    p.then((i) => live && setIndex(i));
    return () => {
      live = false;
    };
  }, [group]);
  return useMemo(
    () =>
      group && index
        ? {
            index,
            url: (lineId: string) => `/audio/voice/${group}/${lineId}.mp3`,
          }
        : null,
    [group, index],
  );
}
