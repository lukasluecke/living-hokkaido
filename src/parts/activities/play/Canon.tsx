"use client";
// Canon kind (ukouk structure): voice 1 starts; bring in each next voice on
// its mark, so the voices follow one melody one after another. The tones
// are a synthetic illustration of the structure, not the song.
import { useEffect, useRef, useState } from "react";
import { useT } from "@/i18n";
import { Cite, complete, type KindProps } from "../kinds/shared";
import { CANON_PATTERN, canonOffBy, ON_MARK, patternNote } from "./musicLogic";
import p from "./play.module.css";
import { hum, tick } from "./synth";
import { SHOW_DISCLAIMERS } from "@/design/disclaimers";

const BEAT_MS = 600;

export function CanonActivity({
  activity: a,
  claims,
  emit,
}: KindProps<"canon">) {
  const tr = useT();
  const [startAt, setStartAt] = useState<number | null>(null);
  const [beat, setBeat] = useState(0);
  const [entries, setEntries] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const [sound, setSound] = useState(true);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const sent = useRef(false);
  const running = startAt !== null;
  const all = entries.length === a.voices.length;
  const reveal = (claimId: string) =>
    emit({ type: "reveal.open", knowledgeId: a.knowledgeId, claimId });

  // Beat clock.
  useEffect(() => {
    if (startAt === null) return;
    const id = setInterval(() => {
      setBeat(Math.floor((performance.now() - startAt) / BEAT_MS));
    }, 40);
    return () => clearInterval(id);
  }, [startAt]);

  // Sound on each new beat; stop two loops after the last voice.
  useEffect(() => {
    if (!running) return;
    if (sound) {
      tick(beat % a.beats === 0);
      entries.forEach((e, i) => {
        if (beat >= e)
          hum(
            patternNote(beat - e),
            (BEAT_MS / 1000) * 0.95,
            a.voices.length > 1 ? -0.6 + (1.2 * i) / (a.voices.length - 1) : 0,
          );
      });
    }
    if (finishedAt !== null && beat >= finishedAt + a.beats * 2)
      setStartAt(null);
  }, [beat, running, sound, entries, a.beats, a.voices.length, finishedAt]);

  // Complete once every voice has sung one full loop together.
  useEffect(() => {
    if (!all || finishedAt !== null) return;
    const last = entries[entries.length - 1];
    if (beat >= last + a.beats) {
      setFinishedAt(beat);
      if (!sent.current) {
        sent.current = true;
        complete(emit, a.id, 1);
      }
    }
  }, [all, beat, entries, finishedAt, a.beats, a.id, emit]);

  const start = () => {
    setEntries([0]);
    setFinishedAt(null);
    setNote("");
    setBeat(0);
    setStartAt(performance.now());
  };

  const bringIn = () => {
    if (startAt === null || all) return;
    const i = entries.length;
    const at = (performance.now() - startAt) / BEAT_MS;
    const off = canonOffBy(at, i, a.offset, a.beats);
    if (Math.abs(off) <= ON_MARK) {
      setEntries([...entries, Math.round(at)]);
      setNote(tr("{voice} is in.", { voice: a.voices[i].label }));
    } else
      setNote(
        off < 0
          ? tr("A little early. Wait for the mark.")
          : tr("A little late. Try on the next mark."),
      );
  };

  const nextMark = (i: number) => (i * a.offset) % a.beats;
  const voiceBeat = (e: number) => (((beat - e) % a.beats) + a.beats) % a.beats;
  const next = entries.length;

  return (
    <div className={p.root}>
      <p>{a.prompt}</p>
      <div
        className="canon"
        aria-label={tr("Voices")}
        style={{ ["--beats" as string]: a.beats }}
      >
        <div className="lane ruler" aria-hidden="true">
          <span className="lane-label">{tr("Beat")}</span>
          {Array.from({ length: a.beats }, (_, b) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed beats
              key={b}
              className={`cell ${running && beat % a.beats === b ? "now" : ""} ${
                !all && running && b === nextMark(next) ? "mark" : ""
              }`}
            />
          ))}
        </div>
        {a.voices.map((v, i) => {
          const e = entries[i];
          const singing = running && e !== undefined && beat >= e;
          return (
            <div key={v.id} className={`lane ${singing ? "singing" : ""}`}>
              <span className="lane-label">{v.label}</span>
              {Array.from({ length: a.beats }, (_, b) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed beats
                  key={b}
                  className={`cell note ${singing && voiceBeat(e) === b ? "now" : ""}`}
                  style={{
                    // Height shows the illustrative melody contour.
                    ["--h" as string]: `${30 + CANON_PATTERN[b % CANON_PATTERN.length] * 9}%`,
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
      <div className="row">
        {!running ? (
          <button type="button" className="btn primary" onClick={start}>
            {finishedAt !== null
              ? tr("Sing again")
              : tr("Start {voice}", { voice: a.voices[0].label })}
          </button>
        ) : (
          <button
            type="button"
            className="btn primary"
            disabled={all}
            onClick={bringIn}
          >
            {all
              ? tr("All voices in")
              : tr("Bring in {voice}", { voice: a.voices[next].label })}
          </button>
        )}
        {running && (
          <button
            type="button"
            className="btn"
            onClick={() => setStartAt(null)}
          >
            {tr("Stop")}
          </button>
        )}
        <label className="toggle">
          <input
            type="checkbox"
            checked={sound}
            onChange={(e) => setSound(e.target.checked)}
          />
          {tr("Sound")}
        </label>
      </div>
      <p className="feedback" aria-live="polite">
        {finishedAt !== null
          ? a.completion
          : note ||
            (running
              ? tr("Press when the gold mark lights up (beat {n}).", {
                  n: nextMark(next) + 1,
                })
              : tr(
                  "Start the first voice, then bring in the others on their marks.",
                ))}
      </p>
      {SHOW_DISCLAIMERS && (
        <p className="small-note">
          {tr(
            "Synthetic tones that show the structure only. They are not the song, and no recording is used.",
          )}
        </p>
      )}
      <Cite
        claim={claims[a.structureClaimId]}
        onReveal={() => reveal(a.structureClaimId)}
      />
      {a.lyrics.length > 0 && (
        <div className="lyrics">
          <p className="small-note">
            {tr("The words, as the museum writes them:")}
          </p>
          {a.lyrics.map((l) => (
            <p key={l.text} className="lyric" lang={l.lang}>
              {l.text}
            </p>
          ))}
          <Cite
            claim={claims[a.lyrics[0].claimId]}
            onReveal={() => reveal(a.lyrics[0].claimId)}
          />
        </div>
      )}
    </div>
  );
}
