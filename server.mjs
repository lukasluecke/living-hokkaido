// Omusha 1808 web server.
//
// - Serves the app (src/), character sheets (characters/) and the sample capture (sample/).
// - Serves /assets/... (museum splat, figure models) from a private S3-compatible bucket when
//   BUCKET is set (Railway Buckets), otherwise from the local assets/ folder. These files are
//   reproductions of museum material and are never committed to the repository.
// - APP_PASSWORD turns on one shared password (HTTP Basic auth, any user name) for everything
//   except /healthz.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Readable } from 'node:stream';

try { process.loadEnvFile(); } catch { /* no .env */ }

const ROOT = import.meta.dirname;
const PORT = Number(process.env.PORT) || 8081;
const PUBLIC_DIRS = ['src', 'characters', 'sample'];
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary', '.sog': 'application/octet-stream', '.spz': 'application/octet-stream',
  '.ply': 'application/octet-stream', '.splat': 'application/octet-stream', '.ksplat': 'application/octet-stream',
};
const mimeOf = (p) => MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';

// ---- Password
const APP_PASSWORD = process.env.APP_PASSWORD || '';
const digest = (s) => createHash('sha256').update(s).digest();
const expected = APP_PASSWORD ? digest(APP_PASSWORD) : null;
function authorised(req) {
  if (!expected) return true;
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  return timingSafeEqual(digest(decoded.slice(decoded.indexOf(':') + 1)), expected);
}

// ---- Bucket (optional)
let s3 = null;
if (process.env.BUCKET) {
  const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    endpoint: process.env.ENDPOINT,
    region: process.env.REGION || 'auto',
    forcePathStyle: process.env.BUCKET_PATH_STYLE === 'true',
    credentials: { accessKeyId: process.env.ACCESS_KEY_ID, secretAccessKey: process.env.SECRET_ACCESS_KEY },
  });
  s3 = { client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, bucket: process.env.BUCKET };
}

// Uploads and deletes of assets need the site password AND this token (x-upload-token header).
const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN || '';
const tokenOk = (req) => UPLOAD_TOKEN && req.headers['x-upload-token'] &&
  timingSafeEqual(digest(String(req.headers['x-upload-token'])), digest(UPLOAD_TOKEN));
const ASSET_KEY = /^(figures\/[a-z0-9-]+\/model-web\.glb|[a-z0-9-]+\.(sog|spz))$/;

async function writeAsset(req, res, key) {
  if (!s3) { res.writeHead(501, { 'content-type': 'text/plain' }); return res.end('No bucket configured'); }
  if (!tokenOk(req)) { res.writeHead(403, { 'content-type': 'text/plain' }); return res.end('Upload token required'); }
  if (req.method === 'GET') { // listing: GET /assets/?list
    const out = await s3.client.send(new s3.ListObjectsV2Command({ Bucket: s3.bucket }));
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify((out.Contents || []).map((o) => ({ key: o.Key, size: o.Size }))));
  }
  if (req.method === 'DELETE' && key === '*') { // take everything down
    const out = await s3.client.send(new s3.ListObjectsV2Command({ Bucket: s3.bucket }));
    for (const o of out.Contents || []) await s3.client.send(new s3.DeleteObjectCommand({ Bucket: s3.bucket, Key: o.Key }));
    res.writeHead(200, { 'content-type': 'text/plain' }); return res.end(`Deleted ${(out.Contents || []).length}`);
  }
  if (!ASSET_KEY.test(key)) { res.writeHead(400, { 'content-type': 'text/plain' }); return res.end('Unexpected asset path'); }
  if (req.method === 'DELETE') {
    await s3.client.send(new s3.DeleteObjectCommand({ Bucket: s3.bucket, Key: key }));
    res.writeHead(204); return res.end();
  }
  const length = Number(req.headers['content-length']);
  if (!length) { res.writeHead(411); return res.end(); }
  await s3.client.send(new s3.PutObjectCommand({ Bucket: s3.bucket, Key: key, Body: req, ContentLength: length, ContentType: mimeOf(key) }));
  res.writeHead(201, { 'content-type': 'text/plain' }); res.end(`Stored ${key} (${length} bytes)`);
}

