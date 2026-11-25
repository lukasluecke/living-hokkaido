// Backup demo video recorder. Plays a scenario (scenario.ts) in Chromium and
// records the page as video, so we have a clean take if the live demo fails.
//
//   npm run build && npm run start          # in one terminal
//   npm run demo:record                     # in another
//   npm run demo:record -- --captions --pace 1.3 --scenario visitor
//
// Options: --base <url> (default http://localhost:3000), --out <dir>
// (default recordings/), --size 1920x1080, --pace <x> (wait multiplier),
// --captions (burn subtitles into the page), --headed, --fresh-journal off.
// Output: <out>/<scenario>-<time>.webm (+ .mp4 when ffmpeg is on PATH) and
// .chapters.txt with time codes. Playwright video has no sound: add the
// soundtrack in the edit (the /sound page plays every cue), or use a screen
// recorder with system audio for a take with sound.
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Locator, type Page } from "playwright";
import { type Step, scenarios } from "./scenario";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : "true";
}

const base = arg("base", "http://localhost:3000") as string;
const outDir = arg("out", "recordings") as string;
const [width, height] = (arg("size", "1920x1080") as string)
  .split("x")
  .map(Number);
const pace = Number(arg("pace", "1"));
const captions = arg("captions") === "true";
const scenarioName = arg("scenario", "visitor") as string;

// A visible cursor (headless video shows none) and a caption bar.
const OVERLAY = `
(() => {
  const add = () => {
    const c = document.createElement("div");
    c.id = "__demo-cursor";
    c.style.cssText = "position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(255,214,120,.55);border:2px solid rgba(90,60,20,.7);box-shadow:0 1px 6px rgba(0,0,0,.3);pointer-events:none;z-index:2147483647;transition:transform .12s;";
    document.body.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => { c.style.transform = "scale(.7)"; }, true);
    addEventListener("mouseup", () => { c.style.transform = ""; }, true);
    const cap = document.createElement("div");
    cap.id = "__demo-caption";
    cap.style.cssText = "position:fixed;left:50%;bottom:6%;transform:translateX(-50%);max-width:70%;padding:.5em 1em;border-radius:.5em;background:rgba(20,16,12,.72);color:#fff8ec;font:500 28px/1.35 system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .3s;pointer-events:none;z-index:2147483646;";
    document.body.appendChild(cap);
  };
  if (document.body) add(); else addEventListener("DOMContentLoaded", add);
})();`;

async function moveTo(page: Page, target: Locator, steps = 25) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error("target has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps,
  });
  await page.waitForTimeout((steps > 10 ? 180 : 40) * pace);
}

async function caption(page: Page, text: string, ms: number) {
  if (!captions) return;
  await page.evaluate(
    ([t, d]) => {
      const el = document.getElementById("__demo-caption");
      if (!el) return;
      el.textContent = t;
      el.style.opacity = "1";
      const w = window as unknown as { __capT?: number };
      clearTimeout(w.__capT);
      w.__capT = window.setTimeout(() => {
        el.style.opacity = "0";
      }, d);
    },
    [text, ms] as const,
  );
}

async function run(page: Page, steps: Step[], started: number) {
  const chapters: string[] = [];
  for (const [i, s] of steps.entries()) {
    const label = `${i + 1}/${steps.length} ${s.do}`;
    try {
      if (s.do === "goto") await page.goto(new URL(s.path, base).toString());
      else if (s.do === "click" || s.do === "hover") {
        const t = page.getByRole(s.role ?? "button", { name: s.name }).first();
        await t.waitFor({ state: "visible", timeout: 10_000 });
        await moveTo(page, t);
        if (s.do === "click") await t.click();
      } else if (s.do === "clickEach") {
        const all = page.locator(s.selector);
        const n = await all.count();
        for (let k = 0; k < n; k++) {
          await moveTo(page, all.nth(k), 6);
          await all.nth(k).click();
          await page.waitForTimeout(s.gapMs * pace);
        }
      } else if (s.do === "key") await page.keyboard.press(s.key);
      else if (s.do === "wait") await page.waitForTimeout(s.ms * pace);
      else if (s.do === "caption")
        await caption(page, s.text, (s.ms ?? 3500) * pace);
      else if (s.do === "chapter") {
        const sec = (Date.now() - started) / 1000;
        const tc = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${(sec % 60).toFixed(1).padStart(4, "0")}`;
        chapters.push(`${tc} ${s.title}`);
      }
      console.log(`ok   ${label}`);
    } catch (err) {
      console.error(`FAIL ${label}: ${(err as Error).message.split("\n")[0]}`);
      throw err;
    }
  }
  return chapters;
}

async function main() {
  const steps = scenarios[scenarioName];
  if (!steps) throw new Error(`No scenario "${scenarioName}" in scenario.ts`);
  try {
    await fetch(base);
  } catch {
    throw new Error(
      `${base} does not answer. Start the app first: npm run build && npm run start`,
    );
  }
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({
    headless: arg("headed") !== "true",
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    recordVideo: { dir: outDir, size: { width, height } },
  });
  await context.addInitScript(OVERLAY);
  const page = await context.newPage();
  const started = Date.now();
  let chapters: string[] = [];
  let failed = false;
  try {
    chapters = await run(page, steps, started);
  } catch {
    failed = true;
  }
  const video = page.video();
  await context.close();
  await browser.close();
  const raw = await video?.path();
  if (!raw) throw new Error("No video was written");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = join(outDir, `${scenarioName}-${stamp}${failed ? "-FAILED" : ""}`);
  renameSync(raw, `${file}.webm`);
  writeFileSync(`${file}.chapters.txt`, `${chapters.join("\n")}\n`);
  try {
    execFileSync("ffmpeg", [
      ...["-hide_banner", "-loglevel", "error", "-y", "-i", `${file}.webm`],
      ...["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18"],
      ...["-movflags", "+faststart", `${file}.mp4`],
    ]);
    console.log(`video: ${file}.mp4`);
  } catch {
    console.log("ffmpeg not found or failed: keeping .webm only");
  }
  console.log(`video: ${file}.webm\nchapters: ${file}.chapters.txt`);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exitCode = 1;
});
