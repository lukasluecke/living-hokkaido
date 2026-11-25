#!/usr/bin/env node
// Photos of a figure -> clean front and back views on white, ready for Hyper3D Rodin.
//
// Layout (one folder per figure, under assets/figures by default):
//   assets/figures/interpreter/photo-1.jpg     one or more photos of the real figure
//   assets/figures/interpreter/notes.txt       optional: what must not change, e.g.
//                                              "black hair; dark robe with white curved pattern on hem"
//   assets/figures/interpreter/front.txt       optional: the photos show only the BACK; the back view
//                                              is made from them and the front from this description
//   assets/figures/_style/front.png            optional: a turnaround you liked, used as a
//   assets/figures/_style/back.png             framing/style reference for every figure
//
// Output per figure: front.png, back.png, turnaround.json (provenance).
//
// Usage:
//   $env:GEMINI_API_KEY = "<key from Google AI Studio>"
//   node tools/turnarounds.mjs                       # every figure folder that has no front.png yet
//   node tools/turnarounds.mjs interpreter aizu-officer
//   node tools/turnarounds.mjs --force interpreter   # redo
//   node tools/turnarounds.mjs --dir path/to/figures
import fs from 'node:fs/promises';
import path from 'node:path';

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-nano-banana-2.1';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const CONCURRENCY = 3;
const PHOTO_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;
const OUTPUTS = new Set(['front.png', 'back.png']);

const args = process.argv.slice(2);
const force = args.includes('--force');
const dirFlag = args.indexOf('--dir');
const root = path.resolve(dirFlag >= 0 ? args[dirFlag + 1] : path.join(import.meta.dirname, '..', 'assets', 'figures'));
const only = args.filter((a, i) => !a.startsWith('--') && !(dirFlag >= 0 && i === dirFlag + 1));

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('Set GEMINI_API_KEY first (create one at https://aistudio.google.com/apikey).');
  process.exit(1);
}

const RULES = `
Rules:
- This is a reference sheet for 3D reconstruction of a museum diorama figurine.
- Keep the figure exactly as photographed: same pose, proportions, face, hair colour and hairstyle,
  garment colours, and every garment pattern and border. Do not redesign, simplify, embellish or
  "correct" patterns, and do not add jewellery, objects or text.
- Full figure, centred, filling about 85% of the frame height, straight-on orthographic-style view,
  camera at the figure's mid-height.
- Pure white background (#FFFFFF), soft even studio lighting, no cast shadow, no floor, no plinth,
  no display glass, reflections or glare.
- Painted figurine material, as in the photo. Not a photo of a real person.`;

const FRONT = (notes) => `Create a clean FRONT view of the figurine in the photo(s).${RULES}${notes}`;

// Back-only photos (front.txt present): the back is drawn from the photos, the front from a description.
const BACK_FROM_PHOTOS = (notes) => `The photo(s) show this figurine from BEHIND. Create a clean BACK view of it,
exactly as photographed.${RULES}${notes}`;
const FRONT_FROM_BACK = (notes, front) => `The first image is the back view of a figurine. Create the FRONT view of the
same figurine, as if it were turned 180 degrees: same scale, framing, pose, hair colour and robe.
The front was never photographed. For what cannot be seen, follow this description: ${front}
Continue the robe's colours and pattern style naturally onto the front; do not add new kinds of motif.${RULES}${notes}`;
const BACK = (notes) => `Create the BACK view of the same figurine, as if it were turned 180 degrees.
The first image is the front view you must match exactly (scale, framing, pose, colours).
Where the back is not visible in the photos, continue only what is clearly implied (garment shape,
hair) and keep surfaces plain rather than inventing new patterns or details.${RULES}${notes}`;

const mimeOf = (file) => ({ '.png': 'image/png', '.webp': 'image/webp', '.heic': 'image/heic', '.heif': 'image/heif' })[path.extname(file).toLowerCase()] || 'image/jpeg';
const imagePart = async (file) => ({ inline_data: { mime_type: mimeOf(file), data: (await fs.readFile(file)).toString('base64') } });
const exists = (p) => fs.access(p).then(() => true, () => false);