// ---- Envelope observations
// The seed record is in the repo (envelopes/observations.jsonl). Additions made through the app
// are appended to a separate store (bucket, or data/ locally) and never rewrite earlier lines.
const OBS_SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, 'envelopes', 'schema', 'observation.schema.json'), 'utf8'));
const ENUMS = {
  kind: OBS_SCHEMA.properties.kind.enum,
  stratum: OBS_SCHEMA.properties.stratum.enum,
  evidence: OBS_SCHEMA.properties.evidence.enum,
  perspective: OBS_SCHEMA.properties.perspective.enum,
  sourceType: OBS_SCHEMA.properties.source.properties.type.enum,
  role: OBS_SCHEMA.properties.standing.properties.role.enum,
  cause: OBS_SCHEMA.properties.absence.properties.cause.enum,
  audience: OBS_SCHEMA.properties.protocol.properties.audience.enum,
};
const ADDITIONS_KEY = 'observations/additions.jsonl';
const LOCAL_ADDITIONS = path.join(ROOT, 'data', 'additions.jsonl');
const parseLines = (text) => text.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));

async function readAdditions() {
  if (!s3) return fs.existsSync(LOCAL_ADDITIONS) ? fs.readFileSync(LOCAL_ADDITIONS, 'utf8') : '';
  try {
    const out = await s3.client.send(new s3.GetObjectCommand({ Bucket: s3.bucket, Key: ADDITIONS_KEY }));
    return await out.Body.transformToString();
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NoSuchKey') return '';
    throw err;
  }
}
async function writeAdditions(text) {
  if (!s3) { fs.mkdirSync(path.dirname(LOCAL_ADDITIONS), { recursive: true }); return fs.writeFileSync(LOCAL_ADDITIONS, text); }
  await s3.client.send(new s3.PutObjectCommand({ Bucket: s3.bucket, Key: ADDITIONS_KEY, Body: text, ContentType: 'application/x-ndjson' }));
}
async function allObservations() {
  const seed = parseLines(fs.readFileSync(path.join(ROOT, 'envelopes', 'observations.jsonl'), 'utf8'));
  return seed.concat(parseLines(await readAdditions()));
}

// Protocol gate: everyone signed in to this site is "team". Family- and community-only
// observations are withheld until per-person access exists.
const VISIBLE_TO_TEAM = new Set(['public', 'team']);
const visible = (o) => VISIBLE_TO_TEAM.has(o.protocol?.audience || 'public');

function validateNew(body, existing) {
  const s = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const errors = [];
  const o = {
    envelopes: Array.isArray(body.envelopes) ? body.envelopes.map((e) => s(e, 80)).filter(Boolean) : [],
    about: Array.isArray(body.about) ? body.about.map((a) => s(a, 80)).filter(Boolean) : [],
    kind: s(body.kind, 40), stratum: s(body.stratum, 40), claim: s(body.claim, 2000),
    source: { type: s(body.source?.type, 40), ref: s(body.source?.ref, 500) },
    evidence: s(body.evidence, 40),
    standing: { role: s(body.standing?.role, 40), grantedBy: s(body.standing?.grantedBy, 200) },
    perspective: s(body.perspective, 40) || 'project',
    protocol: { audience: s(body.protocol?.audience, 20) || 'public' },
    author: s(body.author, 120), note: s(body.note, 1000),
  };
  if (s(body.source?.quote, 300)) o.source.quote = s(body.source.quote, 300);
  if (!o.envelopes.length) errors.push('envelopes');
  if (!o.claim) errors.push('claim');
  if (!o.author) errors.push('author (your name)');
  if (!o.source.ref) errors.push('source');
  for (const [field, list] of [['kind', ENUMS.kind], ['stratum', ENUMS.stratum], ['evidence', ENUMS.evidence], ['perspective', ENUMS.perspective]]) {
    if (!list.includes(o[field])) errors.push(field);
  }
  if (!ENUMS.sourceType.includes(o.source.type)) errors.push('source type');
  if (!ENUMS.role.includes(o.standing.role)) errors.push('standing');
  if (!ENUMS.audience.includes(o.protocol.audience)) errors.push('audience');
  if (o.kind === 'absence') {
    o.absence = { cause: s(body.absence?.cause, 40), note: s(body.absence?.note, 500) };
    if (!ENUMS.cause.includes(o.absence.cause)) errors.push('absence cause');
  }
  if (body.supersedes) {
    o.supersedes = s(body.supersedes, 80);
    if (!existing.some((e) => e.id === o.supersedes)) errors.push('supersedes (unknown observation)');
  }
  if (!o.note) delete o.note;
  if (!o.about.length) delete o.about;
  if (!o.standing.grantedBy) o.standing.grantedBy = '';
  return { errors, o };
}

let appendQueue = Promise.resolve();
async function readJson(req, limit = 20000) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > limit) throw Object.assign(new Error('Too large'), { status: 413 }); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
const sendJson = (res, status, data) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(data)); };

