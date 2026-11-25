"use client";
// Curator memory studio: an authorized curator records a memory about one
// artifact in their own language, gives consent per use, checks the
// transcript, and makes labelled translations. Everything stays in this tab;
// "Export" gives pack JSON plus files to commit after review.
import { useEffect, useRef, useState } from "react";
import { barkToClothPack } from "@/content/bark-to-cloth";
import {
  type ConsentValue,
  isAinu,
  type MemoryTranslation,
  type Source,
  type VoiceMemory,
  voiceMemorySchema,
} from "@/contracts";
import type { ProviderResult } from "@/domain/contracts";
import {
  type TranslateJob,
  type Transcript,
  translationGate,
} from "@/domain/voice-memory";
import { Memories } from "@/parts/artifacts/Memories";

const LANGS: [string, string][] = [
  ["ja", "Japanese"],
  ["en", "English"],
  ["ain", "Ainu"],
  ["zh-Hans", "Chinese (Simplified)"],
  ["zh-Hant", "Chinese (Traditional)"],
  ["ko", "Korean"],
  ["de", "German"],
  ["fr", "French"],
  ["es", "Spanish"],
];
const POLL_MS = 3000;
const POLL_LIMIT_MS = 5 * 60_000;

type Clip = { blob: Blob; url: string };

/** MediaRecorder in a hook. Returns null clip until a recording stops. */
function useRecorder() {
  const rec = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  async function start(onDone: (clip: Clip) => void) {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const parts: Blob[] = [];
      r.ondataavailable = (e) => parts.push(e.data);
      r.onstop = () => {
        for (const t of stream.getTracks()) t.stop();
        const blob = new Blob(parts, { type: r.mimeType || "audio/webm" });
        onDone({ blob, url: URL.createObjectURL(blob) });
        setRecording(false);
      };
      r.start();
      rec.current = r;
      setRecording(true);
    } catch {
      setError("Microphone not available. Upload a file instead.");
    }
  }
  const stop = () => rec.current?.stop();
  return { recording, error, start, stop };
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "memory";

