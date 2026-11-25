// Japanese versions of the character sheets and the seed observations, for the 日本語 view.
//
//   node tools/translate-ja.mjs      # needs GEMINI_API_KEY
//
// Writes characters/1808/ja.json and envelopes/ja.json. The English record stays the original;
// these are machine translations and are labelled as such in the app until someone reviews them.
// Observations added later through the app are translated by the server when first viewed.
import fs from 'node:fs';
import path from 'node:path';
import { translateJa } from '../translate.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
if (!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) { console.error('Set GEMINI_API_KEY first.'); process.exit(1); }

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'characters/1808/index.json'), 'utf8')).characters;
const sheets = index.map((id) => JSON.parse(fs.readFileSync(path.join(ROOT, `characters/1808/${id}.json`), 'utf8')));
const observations = fs.readFileSync(path.join(ROOT, 'envelopes/observations.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

// Flatten everything into id -> English text, translate in one pass, then rebuild.
const items = {};
for (const c of sheets) {
  items[`c.${c.id}.role`] = c.role;
  if (c.appearance) items[`c.${c.id}.appearance`] = c.appearance;
  if (c.model?.label) items[`c.${c.id}.modelLabel`] = c.model.label;
  (c.declines || []).forEach((d, i) => { items[`c.${c.id}.declines.${i}`] = d; });
}
for (const o of observations) {
  items[`o.${o.id}.claim`] = o.claim;
  if (o.note) items[`o.${o.id}.note`] = o.note;
  if (o.absence?.note) items[`o.${o.id}.absenceNote`] = o.absence.note;
  if (o.source?.ref) items[`o.${o.id}.sourceRef`] = o.source.ref;
}
console.log(`Translating ${Object.keys(items).length} strings…`);
const ja = await translateJa(items);

const characters = {};
for (const c of sheets) {
  characters[c.id] = {
    role: ja[`c.${c.id}.role`],
    ...(c.appearance && { appearance: ja[`c.${c.id}.appearance`] }),
    ...(c.model?.label && { modelLabel: ja[`c.${c.id}.modelLabel`] }),
    declines: (c.declines || []).map((_, i) => ja[`c.${c.id}.declines.${i}`]),
  };
}
const obs = {};
for (const o of observations) {
  obs[o.id] = {
    claim: ja[`o.${o.id}.claim`],
    ...(o.note && { note: ja[`o.${o.id}.note`] }),
    ...(o.absence?.note && { absenceNote: ja[`o.${o.id}.absenceNote`] }),
    ...(o.source?.ref && { sourceRef: ja[`o.${o.id}.sourceRef`] }),
  };
}
const meta = { machine: true, model: process.env.GEMINI_MODEL || 'gemini-3.5-flash', translatedAt: new Date().toISOString(), reviewed: false };
fs.writeFileSync(path.join(ROOT, 'characters/1808/ja.json'), JSON.stringify({ ...meta, characters }, null, 2) + '\n');
fs.writeFileSync(path.join(ROOT, 'envelopes/ja.json'), JSON.stringify({ ...meta, observations: obs }, null, 2) + '\n');
const missing = Object.keys(items).filter((k) => !ja[k]);
console.log(`Wrote characters/1808/ja.json and envelopes/ja.json${missing.length ? ` (${missing.length} missing: ${missing.join(', ')})` : ''}`);
