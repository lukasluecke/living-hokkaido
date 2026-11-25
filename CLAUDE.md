# Out of Place (working title)

A cozy multiplayer browser game: hide-and-seek in historically accurate scenes from
Hokkaido, mostly Meiji-era (1868–1912). Hiders dress and paint themselves to blend into
a scene; seekers hunt for whoever looks out of place. Every round ends with a funny,
shareable reveal that teaches a real history fact.

## Core loop (one round ≈ 3 min)
1. **Scene reveal (10s):** everyone sees the scene plus one short history caption.
2. **Disguise (60s):** hiders pick period wardrobe pieces, paint their character with a
   brush and an eyedropper that samples colors from the scene, choose a pose, pick a spot.
3. **Seek (90s):** seekers move a magnifying glass over the scene and tap whoever looks
   wrong. A wrong tap costs the seekers 10 seconds.
4. **Reveal:** slow-motion replay of each hider being found (or surviving), each with a
   history card: what in the scene is period-accurate, and what gave the hider away.

## Win / lose
- Seekers win if they find every hider before time runs out.
- Hiders win if at least one survives.
- Wrong tap = −10s on the seekers' clock.

## Tone (non-negotiable)
- Cozy, warm, funny. Isometric diorama look (see Visual style), gentle music, no violence.
- Being found is a funny moment, never a punishment: comedic animations and sounds, no
  "fail"/"dead" language, no harsh red flashes.
- Reveals should be fun enough to clip and share.

