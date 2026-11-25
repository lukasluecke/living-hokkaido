// Load-time and frame-rate probe for the visitor app. Starts `next start`
// (or uses --url), opens / in a fresh browser with an empty cache, and
// reports: bytes on first load (by type), time to the first island frame,
// frames per second on the island and in a few places, and bytes that each
// place adds. Run `npm run build` first, then `npm run perf`.
//
// Headless Chromium draws WebGL in software (SwiftShader), so its frame rates
// stand for a slow laptop GPU, not a fast one. Use --headed for a real GPU.
import { type ChildProcess, spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { type CDPSession, chromium, type Page } from "playwright";

const { values: opt } = parseArgs({
  options: {
    url: { type: "string" },
    port: { type: "string", default: "3210" },
    headed: { type: "boolean", default: false },
    seconds: { type: "string", default: "4" },
    size: { type: "string", default: "1440x900" },
    json: { type: "string" },
    /** Extra query string for the page, for example "quality=low". */
    query: { type: "string" },
    places: {
      type: "string",
      default: "Lake house,Herring coast,Coal mountain",
    },
  },
});

type Bytes = Record<string, number>;
type Net = { bytes: Bytes; requests: number; files: [string, number][] };

function startServer(port: string): Promise<ChildProcess> {
  const child = spawn("npx", ["next", "start", "-p", port], {
    stdio: ["ignore", "pipe", "ignore"],
    detached: true,
  });
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error("next start timed out")),
      60_000,
    );
    child.stdout?.on("data", (d: Buffer) => {
      if (/Ready|started server|Local:/i.test(d.toString())) {
        clearTimeout(t);
        resolve(child);
      }
    });
    child.on("exit", (c) => reject(new Error(`next start exited ${c}`)));
  });
}

/** Encoded (on-the-wire) bytes per resource type, from CDP. */
function trackNet(cdp: CDPSession) {
  const types = new Map<string, string>();
  const urls = new Map<string, string>();
  let net: Net = { bytes: {}, requests: 0, files: [] };
  cdp.on("Network.responseReceived", (e) => {
    const url = e.response.url;
    const t = url.endsWith(".wasm")
      ? "wasm"
      : (e.type?.toLowerCase() ?? "other");
    types.set(e.requestId, t);
    urls.set(e.requestId, url);
  });
  cdp.on("Network.loadingFinished", (e) => {
    const t = types.get(e.requestId) ?? "other";
    net.bytes[t] = (net.bytes[t] ?? 0) + e.encodedDataLength;
    net.requests++;
    const u = urls.get(e.requestId) ?? "";
    if (t === "script" || t === "wasm")
      net.files.push([u.split("/").pop() ?? u, e.encodedDataLength]);
  });
  return {
    take(): Net {
      const out = net;
      net = { bytes: {}, requests: 0, files: [] };
      return out;
    },
  };
}

// Plain string, so tsx's helpers (`__name`) do not leak into the page.
const FPS_PROBE = `(ms) => new Promise((resolve) => {
  const gaps = [];
  let last = performance.now();
  const start = last;
  const tick = (now) => {
    gaps.push(now - last);
    last = now;
    if (now - start < ms) requestAnimationFrame(tick);
    else {
      gaps.sort((a, b) => a - b);
      resolve({
        fps: Math.round((gaps.length / (now - start)) * 10000) / 10,
        p95: Math.round(gaps[Math.floor(gaps.length * 0.95)] || 0),
      });
    }
  };
  requestAnimationFrame(tick);
})`;

async function fps(page: Page, seconds: number) {
  return (await page.evaluate(`(${FPS_PROBE})(${seconds * 1000})`)) as {
    fps: number;
    p95: number;
  };
}

const kb = (n = 0) => `${Math.round(n / 1024)} KB`;
const total = (b: Bytes) => Object.values(b).reduce((a, x) => a + x, 0);

