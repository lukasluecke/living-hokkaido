import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import { useThree } from "@react-three/fiber";
import { type ReactNode, useEffect, useRef } from "react";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import { HEARTH_POS } from "../room/Hearth";

// We have no licensed capture of a real interior yet, so this builds a
// Gaussian splat from our own room geometry: it samples every surface,
// bakes simple hearth + window light into each splat's colour, and hands
// the result to Spark. It tests the renderer, splat count, memory, sorting
// against meshes, and the "lighting is baked in" look of a real capture.

type Tex = { data: Uint8ClampedArray; w: number; h: number } | null;
const texCache = new WeakMap<THREE.Texture, Tex>();

function readTexture(t: THREE.Texture | null | undefined): Tex {
  if (!t) return null;
  const cached = texCache.get(t);
  if (cached !== undefined) return cached;
  const img = t.image as CanvasImageSource & { width: number; height: number };
  if (!img?.width) return null;
  const c = document.createElement("canvas");
  c.width = Math.min(img.width, 512);
  c.height = Math.min(img.height, 512);
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  let out: Tex = null;
  try {
    out = { data: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
  } catch {
    out = null;
  }
  texCache.set(t, out);
  return out;
}

function sampleTex(tex: Tex, t: THREE.Texture, uv: THREE.Vector2, out: THREE.Color) {
  if (!tex) return out;
  const u = uv.clone();
  t.transformUv(u);
  const x = Math.floor(((u.x % 1) + 1) % 1 * (tex.w - 1));
  const y = Math.floor(((u.y % 1) + 1) % 1 * (tex.h - 1));
  const i = (y * tex.w + x) * 4;
  const c = new THREE.Color().setRGB(tex.data[i] / 255, tex.data[i + 1] / 255, tex.data[i + 2] / 255, THREE.SRGBColorSpace);
  return out.multiply(c);
}

const WINDOW_DIR = new THREE.Vector3(1, 0.35, 0).normalize();

/** Very small "bake": ambient + hearth falloff + window daylight. */
function bakeLight(p: THREE.Vector3, n: THREE.Vector3, albedo: THREE.Color): THREE.Color {
  const toFire = new THREE.Vector3().copy(HEARTH_POS).setY(0.45).sub(p);
  const d = toFire.length();
  toFire.normalize();
  const fire = Math.max(0, n.dot(toFire) * 0.8 + 0.2) * (2.6 / (1 + d * d * 0.35));
  const inside = p.x > -3.7 && p.x < 3.7 && p.z > -2.7 && p.z < 2.7 && p.y < 4.5;
  const win = inside ? Math.max(0, n.dot(WINDOW_DIR)) * Math.max(0, 1 - Math.abs(p.z - 0.2) / 1.8) * Math.max(0, (p.x + 1.5) / 5) * 0.8 : 0.9;
  const amb = inside ? 0.16 + 0.1 * Math.min(1, p.y / 2.5) : 0.75;
  const light = new THREE.Color("#ffb27a").multiplyScalar(fire).add(new THREE.Color("#cfe0ff").multiplyScalar(win + amb));
  return albedo.clone().multiply(light);
}

function buildSplats(root: THREE.Object3D, perSquareMetre: number, maxSplats: number) {
  const meshes: THREE.Mesh[] = [];
  root.updateWorldMatrix(true, true);
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && m.geometry?.attributes.position && !(m as unknown as THREE.Points).isPoints) meshes.push(m);
  });
  // Area per mesh, so splats are spread evenly over the room.
  const areas = meshes.map((m) => {
    const g = m.geometry;
    const pos = g.attributes.position as THREE.BufferAttribute;
    const idx = g.index;
    const tri = idx ? idx.count / 3 : pos.count / 3;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    let area = 0;
    for (let i = 0; i < tri; i++) {
      const i0 = idx ? idx.getX(i * 3) : i * 3;
      const i1 = idx ? idx.getX(i * 3 + 1) : i * 3 + 1;
      const i2 = idx ? idx.getX(i * 3 + 2) : i * 3 + 2;
      a.fromBufferAttribute(pos, i0).applyMatrix4(m.matrixWorld);
      b.fromBufferAttribute(pos, i1).applyMatrix4(m.matrixWorld);
      c.fromBufferAttribute(pos, i2).applyMatrix4(m.matrixWorld);
      area += new THREE.Triangle(a, b, c).getArea();
    }
    return area;
  });
  const total = areas.reduce((s, a) => s + a, 0);
  const density = Math.min(perSquareMetre, maxSplats / total);
  const records: { p: THREE.Vector3; s: THREE.Vector3; q: THREE.Quaternion; c: THREE.Color }[] = [];
  const z = new THREE.Vector3(0, 0, 1);
  meshes.forEach((m, mi) => {
    const n = Math.max(8, Math.round(areas[mi] * density));
    const g = m.geometry.index ? m.geometry : m.geometry;
    if (!g.attributes.normal) g.computeVertexNormals();
    const tmp = new THREE.Mesh(g);
    const sampler = new MeshSurfaceSampler(tmp).build();
    const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
    const tex = readTexture(mat.map);
    const normalMat = new THREE.Matrix3().getNormalMatrix(m.matrixWorld);
    const radius = Math.sqrt(1 / density) * 0.75;
    const p = new THREE.Vector3();
    const nrm = new THREE.Vector3();
    const uv = new THREE.Vector2();
    for (let i = 0; i < n; i++) {
      sampler.sample(p, nrm, undefined, g.attributes.uv ? uv : undefined);
      const wp = p.clone().applyMatrix4(m.matrixWorld);
      const wn = nrm.clone().applyMatrix3(normalMat).normalize();
      let albedo = (mat.color ?? new THREE.Color(1, 1, 1)).clone();
      if (mat.map && g.attributes.uv) albedo = sampleTex(tex, mat.map, uv, albedo);
      if (mat.emissiveIntensity > 1) albedo = mat.emissive.clone().multiplyScalar(1.4);
      const lit = mat.emissiveIntensity > 1 ? albedo : bakeLight(wp, wn, albedo);
      // A flat disc lying on the surface, a little jitter like a real capture.
      const q = new THREE.Quaternion().setFromUnitVectors(z, wn);
      const r = radius * (0.7 + Math.random() * 0.6);
      records.push({ p: wp, s: new THREE.Vector3(r, r, r * 0.12), q, c: lit });
    }
  });
  return records;
}

