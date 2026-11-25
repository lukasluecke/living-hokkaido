// Props for one proposed activity kind. Same shape as ActivityPartProps
// (src/contracts/parts.ts), narrowed to one kind.
import type {
  ActivityKind,
  ActivityOf,
  Emit,
  Prefs,
  ResolvedClaim,
} from "@/contracts";

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
    u.lang = "en";
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
