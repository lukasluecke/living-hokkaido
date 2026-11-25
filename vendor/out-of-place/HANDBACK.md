# Hand-back: Out of Place (hide-and-seek)

Part: activities (proposed lab folder: `labs/activities-hide-seek`)
Author: Erina (+ Claude Code)   Date: 2026-11-26
Status: ready to integrate as a lab; contract change needs Lukas's OK

Written in living-hokkaido's `docs/HANDBACK.md` format. Nothing in the
living-hokkaido repo has been changed.

## Recommendation (3–5 lines)
Add Out of Place as a new activity kind, `hide-seek`: two visitors on one
device. One hides Nuri (an original clay figure) in an illustrated historical
scene by painting it with colours sampled from the scene; the other looks for
whoever seems out of place. The reveal zooms in on the hider, plays a short
synthetic sting, names what gave them away, and shows one cited claim about the
scene. The game already takes `ActivityPartProps`-shaped props and only reports
through `emit`, so porting is a thin React wrapper plus content.

## Keep
| What | Files | Notes for porting |
|---|---|---|
| Mount API | `src/embed.ts` | `mountOutOfPlace(el, props)` → `{ ready, destroy }`. Server-safe (Phaser loads lazily). Validates the activity and its claims at the boundary. |
| Contracts mirror | `src/integration/contracts.ts` | Same names and rules as `@/contracts` (source, claim, KnowledgeEntry, ResolvedClaim, ActivityResult, events, Prefs). Replace imports with `@/contracts`, then delete. |
| Contract proposal | `contract-proposal.ts` | `hideSeekActivitySchema`, additive. Paste into `src/contracts/activity.ts`. |
| Round rules | `src/core/round.ts` (+ test) | Pure reducer: phases, timers, handoff, hit test, wrong-tap penalty, blend score. No Phaser. |
| Giveaway analysis | `src/game/giveaway.ts` (+ test) | Per body part: worst match and the surface behind it. Game observations only, never historical claims. |
| Scene art | `src/art/` | Procedural Canvas2D placeholder of an Otaru herring warehouse on a floating isometric island. No asset files. |
| Nuri | `src/game/nuri.ts` | Paintable parts on one canvas texture, 3 hiding poses plus a victory pose, undo, fill. |
| Reveal + clip | `src/scenes/GameScene.ts`, `src/game/clip.ts`, `src/game/sound.ts` | Freeze, slow zoom, sting, FOUND! stamp or "Master of Disguise" pose. Save clip records a 10 s 9:16 MP4 (WebM fallback) of a replay of the reveal. |
| Content | `content/scenes/otaru-herring-warehouse/`, `content/scenes/sapporo-street/` | Two scenes. Each has `knowledge.ts` (KnowledgeEntry, research-preview) and `activity.ts` (hide-seek activity). Otaru: 7 claims, 6 sources. Meiji street in Sapporo (about 1889): 9 claims, 8 sources. Research notes: `content/scenes/otaru-herring-warehouse/facts.md` and `scenes/sapporo-street.md`. |
| Scene select | `src/scenes/SelectScene.ts` | Opens only when the host passes two or more activities (`activities` prop); living-hokkaido passes one and goes straight in. Cards have live thumbnails and keyboard support (←/→, 1–n, Enter). The round-over screen gets a "Scenes" button (key P). |

### Wrapper sketch (for `src/parts/activities/play/HideSeek.tsx`)
```tsx
"use client";
import { useEffect, useRef } from "react";
import type { KindProps } from "../kinds/shared";
import { mountOutOfPlace } from "./hide-seek/embed";

export function HideSeekActivity({ activity, claims, prefs, emit }: KindProps<"hide-seek">) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const game = mountOutOfPlace(ref.current, { activity, claims, prefs, emit });
    return () => game.destroy();
  }, [activity, claims, prefs, emit]);
  return <div ref={ref} style={{ width: "100%", aspectRatio: "16 / 9" }} />;
}
```
The host element needs a size (the game letterboxes 1280×720 into it). The
existing `ActivityPart` panel supplies the close button (×) and Esc stays with
the shell (`nav.back`); the game does not handle Esc.

## Drop
- Bot hiders and the magnifier from the original plan: not built yet.
- Online play: pass-and-play only. PROJECT.md lists realtime multiplayer as a
  non-goal, and the contract fixes `players: "pass-and-play"`.
- A truly rolling "last 10 seconds" capture: MediaRecorder output can't be
  trimmed without re-encoding, so Save clip replays the reveal for exactly
  10 seconds while recording.

