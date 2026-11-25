// Four candidate looks applied to the same geometry.
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Part } from "./models";

export type LookId = "pbr" | "flat" | "toon" | "matcap" | "painted";

export const LOOKS: { id: LookId; title: string; note: string }[] = [
  { id: "pbr", title: "A · Smooth PBR", note: "MeshStandard, smooth normals" },
  {
    id: "flat",
    title: "B · Flat low-poly",
    note: "MeshStandard + flatShading (current sketch)",
  },
  {
    id: "toon",
    title: "C · Toon + ink line",
    note: "MeshToon 3-step ramp + inverted-hull outline",
  },
  {
    id: "matcap",
    title: "D · Painted matcap",
    note: "MeshMatcap, warm painted sphere, unlit",
  },
  {
    id: "painted",
    title: "E · Flat + baked colour",
    note: "vertex colours: face hue jitter, dark base, warm top",
  },
];

export const PALETTE: Record<Part, string> = {
  cloth: "#c9a46a",
  band: "#2f4b6e",
  wood: "#8a5a35",
  thread: "#eadcb8",
  fiber: "#d9bb86",
  bark: "#6e4b32",
  tie: "#9c4f2e",
};

let ramp: THREE.DataTexture | null = null;
function toonRamp() {
  if (ramp) return ramp;
  const data = new Uint8Array([
    90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255,
  ]);
  ramp = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  ramp.minFilter = THREE.NearestFilter;
  ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

let matcapTex: THREE.CanvasTexture | null = null;
/** Procedural warm matcap: light top-left, cool bounce bottom-right. */
function matcap() {
  if (matcapTex) return matcapTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  if (!g) throw new Error("2d canvas unavailable");
  g.fillStyle = "#3a3a46";
  g.fillRect(0, 0, 256, 256);
  const base = g.createRadialGradient(100, 90, 10, 128, 128, 128);
  base.addColorStop(0, "#fff6e4");
  base.addColorStop(0.45, "#d9cdb8");
  base.addColorStop(0.85, "#7d7480");
  base.addColorStop(1, "#4a4652");
  g.fillStyle = base;
  g.beginPath();
  g.arc(128, 128, 127, 0, Math.PI * 2);
  g.fill();
  const rim = g.createRadialGradient(170, 190, 60, 128, 128, 128);
  rim.addColorStop(0.7, "rgba(160,190,220,0)");
  rim.addColorStop(1, "rgba(160,190,220,0.55)");
  g.fillStyle = rim;
  g.fill();
  matcapTex = new THREE.CanvasTexture(c);
  matcapTex.colorSpace = THREE.SRGBColorSpace;
  return matcapTex;
}

export function materialFor(look: LookId, part: Part): THREE.Material {
  const color = new THREE.Color(PALETTE[part]);
  const side =
    part === "bark" || part === "fiber" ? THREE.DoubleSide : THREE.FrontSide;
  switch (look) {
    case "pbr":
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.75,
        metalness: 0,
        side,
      });
    case "flat":
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9,
        flatShading: true,
        side,
      });
    case "toon":
      return new THREE.MeshToonMaterial({
        color,
        gradientMap: toonRamp(),
        side,
      });
    case "matcap":
      return new THREE.MeshMatcapMaterial({ color, matcap: matcap(), side });
    case "painted":
      return new THREE.MeshLambertMaterial({
        vertexColors: true,
        flatShading: true,
        side,
      });
  }
}

/** Bake per-face colour variation + vertical gradient into vertex colours. */
export function bakePaint(m: THREE.Mesh, base: THREE.Color) {
  const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
  geo.computeBoundingBox();
  const bb = geo.boundingBox as THREE.Box3;
  const pos = geo.getAttribute("position");
  const cols = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let f = 0; f < pos.count; f += 3) {
    const n = Math.sin(f * 12.9898) * 43758.5453;
    const j = (n - Math.floor(n) - 0.5) * 0.08;
    for (let k = 0; k < 3; k++) {
      const y =
        (pos.getY(f + k) - bb.min.y) / Math.max(1e-3, bb.max.y - bb.min.y);
      c.copy(base).offsetHSL(j * 0.3, 0, j + (y - 0.5) * 0.12);
      c.lerp(new THREE.Color("#3b2a22"), (1 - y) * 0.18);
      cols.set([c.r, c.g, c.b], (f + k) * 3);
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  m.geometry = geo;
}

/** Inverted-hull outline: a back-face copy pushed out along normals. */
export function addHull(
  meshObj: THREE.Mesh,
  thickness = 0.012,
  color = "#2a1d17",
) {
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `vec3 transformed = position + normalize(normal) * ${thickness.toFixed(4)};`,
    );
  };
  // Smooth normals so the hull does not split at hard edges.
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", meshObj.geometry.getAttribute("position"));
  if (meshObj.geometry.index) g.setIndex(meshObj.geometry.index);
  const smooth = mergeVertices(g, 1e-3);
  smooth.computeVertexNormals();
  const hull = new THREE.Mesh(smooth, mat);
  hull.name = `${meshObj.name}-hull`;
  hull.userData.hull = true;
  hull.raycast = () => {};
  meshObj.add(hull);
  return hull;
}

/** Apply a look to a built object group (mutates). */
export function applyLook(root: THREE.Object3D, look: LookId) {
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && !o.userData.hull)
      meshes.push(o as THREE.Mesh);
  });
  for (const m of meshes) {
    m.material = materialFor(look, m.userData.part as Part);
    for (const c of Array.from(m.children)) if (c.userData.hull) m.remove(c);
    if (look === "painted")
      bakePaint(m, new THREE.Color(PALETTE[m.userData.part as Part]));
    if (look === "toon")
      addHull(m, m.userData.part === "thread" ? 0.004 : 0.014);
  }
}
