# Backup demo video recorder

Drives the `/shell` visitor flow with Playwright and records a fixed-size
video (default 1920×1080, 30 fps MP4). Use it as the backup if the live demo
fails, or as raw footage for the submitted video.

## One command

```sh
npm install                       # once (adds Playwright)
npx playwright install chromium   # once, or use --browser chrome
npm run demo:video -- --headed    # build, start, record, stop
```

Output goes to `recordings/` (not in Git):

| File                       | What                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| `demo-<time>.mp4`          | H.264, 30 fps, warm-up cut off (needs `ffmpeg` on PATH: `brew install ffmpeg`) |
| `.raw/demo-<time>.webm`    | Raw Playwright capture, always kept                                            |
| `demo-<time>.chapters.txt` | `0:12 From bark to cloth` style markers for editing                            |
| `demo-<time>.markers.json` | Same markers with exact seconds                                                |

The script builds the app (`next build`) and starts `next start` on port
3100. If an app already runs on 3100 it uses that one. `--url` points at any
other running app, `--no-build` reuses the last build, `--dev` uses
`next dev` (slower, shows the dev badge).

## Smooth video on a laptop

- **`--headed`** uses the real GPU. Headless Chromium often renders WebGL in
  software, which drops frames. On macOS the script adds
  `--use-angle=metal`.
- **`--browser chrome`** uses your installed Google Chrome (no download).
- Close other heavy apps, plug in power. Do a `--rehearse` run first.
- A 1920×1080 viewport can be larger than a laptop screen. The video is still
  1920×1080, because Playwright captures the page, not the screen. For OS
  screen recording use `--size 1440x900` or an external display.
- Playwright video has **no audio**. For the ambient and interface sound, use
  `--headed --capture none` and record the window with OBS or QuickTime
  (with a loopback audio device). The script waits for Enter, shows a 3-2-1
  countdown, then plays the flow.
- If the Playwright capture stutters, the OS-recorder path above is the
  fallback. It gives the smoothest result because it records real frames.

## Shots

```sh
npm run demo:video -- --list
```

| Shot        | What it shows                                          |
| ----------- | ------------------------------------------------------ |
| `island`    | Island, slow orbit, pick the open location, owl flight |
| `scene`     | Roof-lift entry into the house                         |
| `artifact`  | Focus the cloth, turn it, open each hotspot            |
| `reveal`    | "How do we know?" card                                 |
| `activity`  | Weave activity                                         |
| `journal`   | Heritage Journal with the earned stamps                |
| `outro`     | Back out to the island                                 |
| `timelapse` | Season timelapse (off by default: `--with timelapse`)  |

Examples:

```sh
npm run demo:video -- --rehearse                    # fast dry run, no video
npm run demo:video -- --headed --with timelapse     # full flow + seasons
npm run demo:video -- --shots timelapse             # only the seasons shot
npm run demo:video -- --skip activity --speed 0.8   # shorter cut
npm run demo:video -- --captions                    # burn in caption steps
```

Shots run in order on one page, so `--shots scene` alone starts on the island
state that the shell has at that time. Start lists with `island` for a full
story.

## Change the flow

Edit **`steps.ts`** only. It is plain data built with helpers from `dsl.ts`:

```ts
click(button("How do we know?")),          // glide the cursor, then click
click(button("Close"), { fallback: press("Escape") }),
waitFor(region("How this was made"), { optional: true }),
waitForEvent("scene.ready", { fallbackMs: 500 }),
drag([300, 0], { ms: 2000, optional: true }), // turn a 3D object
hold(3000),                                 // keep the shot
caption("Explore the island"),              // only with --captions
mark("Journal"),                            // chapter marker
```

- Names come from the content pack (`@/content`), so renamed content does
  not break the run. Do not write cultural text in `steps.ts`; captions are
  for neutral UI hints only.
- `optional: true` keeps the recording going when a step does not match
  (it logs `~ skipped`). Use it for 3D-only steps such as drags.
- `fallback` runs another step when the first fails, for example a key
  press when a 3D part has no visible button.
- `--speed` scales holds and cursor moves.
- A failed required step stops the run and keeps the partial video as
  `demo-<time>-FAILED.mp4`.

## Shell test hook (optional, makes waits exact)

`waitForEvent` and `emit` work best with a small hook in the shell. Without
it, `waitForEvent` waits `fallbackMs` and `emit` steps fail. See
[HANDBACK.md](HANDBACK.md) for the exact change for the shell owner.

## Files

| File         | Role                                                         |
| ------------ | ------------------------------------------------------------ |
| `steps.ts`   | The shot list (edit this)                                    |
| `dsl.ts`     | Step types and builders, no Playwright import                |
| `record.ts`  | CLI: app server, browser, step runner, ffmpeg                |
| `overlay.ts` | In-page cursor, click ripple, captions, countdown, event log |

## Limits

- Tested in a Linux cloud container (headless, software WebGL) against the
  HTML stub parts on 2026-11-25. Not yet tested on macOS with a GPU or
  against the 3D parts.
- Playwright records at about 25 fps internally; the MP4 is resampled to a
  constant 30 fps. For true 60 fps use the `--capture none` path.
- The `activity` shot clicks every cell of the HTML weave stub. Update it
  when the D2 weave lands.
