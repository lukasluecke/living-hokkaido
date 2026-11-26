// Backup demo video recorder. Drives the /shell flow from steps.ts and records
// a fixed-size video. Run `npm run demo:video -- --help` for options.
import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Locator,
  type Page,
} from "playwright";
import type { Shot, Step, Target } from "./dsl";
import { installOverlay } from "./overlay";
import {
  phoneOmushaPreroll,
  phonePreroll,
  phoneShots,
  phoneSkipPreroll,
} from "./phone";
import { preroll as deskPreroll, shots as deskShots } from "./steps";
import { installVirtualClock } from "./vclock";

const HELP = `Backup demo video recorder

  npm run demo:video [-- options]

Output: recordings/demo-<time>.mp4 (needs ffmpeg; else .webm) + markers.

  --url <url>         Use a running app (default: start one on port 3100)
  --dev               Start "next dev" instead of a production build
  --no-build          Reuse the last "next build" (.next) when starting the app
  --size <WxH>        Viewport and video size (default 1920x1080)
  --headed            Show the browser window (real GPU, best for WebGL)
  --browser <name>    chromium (default) | chrome | msedge (installed browser)
  --capture <mode>    playwright (default) | frames (virtual clock, one
                      screenshot per frame: smooth video on a slow or
                      software GPU, renders slower than real time) | none
                      (drive only; record with
                      OBS / QuickTime / Cmd+Shift+5, which also gets audio)
  --shots <a,b>       Only these shots, in this order
  --with <a,b>        Add shots that are off by default (e.g. timelapse)
  --skip <a,b>        Leave out these shots
  --speed <n>         Multiply holds and moves (default 1; 0.5 = faster)
  --captions          Show caption steps as on-screen text
  --no-cursor         Hide the drawn cursor
  --reduced-motion    Emulate prefers-reduced-motion
  --rehearse          No video, speed 0.3: check that the flow still works
  --fps <n>           Frame rate for --capture frames (default 30)
  --ask-fixture <f>   Answer POST /api/ask from a JSON file of recorded
                      replies ({"<question>": <reply>}); other questions
                      go to the app as usual
  --state-out <file>  Save cookies and localStorage (the journal) at the end
  --state-in <file>   Start with a saved state: record a long flow in parts
                      (--shots a,b --state-out s.json, then --shots c,d
                      --state-in s.json) and join the MP4s with ffmpeg
  --phone             Phone shot list (phone.ts) in a 390x844 portrait
                      viewport: touch, mobile mode, 2x pixel ratio
  --phone-omusha      With --phone --shots omusha: skip the tour to the
                      Omusha step first (a separate take on a real GPU)
  --phone-skip <n>    With --phone: skip the first n tour steps before the
                      take (4 = slope), to record a later part on its own
  --media-dir <dir>   Serve /api/museum-assets/<key> from this folder
                      (owl-story.mp4, omusha-mobile.sog; not in Git)
  --out <dir>         Output folder (default recordings)
  --list              List the shots and exit
`;

