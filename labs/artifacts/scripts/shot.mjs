// Usage: node scripts/shot.mjs <query> <out.png> [w] [h] [wait]
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const [q, out, w = "1600", h = "1000", wait = "2500"] = process.argv.slice(2);
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto(`http://localhost:5199/?${q}`);
await p.waitForTimeout(+wait);
await p.screenshot({ path: out });
if (errs.length) console.log("ERRORS:\n" + errs.slice(0, 8).join("\n"));
await b.close();
