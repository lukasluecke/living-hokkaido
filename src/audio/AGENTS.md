# src/audio: ambient and interface sound

Shared sound module. Not a part: the shell feeds it, parts stay unaware.

## Adjust sound (one file)

`manifest.ts` holds everything you tune:

- `buses`: master / ambient / ui gain. `overlayDuck`: ambient gain while the
  journal or reveal is open. `zoneFadeSec`, `seasonFadeSec`: crossfade times.
- `sounds`: id → files (`src`, first playable format wins), `volume`,
  `detuneJitter` (variety), `credit` (row in `public/audio/ATTRIBUTION.md`).
- `zones`: which views play which ambient layers, with a gain per season.
  The mix blends with `seasonWeights()`, so the timelapse fades smoothly.
  `island` = views island/travel; `interior` (lake house) = scene/focus/activity.
- `cues`: a moment sound (`sound`, `volume`, `delayMs`, `minIntervalMs`).
- `events`: shared event type → cue. Events not listed are silent.
- `dom`: CSS selector → cue for hover and click on any element.

Listen and tune at `/sound` (`npm run dev`): every cue, zone, season and
bus slider. Copy good values back into `manifest.ts`. `npm test` checks that
the manifest is consistent and that every file exists.

To replace a sound: drop a new `.ogg` + `.m4a` with the same name in
`public/audio/<ambient|ui>/`, or change `src`. Add a row to
`public/audio/ATTRIBUTION.md` (CC0 preferred). Regenerate the original
placeholders with `npm run audio:generate [-- name]` (needs ffmpeg).

## How it is wired

- `engine.ts` (Web Audio, framework-free): no `AudioContext` before the first
  pointer or key gesture (autoplay rules). Ambient layers loop and ramp with
  `setTargetAtTime`. Suspends when the tab is hidden. Mute is saved in
  `localStorage` (`living-hokkaido.sound.muted`).
- `mix.ts` (pure, tested in `tests/audio.test.ts`): zone, layer gains, event
  cues. `season.set` plays a cue only when the main season changes.
- `dom.ts`: hover / click sounds for buttons via document listeners. If a
  click also emits an event with a cue, the event cue wins (no double sound).
- `react.tsx`: `useSoundscape(state)` + `SoundToggle` for the shell.

Shell hook-up (`src/shell/Shell.tsx`, 4 lines): `useSoundscape(state)`,
`soundEvent(e)` in `emit`, `soundEvent({type:"stamp.earned"})` per earned
stamp, `<SoundToggle>` in the HUD. Keep these when the shell changes.

## For parts (no import needed)

- `data-sound="<cue>"` on an element: click plays that cue. `"off"` = silent.
- `data-sound-hover="off"`: no hover sound.
- 3D objects without a DOM element:
  `window.dispatchEvent(new CustomEvent("lh:sound", { detail: "hover" }))`.
- A weave step has no shared event; the stub's grid cells match the
  `button[aria-label^='Row ']` rule. A new weave UI should set
  `data-sound="weave-step"` on its step control.

## Rules

- No recordings of people, ceremonies or music without documented consent
  and rights. The placeholders are generic and do not represent Ainu sound.
- Sound never carries information alone (captions/visuals stay primary).
- 2026-11-26: owl voice lines queue (Lukas: a line was cut halfway by the next one). `playVoiceLine` waits until the line now playing has ended (max 12 s); only the newest waiting line plays; `stopVoiceLine` drops waiting lines. A line the browser blocks on page load plays on the first tap or key, if it is still the newest line.
