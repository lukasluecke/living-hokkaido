"use client";
// Minimal host for the over-time part: detects prefs, resolves claims,
// logs events. It holds no journal; the real host is src/shell (see
// src/parts/over-time/AGENTS.md § Shell integration).
import { useEffect, useMemo, useState } from "react";
import {
  type ContentPack,
  DEFAULT_SEASON,
  type ExperienceEvent,
  type Prefs,
  type ResolvedClaim,
  resolveClaim,
} from "@/contracts";
import { TimelinePart } from "@/parts/over-time";

function detectPrefs(): Prefs {
  let webgl = false;
  try {
    webgl = !!document.createElement("canvas").getContext("webgl2");
  } catch {}
  const q = new URLSearchParams(window.location.search);
  return {
    reducedMotion:
      q.get("motion") === "reduce" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    webgl: webgl && q.get("webgl") !== "off",
  };
}

export function OverTimeDemo({ pack }: { pack: ContentPack }) {
  const timeline = pack.timelines[0];
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [era, setEra] = useState(0);
  const [seasonValue, setSeasonValue] = useState(1);
  useEffect(() => {
    setPrefs(detectPrefs());
    const q = new URLSearchParams(window.location.search);
    const e = Number(q.get("era"));
    if (Number.isFinite(e)) setEra(e);
    const s = Number(q.get("season"));
    if (q.has("season") && Number.isFinite(s)) setSeasonValue(s);
  }, []);
  const claims = useMemo(() => {
    const out: Record<string, ResolvedClaim> = {};
    if (!timeline) return out;
    const ids = [
      ...timeline.claimIds,
      ...timeline.eras.flatMap((e) => e.claimIds),
    ];
    for (const id of ids) {
      const c = resolveClaim(pack, timeline.knowledgeId, id);
      if (c) out[id] = c;
    }
    return out;
  }, [pack, timeline]);
  const emit = useMemo(
    () => (e: ExperienceEvent) => {
      console.info("[over-time]", e);
      window.dispatchEvent(new CustomEvent("lh:event", { detail: e }));
    },
    [],
  );
  if (!timeline) return <p>No timeline in this content pack.</p>;
  if (!prefs) return null;
  return (
    <main style={{ position: "fixed", inset: 0 }}>
      <TimelinePart
        content={pack}
        season={{ ...DEFAULT_SEASON, value: seasonValue }}
        prefs={prefs}
        emit={emit}
        timeline={timeline}
        claims={claims}
        initialEra={era}
      />
    </main>
  );
}
