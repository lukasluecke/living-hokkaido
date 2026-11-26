# Hand-back: Don't Fall on the Slope, steps 5–8

Part: activities (vendored game, `vendor/` in living-hokkaido)
Author: Erina (+ Claude Code)   Date: 2026-11-26
Status: ready to pull back (`git subtree pull`); based on living-hokkaido
main `db1bb2c`.

## What changed per step

| Step | Commit | What |
|---|---|---|
| Sync | `194f4bf` | Your version from living-hokkaido, unchanged. |
| 5 Gallery captions | `abc8d4d` | `core/captions.ts`: the 12 types from `content/otaru-slope.md`, in order down the street, each with its sources; a building of the matching mesh kind is preferred. Wall-label card in `render/hud.ts` (your optional patch, extended): serif title, research label line, a dry game line, "Illustrative · research preview", "n of 12"; slides in at the top right for 2 s, fades only with reduced motion; announced in the aria-live region. The top meter now wraps clear of the mute button on phones. |
| 6 Real street | `cc19d05` | `core/facades.ts` (pure, tested) picks each building's look; `world/street.ts` draws it. Labelled buildings follow the research: fire walls and plastered shutters, clock shop (tuff, clock, band balcony, arched doors, 2 roof creatures), brick rice merchant, glass wares in the glass workshop, lamp-filled lamp hall, bank columns and turrets, 8 roof creatures, hotel attic storey, three made-up painted marks (none a real family's). Seeded fire walls, marks and shutters elsewhere. New gas lamps, footprint trails, polished ice patches, slightly warmer ambient. **Meshes only; no collider changed.** |
| 7 Make it funny | `1fd1d11` | Arms on shoulder pivots windmill with the wobble and hard leans (flail in a crash). Close calls show a guide line in the caption card ("A daring interpretation.", footer "Style points") instead of a toast. A shopfront crash into a glass workshop (found from the crash position, `core/where.ts`) plays a wind-chime shatter and shows "Do not touch the art.". About 60 % of tourists raise a camera as you approach and flash at 2 m (no flash with reduced motion), with a shutter sound. Static tourist cameras moved from the merged street into the view. |
| 8 Shareable score | `595bc55` | `core/score.ts` (tested): daily seed (YYYYMMDD), share link with only `?seed=`, clean streak (obstacles passed since the last snow pile), style points (25 per close call + 5 per streak step), museum-style run titles ("Untitled (Descent), 2026"). `render/scorecard.ts`: 1080×1920 PNG with a mid-tumble still (or the canal arrival), title, distance and best, captions of 12, style points, the same-slope link; "Share" (share sheet on touch devices that can share files) or "Download image" button on the end card. Score and title announced. Standalone page (`main.ts`) uses today's seed by default and keeps a local best per seed in localStorage. |

## Changes after Erina's playtest

- Slower: air drag 0.004 → 0.0058 → 0.008 → 0.012 (three playtest rounds),
  so top speed is about 8–16 m/s instead of 20–27 (time to take in the
  street and read the signs). The wobble now starts at 5 m/s and is at
  full strength by 14 m/s (was 9–23), so the sway and windmilling arms
  still show at the slower speed.
  Bot test still passes.
- Caption cards: only the title and a short fact (`SHORTS` in
  `core/captions.ts`, e.g. "c. 1895 · Stone, tiles, fire walls"), larger
  type; the dry game line is gone from the card. Full research labels and
  sources stay in `GALLERY`.
- Close calls: every one still scores and ticks, but the guide comments
  only on the first, then at most every 25 s, never over a gallery card
  (`shouldComment` in `core/style.ts`).
- Tourist photos: bigger camera on a visible arm, turned toward the
  slider; the photo and a larger flash happen 6 m ahead instead of 2 m,
  while the tourist is in view.
