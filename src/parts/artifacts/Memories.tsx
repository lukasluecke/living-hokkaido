"use client";
// Curator voice memories on the artifact card. The original recording is
// always offered first. A translation is shown only with its labels:
// machine-translated (or who checked it), and whose voice it is.
import { useEffect, useMemo, useState } from "react";
import {
  isAinu,
  type MemoryAudio,
  needsReview,
  type MemoryTranslation,
  pickTranslation,
  type VoiceMemory,
} from "@/contracts";
import s from "../shared/Fallback.module.css";
import { SHOW_DISCLAIMERS } from "@/design/disclaimers";

const ORIGINAL = "original";

function langName(tag: string, uiLang: string) {
  try {
    return new Intl.DisplayNames([uiLang], { type: "language" }).of(tag) ?? tag;
  } catch {
    return tag;
  }
}

/** Browser speech for text-only entries. Labelled placeholder; never Ainu. */
function DeviceVoice({ text, lang }: { text: string; lang: string }) {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(typeof speechSynthesis !== "undefined"), []);
  if (!ok || isAinu(lang)) return null;
  return (
    <button
      type="button"
      className={s.button}
      onClick={() => {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        speechSynthesis.speak(u);
      }}
    >
      Read aloud · device voice, placeholder
    </button>
  );
}

function Audio({
  audio,
  label,
  text,
  lang,
}: {
  audio: MemoryAudio;
  label: string;
  text: string;
  lang: string;
}) {
  if (audio.kind !== "file")
    return (
      <p className={s.muted}>
        No audio file. Text only. <DeviceVoice text={text} lang={lang} />
      </p>
    );
  return (
    // biome-ignore lint/a11y/useMediaCaption: the transcript is shown next to it
    <audio controls preload="none" src={audio.url} aria-label={label} />
  );
}

function voiceLabel(t: MemoryTranslation, speaker: string) {
  if (t.voice === "cloned")
    return `Synthetic voice modelled on ${speaker}, with ${speaker}'s consent`;
  if (t.voice === "stock") return `Stock synthetic voice, not ${speaker}`;
  return "Text only, no synthetic voice";
}

function modeLabel(t: MemoryTranslation) {
  if (t.provider === "mock") return "Mock · not a real translation";
  if (t.provider === "sample") return "Sample text by the team";
  if (t.mode === "human-checked")
    return `Machine translation, checked by ${t.checkedBy}`;
  return `Machine translated (${t.provider}) · not checked`;
}

export function MemoryCard({
  memory: m,
  choice,
  uiLang,
}: {
  memory: VoiceMemory;
  /** Language tag the visitor picked, or "original". */
  choice: string;
  uiLang: string;
}) {
  const t = choice === ORIGINAL ? null : pickTranslation(m, [choice]);
  const original = langName(m.lang, uiLang);
  return (
    <article aria-label={m.title}>
      <h4>{m.title}</h4>
      <p className={s.muted}>
        {m.curator.name} · {m.curator.role}
      </p>
      {SHOW_DISCLAIMERS && (
        <p>
          <span className={s.badge}>
            {m.placeholder ? "Sample · no real curator yet" : "Curator memory"}
          </span>
          <span className={s.badge}>
            {m.review.status === "approved"
              ? `Reviewed by ${m.review.reviewer}`
              : "Review pending"}
          </span>
        </p>
      )}
      <p>
        <strong>Original · {original}</strong>
      </p>
      <Audio
        audio={m.audio}
        label={`${m.title}, original in ${original}`}
        text={m.transcript}
        lang={m.lang}
      />
      <details open={!t}>
        <summary>Transcript ({original})</summary>
        <p lang={m.lang}>{m.transcript}</p>
      </details>
      {t && (
        <section aria-label={`Translation, ${langName(t.lang, uiLang)}`}>
          <p>
            <strong>{langName(t.lang, uiLang)}</strong>{" "}
            {SHOW_DISCLAIMERS && (
              <>
                <span className={s.badge}>{modeLabel(t)}</span>
                <span className={s.badge}>{voiceLabel(t, m.curator.name)}</span>
                {needsReview(m, t) && <span className={s.badge}>Draft</span>}
              </>
            )}
          </p>
          <Audio
            audio={t.audio}
            label={`${m.title}, translation in ${langName(t.lang, uiLang)}`}
            text={t.text}
            lang={t.lang}
          />
          <p lang={t.lang}>{t.text}</p>
        </section>
      )}
      {!t && choice !== ORIGINAL && (
        <p className={s.muted}>
          No {langName(choice, uiLang)} version yet. The original is shown.
        </p>
      )}
    </article>
  );
}

/** List of memories with one "Listen in" choice for all of them. */
export function Memories({ memories }: { memories: readonly VoiceMemory[] }) {
  const [uiLang, setUiLang] = useState("en");
  const [choice, setChoice] = useState(ORIGINAL);
  const langs = useMemo(
    () =>
      [
        ...new Set(memories.flatMap((m) => m.translations.map((t) => t.lang))),
      ].sort(),
    [memories],
  );
  // Visitor language from the browser, after mount (no SSR mismatch).
  useEffect(() => {
    const pref = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];
    setUiLang(pref[0] ?? "en");
    const base = (l: string) => l.toLowerCase().split("-")[0];
    for (const p of pref) {
      const hit =
        langs.find((l) => l === p) ?? langs.find((l) => base(l) === base(p));
      if (hit) return setChoice(hit);
    }
  }, [langs]);
  if (!memories.length) return null;
  return (
    <section aria-label="Curator memories">
      <h3>Curator memories</h3>
      {langs.length > 0 && (
        <label>
          Listen in{" "}
          <select value={choice} onChange={(e) => setChoice(e.target.value)}>
            <option value={ORIGINAL}>Original language</option>
            {langs.map((l) => (
              <option key={l} value={l}>
                {langName(l, uiLang)}
              </option>
            ))}
          </select>
        </label>
      )}
      {memories.map((m) => (
        <MemoryCard key={m.id} memory={m} choice={choice} uiLang={uiLang} />
      ))}
    </section>
  );
}
