"use client";
// Story kind: a retold story in chapters, with synced captions, a narrator,
// pauses with small navigation choices, and a citation on every fact line.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/i18n";
import { Owl } from "./Owl";
import {
  Cite,
  complete,
  deviceVoice,
  type KindProps,
  useAiVoice,
} from "./shared";
import k from "./kinds.module.css";

const MS_PER_WORD = 340;
const LINE_GAP_MS = 650;

type Pos = { ch: number; line: number };

export function Story({
  activity: a,
  claims,
  prefs,
  emit,
}: KindProps<"story">) {
  const [pos, setPos] = useState<Pos>({ ch: 0, line: 0 });
  const tr = useT();
  const [word, setWord] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [atPause, setAtPause] = useState(false);
  const [done, setDone] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [transcript, setTranscript] = useState(false);
  const finished = useRef(false);
  // The shell may pass a new emit on every render (season clock); keep the
  // latest one in a ref so the caption timer is not reset by re-renders.
  const emitRef = useRef(emit);
  emitRef.current = emit;

  const chapter = a.chapters[pos.ch];
  const line = chapter?.lines[pos.line];
  const refrain = line?.role === "refrain" ? a.refrain : undefined;
  const lineText = line
    ? line.role === "refrain"
      ? (a.refrain?.text ?? "")
      : line.text
    : "";
  const words = useMemo(() => lineText.split(" "), [lineText]);
  const voice = a.narrator.voice;
  // Pre-generated AI voice (English only); null until its index loads or
  // when it is missing, then the story falls back to captions.
  const ai = useAiVoice(voice.kind === "ai-voice" ? voice.group : undefined);
  const [aiFailed, setAiFailed] = useState(false);
  const useAi = !!ai && !aiFailed;
  const canVoiceStory =
    useAi ||
    (voice.kind === "device-voice-placeholder" && deviceVoice.available());
  // No voice ever reads the refrain (it is not English).
  const canVoice = canVoiceStory && line?.role !== "refrain";
  // The AI voice starts on; the device placeholder stays opt-in.
  useEffect(() => {
    if (ai) setVoiceOn(true);
  }, [ai]);

  const finish = useCallback(() => {
    setPlaying(false);
    setDone(true);
    if (!finished.current) {
      finished.current = true;
      complete(emitRef.current, a.id, 1);
    }
  }, [a.id]);

  /** Move to the next line, or the pause, or the next chapter. */
  const advance = useCallback(() => {
    const ch = a.chapters[pos.ch];
    if (!ch) return;
    setWord(0);
    if (pos.line + 1 < ch.lines.length)
      setPos({ ch: pos.ch, line: pos.line + 1 });
    else if (ch.pause) {
      setAtPause(true);
      setPlaying(false);
    } else if (pos.ch + 1 < a.chapters.length)
      setPos({ ch: pos.ch + 1, line: 0 });
    else finish();
  }, [a.chapters, pos, finish]);

  // Timer-driven captions (no voice, or voice unavailable).
  useEffect(() => {
    if (!playing || atPause || done || (voiceOn && canVoice)) return;
    const last = word >= words.length - 1;
    const t = setTimeout(
      () => (last ? advance() : setWord((w) => w + 1)),
      last ? MS_PER_WORD + LINE_GAP_MS : MS_PER_WORD,
    );
    return () => clearTimeout(t);
  }, [playing, atPause, done, voiceOn, canVoice, word, words.length, advance]);

  // AI voice: the audio clock drives the caption via word start times.
  useEffect(() => {
    if (!playing || atPause || done || !voiceOn || !canVoice || !line) return;
    if (!useAi || !ai) return;
    const starts = ai.index.lines[line.id]?.words ?? [];
    const audio = new Audio(ai.url(line.id));
    let t: ReturnType<typeof setTimeout> | undefined;
    audio.ontimeupdate = () =>
      setWord(
        Math.max(
          0,
          starts.findLastIndex((s) => s <= audio.currentTime),
        ),
      );
    audio.onended = () => {
      t = setTimeout(advance, LINE_GAP_MS);
    };
    audio.onerror = () => setAiFailed(true);
    audio.play().catch(() => setAiFailed(true));
    return () => {
      clearTimeout(t);
      audio.pause();
      audio.src = "";
    };
  }, [playing, atPause, done, voiceOn, canVoice, line, useAi, ai, advance]);

  // Device voice placeholder: word boundaries drive the caption.
  useEffect(() => {
    if (!playing || atPause || done || !voiceOn || !canVoice || !line) return;
    if (useAi) return;
    const starts: number[] = [];
    let i = 0;
    for (const w of words) {
      starts.push(i);
      i += w.length + 1;
    }
    deviceVoice.speak(lineText, {
      word: (c) =>
        setWord(
          Math.max(
            0,
            starts.findLastIndex((s) => s <= c),
          ),
        ),
      end: () => setTimeout(advance, LINE_GAP_MS),
    });
    return () => deviceVoice.stop();
  }, [
    playing,
    atPause,
    done,
    voiceOn,
    canVoice,
    useAi,
    line,
    lineText,
    words,
    advance,
  ]);

  // Space = play/pause.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || (e.target as HTMLElement).closest("button"))
        return;
      e.preventDefault();
      if (!atPause && !done) setPlaying((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [atPause, done]);

  const goChapter = (ch: number) => {
    setAtPause(false);
    setDone(false);
    setWord(0);
    setPos({ ch, line: 0 });
  };
  const reveal = (claimId: string) =>
    emit({ type: "reveal.open", knowledgeId: a.knowledgeId, claimId });

  const choose = (
    choice: NonNullable<typeof chapter.pause>["choices"][number],
  ) => {
    const act = choice.action;
    if (act.to === "reveal") return reveal(act.claimId);
    if (act.to === "chapter") {
      goChapter(
        Math.max(
          0,
          a.chapters.findIndex((c) => c.id === act.chapterId),
        ),
      );
    } else if (pos.ch + 1 < a.chapters.length) goChapter(pos.ch + 1);
    else {
      setAtPause(false);
      return finish();
    }
    setPlaying(true);
  };

  const speaking = playing && !atPause && !done;

  return (
    <div className={k.root}>
      <div className="story">
        <div className="story-side">
          <div className="narrator">
            <div className={prefs.reducedMotion ? "still" : ""}>
              <Owl speaking={speaking} size={96} />
            </div>
            <p className="credit">{a.narrator.credit}</p>
            <p className="voice-label">
              {voice.kind === "recording"
                ? tr("Recorded voice")
                : voiceOn && canVoiceStory
                  ? useAi
                    ? tr("AI voice")
                    : tr("Device voice")
                  : tr("Captions")}
            </p>
            {useAi && voice.kind === "ai-voice" && voiceOn && (
              <p className="credit">{voice.credit}</p>
            )}
          </div>
          <nav aria-label={tr("Chapters")}>
            <ol className="chapters">
              {a.chapters.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-current={i === pos.ch ? "step" : undefined}
                    className={
                      i === pos.ch ? "on" : i < pos.ch || done ? "seen" : ""
                    }
                    onClick={() => goChapter(i)}
                  >
                    <span className="num">{i + 1}</span> {c.title}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <section className="story-main">
          <p className="chapter-label">
            Chapter {pos.ch + 1} of {a.chapters.length} · {chapter?.title}
          </p>

          {!done && line && (
            <div className="caption-box">
              <p
                className={`caption ${refrain ? "refrain" : ""}`}
                aria-live="polite"
                lang={refrain?.lang}
              >
                {words.map((w, i) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: words of one fixed line
                    key={i}
                    className={
                      i < word || atPause
                        ? "w past"
                        : i === word && playing
                          ? "w now"
                          : "w"
                    }
                  >
                    {w}{" "}
                  </span>
                ))}
              </p>
              {refrain ? (
                <div className="refrain-note">
                  {refrain.romanised && (
                    <p className="refrain-roman" lang={refrain.lang}>
                      {refrain.romanised}
                    </p>
                  )}
                  <p className="frame-note">
                    Refrain · {refrain.credit} · not read by any voice
                  </p>
                  <Cite
                    claim={claims[refrain.claimId]}
                    onReveal={() => reveal(refrain.claimId)}
                  />
                </div>
              ) : line.role === "fact" ? (
                line.claimIds.map((id) => (
                  <Cite
                    key={id}
                    claim={claims[id]}
                    onReveal={() => reveal(id)}
                  />
                ))
              ) : (
                <p className="frame-note">
                  {tr("Guide line · no cultural claim")}
                </p>
              )}
            </div>
          )}

          {atPause && chapter?.pause && (
            <div className="pause" role="group" aria-label={tr("Pause")}>
              <p>{chapter.pause.prompt}</p>
              <div className="row">
                {chapter.pause.choices.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="btn"
                    onClick={() => choose(c)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {done && (
            <div className="pause">
              <p>{a.completion}</p>
              <div className="row">
                {a.claimIds.map((id) => (
                  <Cite
                    key={id}
                    claim={claims[id]}
                    onReveal={() => reveal(id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="controls">
            <button
              type="button"
              className="btn primary"
              disabled={atPause}
              onClick={() => {
                if (done) {
                  goChapter(0);
                  setPlaying(true);
                } else setPlaying((p) => !p);
              }}
            >
              {done ? tr("Listen again") : playing ? tr("Pause") : tr("Play")}
            </button>
            <button
              type="button"
              className="btn"
              disabled={atPause || done}
              onClick={advance}
            >
              {tr("Next line")}
            </button>
            <label className={`toggle ${canVoiceStory ? "" : "off"}`}>
              <input
                type="checkbox"
                checked={voiceOn && canVoiceStory}
                disabled={!canVoiceStory}
                onChange={(e) => setVoiceOn(e.target.checked)}
              />
              {useAi ? tr("AI voice") : tr("Device voice")}
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={transcript}
                onChange={(e) => setTranscript(e.target.checked)}
              />
              {tr("Transcript")}
            </label>
          </div>

          {transcript && (
            <ol className="transcript">
              {a.chapters.flatMap((c) =>
                c.lines.map((l) => (
                  <li key={l.id}>
                    {l.role === "refrain" ? (
                      <i lang={a.refrain?.lang}>{a.refrain?.text}</i>
                    ) : (
                      l.text
                    )}
                    {l.role === "fact" && (
                      <small> [{l.claimIds.join(", ")}]</small>
                    )}
                  </li>
                )),
              )}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