async function main() {
  const server = opt.url ? null : await startServer(opt.port);
  const origin = opt.url ?? `http://localhost:${opt.port}`;
  const base = opt.query ? `${origin}/?${opt.query}` : origin;
  const [w, h] = (opt.size ?? "1440x900").split("x").map(Number);
  const secs = Number(opt.seconds);
  const browser = await chromium.launch({ headless: !opt.headed });
  const report: Record<string, unknown> = { base, size: opt.size };
  try {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    const net = trackNet(cdp);

    const t0 = Date.now();
    await page.goto(base, { waitUntil: "load" });
    const loadMs = Date.now() - t0;
    // First island frame: a canvas exists and has drawn (two rAFs later).
    await page.waitForSelector("canvas", { timeout: 60_000 });
    await page.evaluate(
      "new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))",
    );
    const firstFrameMs = Date.now() - t0;
    await page.waitForLoadState("networkidle");
    const first = net.take();
    report.firstLoad = {
      loadMs,
      firstFrameMs,
      requests: first.requests,
      bytes: first.bytes,
      total: total(first.bytes),
    };
    console.log(
      `First load: ${kb(total(first.bytes))} in ${first.requests} requests`,
    );
    for (const [t, b] of Object.entries(first.bytes))
      console.log(`  ${t.padEnd(12)} ${kb(b)}`);
    for (const [f, b] of first.files.sort((x, y) => y[1] - x[1]).slice(0, 6))
      console.log(`    ${f} ${kb(b)}`);
    console.log(
      `  load event ${loadMs} ms, first island frame ${firstFrameMs} ms`,
    );

    const island = await fps(page, secs);
    const tier = await page.evaluate(
      "(() => { try { return sessionStorage.getItem('lh-quality-v1') ?? 'full'; } catch { return '?'; } })()",
    );
    report.island = { ...island, tier };
    console.log(
      `Island: ${island.fps} fps (p95 frame ${island.p95} ms), quality ${tier}`,
    );

    const places: Record<string, unknown> = {};
    for (const name of (opt.places ?? "").split(",").filter(Boolean)) {
      const card = page
        .getByRole("navigation", { name: "Places on the island" })
        .getByRole("button", { name: new RegExp(`^${name}`) })
        .first();
      try {
        // A DOM click: at 1 fps Playwright's "stable element" check is slow.
        await card.dispatchEvent("click", undefined, { timeout: 10_000 });
        // Wait for the place to open (travel then scene), then settle.
        await page.waitForFunction(
          "!document.querySelector('[aria-label=\"Places on the island\"]')",
          undefined,
          { timeout: 30_000 },
        );
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1500);
        const added = net.take();
        const f = await fps(page, secs);
        places[name] = {
          ...f,
          tier: await page.evaluate(
            "(() => { try { return sessionStorage.getItem('lh-quality-v1') ?? 'full'; } catch { return '?'; } })()",
          ),
          addedBytes: total(added.bytes),
          addedFiles: added.files,
        };
        console.log(
          `${name}: ${f.fps} fps (p95 ${f.p95} ms), +${kb(total(added.bytes))}`,
        );
        for (const [file, b] of added.files
          .sort((x, y) => y[1] - x[1])
          .slice(0, 4))
          console.log(`    ${file} ${kb(b)}`);
        await page.keyboard.press("Escape");
        await page.keyboard.press("Escape");
        await page.waitForSelector('[aria-label="Places on the island"]', {
          timeout: 30_000,
        });
        await page.waitForTimeout(800);
        net.take();
      } catch (e) {
        console.log(
          `${name}: skipped (${(e as Error).message.split("\n")[0]})`,
        );
        await page.goto(base, { waitUntil: "load" });
        await page.waitForSelector("canvas", { timeout: 60_000 });
        net.take();
      }
    }
    report.places = places;
  } finally {
    await browser.close();
    // Kill the whole group: npx, next and its workers.
    if (server?.pid) process.kill(-server.pid, "SIGTERM");
  }
  if (opt.json) writeFileSync(opt.json, `${JSON.stringify(report, null, 2)}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
