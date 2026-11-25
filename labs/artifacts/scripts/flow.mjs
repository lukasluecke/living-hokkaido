// Interaction test: click cloth (loom model), drag to turn, click hotspot 1, put back.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("http://localhost:5199/?view=inspect&look=toon");
await p.waitForTimeout(2500);
await p.mouse.move(790, 440, { steps: 5 }); await p.mouse.down(); await p.mouse.up(); // cloth (loom model)
await p.waitForTimeout(1500);
const card = await p.locator("h2").textContent().catch(() => null);
console.log("picked card:", card);
await p.mouse.move(500, 500);
await p.mouse.down();
for (let i = 0; i < 10; i++) { await p.mouse.move(500 + i * 25, 500 + i * 3); await p.waitForTimeout(16); }
await p.mouse.up();
await p.waitForTimeout(400);
await p.screenshot({ path: "out/flow-turning.png" });
await p.waitForTimeout(1600);
const btns = p.locator("button[aria-label]");
const n = await btns.count();
const vis = [];
for (let i = 0; i < n; i++) vis.push(await btns.nth(i).evaluate((e) => `${e.getAttribute("aria-label")}:${e.style.opacity.slice(0,4)}`));
console.log("hotspots:", vis.join(" | "));
const first = btns.filter({ hasText: "1" }).first();
for (let i = 0; i < n; i++) { const b2 = btns.nth(i); if (Number(await b2.evaluate((e) => e.style.opacity)) > 0.5) { await b2.click(); break; } }
await p.waitForTimeout(500);
console.log("note:", (await p.locator("p").first().textContent()));
await p.screenshot({ path: "out/flow-note.png" });
await p.getByText("Put it back").click();
await p.waitForTimeout(1500);
console.log("after put back, card present:", await p.locator("h2").count());
console.log("errors:", errs);
await b.close();
