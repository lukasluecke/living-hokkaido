// Screenshots of each kind mid-interaction. Needs `npm run dev` on :5201.
// Usage: node scripts/shots.mjs [outDir]
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const out = process.argv[2] ?? "shots";
const b = await chromium.launch();
const errs = [];
const page = async (q, w = 1280, h = 860) => {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(`http://localhost:5201/?${q}`);
  await p.waitForTimeout(400);
  return p;
};
const shot = (p, name) => p.screenshot({ path: `${out}/${name}.jpg`, quality: 82, type: "jpeg" });

// Story: play into the second line, then reach the first pause.
let p = await page("a=story");
await p.getByRole("button", { name: "Play" }).click();
await p.waitForTimeout(3600);
await shot(p, "story-captions");
await p.getByText("What next?").waitFor({ timeout: 15000 });
await shot(p, "story-pause");
await p.getByRole("button", { name: "How do we know?" }).click();
await p.close();

// Words: listen cards, then match two of three.
p = await page("a=words");
await p.getByRole("button", { name: "I said it aloud" }).first().click();
await shot(p, "words-listen");
await p.getByRole("tab", { name: /Match/ }).click();
await p.getByRole("button", { name: "fiber", exact: true }).click();
await p.getByRole("button", { name: "Object: inner bark fibers" }).click();
await p.getByRole("button", { name: "garment", exact: true }).click();
await p.getByRole("button", { name: /Object: cloth woven/ }).click();
await p.getByRole("button", { name: "garment", exact: true }).click();
await shot(p, "words-match");
await p.close();

// Trace: link all four sentences.
p = await page("a=trace");
for (const [claim, src] of [
  ["Inner bark fibers", "Hokkaido Digital Museum"],
  ["Clothing varies", "Hokkaido Digital Museum"],
  ["Sketch geometry", "editorial policy"],
]) {
  await p.getByRole("button", { name: new RegExp(claim) }).click();
  await p.getByRole("button", { name: new RegExp(src) }).click();
}
await shot(p, "trace-progress");
await p.getByRole("button", { name: /Check consent/ }).click();
await p.getByRole("button", { name: /editorial policy/ }).click();
await shot(p, "trace-done");
await p.close();

// Phone width.
p = await page("a=story", 390, 844);
await shot(p, "story-mobile");
await p.close();

console.log(errs.length ? `ERRORS:\n${errs.join("\n")}` : "no page errors");
await b.close();