async function generate(prompt, imageFiles) {
  const parts = [{ text: prompt }, ...(await Promise.all(imageFiles.map(imagePart)))];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '3:4', imageSize: '2K' } },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      const out = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
      const data = out?.inlineData?.data || out?.inline_data?.data;
      if (data) return Buffer.from(data, 'base64');
      const why = body.candidates?.[0]?.finishReason || body.promptFeedback?.blockReason || 'no image returned';
      throw new Error(`Gemini returned no image (${why})`);
    }
    const msg = body.error?.message || `HTTP ${res.status}`;
    if (res.status === 429 && /limit: 0|per day/i.test(msg)) {
      throw new Error('No image quota on this API key. Image models need billing turned on for the key\'s project in Google AI Studio.');
    }
    if (res.status === 429 || res.status >= 500) {
      console.warn(`  retry ${attempt}/3 after: ${msg}`);
      await new Promise((r) => setTimeout(r, 5000 * attempt));
      continue;
    }
    throw new Error(msg);
  }
  throw new Error('Gemini kept failing after 3 attempts');
}

async function processFigure(dir, style) {
  const name = path.basename(dir);
  const files = await fs.readdir(dir);
  const photos = files.filter((f) => PHOTO_EXT.test(f) && !OUTPUTS.has(f)).sort().map((f) => path.join(dir, f));
  if (!photos.length) return console.log(`- ${name}: no photos, skipped`);
  if (!force && (await exists(path.join(dir, 'front.png')))) return console.log(`- ${name}: already done (use --force to redo)`);

  const notesFile = path.join(dir, 'notes.txt');
  const notesText = (await exists(notesFile)) ? (await fs.readFile(notesFile, 'utf8')).trim() : '';
  const notes = notesText ? `\nDetails that must match: ${notesText}` : '';
  const styleNote = style.length ? '\nThe last image(s) are a style reference for framing and background only; take nothing else from them.' : '';

  const frontDescFile = path.join(dir, 'front.txt');
  const frontDesc = (await exists(frontDescFile)) ? (await fs.readFile(frontDescFile, 'utf8')).trim() : '';
  const frontFile = path.join(dir, 'front.png');
  const backFile = path.join(dir, 'back.png');

  console.log(`- ${name}: ${photos.length} photo(s)${frontDesc ? ', back only (front from front.txt)' : ''}…`);
  if (frontDesc) {
    await fs.writeFile(backFile, await generate(BACK_FROM_PHOTOS(notes) + styleNote, [...photos, ...style.slice(1, 2)]));
    await fs.writeFile(frontFile, await generate(FRONT_FROM_BACK(notes, frontDesc) + styleNote, [backFile, ...photos, ...style.slice(0, 1)]));
  } else {
    await fs.writeFile(frontFile, await generate(FRONT(notes) + styleNote, [...photos, ...style.slice(0, 1)]));
    await fs.writeFile(backFile, await generate(BACK(notes) + styleNote, [frontFile, ...photos, ...style.slice(1, 2)]));
  }

  await fs.writeFile(path.join(dir, 'turnaround.json'), JSON.stringify({
    figure: name,
    model: MODEL,
    created: new Date().toISOString(),
    sourcePhotos: photos.map((p) => path.basename(p)),
    notes: notesText || null,
    frontDescription: frontDesc || null,
    styleReference: style.map((p) => path.relative(root, p)),
    label: frontDesc
      ? 'AI-generated reference views. Back from photos of a museum figurine; FRONT INVENTED from a written description (never photographed).'
      : 'AI-generated reference views from photos of a museum figurine; unseen sides inferred.',
  }, null, 2) + '\n');
  console.log(`  ${name}: front.png and back.png written`);
}

const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => {
  console.error(`No figures folder at ${root}`);
  process.exit(1);
});
const styleDir = path.join(root, '_style');
const style = (await exists(styleDir))
  ? ['front.png', 'back.png'].map((f) => path.join(styleDir, f))
  : [];
for (const f of [...style]) if (!(await exists(f))) style.splice(style.indexOf(f), 1);

const figures = entries
  .filter((e) => e.isDirectory() && !e.name.startsWith('_') && (!only.length || only.includes(e.name)))
  .map((e) => path.join(root, e.name));
if (!figures.length) {
  console.log('No figure folders found.');
  process.exit(0);
}

console.log(`${figures.length} figure(s), model ${MODEL}${style.length ? ', with style reference' : ''}`);
let failed = 0;
const queue = [...figures];
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
  while (queue.length) {
    const dir = queue.shift();
    try { await processFigure(dir, style); } catch (err) { failed++; console.error(`  ${path.basename(dir)} failed: ${err.message}`); }
  }
}));
console.log(failed ? `Done with ${failed} failure(s).` : 'Done.');
process.exit(failed ? 1 : 0);
