// Sea, diorama plinth, Okhotsk drift ice, Furano-style lavender rows,
// falling petals/leaves/snow, and the season driver (sky, fog, sun).
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending, BufferGeometry, Color, CylinderGeometry, DataTexture, LinearFilter, RedFormat, UnsignedByteType, type DirectionalLight, Float32BufferAttribute, Fog,
  type HemisphereLight, InstancedBufferAttribute, type InstancedMesh, MeshStandardMaterial, NormalBlending, Object3D,
  ShaderMaterial, Vector4,
} from "three";
import { type Field, heightFromElev, rng } from "./field";
import { GLSL_COMMON, LAVENDER, mix4, num4, SEA, SKY, SUN, U, weightsFor } from "./season";

export function SeasonDriver({ season, playing, speed = 0.12, onSeason }: {
  season: number; playing: boolean; speed?: number; onSeason?: (s: number) => void;
}) {
  const s = useRef(season);
  const { scene } = useThree();
  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const tmp = useMemo(() => ({ w: new Vector4(), c: new Color() }), []);
  const last = useRef(-1);
  if (!playing) s.current = season;
  useFrame((_, dt) => {
    U.uTime.value += dt;
    if (playing) s.current = (s.current + dt * speed) % 4;
    const w = weightsFor(s.current, tmp.w);
    U.uW.value.copy(w);
    U.uSnowLine.value = num4(w, [1350, 2600, 1800, -200]);
    const sky = mix4(w, SKY, tmp.c);
    if (!(scene.background instanceof Color)) scene.background = new Color();
    (scene.background as Color).copy(sky);
    if (!scene.fog) scene.fog = new Fog(sky, 35, 90);
    (scene.fog as Fog).color.copy(sky);
    if (sun.current) {
      mix4(w, SUN, sun.current.color);
      sun.current.intensity = num4(w, [2.6, 3.0, 2.4, 2.0]);
      const elev = num4(w, [0.9, 1.1, 0.7, 0.45]);
      sun.current.position.set(-22 * Math.cos(elev), 30 * Math.sin(elev) + 6, 14);
    }
    if (hemi.current) {
      hemi.current.intensity = num4(w, [1.1, 1.0, 1.0, 0.8]);
      mix4(w, ["#d5e6f0", "#cfe6ff", "#f0dcc0", "#c4d0e6"], hemi.current.color);
    }
    const k = Math.floor(s.current + 0.45) % 4;
    if (k !== last.current) { last.current = k; onSeason?.(k); }
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={["#d5e6f0", "#5a6a52", 1]} />
      <directionalLight
        ref={sun} castShadow position={[-18, 25, 14]} intensity={2.6}
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16}
        shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={90} shadow-bias={-0.0004} shadow-normalBias={0.02}
      />
    </>
  );
}