export function SplatFromScene({
  children,
  density = 9000,
  maxSplats = 400_000,
  onStats,
}: {
  children: ReactNode;
  density?: number;
  maxSplats?: number;
  onStats?: (s: { splats: number; buildMs: number; mb: number }) => void;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const source = useRef<THREE.Group>(null);

  useEffect(() => {
    const spark = new SparkRenderer({ renderer: gl });
    scene.add(spark);
    let mesh: SplatMesh | null = null;
    // Wait one frame so textures and children exist.
    const id = requestAnimationFrame(() => {
      if (!source.current) return;
      const t0 = performance.now();
      const recs = buildSplats(source.current, density, maxSplats);
      mesh = new SplatMesh({
        constructSplats: (splats) => {
          for (const r of recs) splats.pushSplat(r.p, r.s, r.q, 0.95, r.c);
        },
      });
      scene.add(mesh);
      // Spark packs a splat into 16 bytes.
      onStats?.({ splats: recs.length, buildMs: Math.round(performance.now() - t0), mb: (recs.length * 16) / 1e6 });
    });
    return () => {
      cancelAnimationFrame(id);
      if (mesh) {
        scene.remove(mesh);
        mesh.dispose();
      }
      scene.remove(spark);
    };
  }, [gl, scene, density, maxSplats, onStats]);

  return (
    <group ref={source} visible={false}>
      {children}
    </group>
  );
}
