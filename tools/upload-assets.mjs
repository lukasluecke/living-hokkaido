#!/usr/bin/env node
// Upload the web-ready museum assets to the private bucket the server reads from.
// Only files the app uses are sent: assets/figures/*/model-web.glb and assets/*.sog|*.spz.
//
// Needs BUCKET, ENDPOINT, REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY in the environment
// (copy them from the Railway bucket's Credentials tab; never commit them).
//   node tools/upload-assets.mjs            # upload
//   node tools/upload-assets.mjs --dry-run  # list what would be uploaded
//   node tools/upload-assets.mjs --delete-all   # remove every object (taking the assets down)
import fs from 'node:fs';
import path from 'node:path';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const root = path.join(import.meta.dirname, '..', 'assets');
const dry = process.argv.includes('--dry-run');
const wipe = process.argv.includes('--delete-all');
for (const k of ['BUCKET', 'ENDPOINT', 'ACCESS_KEY_ID', 'SECRET_ACCESS_KEY']) {
  if (!process.env[k] && !dry) { console.error(`Missing ${k}`); process.exit(1); }
}
const s3 = new S3Client({
  endpoint: process.env.ENDPOINT, region: process.env.REGION || 'auto',
  forcePathStyle: process.env.BUCKET_PATH_STYLE === 'true',
  credentials: { accessKeyId: process.env.ACCESS_KEY_ID || 'x', secretAccessKey: process.env.SECRET_ACCESS_KEY || 'x' },
});
const Bucket = process.env.BUCKET;

if (wipe) {
  let n = 0, token;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket, ContinuationToken: token }));
    const keys = (page.Contents || []).map((o) => ({ Key: o.Key }));
    if (keys.length) { await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: keys } })); n += keys.length; }
    token = page.NextContinuationToken;
  } while (token);
  console.log(`Deleted ${n} object(s).`);
  process.exit(0);
}

const files = [];
for (const f of fs.readdirSync(root)) if (/\.(sog|spz)$/i.test(f)) files.push(f);
const figs = path.join(root, 'figures');
if (fs.existsSync(figs)) for (const d of fs.readdirSync(figs)) {
  if (fs.existsSync(path.join(figs, d, 'model-web.glb'))) files.push(`figures/${d}/model-web.glb`);
}
const type = (k) => (k.endsWith('.glb') ? 'model/gltf-binary' : 'application/octet-stream');
let total = 0;
for (const key of files) {
  const body = fs.readFileSync(path.join(root, key));
  total += body.length;
  console.log(`${dry ? 'would upload' : 'upload'} ${key} (${(body.length / 1048576).toFixed(1)} MB)`);
  if (!dry) await s3.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: type(key) }));
}
console.log(`${files.length} file(s), ${(total / 1048576).toFixed(1)} MB${dry ? ' (dry run)' : ' uploaded'}.`);