export function Sea({ field, plinth = true }: { field: Field; plinth?: boolean }) {
  const coastTex = useMemo(() => {
    const d = new Uint8Array(field.w * field.h);
    for (let i = 0; i < d.length; i++) d[i] = Math.min(255, field.coastDist[i] * 8);
    const t = new DataTexture(d, field.w, field.h, RedFormat, UnsignedByteType);
    t.magFilter = LinearFilter; t.minFilter = LinearFilter; t.needsUpdate = true;
    return t;
  }, [field]);
  const mat = useMemo(() => {
    const m = new MeshStandardMaterial({ roughness: 0.3, metalness: 0.05 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U, { uCoast: { value: coastTex }, uExt: { value: [field.size, field.depth] } });
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWP = (modelMatrix * vec4(position, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", `#include <common>\n${GLSL_COMMON}\nvarying vec3 vWP;\nuniform sampler2D uCoast;\nuniform vec2 uExt;`)
        .replace(
          "vec4 diffuseColor = vec4( diffuse, opacity );",
          `vec2 cuv = vWP.xz / uExt + 0.5;
           float cd = (cuv.x < 0.0 || cuv.y < 0.0 || cuv.x > 1.0 || cuv.y > 1.0) ? 1.0 : texture2D(uCoast, vec2(cuv.x, cuv.y)).r; // 0 at coast, 1 = 32 cells out
           vec3 sea = sc(vec3(${hex3(SEA[0])}), vec3(${hex3(SEA[1])}), vec3(${hex3(SEA[2])}), vec3(${hex3(SEA[3])}));
           float ripple = vn(vWP.xz * 1.6 + vec2(uTime * 0.25, uTime * 0.18)) * vn(vWP.xz * 2.4 - uTime * 0.2);
           vec3 shallow = mix(sea, vec3(0.45, 0.78, 0.78), 0.55 * (1.0 - uW.w * 0.6));
           sea = mix(shallow, sea * 0.85, smoothstep(0.02, 0.35, cd + (ripple - 0.25) * 0.08));
           sea += ripple * 0.05;
           float foam = 1.0 - smoothstep(0.0, 0.045, cd + sin(uTime * 1.2 + vWP.x * 3.0) * 0.008);
           sea = mix(sea, vec3(0.95), foam * 0.7);
           vec4 diffuseColor = vec4(sea, opacity);`,
        );
    };
    m.customProgramCacheKey = () => "sea";
    return m;
  }, [coastTex, field]);
  const r = Math.hypot(field.size, field.depth) * 0.5 + 1.5;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} material={mat} receiveShadow>
        {plinth ? <circleGeometry args={[r, 96]} /> : <planeGeometry args={[400, 400]} />}
      </mesh>
      {plinth && (
        <>
          <mesh position-y={-0.9} receiveShadow>
            <cylinderGeometry args={[r + 0.15, r + 0.4, 1.8, 96, 1, true]} />
            <meshStandardMaterial color="#6b4a33" roughness={0.8} />
          </mesh>
          <mesh position-y={-0.85} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[r, 96]} />
            <meshStandardMaterial color="#264d66" />
          </mesh>
        </>
      )}
    </group>
  );
}
const hex3 = (h: string) => new Color(h).toArray().map((v) => v.toFixed(3)).join(",");