## Visual style (approved, applies to every asset)
1. **Palette:** a deep night-teal backdrop around a warm, daylit diorama. Layered pine and
   moss greens, bark browns and cliff greys, with persimmon-red and slate-blue roofs as
   accents. Saturated but softened. No pure black (#000) or pure white (#fff).
2. **Line quality:** chunky, crisp, slightly pixel-like edges with dark-tinted outlines
   (never black). Foliage is built from rounded clumps. Each material gets flat shading in
   2–3 tones, with no gradients beyond a soft contact shadow where surfaces meet.
3. **Lighting:** soft sun from the top left, cool shadows on right and bottom faces, a
   gentle warm glow on edges. Time of day (snowy morning, lantern-lit dusk) changes by
   palette swap, not by redrawing.
4. **Player character, "Nuri" (塗り, "painting"):** an original design. A small,
   round-headed figure in unglazed-clay off-white, with mitten hands, dot eyes and a tiny
   smile, and no hair or clothes by default. About 1.5 heads tall so wardrobe pieces read.
   Built from separate paintable regions (head, body, arms, legs), drawn at the scene's
   isometric angle.
5. **Scene framing:** each scene is a floating island cut out of the landscape, seen at
   about a 30° isometric angle against the night-teal backdrop. Packed with nooks, crowds
   and props to hide among. Buildings follow real Meiji-era references (for example
   Kaitakushi Western-style wooden buildings), not generic temples.

Rules for applying it:
- All colors come from `src/style/palette.ts`. Don't hard-code hex values elsewhere. If an
  asset needs a new color, add it to the palette with a name, and keep it within the rules
  above.
- UI (text, buttons, bars, cards) sits on the night-teal backdrop: cream text, dark-tinted
  outlines, flat fills, chunky rounded-rect shapes.
- Use `pixelArt`-friendly rendering for sprites (crisp edges, no blurry scaling).
- The style reference image (an AI-generated diorama from promptbase.com) is for mood
  only. Never copy or trace it, and never ship it as an asset.

## History and cultural accuracy
- **Every scene is set in Hokkaido** (user decision, 2026-11-26). No scenes elsewhere in
  Japan. Ideas that fit another city get re-researched for a Hokkaido place, and items
  that don't fit Hokkaido's dates move to the out-of-place list (for example, gas lamps
  reached Tokyo in 1874 but Sapporo only in 1912).
- Every scene ships with a fact sheet (`content/scenes/<id>/facts.md`): date/era, location,
  what's depicted, and at least one cited source per claim on a history card.
- Don't invent facts. Mark anything uncertain as such, and leave it out of cards until it's
  verified.
- Watch era boundaries: Meiji is 1868–1912. Label Edo, Taishō or later elements correctly
  (example: Otaru Canal was finished in 1923, which is Taishō).
- Treat Ainu people and culture with respect, and source it carefully. Ainu ceremonial or
  sacred items are not "disguise" costume pieces. Represent Ainu presence in scenes
  accurately, not as decoration.
- History cards are short, warm and specific ("Kaitakushi brick, est. 1873"), not
  lectures.

## Tech decisions
- **Engine: Phaser 3 + TypeScript + Vite.** Why Phaser over plain canvas: it already gives
  us scene/state management, unified mouse+touch input, a Scale Manager for desktop and
  phone, tweens and time scaling (slow-motion reveals), cameras (magnifier), and
  RenderTexture/CanvasTexture (painting, eyedropper pixel sampling). With plain canvas we'd
  rebuild all of that ourselves. Phaser is mature, well documented and runs on WebGL with a
  Canvas fallback.
- **Logic is separate from rendering.** Game rules live in a pure, framework-free module
  (`src/core/`): state, phases, timers, hit tests, scoring. Every change goes through
  serializable actions → reducer. Phaser scenes only render state and send actions. That
  makes the rules testable, and it lets online multiplayer reuse the same core later on an
  authoritative server.
- **Platforms:** must run in desktop and mobile browsers (iOS Safari, Android Chrome).
  Touch-first controls, tap targets ≥ 44px, landscape layout with a portrait fallback.
  Target 60fps on a mid-range phone.
- **Multiplayer roadmap:** local first (pass-and-play on one device, plus bot hiders).
  Online comes later. Don't add networking code until that milestone, but keep every
  action serializable.
- **Tests:** Vitest for `src/core/`, `src/game/` pure logic and `content/`. Each
  phase/rule change gets a test. `npm run check` (typecheck, Biome, oxlint, tests, build)
  must pass before calling work done.
- **Formatting:** Biome, same config as living-hokkaido (double quotes, 2 spaces, 80
  columns). Run `npm run format`. No ESLint/Prettier.

## Integration with living-hokkaido (read before changing the game's API)
The game will be ported into github.com/lukasluecke/living-hokkaido (private) as the
activity kind `hide-seek`. See `HANDBACK.md` (integrator notes) and
`contract-proposal.ts` (the proposed schema). Don't edit the living-hokkaido repo from
here unless the user asks.
- **Props in, events out.** The game is mounted with `mountOutOfPlace(el, props)`
  (`src/embed.ts`). Props mirror living-hokkaido's `ActivityPartProps`; output is only
  `emit(event)` (`activity.complete` once, `reveal.open`). No globals, no URL reading, no
  localStorage, no page-wide key capture inside the game. Page chrome lives in `main.ts`.
- **Contracts mirror.** `src/integration/contracts.ts` copies living-hokkaido's names and
  rules. Never add fields there that living-hokkaido doesn't have; new fields go in
  `contract-proposal.ts` and HANDBACK.md.
- **History text comes only from claims.** Every historical line the game shows is a claim
  in `content/scenes/<id>/knowledge.ts` with a source and an honest locator. Game lines
  (giveaways, jokes) must not state history. Content stays `research-preview` until a
  named reviewer approves it.
- **Honesty labels** stay visible: "Research preview · review pending" and "Illustrative
  scene" (caption, reveal card, clip footer).
- **Accessibility:** every action has a keyboard path, phases are announced in the
  aria-live region, `prefs.reducedMotion` turns off zooms, hops and confetti, and
  `prefs.webgl: false` runs on Canvas 2D.
- **Phaser loads lazily** (dynamic import in `embed.ts`), so importing the game is safe in
  Next.js server code.

## Project layout (target)
- `src/embed.ts`: mount API for host apps; `src/main.ts`: standalone page
- `src/integration/`: living-hokkaido contracts mirror
- `src/core/`: pure game logic (no Phaser imports)
- `src/game/`: Nuri, giveaway analysis, sound stings, clip recorder
- `src/art/`: procedural scene art (Canvas2D)
- `src/scenes/`: Phaser scenes (currently one GameScene for the whole round)
- `src/bots/`: bot hider/seeker AI (not built yet)
- `src/style/`: palette and shared UI helpers (single source of truth for colors)
- `content/scenes/<id>/`: `knowledge.ts` (cited claims), `activity.ts` (hide-seek
  activity), later hide-spot masks and wardrobe tags
- Scene research notes, written before building: `scenes/<id>.md` (new scenes, e.g.
  `scenes/sapporo-street.md`); the Otaru notes are in
  `content/scenes/otaru-herring-warehouse/facts.md`
- `src/art/scenes.ts`: one art builder per scene id; `src/scenes/SelectScene.ts`: scene select
- `content/wardrobe/`: period clothing pieces plus metadata (era, region, class, source)
- `public/audio/`: music and SFX

## Build milestones (in order)
- **M0 Skeleton:** Vite + TS + Phaser, Vitest, `.claude/launch.json` dev server, a core
  reducer that cycles the four phases with countdowns.
- **M1 Smallest playable (done, redefined by the user 2026-11-26):** Otaru herring
  warehouse scene (placeholder art), one human hider (Nuri) with brush in 3 sizes,
  eyedropper, undo and zoom, 3 poses (standing, crouching, leaning), pass-and-play
  handoff, seek by tapping (−10s per miss), reveal card with blend score and history.
  Still to come from the old M1: bot hiders, magnifier.
- **M2 Pass-and-play hiding:** role setup for 2–4 players, "pass the device" cover screens
  so nobody sees another player's disguise, wardrobe picker and spot choice, bots fill
  the empty hider slots.
- **M3 Paint + eyedropper:** brush, scene color sampling, undo, blend score in core.
- **M4 Poses + bot seeker:** poses that match scene activities, a bot seeker weighted by
  blend score and anachronism tags.
- **M5 Reveal show (mostly done 2026-11-26):** freeze and slow zoom on the hider,
  synthesised sting, FOUND! stamp or "Master of Disguise" victory pose with confetti,
  card with what gave them away plus one cited fact. Still to do: slow-motion replay of
  the find from a recorded event timeline, illustrated cards.
- **M6 Art, audio, content (in progress):** 2 sourced Hokkaido scenes so far (Otaru herring
  warehouse, Meiji street in Sapporo) with a scene select screen; synthesised SFX. Still to
  do: 1–3 more scenes, music.
  - **Process for every new scene:** research first, then write `scenes/<id>.md` with sources,
    a period-accurate list and an out-of-place list (each item cited, uncertainties noted),
    then the `knowledge.ts` and `activity.ts`, then the art, then add the id to the
    `scene` enum in `contract-proposal.ts` and to `SCENE_ART`.
  - **Scale rule:** people and Nuri are about 140 px tall. Buildings must be clearly taller
    (two storeys about 190–200 px), or the scene reads as a toy town.
- **M7 Shareable clips (mostly done 2026-11-26):** Save clip replays the reveal for 10 s and
  records a vertical 9:16 MP4/WebM with the history card; Web Share on phones, download
  elsewhere. Still to do: PNG history card.
- **M8 Online multiplayer:** authoritative server reusing `src/core`, rooms and join codes,
  hidden info (seekers never receive hider positions), reconnects.

## Working rules for Claude sessions
- Follow the milestones in order, and ship the smallest playable thing first.
- Keep the game playable after every milestone. Verify in the browser preview, desktop and
  mobile viewport, before calling work done.
- Placeholder art is fine early on, but it must already follow the Visual style and use
  the shared palette.
- Don't add dependencies without saying why.
