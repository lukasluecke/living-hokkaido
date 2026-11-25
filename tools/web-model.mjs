#!/usr/bin/env node
// Hyper3D Rodin output -> web-ready GLB (~1-2 MB): Meshopt geometry, WebP textures <= 2048 px.
//
//   node tools/web-model.mjs <model.glb> [out.glb]
//   node tools/web-model.mjs --rebuild-pbr <base_basic_shaded.glb> <texture-dir> [out.glb]
//
// --rebuild-pbr makes the PBR GLB when Hyper3D only offers it as FBX: it reuses the Shaded GLB's
// mesh (same mesh and UVs) with texture_diffuse.png, texture_normal.png and texture_pbr.png from
// the download, exactly as Hyper3D assembles its own PBR GLBs.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { NodeIO } from '@gltf-transform/core';

const args = process.argv.slice(2);
let input;
let out;
if (args[0] === '--rebuild-pbr') {
  const [, shaded, texDir, target] = args;
  if (!shaded || !texDir) { console.error('Usage: --rebuild-pbr <base_basic_shaded.glb> <texture-dir> [out.glb]'); process.exit(1); }
  const io = new NodeIO();
  const doc = await io.read(shaded);
  const tex = (file) => doc.createTexture(file).setImage(fs.readFileSync(path.join(texDir, file))).setMimeType('image/png');
  const base = tex('texture_diffuse.png');
  const normal = tex('texture_normal.png');
  const mr = tex('texture_pbr.png');
  for (const m of doc.getRoot().listMaterials()) {
    const old = m.getEmissiveTexture();
    m.setEmissiveTexture(null).setEmissiveFactor([0, 0, 0])
      .setBaseColorFactor([1, 1, 1, 1]).setBaseColorTexture(base)
      .setNormalTexture(normal).setMetallicRoughnessTexture(mr).setMetallicFactor(1).setRoughnessFactor(1);
    if (old && old.listParents().every((p) => p === doc.getRoot())) old.dispose();
  }
  input = path.join(os.tmpdir(), `pbr-${Date.now()}.glb`);
  await io.write(input, doc);
  out = target || shaded.replace(/(_shaded)?\.glb$/i, '').replace(/base_basic$/, 'base_basic_pbr') + '-web.glb';
} else {
  [input, out] = args;
  if (!input) { console.error('Usage: node tools/web-model.mjs <model.glb> [out.glb]'); process.exit(1); }
  out ||= input.replace(/\.glb$/i, '-web.glb');
}

const cli = path.join(import.meta.dirname, '..', 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');
execFileSync(process.execPath, [cli, 'optimize', input, out,
  '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '2048', '--simplify', 'false'], { stdio: 'inherit' });
const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(1);
console.log(`${path.basename(input)} (${mb(input)} MB) -> ${out} (${mb(out)} MB)`);
