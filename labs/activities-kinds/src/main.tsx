// Activity kinds lab: three proposed kinds (story, words, trace) rendered
// with the props shape of ActivityPartProps. Events go to a visible log.
import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createEventBus, type ExperienceEvent } from "@/contracts";
import { type as fonts, ui } from "@/design/tokens";
import { activities, claimsFor } from "./data";
import { Story } from "./Story";
import { Trace } from "./Trace";
import { Words } from "./Words";
import "./ui.css";

const KINDS = [
  { id: "story", label: "Story · owl narrator" },
  { id: "words", label: "Words · listen and match" },
  { id: "trace", label: "Follow the thread" },
] as const;
type KindId = (typeof KINDS)[number]["id"];

const bus = createEventBus();

function App() {
  const q = new URLSearchParams(location.search);
  const initial = (q.get("a") as KindId) ?? "story";
  const [kind, setKind] = useState<KindId>(KINDS.some((k) => k.id === initial) ? initial : "story");
  const [log, setLog] = useState<ExperienceEvent[]>([]);
  const reducedMotion = useMemo(
    () => q.has("still") || matchMedia("(prefers-reduced-motion: reduce)").matches,
    [q],
  );
  const prefs = { reducedMotion, webgl: false };

  useEffect(() => bus.on((e) => setLog((l) => [e, ...l].slice(0, 6))), []);
  useEffect(() => {
    const u = new URL(location.href);
    u.searchParams.set("a", kind);
    history.replaceState(null, "", u);
  }, [kind]);

  const a = activities[kind];
  const props = { claims: claimsFor(a.claimIds), prefs, emit: bus.emit };

  return (
    <div
      className="app"
      style={
        {
          "--paper": ui.paper,
          "--paper-edge": ui.paperEdge,
          "--ink": ui.ink,
          "--ink-soft": ui.inkSoft,
          "--gold": ui.gold,
          "--gold-deep": ui.goldDeep,
          "--night": ui.night,
          "--danger": ui.danger,
          "--body": fonts.body,
          "--heading": fonts.heading,
        } as React.CSSProperties
      }
    >
      <header className="top">
        <h1>Activity kinds lab</h1>
        <div className="kinds" role="tablist" aria-label="Activity kind">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              role="tab"
              aria-selected={kind === k.id}
              className={kind === k.id ? "on" : ""}
              onClick={() => setKind(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
      </header>
      <main className="panel" key={kind}>
        {a.kind === "story" && <Story activity={a} {...props} />}
        {a.kind === "words" && <Words activity={a} {...props} />}
        {a.kind === "trace" && <Trace activity={a} {...props} />}
        <button
          type="button"
          className="close"
          aria-label="Close activity"
          onClick={() => bus.emit({ type: "activity.close", activityId: a.id })}
        >
          ×
        </button>
      </main>
      <aside className="log" aria-label="Emitted events">
        <strong>Events</strong>
        {log.length === 0 && <span>none yet</span>}
        {log.map((e, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: append-only log
          <code key={i}>{JSON.stringify(e)}</code>
        ))}
      </aside>
    </div>
  );
}

const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
