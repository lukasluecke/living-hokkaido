// Words kind: listen, say it aloud, match word to object. In this lab the
// terms are English stand-ins. No Ainu word is shown until a qualified person
// has checked spelling, region, meaning and pronunciation and a consenting
// speaker's recording exists (docs/RESEARCH.md, validateContentPack).
import { useMemo, useState } from "react";
import type { Term } from "@/contracts";
import { ObjectIcon } from "./icons";
import { Cite, complete, deviceVoice, type KindProps, PreviewBanner } from "./shared";

const CHECKS: { key: keyof Term["review"]; label: string }[] = [
  { key: "spelling", label: "Spelling" },
  { key: "region", label: "Region / variety" },
  { key: "meaning", label: "Meaning" },
  { key: "pronunciation", label: "Pronunciation recording" },
  { key: "consent", label: "Speaker consent" },
];

/** Stable shuffle so the match columns differ but do not jump on re-render. */
const shuffled = <T,>(xs: T[]) => [...xs.slice(1), xs[0]].filter(Boolean) as T[];

export function Words({ activity: a, claims, emit }: KindProps<"words">) {
  const [step, setStep] = useState<"listen" | "match">("listen");
  const [said, setSaid] = useState<Set<string>>(new Set());
  const [pick, setPick] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [misses, setMisses] = useState(0);
  const [note, setNote] = useState("");
  const objects = useMemo(() => shuffled(a.terms), [a.terms]);
  const presentation = Object.values(claims)[0]?.presentation ?? "research-preview";
  const canVoice = deviceVoice.available();
  const reveal = (claimId: string) =>
    emit({ type: "reveal.open", knowledgeId: a.knowledgeId, claimId });

  const tryMatch = (termId: string, artifactId: string) => {
    const t = a.terms.find((x) => x.id === termId);
    if (!t) return;
    if (t.artifactId === artifactId) {
      const next = new Set(matched).add(termId);
      setMatched(next);
      setNote(`Matched: “${t.text}” · ${t.gloss}.`);
      if (next.size === a.terms.length)
        complete(emit, a.id, a.terms.length / (a.terms.length + misses));
    } else {
      setMisses((m) => m + 1);
      setNote("Not this one. Look at the shapes again.");
    }
    setPick(null);
  };

  return (
    <div className="words">
      <PreviewBanner presentation={presentation} />
      {a.standIn && (
        <p className="banner gate" role="note">
          Mechanic demo · English stand-in words. Ainu words appear here only
          after a qualified speaker reviews them and a consenting speaker
          records them.
        </p>
      )}
      <h2>{a.title}</h2>
      <p>{a.prompt}</p>
      <div className="tabs" role="tablist">
        {(["listen", "match"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={step === s}
            className={step === s ? "on" : ""}
            onClick={() => setStep(s)}
          >
            {s === "listen" ? "1 · Listen and repeat" : "2 · Match"}
          </button>
        ))}
      </div>

      {step === "listen" && (
        <div className="term-grid">
          {a.terms.map((t) => (
            <article key={t.id} className="term-card">
              <ObjectIcon id={t.artifactId} />
              <p className="term" lang={t.lang}>
                {t.text}
              </p>
              <p className="gloss">{t.gloss}</p>
              <div className="row">
                <button
                  type="button"
                  className="btn"
                  disabled={t.audio.kind === "none" || (t.audio.kind !== "recording" && !canVoice)}
                  onClick={() => deviceVoice.speak(t.text)}
                >
                  ▶ Listen
                </button>
                <button
                  type="button"
                  className="btn"
                  aria-pressed={said.has(t.id)}
                  onClick={() => setSaid(new Set(said).add(t.id))}
                >
                  {said.has(t.id) ? "✓ Said it" : "I said it aloud"}
                </button>
              </div>
              <p className="voice-label">
                {t.audio.kind === "recording"
                  ? "Recorded speaker · consent on file"
                  : canVoice
                    ? "Device voice · placeholder"
                    : "No voice on this device · read it aloud"}
              </p>
              <div className="locked">
                <p>
                  <strong>Ainu word:</strong> not shown until reviewed
                </p>
                <ul className="checks">
                  {CHECKS.map((c) => (
                    <li key={c.key} className={t.review[c.key] ? "ok" : ""}>
                      {t.review[c.key] ? "☑" : "☐"} {c.label}
                    </li>
                  ))}
                </ul>
              </div>
              <Cite claim={claims[t.claimId]} onReveal={() => reveal(t.claimId)} />
            </article>
          ))}
        </div>
      )}

      {step === "match" && (
        <div className="match">
          <div className="match-col" aria-label="Words">
            {a.terms.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`chip ${pick === t.id ? "picked" : ""} ${matched.has(t.id) ? "done" : ""}`}
                disabled={matched.has(t.id)}
                aria-pressed={pick === t.id}
                lang={t.lang}
                onClick={() => setPick(t.id)}
              >
                {t.text}
              </button>
            ))}
          </div>
          <div className="match-objects" aria-label="Objects">
            {objects.map((o) => {
              const done = [...matched].some(
                (id) => a.terms.find((t) => t.id === id)?.artifactId === o.artifactId,
              );
              return (
                <button
                  key={o.artifactId}
                  type="button"
                  className={`object ${done ? "done" : ""}`}
                  disabled={!pick || done}
                  aria-label={`Object: ${o.gloss}`}
                  onClick={() => pick && tryMatch(pick, o.artifactId)}
                >
                  <ObjectIcon id={o.artifactId} size={88} />
                  <span>{done ? o.text : "?"}</span>
                </button>
              );
            })}
          </div>
          <p className="feedback" aria-live="polite">
            {matched.size === a.terms.length
              ? "All matched. Illustrative shapes, not museum objects."
              : note || (pick ? "Now pick the object." : "Pick a word first.")}
          </p>
        </div>
      )}
    </div>
  );
}