- Start button: "Begin sliding".
- Caption cards no longer show "Illustrative · research preview"
  (Erina's call after playtesting). Note for Lukas: the hand-off asked for
  it on every card; the score card and the honesty labels elsewhere still
  say it. Re-add with the `footer` field in `render/hud.ts` if needed.
- Smoother keyboard steering: the lean eases in (exponential, capped at
  5/s; A → D takes about half a second), sideways damping 0.8 → 1.2 so
  taps don't zigzag, and the game takes keyboard focus back when a run
  starts (a clicked card button used to take focus with it, so A/D/S
  stopped working).
- Brace (Space / S / ↓) made noticeable: 3.4 → 5 m/s², steering keeps 70 %
  instead of 50 % while bracing, the figure crouches, and a skate scrape
  plays. Space never presses a focused button (it used to toggle sound
  after clicking "Sound on"); the game takes focus back on any game key
  and after the sound toggle.
- Exhibit names show with a capital first letter, in words
  (`displayLabel`: "herring-boxes" → "Herring boxes").
- End card: the stats line is just distance and best (captions, noticed
  and style points are on the score card). An exhibit with no claim text
  shows only its name; the standalone page no longer passes placeholder
  text.

## Japanese version

- Every player-facing string is in `src/i18n/index.ts` (English and
  Japanese tables): start and crash cards, HUD, touch pad, sound button,
  gallery captions (the 12 types, e.g. 卯建のある商家 · 1895年頃・石、瓦、卯建),
  close-call lines, run titles, score card, share text, screen-reader
  announcements, the no-WebGL message. Title: 坂道で転ばないでください.
- New optional prop `lang?: "en" | "ja"` (default "en"); the game sets
  `lang` on its host element for screen readers. The standalone page uses
  `?lang=ja`, else the browser language. No italics in Japanese.
- Language button (日本語 / English) in the corner of the start and end
  cards. New optional prop `onLangChange?: (lang) => void`: the game shows
  the button only when it is given and calls it with the other language;
  the host remounts with the new `lang`. The standalone page does that and
  keeps the choice in `?lang=`.
- Start line now includes people: "Please do not touch the exhibits or
  the people." / 「展示物や人には手を触れないでください。」
- Controls made obvious: keycap legend on the start and end cards (A D or
  ← → steer, S / ↓ / Space brace, Enter start, trackpad/mouse note), a 4 s
  key reminder as the first two runs start, and two-finger trackpad
  swipes now steer (sideways scroll is captured so it never swipes the
  browser back). Swipe direction follows macOS natural scrolling; not
  tried on a real trackpad.
- A touch faster: drag 0.012 → 0.010 (top ≈ 9–17 m/s). The bot now brakes
  above 13 m/s (was 15) and still finishes all 8 streets.
- Canal ending: reaching the canal no longer stops you. You slide to the
  embankment edge, are launched off it with a forward flip (arms
  flailing), splash down (sound, ripple ring, droplets; ring only with
  reduced motion) and float upright, bobbing, head above the water. The
  camera follows the flight, then drops to just above the water; the end
  card rises from the bottom (no key diagram, max 56 % high) with the
  figure visible above it; the score-card still is taken at the splash.
  Physics in `physics/world.ts` (`flyOff`, `flying`, `floating`), tested.
- More, and more local, obstacles: parked rickshaws (人力車), stacked
  herring crates (鰊箱), children's sleds (ソリ) and two-ball snowmen
  (雪だるま), with names and crash lines in both languages. Rows are denser
  further down (up to three per row near the canal) and never overlap;
  the guaranteed lane keeps every street finishable (bot test, 8 seeds).
- Compared with photos (Wikimedia Commons: old Bank of Japan branch, the
  old Otaru Warehouse, the music-box museum, Sakaimachi street views) and
  adjusted: warmer soft stone with pale mortar, white plaster window frames
  on warehouses, hip roof + red-brick gatehouse + 2.5× roof creatures +
  vents on the gated warehouse, stone surrounds/strips/arched door/parapet
  on the brick merchant, light-grey stucco and pedimented end bays on the
  bank, pale clapboard western houses, shop eaves with red lanterns on some
  warehouses.
- Browser auto-translate is off for the game (`translate="no"`, Google
  notranslate meta): a machine-translated Japanese page looked like a
  broken English one. English start button: "Start to slide". The
  Space/Enter line is gone from the key diagram. Tourist crash line:
  "Please apologise." instead of "part of the exhibit".
- Buildings rebuilt after the real Otaru building types
  (`world/buildings.ts`, one shape per `Form` in `core/facades.ts`):
  stone storehouse-style shop with plaster fire shutters and udatsu, tuff
  clock shop with arched ground floor and band balcony, red-brick merchant
  with stone bands and quoins, lattice-fronted machiya, glass shop in a
  stone warehouse, gable-to-street warehouses with iron doors, lamp hall,
  stucco bank with pilasters and copper domes, gated warehouse with eight
  roof creatures, flat-roofed early-Showa hotel, canal warehouse. Otaru
  soft-stone colour, kawara roof-tile and brick textures. Still generic
  and illustrative: no real names, logos or family marks; meshes only,
  colliders unchanged (bot test passes).
- Key diagram redone: WASD and arrow keys as two familiar blocks, W and
  ↑ greyed out ("No W or ↑: gravity does the rest"), each key labelled
  Left / Brace / Right.
- Mobile: touch buttons hide while a card is open (they covered the card
  buttons in landscape), compact card on short screens (max-height 500
  px), smaller top bar on narrow screens, notch safe areas, no double-tap
  zoom, touch hint names the ◀ ▶ and Brace buttons, keyboard reminder
  only on keyboard devices. Checked in Chromium phone emulation (375×812
  portrait, 740×360 landscape), not on a real phone.
- Shorter crash lines where the second sentence fell flat (lamp post,
  crate, any exhibit, glass workshop), in both languages.
- Chika reviewed the finish line: 「係員には落ち着くよう伝えてあります」
  did not read; now 「係員一同、驚きを隠せません。」.
- **Needs review:** the rest of the Japanese is a draft by Claude, not checked by a
  native speaker. Chika should review it (especially the gallery facts and
  the jokes) before visitors see it. Tests check every table has all 12
  captions, short enough, and that game lines state no years or eras.

## Prop and event changes

All new props are optional; `src/integration/contracts.ts`:

- `best?: number` (default 0): best distance on this slope; the host keeps it.
- `shareUrl?: string` (default none): link for the share text and card; must carry only the seed.
- `onRunEnd?: (run: RunSummary) => void`: called at the end of every run (`seed, distance, finished, captions, closeCalls, streak, style, title`).
- `FindInfo.image?: { src, alt, credit }` (in `core/exhibits.ts`): a real
  photo of an exhibit, shown on the end card with its credit. The host
  supplies it with rights cleared; the standalone page passes none yet.
- `onScoreCard?: (card: Blob) => void`: host takes the PNG; without it the game shares or downloads.

No new events. `activity.complete` is unchanged (once, score 0–1). `mountSlope` still reads no URL and no storage. No new dependencies.

## Tested

- `npm run check` (typecheck, Biome, oxlint, 74 Vitest tests, build) before every commit. `src/physics/bot.test.ts` passes on every step: the bot still reaches the canal on 8 seeds, so physics and colliders are unchanged.
- Browser: the desktop app's built-in Chromium pane at desktop size and at 390×844, after every step. Checked: caption 1 and 2 cards and announcements; the labelled buildings (fire walls, clock shop, glass wares, bank, marks, gas lamps, footprints, ice patches); a glass-workshop crash (chime caption, "Glass workshop" card); arms flailing and flying out when leaning hard; the end card's Download button (download intercepted to view the 1080×1920 card); daily seed; local best surviving a reload. No console errors on clean loads.

## Not finished / not verified

- Not playtested at full speed: the preview pane throttles to ~2 fps when hidden, so the 2-second caption timing and the feel are unchecked.
- The real share sheet was not tested (no phone); only the download path.
- Tourist camera raise and flash are only covered by timing tests; too small to confirm in screenshots.
- Roof creatures and turrets sit above the low chase camera, so they mostly show from a distance.
- Dev `?at=N` starts fire the captions for skipped buildings at once (dev only).
- The research is a preview: every label line needs a reviewer (see the Unsure points in `content/otaru-slope.md`).
- Older open milestones (CLAUDE.md): ragdoll (M4), phone tilt (M6), canal ending (M7).