const { values: opt } = parseArgs({
  options: {
    url: { type: "string" },
    dev: { type: "boolean", default: false },
    "no-build": { type: "boolean", default: false },
    size: { type: "string" },
    phone: { type: "boolean", default: false },
    "phone-omusha": { type: "boolean", default: false },
    "phone-skip": { type: "string" },
    "media-dir": { type: "string" },
    headed: { type: "boolean", default: false },
    browser: { type: "string", default: "chromium" },
    capture: { type: "string", default: "playwright" },
    shots: { type: "string" },
    with: { type: "string" },
    skip: { type: "string" },
    speed: { type: "string" },
    captions: { type: "boolean", default: false },
    "no-cursor": { type: "boolean", default: false },
    "reduced-motion": { type: "boolean", default: false },
    rehearse: { type: "boolean", default: false },
    out: { type: "string", default: "recordings" },
    fps: { type: "string", default: "30" },
    "ask-fixture": { type: "string" },
    "state-in": { type: "string" },
    "state-out": { type: "string" },
    list: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: false,
});

const shots = opt.phone ? phoneShots : deskShots;
const preroll = opt["phone-skip"]
  ? phoneSkipPreroll(Number(opt["phone-skip"]))
  : opt["phone-omusha"]
    ? phoneOmushaPreroll
    : opt.phone
      ? phonePreroll
      : deskPreroll;

const csv = (s?: string) =>
  s
    ?.split(",")
    .map((x) => x.trim())
    .filter(Boolean) ?? [];

if (opt.help) {
  console.log(HELP);
  process.exit(0);
}
if (opt.list) {
  for (const s of shots)
    console.log(
      `${s.enabled === false ? "  (off)" : "       "} ${s.id.padEnd(12)} ${s.title}  [${s.steps.length} steps]`,
    );
  process.exit(0);
}

const [width, height] = (opt.size ?? (opt.phone ? "390x844" : "1920x1080"))
  .split("x")
  .map(Number);
if (!width || !height) throw new Error(`Bad --size "${opt.size}" (use WxH)`);
const speed = Number(opt.speed ?? (opt.rehearse ? 0.3 : 1));
const capture = opt.rehearse ? "none" : opt.capture;
if (capture !== "playwright" && capture !== "none" && capture !== "frames")
  throw new Error(`Bad --capture "${opt.capture}"`);

function selectShots(): Shot[] {
  const only = csv(opt.shots);
  const extra = new Set(csv(opt.with));
  const skip = new Set(csv(opt.skip));
  const known = new Set(shots.map((s) => s.id));
  for (const id of [...only, ...extra, ...skip])
    if (!known.has(id)) throw new Error(`Unknown shot "${id}" (see --list)`);
  const list = only.length
    ? only.map((id) => shots.find((s) => s.id === id) as Shot)
    : shots.filter((s) => s.enabled !== false || extra.has(s.id));
  return list.filter((s) => !skip.has(s.id));
}

// ---- app server -----------------------------------------------------------

const PORT = 3100;
let server: ChildProcess | null = null;

async function isUp(url: string) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return r.status < 500;
  } catch {
    return false;
  }
}

async function ensureApp(): Promise<string> {
  if (opt.url) {
    if (!(await isUp(opt.url))) throw new Error(`No app at ${opt.url}`);
    return opt.url.replace(/\/$/, "");
  }
  const base = `http://localhost:${PORT}`;
  if (await isUp(base)) {
    console.log(`Using the app already running at ${base}`);
    return base;
  }
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  if (!opt.dev) {
    const reuse = opt["no-build"] && existsSync(".next/BUILD_ID");
    if (!reuse) {
      console.log("Building the app (next build)…");
      const b = spawnSync(npx, ["next", "build"], { stdio: "inherit" });
      if (b.status !== 0) throw new Error("next build failed");
    }
  }
  const args = opt.dev
    ? ["next", "dev", "-p", String(PORT)]
    : ["next", "start", "-p", String(PORT)];
  console.log(`Starting ${args.slice(0, 2).join(" ")} on ${base}…`);
  server = spawn(npx, args, {
    stdio: ["ignore", "ignore", "inherit"],
    detached: process.platform !== "win32",
  });
  for (let i = 0; i < 240; i++) {
    if (await isUp(base)) return base;
    if (server.exitCode !== null) throw new Error("The app server exited");
    await sleep(500);
  }
  throw new Error("The app server did not start in 120 s");
}

function stopApp() {
  if (!server || server.exitCode !== null) return;
  try {
    if (server.pid && process.platform !== "win32")
      process.kill(-server.pid, "SIGTERM");
    else server.kill();
  } catch {}
}
process.on("exit", stopApp);
process.on("SIGINT", () => process.exit(130));

// ---- browser --------------------------------------------------------------