async function handleApi(req, res, pathname) {
  if (pathname === '/api/envelopes' && req.method === 'GET') {
    return sendJson(res, 200, JSON.parse(fs.readFileSync(path.join(ROOT, 'envelopes', 'index.json'), 'utf8')));
  }
  if (pathname === '/api/observations' && req.method === 'GET') {
    return sendJson(res, 200, (await allObservations()).filter(visible));
  }
  if (pathname === '/api/observations' && req.method === 'POST') {
    let body;
    try { body = await readJson(req); } catch (err) { return sendJson(res, err.status || 400, { error: 'Send JSON' }); }
    // Serialise appends so two curators can't overwrite each other's line.
    const result = appendQueue.then(async () => {
      const existing = await allObservations();
      const { errors, o } = validateNew(body, existing);
      if (errors.length) return { status: 400, data: { error: `Missing or invalid: ${errors.join(', ')}` } };
      const full = { id: `obs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, ...o, status: 'unverified', createdAt: new Date().toISOString() };
      await writeAdditions((await readAdditions()) + JSON.stringify(full) + '\n');
      return { status: 201, data: full };
    });
    appendQueue = result.catch(() => {});
    const { status, data } = await result;
    return sendJson(res, status, data);
  }
  return sendJson(res, 404, { error: 'Not found' });
}

// Keeps a request path inside a base folder; returns null for anything that escapes it.
function safeJoin(base, rel) {
  const p = path.resolve(base, '.' + path.posix.normalize('/' + rel));
  return p.startsWith(base + path.sep) || p === base ? p : null;
}

function sendFile(res, file, cache) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'content-type': mimeOf(file), 'content-length': st.size, 'cache-control': cache });
    fs.createReadStream(file).pipe(res);
  });
}

async function sendAsset(res, key) {
  const cache = 'private, max-age=3600';
  if (!s3) {
    const file = safeJoin(path.join(ROOT, 'assets'), key);
    return file ? sendFile(res, file, cache) : (res.writeHead(404), res.end());
  }
  try {
    const out = await s3.client.send(new s3.GetObjectCommand({ Bucket: s3.bucket, Key: key }));
    res.writeHead(200, {
      'content-type': mimeOf(key),
      ...(out.ContentLength != null && { 'content-length': out.ContentLength }),
      'cache-control': cache,
    });
    Readable.fromWeb(out.Body.transformToWebStream()).pipe(res);
  } catch (err) {
    const status = err?.$metadata?.httpStatusCode === 404 || err?.name === 'NoSuchKey' ? 404 : 502;
    if (status !== 404) console.error('bucket error', key, err?.name, err?.message);
    res.writeHead(status, { 'content-type': 'text/plain' });
    res.end(status === 404 ? 'Not found' : 'Asset storage error');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === '/healthz') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end('{"ok":true}'); }

  if (!authorised(req)) {
    res.writeHead(401, { 'www-authenticate': 'Basic realm="Omusha 1808", charset="UTF-8"', 'content-type': 'text/plain' });
    return res.end('Password required.');
  }
  // Keep search engines and AI crawlers out of the whole site.
  res.setHeader('x-robots-tag', 'noindex, nofollow, noarchive, noai, noimageai');
  if (pathname.startsWith('/api/')) {
    try { return await handleApi(req, res, pathname); }
    catch (err) { console.error('api error', err?.name, err?.message); return sendJson(res, 500, { error: 'Something went wrong' }); }
  }
  if (pathname.startsWith('/assets/') && (req.method === 'PUT' || req.method === 'DELETE' || url.searchParams.has('list'))) {
    try { return await writeAsset(req, res, pathname.slice('/assets/'.length)); }
    catch (err) { console.error('upload error', err?.name, err?.message); res.writeHead(502); return res.end('Asset storage error'); }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }

  if (pathname === '/' || pathname === '') { res.writeHead(302, { location: '/src/' + url.search }); return res.end(); }
  if (pathname === '/robots.txt') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('User-agent: *\nDisallow: /\n'); }
  if (pathname.startsWith('/assets/')) return sendAsset(res, pathname.slice('/assets/'.length));

  const top = pathname.split('/')[1];
  if (!PUBLIC_DIRS.includes(top)) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('Not found'); }
  let file = safeJoin(ROOT, pathname.slice(1));
  if (!file) { res.writeHead(400); return res.end(); }
  if (pathname.endsWith('/')) file = path.join(file, 'index.html');
  sendFile(res, file, 'no-cache');
});

server.listen(PORT, () => {
  console.log(`Omusha running at http://localhost:${PORT}/`);
  console.log(`  password: ${APP_PASSWORD ? 'on' : 'off (set APP_PASSWORD before sharing)'}`);
  console.log(`  assets:   ${s3 ? `bucket ${s3.bucket}` : 'local assets/ folder'}`);
});