/** Drift ice: floes that fade/drift in along the Okhotsk coast in winter. */
export function DriftIce({ field }: { field: Field }) {
  const ref = useRef<InstancedMesh>(null);
  const floes = useMemo(() => {
    const R = rng(11), out: number[][] = [];
    for (let t = 0; t < 60000 && out.length < 380; t++) {
      const x = (R() - 0.5) * field.size, z = (R() - 0.5) * field.depth;
      if (z > -1.5 + x * 0.15) continue; // north / north-east coast only
      const i = Math.round((x / field.size + 0.5) * (field.w - 1)), j = Math.round((z / field.depth + 0.5) * (field.h - 1));
      const d = field.coastDist[j * field.w + i];
      if (field.elev[j * field.w + i] > -20 || d > 26 || d < 2) continue; // sea only (not lake/river)
      out.push([x, z, 0.1 + R() * 0.28, R() * 6.28, R(), d / 26]);
    }
    return out;
  }, [field]);
  const geo = useMemo(() => {
    const g = new CylinderGeometry(1, 1, 0.06, 7);
    g.setAttribute("aRand", new InstancedBufferAttribute(new Float32Array(floes.map((f) => f[4])), 1));
    g.setAttribute("aDist", new InstancedBufferAttribute(new Float32Array(floes.map((f) => f[5])), 1));
    return g;
  }, [floes]);
  const mat = useMemo(() => {
    const m = new MeshStandardMaterial({ color: "#f2f7fb", roughness: 0.6, flatShading: true });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", `#include <common>\n${GLSL_COMMON}\nattribute float aRand;\nattribute float aDist;`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           float a = smoothstep(aDist * 0.5, aDist * 0.5 + 0.45, uW.w); // nearer floes arrive first
           transformed *= a;`,
        );
    };
    m.customProgramCacheKey = () => "ice";
    return m;
  }, []);
  useLayoutEffect(() => {
    const o = new Object3D();
    floes.forEach((f, i) => {
      o.position.set(f[0], 0.04, f[1]);
      o.rotation.set(0, f[3], 0);
      o.scale.set(f[2], 1, f[2] * (0.6 + f[4] * 0.6));
      o.updateMatrix();
      ref.current?.setMatrixAt(i, o.matrix);
    });
    if (ref.current) { ref.current.instanceMatrix.needsUpdate = true; ref.current.computeBoundingSphere(); }
  }, [floes]);
  return <instancedMesh ref={ref} args={[geo, mat, floes.length]} receiveShadow />;
}

/** Rows of a flower field. Colour changes by season on the CPU (1 uniform). */
export function FlowerField({ field, x: cx, z: cz }: { field: Field; x: number; z: number }) {
  const ref = useRef<InstancedMesh>(null);
  const mat = useMemo(() => new MeshStandardMaterial({ roughness: 0.9 }), []);
  const rows = useMemo(() => {
    const out: number[][] = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 5; c++) out.push([cx + (c - 2) * 0.22, cz + (r - 4) * 0.09]);
    return out;
  }, [cx, cz]);
  useLayoutEffect(() => {
    const o = new Object3D();
    rows.forEach(([x, z], i) => {
      o.position.set(x, heightFromElev(field.elevAt(x, z)) + 0.015, z);
      o.rotation.set(0, 0.35, 0);
      o.scale.set(0.2, 0.05, 0.05);
      o.updateMatrix();
      ref.current?.setMatrixAt(i, o.matrix);
    });
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [rows, field]);
  useFrame(() => mix4(U.uW.value, LAVENDER, mat.color));
  return (
    <instancedMesh ref={ref} args={[undefined, mat, rows.length]} castShadow receiveShadow>
      <boxGeometry />
    </instancedMesh>
  );
}

/** Petals (spring), leaves (autumn), snow (winter): one Points draw call. */
export function Weather({ count = 2200 }: { count?: number }) {
  const geo = useMemo(() => {
    const R = rng(3), p = new Float32Array(count * 3), r = new Float32Array(count);
    for (let i = 0; i < count; i++) { p.set([(R() - 0.5) * 30, R() * 12, (R() - 0.5) * 26], i * 3); r[i] = R(); }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(p, 3));
    g.setAttribute("aRand", new Float32BufferAttribute(r, 1));
    return g;
  }, [count]);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true, depthWrite: false, blending: NormalBlending, uniforms: U,
        vertexShader: /* glsl */ `${GLSL_COMMON}
          attribute float aRand; varying float vR; varying float vA;
          void main() {
            vR = aRand;
            float fall = mix(0.5, 1.6, uW.w);
            vec3 p = position;
            p.y = mod(p.y - uTime * fall * (0.6 + aRand), 12.0);
            p.x += sin(uTime * 0.7 + aRand * 30.0) * 0.6 + uTime * 0.15 * (1.0 - uW.w);
            p.x = mod(p.x + 15.0, 30.0) - 15.0;
            vA = (uW.x * step(aRand, 0.35) + uW.z * step(aRand, 0.3) + uW.w) * smoothstep(0.0, 1.5, p.y) * smoothstep(12.0, 9.0, p.y);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (uW.w > 0.5 ? 3.5 : 5.0) * (30.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `${GLSL_COMMON}
          varying float vR; varying float vA;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c * vec2(1.0, uW.w > 0.5 ? 1.0 : 1.8));
            if (d > 0.5) discard;
            vec3 col = sc(vec3(1.0,0.78,0.86), vec3(1.0), vR < 0.15 ? vec3(0.85,0.25,0.12) : vec3(0.95,0.6,0.15), vec3(1.0));
            gl_FragColor = vec4(col, vA * smoothstep(0.5, 0.3, d));
          }`,
      }),
    [],
  );
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}
export { AdditiveBlending };
