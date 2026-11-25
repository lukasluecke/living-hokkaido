# Out of Place: status and open work (2026-11-26)

Cozy hide-and-seek in historical Hokkaido scenes (Phaser 3 + TypeScript + Vite).
Rules for contributors and agents: [CLAUDE.md](CLAUDE.md). Integration notes for
living-hokkaido: [HANDBACK.md](HANDBACK.md).

## Run
```bash
npm install
npm run dev      # http://localhost:5173 (add ?speed=20 to fast-forward timers)
npm run check    # typecheck, Biome, oxlint, tests, build
```

## Done
- **M0 skeleton:** a pure round reducer (`src/core/round.ts`) with tests.
- **M1 first playable:** one human hider (Nuri) with brush (S/M/L), eyedropper, fill, undo,
  zoom and 3 poses; a pass-and-play handoff screen; seeking with a −10s penalty per miss;
  win/lose rules.
- **Reveal (most of M5):** freeze, slow zoom, synthesised sting, a FOUND! stamp or a
  "Master of Disguise" victory pose, and a card with what gave the hider away plus one
  cited fact.
- **Clips (most of M7):** Save clip records a 10-second, 9:16 MP4/WebM replay of the reveal.
  Phones get the share sheet; computers get a download.
- **Scenes (part of M6):** Otaru herring warehouse and a Meiji street in Sapporo (c. 1889),
  plus a scene select screen. Every scene is in Hokkaido.
- **Content:** history comes only from cited claims (`content/scenes/*/knowledge.ts`),
  labelled "research preview". Research notes: `scenes/*.md` and
  `content/scenes/otaru-herring-warehouse/facts.md`.
- **Accessibility:** full keyboard path, aria-live announcements, reduced motion, and a
  Canvas 2D fallback when WebGL is off.
- **living-hokkaido-ready:** `mountOutOfPlace(el, props)` takes living-hokkaido-shaped
  props and reports through `emit` events; `contract-proposal.ts` holds the proposed
  `hide-seek` activity kind.

## Open stages (in order)
1. **Bot hiders and the magnifier** (left over from M1).
2. **M2:** 2–4 players on one device, plus wardrobe pieces (period clothing) for the hider.
3. **M4:** poses that match scene activities, and a bot seeker weighted by blend score and
   anachronism tags.
4. **M5 rest:** a slow-motion replay of the find from a recorded event timeline, and
   illustrated history cards.
5. **M6 rest:** 1–3 more Hokkaido scenes (process in CLAUDE.md: research → `scenes/<id>.md`
   → claims → art), music, and real art instead of the code-drawn placeholders.
6. **M7 rest:** a PNG history card.
7. **M8:** online multiplayer, with an authoritative server reusing `src/core`.

## Known issues / not verified
- **Not tested on real devices:** sound, the Save clip share sheet, and phone layouts.
  Small text on phones; the crouch pose looks rough.
- **No real-GPU fps numbers:** the dev browser pane throttled frames, so fps couldn't be
  measured.
- **Banner overlap:** the Sapporo clock tower's peak sits under the top banner during the
  opening and disguise.
- **Facts not reviewed:** a historian (Chika, on the living-hokkaido team) should review
  every claim. Locators are coarse ("page text").

## Decisions waiting on others (living-hokkaido)
- **Lukas** to approve the `hide-seek` contract change.
- Whether Hokkaido merchant/settler scenes fit the Ainu-centred story pack.
- Whether the game's UI should use living-hokkaido's tokens inside their activity panel.
- Whether Phaser (~320 KB gzip, loaded lazily) is acceptable as a dependency.
- Hooking the stings up to living-hokkaido's audio engine.
- Nothing in the living-hokkaido repo has been changed.
