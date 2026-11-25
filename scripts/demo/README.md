# Backup demo video recorder

Records a clean take of the visitor flow, as a backup for the live demo.

```sh
npm run build && npm run start      # terminal 1 (or npm run dev)
npm run demo:record                 # terminal 2
npm run demo:record -- --captions --pace 1.3
```

- The steps are in `scenario.ts` (`visitor`). Edit, reorder, add captions,
  or add a new scenario and run it with `--scenario <name>`. Button names
  come from the content pack, so content changes follow.
- Options: `--base <url>` (default `http://localhost:3000`), `--out <dir>`
  (default `recordings/`, git-ignored), `--size 1920x1080`, `--pace <x>`
  (scales all waits), `--captions` (subtitles in the page), `--headed`.
- Output: `<scenario>-<time>.webm`, `.mp4` (if ffmpeg is on PATH) and
  `.chapters.txt` (time codes for the edit). A failed step stops the take
  and names the file `-FAILED`.
- A visible cursor is drawn into the page, because headless video has none.
- Playwright video has **no sound**. Add the soundtrack in the edit, or for
  a take with sound use a screen recorder with system audio while
  `--headed` runs.
- First run on a new machine: `npx playwright install chromium`.
