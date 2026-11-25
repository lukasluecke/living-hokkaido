// Usage: node scripts/shots.mjs <outDir> [name=query ...]
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW ?? "playwright");
const [out, ...pairs] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 760 }, deviceScaleFactor: 1 });
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("console:", m.text().slice(0, 300)); });
page.on("pageerror", (e) => console.log("pageerror:", e.message));
for (const pair of pairs) {
  const [name, q, wait = "6000"] = pair.split("|");
  await page.goto(`http://localhost:5180/?${q}`);
  await page.waitForTimeout(Number(wait));
  const stats = await page.evaluate(() => window.__lab?.stats);
  console.log(name, JSON.stringify(stats));
  await page.screenshot({ path: `${out}/${name}.png`, timeout: 180000 });
}
await browser.close();
