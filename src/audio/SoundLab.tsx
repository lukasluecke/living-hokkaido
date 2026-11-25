"use client";
// Sound check page (/sound). Plays every cue and the ambient mix, and shows
// live bus gains so you can copy good values into manifest.ts.
import { useEffect, useState } from "react";
import { SEASON_IDS, seasonAt } from "@/contracts";
import { getSoundEngine } from "./react";
import { VIEWS } from "./types";

type View = (typeof VIEWS)[number];

export function SoundLab() {
  const [view, setView] = useState<View>("island");
  const [season, setSeason] = useState(0);
  const [overlay, setOverlay] = useState(false);
  const [buses, setBuses] = useState(() => ({
    ...(getSoundEngine()?.manifest.buses ?? { master: 1, ambient: 1, ui: 1 }),
  }));
  const engine = getSoundEngine();

  useEffect(() => getSoundEngine()?.attach(), []);
  useEffect(() => {
    getSoundEngine()?.setScene({
      view,
      season,
      overlay: overlay ? "journal" : null,
    });
  }, [view, season, overlay]);

  if (!engine) return null;
  const m = engine.manifest;
  return (
    <main style={{ padding: 24, maxWidth: 760, fontFamily: "system-ui" }}>
      <h1>Sound check</h1>
      <p>
        Click once anywhere to start audio (browser autoplay rules). Edit values
        in <code>src/audio/manifest.ts</code>.
      </p>
      <h2>Ambient</h2>
      <p>
        View:{" "}
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={v === view}
            onClick={() => setView(v)}
          >
            {v}
          </button>
        ))}
      </p>
      <label>
        Season {season.toFixed(2)} ({seasonAt(season)}){" "}
        <input
          type="range"
          min={0}
          max={3.99}
          step={0.01}
          value={season}
          onChange={(e) => setSeason(Number(e.target.value))}
        />
      </label>{" "}
      {SEASON_IDS.map((id, i) => (
        <button key={id} type="button" onClick={() => setSeason(i)}>
          {id}
        </button>
      ))}
      <p>
        <label>
          <input
            type="checkbox"
            checked={overlay}
            onChange={(e) => setOverlay(e.target.checked)}
          />{" "}
          Overlay open (duck ambient to {m.overlayDuck})
        </label>
      </p>
      <h2>Buses</h2>
      {(["master", "ambient", "ui"] as const).map((b) => (
        <p key={b}>
          <label>
            {b} {buses[b].toFixed(2)}{" "}
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.01}
              value={buses[b]}
              onChange={(e) => {
                const v = Number(e.target.value);
                engine.setBus(b, v);
                setBuses((x) => ({ ...x, [b]: v }));
              }}
            />
          </label>
        </p>
      ))}
      <code>buses: {JSON.stringify(buses)}</code>
      <h2>Cues</h2>
      <p>
        {Object.keys(m.cues).map((c) => (
          <button
            key={c}
            type="button"
            data-sound="off"
            onClick={() => {
              engine.unlock();
              engine.play(c);
            }}
          >
            {c}
          </button>
        ))}
      </p>
      <h2>Events</h2>
      <ul>
        {Object.entries(m.events).map(([ev, cue]) => (
          <li key={ev}>
            <code>{ev}</code> → {cue}
          </li>
        ))}
      </ul>
    </main>
  );
}