export default function CuratorMemory() {
  const artifacts = barkToClothPack.artifacts;
  const [provider, setProvider] = useState("…");
  const [curator, setCurator] = useState({
    name: "",
    role: "",
    authorizationId: "",
  });
  const [authorized, setAuthorized] = useState(false);
  const [artifactId, setArtifactId] = useState(artifacts[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [lang, setLang] = useState("ja");
  const [containsAinu, setContainsAinu] = useState(false);
  const [consent, setConsent] = useState<{
    recording: ConsentValue;
    translation: ConsentValue;
    voiceClone: ConsentValue;
  }>({ recording: "pending", translation: "pending", voiceClone: "pending" });
  const [consentClip, setConsentClip] = useState<Clip | null>(null);
  const [consentAt, setConsentAt] = useState("");
  const [clip, setClip] = useState<Clip | null>(null);
  const [transcript, setTranscript] = useState("");
  const [transcriptMode, setTranscriptMode] =
    useState<VoiceMemory["transcriptMode"]>("curator-typed");
  const [targets, setTargets] = useState<string[]>(["en"]);
  const [translations, setTranslations] = useState<MemoryTranslation[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const recorder = useRecorder();
  const consentRecorder = useRecorder();

  useEffect(() => {
    fetch("/api/voice-memory")
      .then((r) => r.json())
      .then((j: { provider: string }) => setProvider(j.provider))
      .catch(() => setProvider("mock"));
  }, []);

  const ainu = isAinu(lang) || containsAinu;
  const memoryId = `memory-${slug(title || artifactId)}`;
  const consentRecordId = `consent-${memoryId}`;
  const cloneNeedsClip = consent.voiceClone === "granted" && !consentClip;
  const effectiveConsent = {
    ...consent,
    voiceClone: cloneNeedsClip ? ("pending" as const) : consent.voiceClone,
  };

  function setConsentValue(key: keyof typeof consent, granted: boolean) {
    setConsent({ ...consent, [key]: granted ? "granted" : "declined" });
    setConsentAt(new Date().toISOString());
    // A consent change invalidates translations made under the old one.
    setTranslations([]);
  }

  async function transcribe() {
    if (!clip) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.set("audio", clip.blob);
      form.set("lang", lang);
      const res = (await (
        await fetch("/api/voice-memory/transcribe", {
          method: "POST",
          body: form,
        })
      ).json()) as ProviderResult<Transcript | null>;
      setStatus(res.notice);
      if (res.value) {
        setTranscript(res.value.text);
        setTranscriptMode("machine");
      }
    } catch {
      setStatus("Transcription request failed. Type the transcript.");
    } finally {
      setBusy(false);
    }
  }

  async function translateOne(
    target: string,
  ): Promise<MemoryTranslation | string> {
    if (!clip) return "No recording.";
    const form = new FormData();
    form.set("audio", clip.blob);
    form.set("sourceLang", lang);
    form.set("targetLang", target);
    form.set("transcript", transcript);
    form.set("containsAinu", String(containsAinu));
    form.set("translationConsent", effectiveConsent.translation);
    form.set("voiceCloneConsent", effectiveConsent.voiceClone);
    const started = (await (
      await fetch("/api/voice-memory/translate", { method: "POST", body: form })
    ).json()) as ProviderResult<TranslateJob | null>;
    let job = started.value;
    if (!job) return started.notice;
    const clone = effectiveConsent.voiceClone === "granted" ? "1" : "0";
    const t0 = Date.now();
    while (job.status === "running") {
      if (Date.now() - t0 > POLL_LIMIT_MS) return `${target}: timed out.`;
      await new Promise((r) => setTimeout(r, POLL_MS));
      const q = new URLSearchParams({ lang: target, clone });
      const next = (await (
        await fetch(
          `/api/voice-memory/translate/${encodeURIComponent(job.jobId)}?${q}`,
        )
      ).json()) as ProviderResult<TranslateJob | null>;
      if (!next.value) return next.notice;
      job = next.value;
      setStatus(`${target}: ${next.notice}`);
    }
    if (job.status === "failed" || !job.result) return `${target}: failed.`;
    const r = job.result;
    return {
      lang: target,
      text: r.text,
      audio: r.audioDataUrl
        ? { kind: "file", url: r.audioDataUrl }
        : { kind: "none" },
      voice: r.voice,
      mode: "machine",
      provider: started.mode === "mock" ? "mock" : provider,
      createdAt: new Date().toISOString(),
    };
  }

  async function translate() {
    setBusy(true);
    const made: MemoryTranslation[] = [];
    const notes: string[] = [];
    try {
      for (const target of targets) {
        const gate = translationGate({
          sourceLang: lang,
          targetLang: target,
          containsAinu,
          consent: effectiveConsent,
        });
        if (!gate.ok) {
          notes.push(`${target}: ${gate.reason}`);
          continue;
        }
        setStatus(`Translating to ${target}…`);
        const out = await translateOne(target).catch(
          () => `${target}: request failed.`,
        );
        if (typeof out === "string") notes.push(out);
        else made.push(out);
      }
      setTranslations(made);
      setStatus(
        [`${made.length} translation(s) ready (${provider}).`, ...notes].join(
          " ",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  const draft: unknown = {
    id: memoryId,
    artifactId,
    knowledgeId: artifacts.find((a) => a.id === artifactId)?.knowledgeId ?? "",
    title: title || "Untitled memory",
    curator,
    lang,
    containsAinu,
    sourceId: `${memoryId}-audio`,
    audio: clip
      ? { kind: "file", url: clip.url, mime: clip.blob.type }
      : { kind: "none" },
    transcript: transcript || " ",
    transcriptMode,
    consent: {
      ...effectiveConsent,
      recording: withdrawn ? "withdrawn" : effectiveConsent.recording,
      recordId: consentRecordId,
      recordedAt: consentAt || "not-recorded",
      method: consentClip ? "spoken" : "form",
    },
    review: { status: "unreviewed" },
    translations,
  };
  const parsed = voiceMemorySchema.safeParse(draft);
  const ready =
    authorized &&
    !!curator.name &&
    !!curator.role &&
    !!curator.authorizationId &&
    consent.recording === "granted" &&
    !!clip &&
    transcript.trim().length > 0;

  function exportJson() {
    if (!parsed.success) return;
    const m = parsed.data;
    const source: Source = {
      id: m.sourceId,
      title: `${m.curator.name}: ${m.title}`,
      kind: "audio",
      rights: "restricted",
      consent: m.consent.recording === "granted" ? "granted" : "pending",
      attribution: `${m.curator.name}, ${m.curator.role}`,
      placeholder: false,
    };
    const forPack = {
      ...m,
      audio: {
        kind: "file",
        url: `/memories/${m.id}.webm`,
        mime: clip?.blob.type,
      },
      translations: m.translations.map((t) => ({
        ...t,
        audio:
          t.audio.kind === "file"
            ? { kind: "file", url: `/memories/${m.id}-${t.lang}.mp3` }
            : t.audio,
      })),
    };
    const blob = new Blob(
      [
        JSON.stringify(
          {
            note: "Add `source` to the knowledge entry and `memory` to pack.memories after review. Set source rights to approved only with a signed or spoken consent record.",
            source,
            memory: forPack,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${m.id}.json`;
    a.click();
  }

  const statement = `I, ${curator.name || "[name]"}, agree that Living Hokkaido may keep this recording for visitors${
    consent.translation === "granted" ? ", translate it by machine" : ""
  }${
    consent.voiceClone === "granted"
      ? ", and make a synthetic copy of my voice to speak the translations"
      : ""
  }. I can withdraw this at any time.`;

  return (
    <section className="contribution" aria-labelledby="memory-studio">
      <div>
        <p className="eyebrow">CURATOR MEMORIES</p>
        <h2 id="memory-studio">Tell it in your own language.</h2>
        <p>
          Record a memory or context about one object. Visitors hear your
          original first. With your consent, they can also hear a labelled
          machine translation.
        </p>
        <p className="notice">
          Provider: <strong>{provider}</strong>.{" "}
          {provider === "mock"
            ? "Offline mock: no transcription, translation or voice is made. Text is marked as not translated."
            : "Live: audio is sent to the provider only after the consent checks below."}{" "}
          Nothing is stored online. No sign-in in this demo; production needs a
          curator role.
        </p>
        <fieldset disabled={withdrawn}>
          <legend>1 · Curator</legend>
          <label>
            Name
            <input
              value={curator.name}
              onChange={(e) => setCurator({ ...curator, name: e.target.value })}
            />
          </label>
          <label>
            Role or community
            <input
              value={curator.role}
              onChange={(e) => setCurator({ ...curator, role: e.target.value })}
            />
          </label>
          <label>
            Authorization record
            <input
              value={curator.authorizationId}
              placeholder="For example the curator agreement number"
              onChange={(e) =>
                setCurator({ ...curator, authorizationId: e.target.value })
              }
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
            />
            I am an authorized curator for this object
          </label>
        </fieldset>
        <fieldset disabled={withdrawn}>
          <legend>2 · Object and language</legend>
          <label>
            Object
            <select
              value={artifactId}
              onChange={(e) => setArtifactId(e.target.value)}
            >
              {artifacts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Memory title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Language you speak in
            <select
              value={lang}
              onChange={(e) => {
                setLang(e.target.value);
                setTranslations([]);
              }}
            >
              {LANGS.map(([tag, name]) => (
                <option key={tag} value={tag}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={containsAinu}
              onChange={(e) => {
                setContainsAinu(e.target.checked);
                setTranslations([]);
              }}
            />
            The memory contains Ainu words
          </label>
          {ainu && (
            <p className="small">
              Draft: Ainu content is marked for the later review pass.
            </p>
          )}
        </fieldset>
        <fieldset disabled={withdrawn}>
          <legend>3 · Consent of the speaker</legend>
          {(
            [
              ["recording", "Keep and play my recording for visitors"],
              ["translation", "Translate my words by machine"],
              [
                "voiceClone",
                "Make a synthetic copy of my voice for the translations",
              ],
            ] as const
          ).map(([key, label]) => (
            <label className="check" key={key}>
              <input
                type="checkbox"
                checked={consent[key] === "granted"}
                onChange={(e) => setConsentValue(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
          <p className="small">
            Read this aloud and record it as your consent record:
          </p>
          <blockquote>{statement}</blockquote>
          <div className="actions">
            {consentRecorder.recording ? (
              <button type="button" onClick={consentRecorder.stop}>
                Stop consent recording
              </button>
            ) : (
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  consentRecorder.start((c) => {
                    setConsentClip(c);
                    setConsentAt(new Date().toISOString());
                  })
                }
              >
                {consentClip ? "Record consent again" : "Record spoken consent"}
              </button>
            )}
          </div>
          {consentClip && (
            // biome-ignore lint/a11y/useMediaCaption: the statement text is shown above
            <audio
              controls
              src={consentClip.url}
              aria-label="Consent recording"
            />
          )}
          {cloneNeedsClip && (
            <p className="small">
              Voice copy stays off until the spoken consent is recorded. A stock
              voice is used instead.
            </p>
          )}
          {consentRecorder.error && (
            <p className="small">{consentRecorder.error}</p>
          )}
        </fieldset>
        <fieldset disabled={withdrawn}>
          <legend>4 · Your memory</legend>
          <div className="actions">
            {recorder.recording ? (
              <button type="button" onClick={recorder.stop}>
                Stop recording
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  recorder.start((c) => {
                    setClip(c);
                    setTranslations([]);
                  })
                }
              >
                {clip ? "Record again" : "Record memory"}
              </button>
            )}
          </div>
          <label>
            Or upload audio
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 25_000_000)
                  return setStatus("Choose a file under 25 MB.");
                setClip({ blob: f, url: URL.createObjectURL(f) });
                setTranslations([]);
              }}
            />
          </label>
          {recorder.error && <p className="small">{recorder.error}</p>}
          <div className="actions">
            <button
              type="button"
              className="secondary"
              disabled={!clip || busy}
              onClick={transcribe}
            >
              Transcribe ({provider})
            </button>
          </div>
          <label>
            Transcript (check every word)
            <textarea
              rows={5}
              lang={lang}
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                setTranscriptMode(
                  transcriptMode === "machine"
                    ? "human-checked"
                    : transcriptMode,
                );
                setTranslations([]);
              }}
            />
          </label>
        </fieldset>
      </div>
      <div className="review">
        <p className="eyebrow">5 · TRANSLATE AND PREVIEW</p>
        <fieldset disabled={withdrawn || consent.translation !== "granted"}>
          <legend>Visitor languages</legend>
          {LANGS.filter(([tag]) => tag !== lang).map(([tag, name]) => (
            <label className="check" key={tag}>
              <input
                type="checkbox"
                checked={targets.includes(tag)}
                onChange={(e) =>
                  setTargets(
                    e.target.checked
                      ? [...targets, tag]
                      : targets.filter((t) => t !== tag),
                  )
                }
              />
              {name}
            </label>
          ))}
          <div className="actions">
            <button
              type="button"
              disabled={!ready || busy || !targets.length}
              onClick={translate}
            >
              Translate ·{" "}
              {effectiveConsent.voiceClone === "granted"
                ? "your voice"
                : "stock voice"}
            </button>
          </div>
        </fieldset>
        {!ready && !withdrawn && (
          <p className="small">
            To continue: curator details and authorization, recording consent, a
            recording and a transcript.
          </p>
        )}
        {parsed.success && ready && !withdrawn && (
          <>
            <p className="small">Visitor preview, as on the object card:</p>
            <Memories memories={[parsed.data]} />
            {translations.map((t) =>
              t.audio.kind === "file" ? (
                <p key={t.lang} className="small">
                  <a href={t.audio.url} download={`${memoryId}-${t.lang}.mp3`}>
                    Download {t.lang} audio
                  </a>
                </p>
              ) : null,
            )}
          </>
        )}
        {!parsed.success && ready && (
          <p className="small">
            Not valid yet:{" "}
            {parsed.error.issues.map((i) => i.message).join("; ")}
          </p>
        )}
        <div className="actions">
          <button
            type="button"
            disabled={!ready || !parsed.success || withdrawn}
            onClick={exportJson}
          >
            Export for review
          </button>
          {clip && (
            <a href={clip.url} download={`${memoryId}.webm`}>
              Download original
            </a>
          )}
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setWithdrawn(true);
              setTranslations([]);
              setClip(null);
              setConsentClip(null);
              setStatus(
                "Withdrawn. The recording, consent clip and translations were removed from this tab.",
              );
            }}
          >
            Withdraw
          </button>
        </div>
        <p role="status">{status}</p>
      </div>
    </section>
  );
}
