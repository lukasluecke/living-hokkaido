const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const pages = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const out = process.argv[3];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  for (const [i, h] of pages.entries()) {
    fs.writeFileSync(`${out}/panel${i}.html`, h);
    await p.goto(`file://${out}/panel${i}.html`);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${out}/panel${i}.png` });
  }
  await b.close();
})();