## Contract impact
- Uses as-is: `KnowledgeEntry`, `ResolvedClaim`, `Prefs`, `ActivityResult`,
  events `activity.complete` (once, when the first round's reveal starts;
  `score` = blend 0–1) and `reveal.open` ("How do we know?", with the first
  accurate claim). `activity.close` comes from the panel's × button.
- Proposed (additive): activity kind `hide-seek`, in `contract-proposal.ts`.
  Fields: `scene` (`otaru-herring-warehouse` or `sapporo-street`), `prompt` (frame text only), `captionClaimIds`,
  `accurateClaimIds`, `anachronismClaimIds`, `completion`, `durations`
  (default 10/80/90/20 s), `wrongTapPenalty` (default 10 s), `players`,
  `illustrative` (default true). A refine checks every referenced claim is in
  `claimIds`. Also needs `"hide-seek": "Game"` in `KIND_LABEL` and a test in
  `tests/contracts.test.ts`.
- Optional props beyond `ActivityPartProps`: `muted` (silence the stings),
  `onClip(blob, ext)` (let the host handle a saved clip) and `activities`
  (several scenes, which turns on the scene select). All have safe defaults.

## Assets
| File | Source | Licence / rights | Size | Triangles |
|---|---|---|---|---|
| none | All art is drawn in code; all sounds are synthesised with Web Audio | Original, MIT with the code | 0 | 0 (2D) |

## Measurements
- Bundle: Phaser 3.90 is a lazy chunk, 1.19 MB (318 KB gzip), fetched only
  when the activity mounts. Game code 39 KB (15 KB gzip). Zod is already in
  living-hokkaido.
- fps: not measured on a real GPU yet (only in the desktop app's browser pane,
  which throttles background frames). Please measure on the demo laptop.
- Clip: 720×1280 H.264 MP4 at about 4 Mbit/s, so a 10 s clip is about 5 MB;
  WebM where MP4 recording isn't supported.

## Fallback and accessibility
- **Keyboard (whole round):** Enter skips, finishes or continues. In the
  disguise, arrows move Nuri (Shift moves faster), E picks the colour behind
  Nuri, F fills, Z undoes, 1–3 change pose, +/− zoom. In the seek, arrows move
  a finder ring, Space or Enter taps, G gives up. In the reveal, S opens the
  sources and C saves a clip. Keys only reach the game while its element has
  focus; it never captures keys page-wide.
- **Screen readers:** an `aria-live` region inside the host element announces
  each phase, misses and the full reveal card.
- **No WebGL:** `prefs.webgl: false` runs Phaser on Canvas 2D.
- **Reduced motion:** `prefs.reducedMotion` makes the reveal zoom a cut and
  turns off hops, pulses, confetti and floating labels.
- **Honesty labels:** "Research preview · review pending" (from claim
  presentation) and "Illustrative scene" show on the scene caption, the reveal
  card and the clip footer.
- **Not covered:** there is no pure HTML version of the game, since it is
  canvas-based. The reveal card's text is fully announced through the live
  region.

## Screenshots
Not committed yet. Run `npm run dev` here and play a round.

## Open questions
1. **Story fit.** The current slice is "From bark to cloth" (Ainu textiles).
   Both scenes are in Hokkaido: Meiji-era Otaru merchant history and a Sapporo
   street around 1889 (Kaitakushi-era settlers; Ainu people are not depicted, see
   `scenes/sapporo-street.md`). Does it belong in this pack,
   in a separate pack, or on one of the three "soon" places? Chika should
   review the claims (all research-preview).
2. **Look.** The game has its own approved pixel-ish isometric palette
   (`src/style/palette.ts`); living-hokkaido has `tokens.ts` (paper, ink, gold).
   Inside the activity panel, should the game's UI switch to the tokens? The
   palette is the single place to change it.
3. **Dependency.** Phaser adds about 320 KB gzip (lazy). AGENTS.md asks for
   small dependencies, so this needs a decision.
4. **Tooling.** This lab uses Vite 8 and Vitest. living-hokkaido labs use
   Vite 7, and the app uses `tsx --test`. The pure tests (`round`, `giveaway`,
   content) port as-is with `node:test` asserts.
5. **Sound.** The stings are synthetic and bypass the shell's audio engine
   (`src/audio`). Wire `muted` to the shell's sound preference, or route
   through the engine.
6. **Locators.** Locators are honest but coarse ("page text"). Chika may want
   paragraph-level ones; see `facts.md`.
