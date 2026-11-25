// Trace kind ("Follow the thread"): match each sentence to the source that
// backs it. Built only from the knowledge entry, so it cannot invent content.
import { useLayoutEffect, useRef, useState } from "react";
import type { Source } from "@/contracts";
import { complete, type KindProps, PreviewBanner } from "./shared";

type Line = { claimId: string; sourceId: string; d: string };

export function Trace({ activity: a, claims, emit }: KindProps<"trace">) {
  const resolved = a.claimIds.map((id) => claims[id]).filter((c) => c !== undefined);
  const sources: Source[] = [];
  for (const id of new Set(resolved.flatMap((c) => c.claim.citations.map((x) => x.sourceId)))) {
    const s = resolved.flatMap((c) => c.sources).find((x) => x.id === id);
    if (s) sources.push(s);
  }
  const [pick, setPick] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [misses, setMisses] = useState(0);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const presentation = resolved[0]?.presentation ?? "research-preview";
  const finished = Object.keys(links).length === resolved.length;

  const connect = (sourceId: string) => {
    const c = resolved.find((r) => r.claim.id === pick);
    if (!c) return;
    if (c.claim.citations.some((x) => x.sourceId === sourceId)) {
      const next = { ...links, [c.claim.id]: sourceId };
      setLinks(next);
      setNote("");
      if (Object.keys(next).length === resolved.length)
        complete(emit, a.id, resolved.length / (resolved.length + misses));
    } else {
      setMisses((m) => m + 1);
      setNote("This source does not back that sentence. Try another.");
    }
    setPick(null);
  };

  // Draw a soft thread between each linked sentence and its source.
  useLayoutEffect(() => {
    const draw = () => {
      const root = box.current;
      if (!root) return;
      const o = root.getBoundingClientRect();
      const out: Line[] = [];
      for (const [claimId, sourceId] of Object.entries(links)) {
        const c = root.querySelector(`[data-claim="${claimId}"]`)?.getBoundingClientRect();
        const s = root.querySelector(`[data-source="${sourceId}"]`)?.getBoundingClientRect();
        if (!c || !s) continue;
        const x1 = c.right - o.left;
        const y1 = c.top + c.height / 2 - o.top;
        const x2 = s.left - o.left;
        const y2 = s.top + s.height / 2 - o.top;
        const mx = (x1 + x2) / 2;
        out.push({ claimId, sourceId, d: `M${x1} ${y1} C ${mx} ${y1 + 18}, ${mx} ${y2 - 18}, ${x2} ${y2}` });
      }
      setLines(out);
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [links]);

  return (
    <div className="trace">
      <PreviewBanner presentation={presentation} />
      <h2>{a.title}</h2>
      <p>{a.prompt}</p>
      <div className="trace-board" ref={box}>
        <svg className="threads" aria-hidden="true">
          {lines.map((l) => (
            <path key={l.claimId} d={l.d} />
          ))}
        </svg>
        <div className="trace-col">
          {resolved.map((c) => {
            const linked = links[c.claim.id];
            const cit = c.claim.citations.find((x) => x.sourceId === linked);
            return (
              <button
                key={c.claim.id}
                type="button"
                data-claim={c.claim.id}
                className={`claim ${pick === c.claim.id ? "picked" : ""} ${linked ? "done" : ""}`}
                aria-pressed={pick === c.claim.id}
                disabled={!!linked}
                onClick={() => setPick(c.claim.id)}
              >
                <span>“{c.claim.text}”</span>
                {cit && <small>Locator: {cit.locator}</small>}
              </button>
            );
          })}
        </div>
        <div className="trace-col">
          {sources.map((s) => (
            <button
              key={s.id}
              type="button"
              data-source={s.id}
              className="source"
              disabled={!pick}
              onClick={() => connect(s.id)}
            >
              <strong>{s.title}</strong>
              <small>
                {s.kind} · rights {s.rights} · consent {s.consent}
              </small>
            </button>
          ))}
        </div>
      </div>
      <p className="feedback" aria-live="polite">
        {finished ? a.completion : note || (pick ? "Now pick its source." : "Pick a sentence.")}
      </p>
      {finished && (
        <div className="review-strip">
          <span>Source</span>→<span>Claim</span>→
          <span className="pending">Human review · pending</span>
          <button
            type="button"
            className="btn"
            onClick={() => emit({ type: "reveal.open", knowledgeId: a.knowledgeId })}
          >
            Turn the card
          </button>
        </div>
      )}
    </div>
  );
}
