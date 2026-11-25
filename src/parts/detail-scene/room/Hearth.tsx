import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { rng, woodTexture } from "./textures";

export const HEARTH_POS = new THREE.Vector3(0, 0, 0.2);

/** Hearth with a flickering light, glowing embers and rising sparks. */
export function Hearth({
  light = true,
  shadows = true,
}: {
  light?: boolean;
  shadows?: boolean;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const emberMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a1a0a",
        emissive: "#ff7a2a",
        emissiveIntensity: 2.2,
      }),
    [],
  );
  const frame = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.8 }),
    [],
  );
  const ash = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#6f6760", roughness: 1 }),
    [],
  );
  const char = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#241810", roughness: 0.9 }),
    [],
  );

  const sparks = useMemo(() => {
    const n = 60;
    const r = rng(9);
    const pos = new Float32Array(n * 3);
    const speed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (r() - 0.5) * 0.4;
      pos[i * 3 + 1] = r() * 1.6;
      pos[i * 3 + 2] = (r() - 0.5) * 0.3;
      speed[i] = 0.2 + r() * 0.4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { g, speed, n };
  }, []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (lightRef.current) {
      const f =
        Math.sin(t * 9.1) * 0.12 +
        Math.sin(t * 23.7) * 0.07 +
        Math.sin(t * 3.3) * 0.1;
      lightRef.current.intensity = 14 * (1 + f);
      lightRef.current.position.x = HEARTH_POS.x + Math.sin(t * 5.1) * 0.03;
    }
    emberMat.emissiveIntensity =
      2 + Math.sin(t * 6.3) * 0.4 + Math.sin(t * 17) * 0.2;
    const p = sparks.g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < sparks.n; i++) {
      let y = p.getY(i) + sparks.speed[i] * dt;
      if (y > 1.7) y = 0.1;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(t * 2 + i) * 0.002);
    }
    p.needsUpdate = true;
  });

  return (
    <group position={HEARTH_POS} name="hearth">
      {/* Long wooden frame around a sunken ash bed (as in the museum's
          restored house; claims cise-hearth, panel-hearth). */}
      {[
        { p: [0, 0.05, -0.47], s: [1.9, 0.1, 0.1] },
        { p: [0, 0.05, 0.47], s: [1.9, 0.1, 0.1] },
        { p: [-0.95, 0.05, 0], s: [0.1, 0.1, 1.04] },
        { p: [0.95, 0.05, 0], s: [0.1, 0.1, 1.04] },
      ].map((b, i) => (
        <mesh
          key={i}
          position={b.p as [number, number, number]}
          material={frame}
          castShadow
          receiveShadow
        >
          <boxGeometry args={b.s as [number, number, number]} />
        </mesh>
      ))}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        material={ash}
        receiveShadow
      >
        <planeGeometry args={[1.8, 0.84]} />
      </mesh>
      {/* Logs fed in lengthwise; their ends meet in the fire. */}
      {[
        [0.48, -0.1, 0.05],
        [0.5, 0.06, -0.04],
        [-0.46, 0.0, 0.03],
      ].map(([x, z, a], i) => (
        <mesh
          key={i}
          position={[x, 0.07, z]}
          rotation={[0, a, Math.PI / 2 - Math.sign(x) * 0.06]}
          material={char}
          castShadow
        >
          <cylinderGeometry args={[0.05, 0.06, 0.8, 6]} />
        </mesh>
      ))}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const d = 0.08 + (i % 4) * 0.05;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * d, 0.06, Math.sin(a) * d]}
            material={emberMat}
          >
            <icosahedronGeometry args={[0.035 + (i % 3) * 0.012, 0]} />
          </mesh>
        );
      })}
      <Flames />
      <points geometry={sparks.g}>
        <pointsMaterial
          color="#ffb060"
          size={0.025}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {light && (
        <pointLight
          ref={lightRef}
          position={[0, 0.45, 0]}
          color="#ff9a4a"
          intensity={14}
          distance={7}
          decay={2}
          castShadow={shadows}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.002}
          shadow-radius={6}
        />
      )}
    </group>
  );
}

/** Three additive flame tongues that flicker. Cheap and readable. */
function Flames() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useMemo(
    () =>
      ["#ffd27a", "#ff9a3a", "#ff6a1a"].map(
        (c) =>
          new THREE.MeshBasicMaterial({
            color: c,
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
      ),
    [],
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const k =
        1 +
        Math.sin(t * (7 + i * 3.1) + i) * 0.18 +
        Math.sin(t * 19 + i * 2) * 0.08;
      m.scale.set(1, k, 1);
      m.position.y = 0.1 + (0.18 * k) / 2;
      m.rotation.y = t * (0.6 + i * 0.2);
    });
  });
  return (
    <group>
      {[
        { r: 0.12, h: 0.36, x: 0, z: 0, m: 2 },
        { r: 0.08, h: 0.3, x: 0.06, z: 0.04, m: 1 },
        { r: 0.05, h: 0.24, x: -0.04, z: -0.02, m: 0 },
      ].map((f, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[f.x, 0.2, f.z]}
          material={mats[f.m]}
        >
          <coneGeometry args={[f.r, f.h, 7, 1, true]} />
        </mesh>
      ))}
    </group>
  );
}

/** Cool daylight through the east window, with a soft visible shaft. */
export function WindowLight({ shadows = true }: { shadows?: boolean }) {
  const spot = useRef<THREE.SpotLight>(null);
  useLayoutEffect(() => {
    const l = spot.current;
    if (!l) return;
    l.target.position.set(-1, 0, 0.4);
    l.target.updateMatrixWorld();
  }, []);
  return (
    <group>
      <spotLight
        ref={spot}
        position={[7, 3.2, 0]}
        angle={0.32}
        penumbra={0.8}
        intensity={140}
        color="#bcd4ff"
        distance={14}
        decay={1.4}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />
    </group>
  );
}

/** Slow dust motes in the air. Cheap, and it sells "a lived-in room". */
export function Dust() {
  const g = useMemo(() => {
    const r = rng(77);
    const n = 400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (r() - 0.5) * 6.8;
      pos[i * 3 + 1] = r() * 2.6;
      pos[i * 3 + 2] = (r() - 0.5) * 4.8;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.01;
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.3) * 0.05;
    }
  });
  return (
    <points ref={ref} geometry={g}>
      <pointsMaterial
        color="#ffe2b8"
        size={0.012}
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </points>
  );
}