function gpuArgs(): string[] {
  const args = [
    "--ignore-gpu-blocklist",
    "--enable-gpu-rasterization",
    // Ambient sound may start without a click (for OS-recorder takes).
    "--autoplay-policy=no-user-gesture-required",
  ];
  if (process.platform === "darwin") args.push("--use-angle=metal");
  return args;
}

async function launch(): Promise<Browser> {
  const channel = opt.browser === "chromium" ? undefined : opt.browser;
  try {
    return await chromium.launch({
      headless: !opt.headed,
      channel,
      args: gpuArgs(),
    });
  } catch (err) {
    const msg = String(err);
    if (msg.includes("Executable doesn't exist"))
      console.error(
        "\nNo Playwright browser found. Run once:  npx playwright install chromium\n" +
          "or use your installed Chrome:          npm run demo:video -- --browser chrome\n",
      );
    throw err;
  }
}

// ---- step runner ----------------------------------------------------------

const realSleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const fps = Number(opt.fps) || 30;
const frameMs = 1000 / fps;
/** Frame mode: the page clock, in ms, as last advanced by the pump. */
const vclock = { on: false, now: 0 };
/** Waits page time in frame mode (after warm-up), real time otherwise. */
async function sleep(ms: number) {
  if (!vclock.on) return realSleep(ms);
  const end = vclock.now + ms;
  while (vclock.on && vclock.now < end) await realSleep(15);
}
/** Video time: page time in frame mode, wall time otherwise. */
const clockNow = () => (vclock.on ? vclock.now : Date.now());
/** Real-time timeouts must cover the slow frames of frame mode. */
const tmo = (ms: number) => (capture === "frames" ? ms * 40 : ms);
const scaled = (ms: number) => Math.max(0, Math.round(ms * speed));

type Ctx = {
  page: Page;
  base: string;
  mouse: { x: number; y: number };
  seen: Map<string, number>;
  t0: number;
  markers: { at: number; label: string }[];
};

function locate(page: Page, t: Target): Locator {
  if ("role" in t)
    return page.getByRole(t.role, { name: t.name, exact: t.exact ?? true });
  if ("text" in t) return page.getByText(t.text);
  if ("label" in t) return page.getByLabel(t.label);
  if ("testId" in t) return page.getByTestId(t.testId);
  return page.locator(t.css);
}

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** Glide the real mouse (and the drawn cursor) to x/y. */
async function glide(c: Ctx, x: number, y: number, ms: number) {
  const steps = Math.max(1, Math.round(scaled(ms) / 16));
  const { x: sx, y: sy } = c.mouse;
  for (let i = 1; i <= steps; i++) {
    const k = easeInOut(i / steps);
    await c.page.mouse.move(sx + (x - sx) * k, sy + (y - sy) * k);
    if (steps > 1) await sleep(scaled(ms) / steps);
  }
  c.mouse = { x, y };
}

