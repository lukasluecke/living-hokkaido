// Look-agnostic highlight helpers that attach to an artifact group.
import * as THREE from "three";
import { addHull } from "./looks";

export function meshesOf(root: THREE.Object3D) {
  const out: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && !o.userData.hull && !o.userData.fx) out.push(o as THREE.Mesh);
  });
  return out;
}

/** Gold outline hulls, hidden until shown. */
export function attachHoverHull(root: THREE.Object3D) {
  const hulls = meshesOf(root).map((m) => {
    const h = addHull(m, m.userData.part === "thread" ? 0.012 : 0.04, "#ffb02e");
    h.userData.hull = false;
    h.userData.fx = true;
    h.visible = false;
    return h;
  });
  return (on: boolean) => {
    for (const h of hulls) h.visible = on;
  };
}

/** Additive fresnel rim pass. Returns a setter for strength 0..1. */
export function attachRim(root: THREE.Object3D, color = "#ffd27a") {
  const uniforms = { uStrength: { value: 0 }, uColor: { value: new THREE.Color(color) } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uStrength; uniform vec3 uColor;
      varying vec3 vN; varying vec3 vV;
      void main(){
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        gl_FragColor = vec4(uColor * f * uStrength * 1.6, 1.0);
      }`,
  });
  for (const m of meshesOf(root)) {
    const r = new THREE.Mesh(m.geometry, mat);
    r.userData.fx = true;
    r.raycast = () => {};
    m.add(r);
  }
  return (s: number) => {
    uniforms.uStrength.value = s;
  };
}

/** Lift emissive on standard/toon materials. */
export function setEmissive(root: THREE.Object3D, amount: number) {
  for (const m of meshesOf(root)) {
    const mat = m.material as THREE.MeshStandardMaterial;
    if ("emissive" in mat) {
      mat.emissive.set("#ffb347");
      mat.emissiveIntensity = amount;
    }
  }
}
