"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { activities, destinations, story } from "@/data/story";
import type { Activity, Knowledge } from "@/domain/contracts";
import { publishable } from "@/domain/review";
import Contributor from "./Contributor";
const World = dynamic(() => import("./World"), {
  ssr: false,
  loading: () => (
    <div className="loading">Opening your little corner of Hokkaido…</div>
  ),
});
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="loading">
        3D is unavailable. Explore every object using the buttons below.
      </div>
    ) : (
      this.props.children
    );
  }
}
function Quiz({
  activity,
  done,
  onComplete,
}: {
  activity: Activity;
  done: boolean;
  onComplete: () => void;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  return (
    <article className="quiz">
      <span className="eyebrow">
        {done ? "COLLECTED" : "A MOMENT TO DISCOVER"}
      </span>
      <h3>{activity.question}</h3>
      <div className="options">
        {activity.options.map((o, i) => (
          <button
            className={choice === i ? "selected" : "secondary"}
            key={o}
            onClick={() => {
              setChoice(i);
              if (i === activity.answer) onComplete();
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {choice !== null && (
        <p role="status">
          {choice === activity.answer
            ? "That’s right. "
            : "Take another look. "}
          {activity.explanation}
        </p>
      )}
    </article>
  );
}
export default function Experience() {
  const [view, setView] = useState<"explore" | "contribute" | "journal">(
    "explore",
  );
  const [room, setRoom] = useState(false);
  const [artifact, setArtifact] = useState("fiber");
  const [done, setDone] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [contribution, setContribution] = useState<Knowledge | null>(null);
  const [voice, setVoice] = useState("");
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("lh-journal-v1") || "[]");
      if (Array.isArray(saved))
        setDone(
          saved.filter(
            (v: unknown) =>
              typeof v === "string" && activities.some((a) => a.id === v),
          ),
        );
    } catch {}
    setReady(true);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem("lh-journal-v1", JSON.stringify(done));
      } catch {}
  }, [done, ready]);
  function complete(id: string) {
    setDone((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }
  function navigate(next: typeof view) {
    window.speechSynthesis?.cancel();
    setView(next);
  }
  const selected =
    story.artifacts.find((a) => a.id === artifact) ?? story.artifacts[0];
  return (
    <>
      <header>
        <a className="brand" href="/">
          ◒{" "}
          <span>
            Living Hokkaido<small>STORIES THAT STAY WITH US</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <button
            className={view === "explore" ? "active" : "plain"}
            onClick={() => navigate("explore")}
          >
            Explore
          </button>
          <button
            className={view === "journal" ? "active" : "plain"}
            onClick={() => navigate("journal")}
          >
            Heritage Journal <span className="count">{done.length}/3</span>
          </button>
          <button
            className={view === "contribute" ? "active" : "plain"}
            onClick={() => navigate("contribute")}
          >
            Contribute a story
          </button>
        </nav>
      </header>
      <main>
        <div hidden={view !== "contribute"}>
          <Contributor onApproved={setContribution} />
        </div>
        {view === "journal" && (
          <section className="journal">
            <p className="eyebrow">YOUR HERITAGE JOURNAL</p>
            <h1>
              Small discoveries,
              <br />
              carried with you.
            </h1>
            <p>
              {done.length} of 3 reflections collected · saved on this device.
            </p>
            <div className="journal-grid">
              {activities.map((a, i) => (
                <article key={a.id}>
                  <span className="stamp">
                    {done.includes(a.id) ? "✦" : "○"}
                  </span>
                  <h2>
                    {
                      [
                        "A material’s story",
                        "Look beyond one object",
                        "Care for the source",
                      ][i]
                    }
                  </h2>
                  <p>
                    {done.includes(a.id)
                      ? a.explanation
                      : "Visit the textile room to add this reflection."}
                  </p>
                </article>
              ))}
            </div>
            <button
              onClick={() => {
                setRoom(true);
                navigate("explore");
              }}
            >
              Return to the textile room
            </button>
            <button className="secondary" onClick={() => setDone([])}>
              Reset journal
            </button>
          </section>
        )}
        {view === "explore" && (
          <>
            <section className="intro">
              <div>
                <p className="eyebrow">A LIVING CULTURAL LANDSCAPE</p>
                <h1>
                  {room ? (
                    "From bark to cloth."
                  ) : (
                    <>
                      Every story deserves
                      <br />a place to live.
                    </>
                  )}
                </h1>
                <p>
                  {room
                    ? "Look closely. Follow a thread back to its source."
                    : "Wander a little. Listen closely. Take a story with you."}
                </p>
              </div>
              <div className="edition">
                HOKKAIDO, JAPAN
                <br />
                <span>Research prototype / 01</span>
              </div>
            </section>
            <section
              className="landscape"
              aria-label={
                room
                  ? "Interactive textile room"
                  : "Interactive Hokkaido-inspired diorama"
              }
            >
              <SceneBoundary>
                <World
                  room={room}
                  onEnter={() => setRoom(true)}
                  onArtifact={setArtifact}
                />
              </SceneBoundary>
              <div className="scene-label">
                {room ? "THE TEXTILE ROOM" : "YOUR LITTLE CORNER OF HOKKAIDO"}
                <small>Drag to orbit · scroll to look closer</small>
              </div>
              <div className="guide">
                <span className="owl" aria-hidden="true">
                  ◉ᴗ◉
                </span>
                <div>
                  <strong>
                    {room
                      ? "Let’s look a little closer."
                      : "A story is waiting in the textile room."}
                  </strong>
                  <p>
                    {room
                      ? "Choose one of the three objects. Each has a source to follow."
                      : "I’ll help you find your way. Where shall we begin?"}
                  </p>
                  <button onClick={() => setRoom(!room)}>
                    {room ? "Back to the landscape" : "Follow the owl"}
                  </button>
                </div>
              </div>
            </section>
            <div className="scene-foot">
              <span>
                Original illustrative scene · not a real location or cultural
                reconstruction
              </span>
              <span>Keyboard-friendly navigation below</span>
            </div>
            {!room ? (
              <section className="destinations">
                {destinations.map((d, i) => (
                  <button
                    key={d.id}
                    disabled={!d.open}
                    className="destination"
                    onClick={() => setRoom(true)}
                  >
                    <span className="destination-icon">
                      {["⌂", "♧", "◇", "▤"][i]}
                    </span>
                    <strong>{d.title}</strong>
                    <small>{d.detail}</small>
                    <span className="badge">
                      {d.open ? "Enter preview" : "Coming later"}
                    </span>
                  </button>
                ))}
              </section>
            ) : (
              <section className="room-content">
                <div className="story-head">
                  <div>
                    <p className="eyebrow">ONE MATERIAL, MANY QUESTIONS</p>
                    <h2>{story.title}</h2>
                  </div>
                  <span className="badge">{story.status}</span>
                </div>
                <p>{story.narration}</p>
                <div className="actions">
                  <button
                    onClick={() => {
                      if (!("speechSynthesis" in window)) {
                        setVoice(
                          "Narration unavailable; read the transcript above.",
                        );
                        return;
                      }
                      window.speechSynthesis.cancel();
                      const utterance = new SpeechSynthesisUtterance(
                        story.narration,
                      );
                      utterance.lang = "en-US";
                      utterance.onerror = () =>
                        setVoice(
                          "Narration unavailable; transcript remains above.",
                        );
                      window.speechSynthesis.speak(utterance);
                      setVoice(
                        "Device-generated English narration. Not a practitioner recording.",
                      );
                    }}
                  >
                    Listen to the story
                  </button>
                  <button
                    className="secondary"
                    onClick={() => window.speechSynthesis?.cancel()}
                  >
                    Stop narration
                  </button>
                </div>
                <p className="small" role="status">
                  {voice ||
                    "Narration uses your device’s synthetic voice when available; full transcript above."}
                </p>
                <div className="artifact-tabs" aria-label="Select an object">
                  {story.artifacts.map((a) => (
                    <button
                      key={a.id}
                      className={a.id === artifact ? "selected" : "secondary"}
                      onClick={() => setArtifact(a.id)}
                    >
                      {a.title}
                    </button>
                  ))}
                </div>
                <article className="artifact">
                  <span className="eyebrow">
                    ILLUSTRATIVE OBJECT · NOT A SCAN
                  </span>
                  <h2>{selected.label}</h2>
                  <p>{selected.description}</p>
                  <a
                    href={story.sources[0].url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read the museum source
                  </a>
                  <p className="small">Section: {selected.locator}</p>
                </article>
                <div className="activities">
                  {activities.map((a) => (
                    <Quiz
                      key={a.id}
                      activity={a}
                      done={done.includes(a.id)}
                      onComplete={() => complete(a.id)}
                    />
                  ))}
                </div>
                <p className="notice">
                  Ainu is a distinct language. Vocabulary and pronunciation
                  activities await qualified review. The owl is an original
                  fictional guide, with no claimed cultural or spiritual
                  identity.
                </p>
                {contribution && publishable(contribution) && (
                  <article className="artifact">
                    <span className="badge">
                      Local contributor preview · mock pipeline
                    </span>
                    <h2>{contribution.title}</h2>
                    {contribution.claims.map((c) => (
                      <p key={c.id}>{c.text}</p>
                    ))}
                    <p>
                      Reviewed by {contribution.reviewer}. Source:{" "}
                      {contribution.sources[0].title}
                    </p>
                    {contribution.activities.map((a) => (
                      <Quiz
                        key={a.id}
                        activity={a}
                        done={false}
                        onComplete={() => {}}
                      />
                    ))}
                  </article>
                )}
                <details>
                  <summary>Sources, attribution and review status</summary>
                  {story.sources.map((s) => (
                    <p key={s.id}>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.title}
                      </a>
                      <br />
                      {s.locator}
                    </p>
                  ))}
                  <p>
                    Short research paraphrases, checked against these pages on
                    25 November 2026 JST. Cultural/editorial approval pending.
                    No museum images, models or recordings are redistributed.
                    The third activity teaches our editorial policy.
                  </p>
                </details>
              </section>
            )}
          </>
        )}
      </main>
      <footer>
        <span>Living Hokkaido</span>
        <p>Made for stories, and the people who carry them.</p>
        <span>Prototype · all sponsor services mocked</span>
      </footer>
    </>
  );
}
