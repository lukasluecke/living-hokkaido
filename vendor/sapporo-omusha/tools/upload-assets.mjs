#!/usr/bin/env node
// Upload the web-ready museum assets to the deployed site's private bucket, through the server.
// Sends only what the app uses: assets/figures/*/model-web.glb and assets/*.sog|*.spz.
//
// Needs, in the environment or a git-ignored .env.deploy file:
//   OMUSHA_URL    e.g. https://omusha-production.up.railway.app
//   APP_PASSWORD  the site password
//   UPLOAD_TOKEN  the upload token (Railway variable on the omusha service)
//
//   node tools/upload-assets.mjs              # upload
//   node tools/upload-assets.mjs --dry-run    # list what would be uploaded
//   node tools/upload-assets.mjs --list       # list what is in the bucket
//   node tools/upload-assets.mjs --delete-all # take every asset down
import fs from 'node:fs';
import path from 'node:path';

try { process.loadEnvFile(path.join(import.meta.dirname, '..', '.env.deploy')); } catch { /* use the environment */ }
const root = path.join(import.meta.dirname, '..', 'assets');
const args = process.argv.slice(2);
const { OMUSHA_URL, APP_PASSWORD, UPLOAD_TOKEN } = process.env;
if (!args.includes('--dry-run') && !(OMUSHA_URL && APP_PASSWORD && UPLOAD_TOKEN)) {
  console.error('Set OMUSHA_URL, APP_PASSWORD and UPLOAD_TOKEN (or put them in .env.deploy).');
  process.exit(1);
}
const headers = {
  authorization: 'Basic ' + Buffer.from(`team:${APP_PASSWORD}`).toString('base64'),
  'x-upload-token': UPLOAD_TOKEN,
};
const call = async (method, key, body) => {
  const res = await fetch(`${OMUSHA_URL.replace(/\/$/, '')}/assets/${key}`, { method, headers, body });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${key}: ${res.status} ${text}`);
  return text;
};

if (args.includes('--list')) { console.log(await call('GET', '?list')); process.exit(0); }
if (args.includes('--delete-all')) { console.log(await call('DELETE', '*')); process.exit(0); }

const files = [];
for (const f of fs.readdirSync(root)) if (/\.(sog|spz)$/i.test(f)) files.push(f);
const figs = path.join(root, 'figures');
if (fs.existsSync(figs)) for (const d of fs.readdirSync(figs)) {
  if (fs.existsSync(path.join(figs, d, 'model-web.glb'))) files.push(`figures/${d}/model-web.glb`);
}
let total = 0;
for (const key of files) {
  const body = fs.readFileSync(path.join(root, key));
  total += body.length;
  if (args.includes('--dry-run')) { console.log(`would upload ${key} (${(body.length / 1048576).toFixed(1)} MB)`); continue; }
  console.log(await call('PUT', key, body));
}
console.log(`${files.length} file(s), ${(total / 1048576).toFixed(1)} MB${args.includes('--dry-run') ? ' (dry run)' : ' uploaded'}.`);