async function centreOf(c: Ctx, t: Target, timeoutMs: number) {
  const loc = locate(c.page, t).first();
  await loc.waitFor({ state: "visible", timeout: timeoutMs });
  await loc.scrollIntoViewIfNeeded({ timeout: timeoutMs });
  const box = await loc.boundingBox();
  if (!box) throw new Error("Target has no box");
  return { loc, x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

const hasHook = (page: Page) =>
  page.evaluate(
    () =>
      typeof (window as { __livingHokkaido?: { emit?: unknown } })
        .__livingHokkaido?.emit === "function",
  );

function describe(s: Step): string {
  const t = "target" in s && s.target ? JSON.stringify(s.target) : "";
  const extra =
    s.do === "press"
      ? s.key
      : s.do === "hold"
        ? `${s.ms}ms`
        : s.do === "waitForEvent"
          ? s.type
          : s.do === "emit"
            ? s.event.type
            : s.do === "mark"
              ? s.label
              : s.do === "caption"
                ? s.text
                : "";
  return `${s.do} ${t || extra}`.trim();
}

async function runStep(c: Ctx, s: Step): Promise<void> {
  const { page } = c;
  switch (s.do) {
    case "goto":
      await page.goto(c.base + s.path, { waitUntil: "networkidle" });
      return;
    case "click":
    case "hover": {
      const { loc, x, y } = await centreOf(
        c,
        s.target,
        tmo(s.timeoutMs ?? 8000),
      );
      await glide(c, x, y, s.moveMs ?? 700);
      if (s.do === "hover") return;
      await sleep(scaled(s.pauseMs ?? 150));
      // Real mouse click at the cursor, so the ripple shows. If something
      // covers the element, fall back to a locator click.
      const hit = await loc.evaluate(
        (el, p) => el.contains(document.elementFromPoint(p.x, p.y)),
        { x, y },
      );
      if (hit && !(s.do === "click" && s.synthetic))
        await page.mouse.click(x, y);
      // Frame mode: 3D labels move every frame, so Playwright never sees
      // them "stable"; send the click to the element itself.
      else if (capture === "frames" || (s.do === "click" && s.synthetic))
        await loc.dispatchEvent("click");
      else await loc.click({ timeout: 3000 });
      return;
    }
    case "press":
      await page.keyboard.press(s.key);
      return;
    case "type": {
      const { loc, x, y } = await centreOf(c, s.target, tmo(8000));
      await glide(c, x, y, 600);
      await loc.focus({ timeout: tmo(3000) });
      for (const ch of s.text) {
        await page.keyboard.type(ch);
        await sleep(scaled(s.charMs ?? 55));
      }
      return;
    }
    case "drag": {
      let start = s.target
        ? await centreOf(c, s.target, tmo(5000))
        : { x: width / 2, y: height / 2 };
      if (s.target && s.at) {
        const box = await locate(c.page, s.target).first().boundingBox();
        if (box)
          start = {
            ...start,
            x: box.x + box.width * s.at[0],
            y: box.y + box.height * s.at[1],
          };
      }
      await glide(c, start.x, start.y, 500);
      // No text selection while dragging over HTML (the stub parts).
      const noSelect = await page.addStyleTag({
        content: "*{user-select:none!important}",
      });
      try {
        await page.mouse.down();
        await glide(c, start.x + s.by[0], start.y + s.by[1], s.ms ?? 1500);
        await page.mouse.up();
      } finally {
        await noSelect.evaluate((el) => (el as Element).remove());
        await page.evaluate(() => window.getSelection()?.removeAllRanges());
      }
      return;
    }
    case "wheel": {
      const n = Math.max(1, Math.round(scaled(s.ms ?? 800) / 16));
      for (let i = 0; i < n; i++) {
        await page.mouse.wheel(0, s.dy / n);
        await sleep(16);
      }
      return;
    }
    case "waitFor": {
      const loc = locate(page, s.target).first();
      const state = s.state ?? "visible";
      await loc.waitFor({ state, timeout: tmo(s.timeoutMs ?? 8000) });
      // Bring a new panel on screen (matters for the stacked HTML stubs).
      if (state === "visible")
        await loc.evaluate((el) =>
          el.scrollIntoView({ behavior: "smooth", block: "nearest" }),
        );
      return;
    }
    case "waitForEvent": {
      if (!(await hasHook(page))) {
        await sleep(scaled(s.fallbackMs ?? 1500));
        return;
      }
      const after = c.seen.get(s.type) ?? 0;
      const handle = await page.waitForFunction(
        ({ type, after }) => {
          const log = (window as { __demoEvents?: { type: string }[] })
            .__demoEvents;
          const n = log?.filter((e) => e.type === type).length ?? 0;
          return n > after ? n : false;
        },
        { type: s.type, after },
        { timeout: tmo(s.timeoutMs ?? 10000), polling: 100 },
      );
      c.seen.set(s.type, (await handle.jsonValue()) as number);
      return;
    }
    case "emit": {
      if (!(await hasHook(page)))
        throw new Error("emit needs the shell test hook (see HANDBACK.md)");
      await page.evaluate((e) => {
        (
          window as { __livingHokkaido?: { emit: (e: unknown) => void } }
        ).__livingHokkaido?.emit(e);
      }, s.event);
      return;
    }
    case "hold":
      await sleep(scaled(s.ms));
      return;
    case "caption":
    case "captionClear":
      if (!opt.captions) return;
      await page.evaluate(
        (text) =>
          (
            window as { __demo?: { caption: (t: string | null) => void } }
          ).__demo?.caption(text),
        s.do === "caption" ? s.text : null,
      );
      return;
    case "mark":
      c.markers.push({ at: (clockNow() - c.t0) / 1000, label: s.label });
      return;
  }
}

/** Runs a step with fallback/optional handling. Returns false on hard fail. */
async function run(c: Ctx, s: Step, where: string): Promise<boolean> {
  try {
    await runStep(c, s);
    return true;
  } catch (err) {
    const why = String(err).split("\n")[0];
    if (s.fallback) {
      console.warn(`  ~ ${where}: ${describe(s)} failed, trying fallback`);
      if (await run(c, s.fallback, `${where} (fallback)`)) return true;
    }
    if (s.optional) {
      console.warn(`  ~ ${where}: skipped optional ${describe(s)} (${why})`);
      return true;
    }
    console.error(`  ✗ ${where}: ${describe(s)}\n    ${why}`);
    await c.page
      .screenshot({
        path: path.resolve(opt.out ?? "recordings", "failed-step.png"),
      })
      .catch(() => {});
    return false;
  }
}

// ---- frame mode -----------------------------------------------------------

/**
 * Drives the page's virtual clock (vclock.ts). Before `record` it follows
 * wall time, so the warm-up loads at normal speed. After `record` every step
 * moves the clock by one frame and pipes one screenshot to ffmpeg.
 */
function startPump(page: Page) {
  let stopping = false;
  const sink: { p: ChildProcess | null } = { p: null };
  let frames = 0;
  let file = "";
  const advance = (ms: number) =>
    page.evaluate(
      (d) =>
        (
          window as { __vclock?: { advance: (n: number) => number } }
        ).__vclock?.advance(d) ?? 0,
      ms,
    );
  const loop = (async () => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Animation.enable").catch(() => {});
    let last = Date.now();
    let rate = 1;
    while (!stopping) {
      try {
        const out = sink.p;
        if (!out) {
          const now = Date.now();
          await advance(Math.min(100, now - last));
          last = now;
          await realSleep(16);
          continue;
        }
        const t = Date.now();
        vclock.now = await advance(frameMs);
        await page.evaluate(
          (d) =>
            (
              window as {
                __vclock?: { media: (n: number) => Promise<number> };
              }
            ).__vclock?.media(d),
          frameMs,
        );
        const shot = await page.screenshot({ type: "jpeg", quality: 92 });
        const ok = out.stdin?.write(shot);
        if (!ok) await new Promise((r) => out.stdin?.once("drain", r));
        frames++;
        if (frames % (fps * 5) === 0)
          console.log(`  · ${(frames / fps).toFixed(0)} s of video`);
        // CSS transitions run on wall time: slow them to one frame per step.
        const next = Math.min(1, Math.max(0.01, frameMs / (Date.now() - t)));
        if (Math.abs(next - rate) / rate > 0.15) {
          rate = next;
          await cdp
            .send("Animation.setPlaybackRate", { playbackRate: rate })
            .catch(() => {});
        }
      } catch (err) {
        if (stopping || page.isClosed()) break;
        console.warn(`  ~ frame: ${String(err).split("\n")[0]}`);
        await realSleep(50);
      }
    }
  })();
  return {
    /** Start writing frames to an MP4 (needs ffmpeg on PATH). */
    async record(mp4: string) {
      file = mp4;
      sink.p = spawn(
        "ffmpeg",
        [
          ...["-y", "-loglevel", "error", "-f", "image2pipe"],
          ...["-framerate", String(fps), "-c:v", "mjpeg", "-i", "-"],
          ...["-c:v", "libx264", "-preset", "medium", "-crf", "18"],
          ...["-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4],
        ],
        { stdio: ["pipe", "ignore", "inherit"] },
      );
      vclock.now = await advance(0);
      vclock.on = true;
    },
    async stop() {
      stopping = true;
      await loop;
      vclock.on = false;
      const p = sink.p;
      if (p) {
        await new Promise((r) => {
          p.on("close", r);
          p.stdin?.end();
        });
      }
      return { frames, file };
    },
  };
}

// ---- main -----------------------------------------------------------------

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function main() {
  const selected = selectShots();
  const base = await ensureApp();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.resolve(opt.out ?? "recordings");
  const rawDir = path.join(outDir, ".raw");
  mkdirSync(rawDir, { recursive: true });

  const browser = await launch();
  let context: BrowserContext | null = null;
  let ok = true;
  const ctx: Partial<Ctx> = {};
  try {
    context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: opt.phone ? 2 : 1,
      ...(opt.phone ? { isMobile: true, hasTouch: true } : {}),
      reducedMotion: opt["reduced-motion"] ? "reduce" : "no-preference",
      ...(opt["state-in"] ? { storageState: opt["state-in"] } : {}),
      ...(capture === "playwright"
        ? { recordVideo: { dir: rawDir, size: { width, height } } }
        : {}),
    });
    // Playwright and frame captures have no sound. Web Audio can also crash
    // a headless browser without an audio device (seen in a Linux
    // container at the slope game), so the page gets no AudioContext.
    if (capture !== "none" || opt.rehearse)
      await context.addInitScript({
        content:
          "Object.defineProperty(window, 'AudioContext', { value: undefined });" +
          "Object.defineProperty(window, 'webkitAudioContext', { value: undefined });",
      });
    if (capture === "frames")
      await context.addInitScript({
        content: `var __name = (f) => f; (${installVirtualClock.toString()})();`,
      });
    if (opt["ask-fixture"]) {
      const replies = JSON.parse(
        readFileSync(opt["ask-fixture"], "utf8"),
      ) as Record<string, unknown>;
      await context.route("**/api/ask", async (route) => {
        const req = route.request();
        const q =
          req.method() === "POST"
            ? (req.postDataJSON() as { question?: string } | null)?.question
            : undefined;
        const reply = q ? replies[q.trim()] : undefined;
        if (reply === undefined) return route.continue();
        await realSleep(1200); // about the live round trip
        await route.fulfill({ json: reply });
      });
    }
    const mediaDir = opt["media-dir"];
    if (mediaDir) {
      // Large museum media live in R2, not in Git. Serve local copies.
      await context.route("**/api/museum-assets/*", async (route) => {
        const key = new URL(route.request().url()).pathname.split("/").pop();
        const file = key && path.join(mediaDir, key);
        if (
          !file ||
          !/^[a-z0-9-]+\.(sog|spz|mp4|webm)$/.test(key) ||
          !existsSync(file)
        )
          return route.continue();
        await route.fulfill({
          status: 200,
          contentType: key.endsWith(".mp4")
            ? "video/mp4"
            : key.endsWith(".webm")
              ? "video/webm"
              : "application/octet-stream",
          body: route.request().method() === "HEAD" ? "" : readFileSync(file),
        });
      });
    }
    // Passed as source text with a __name shim: tsx (esbuild) adds __name()
    // calls to functions, and that helper does not exist in the page.
    await context.addInitScript({
      content: `var __name = (f) => f; (${installOverlay.toString()})(${JSON.stringify({ cursor: !opt["no-cursor"], touch: opt.phone })});`,
    });
    const page = await context.newPage();
    const pageStart = Date.now();
    const pump = capture === "frames" ? startPump(page) : null;
    Object.assign(ctx, {
      page,
      base,
      mouse: { x: width * 0.6, y: height * 0.6 },
      seen: new Map(),
      t0: pageStart,
      markers: [],
    });
    const c = ctx as Ctx;

    console.log("Warm-up (not in the final video)…");
    for (const s of preroll)
      if (!(await run(c, s, "preroll"))) throw new Error("Warm-up failed");
    await page.mouse.move(c.mouse.x, c.mouse.y);
    // Let shaders compile and the first frames settle.
    await sleep(2000);
    console.log(
      (await hasHook(page))
        ? "Shell test hook found: event waits are exact."
        : "No shell test hook: event waits use fixed delays (see HANDBACK.md).",
    );

    if (capture === "none" && !opt.rehearse && process.stdin.isTTY) {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      await rl.question("Start your screen recorder, then press Enter… ");
      rl.close();
      await page.evaluate(() =>
        (
          window as { __demo?: { countdown: (n: number) => Promise<void> } }
        ).__demo?.countdown(3),
      );
    }

    if (pump) await pump.record(path.join(outDir, `demo-${stamp}.mp4`));
    c.t0 = clockNow();
    const trim = (c.t0 - pageStart) / 1000;
    for (const shot of selected) {
      console.log(`▶ ${shot.id}: ${shot.title}`);
      for (const [i, s] of shot.steps.entries())
        if (!(await run(c, s, `${shot.id}#${i + 1}`))) {
          ok = false;
          break;
        }
      if (!ok) break;
    }
    await sleep(scaled(800));

    const duration = (clockNow() - c.t0) / 1000;
    if (pump) {
      const name = `demo-${stamp}${ok ? "" : "-FAILED"}`;
      const done = await pump.stop();
      const mp4 = path.join(outDir, `${name}.mp4`);
      if (!ok) renameSync(done.file, mp4);
      console.log(`\nVideo: ${mp4} (${done.frames} frames at ${fps} fps)`);
      writeFileSync(
        path.join(outDir, `${name}.markers.json`),
        `${JSON.stringify({ size: `${width}x${height}`, duration, markers: c.markers }, null, 2)}\n`,
      );
      writeFileSync(
        path.join(outDir, `${name}.chapters.txt`),
        `${c.markers.map((m) => `${fmt(m.at)} ${m.label}`).join("\n")}\n`,
      );
    }
    if (opt["state-out"])
      await context.storageState({ path: opt["state-out"] });
    const video = page.video();
    await context.close();
    context = null;
    const markers = c.markers;
    if (capture === "playwright" && video) {
      const name = `demo-${stamp}${ok ? "" : "-FAILED"}`;
      const webm = path.join(rawDir, `${name}.webm`);
      renameSync(await video.path(), webm);
      const mp4 = path.join(outDir, `${name}.mp4`);
      const ff = spawnSync(
        "ffmpeg",
        [
          ...["-y", "-loglevel", "error", "-ss", trim.toFixed(2), "-i", webm],
          ...["-t", duration.toFixed(2), "-r", "30", "-c:v", "libx264"],
          ...["-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p"],
          ...["-movflags", "+faststart", mp4],
        ],
        { stdio: "inherit" },
      );
      if (ff.status === 0) console.log(`\nVideo: ${mp4}`);
      else
        console.log(
          `\nffmpeg not found or failed. Raw video: ${webm}\nCut the first ${trim.toFixed(2)} s (warm-up) when you edit it.`,
        );
      writeFileSync(
        path.join(outDir, `${name}.markers.json`),
        `${JSON.stringify({ size: `${width}x${height}`, duration, markers }, null, 2)}\n`,
      );
      writeFileSync(
        path.join(outDir, `${name}.chapters.txt`),
        `${markers.map((m) => `${fmt(m.at)} ${m.label}`).join("\n")}\n`,
      );
      console.log(`Markers: ${path.join(outDir, `${name}.chapters.txt`)}`);
    }
    console.log(
      `${ok ? "Done" : "Stopped at a failed step"} in ${duration.toFixed(1)} s.`,
    );
  } finally {
    await context?.close().catch(() => {});
    await browser.close().catch(() => {});
  }
  process.exitCode = ok ? 0 : 1;
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(stopApp);
