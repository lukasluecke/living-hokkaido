// Low-poly owl + flight along a curve that clears the real terrain.
import { useFrame } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { CatmullRomCurve3, type Group, Vector3 } from "three";
import { ISLAND } from "@/contracts";
import type { Field } from "./field";

export type OwlApi = { group: Group | null; flying: boolean; dir: Vector3 };

export function flightCurve(field: Field, a: Vector3, b: Vector3) {
  const pts: Vector3[] = [];
  const n = 10,
    dist = a.distanceTo(b);
  const arc = Math.min(9, 1.8 + dist * 0.12);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = a.x + (b.x - a.x) * t,
      z = a.z + (b.z - a.z) * t;
    // terrain clearance: max ground height near this sample
    let g = 0;
    for (let k = -1; k <= 1; k++)
      g = Math.max(
        g,
        field.groundY(x + k * 1.4, z),
        field.groundY(x, z + k * 1.4),
      );
    const base = a.y + (b.y - a.y) * t;
    const y = Math.max(
      base + Math.sin(Math.PI * t) * arc,
      g + 2.0 * Math.sin(Math.PI * Math.min(1, t * 6, (1 - t) * 6)) + 0.8,
    );
    pts.push(new Vector3(x, i === 0 ? a.y : i === n ? b.y : y, z));
  }
  return new CatmullRomCurve3(pts, false, "centripetal");
}

const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** Owl body is ~2 units wide with wings out; scale it to the contract wingspan. */
export const Owl = forwardRef<
  OwlApi,
  {
    field: Field;
    perch: Vector3;
    target: Vector3 | null;
    onArrive: () => void;
    scale?: number;
  }
>(function Owl(
  { field, perch, target, onArrive, scale = ISLAND.owlWingspan / 2 },
  ref,
) {
  const g = useRef<Group>(null);
  const wl = useRef<Group>(null),
    wr = useRef<Group>(null);
  const st = useRef({
    t: 1,
    curve: null as CatmullRomCurve3 | null,
    dur: 1,
    key: "",
    dir: new Vector3(0, 0, 1),
  });
  const api = useMemo<OwlApi>(
    () => ({ group: null, flying: false, dir: st.current.dir }),
    [],
  );
  useImperativeHandle(ref, () => api, [api]);
  const key = target ? target.toArray().join(",") : "";
  if (key !== st.current.key) {
    const from = g.current ? g.current.position.clone() : perch.clone();
    st.current.key = key;
    if (target) {
      const to = target.clone(); // caller passes anchor + owlPerch
      st.current.curve = flightCurve(field, from, to);
      st.current.dur = Math.max(2.2, st.current.curve.getLength() / 11);
      st.current.t = 0;
    }
  }
  useFrame((state, dt) => {
    const o = g.current;
    if (!o) return;
    api.group = o;
    const s = st.current;
    const flap =
      s.t < 1
        ? Math.sin(state.clock.elapsedTime * 14) * 0.9
        : Math.sin(state.clock.elapsedTime * 1.5) * 0.05 - 0.1;
    if (wl.current) wl.current.rotation.z = 0.2 + flap;
    if (wr.current) wr.current.rotation.z = -0.2 - flap;
    if (!s.curve || s.t >= 1) {
      if (!s.curve) o.position.copy(perch);
      o.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.0015;
      api.flying = false;
      return;
    }
    api.flying = true;
    s.t = Math.min(1, s.t + dt / s.dur);
    const u = ease(s.t);
    const p = s.curve.getPointAt(u),
      ahead = s.curve.getPointAt(Math.min(1, u + 0.02));
    o.position.copy(p);
    if (ahead.distanceToSquared(p) > 1e-6) {
      s.dir.copy(ahead).sub(p).normalize();
      const look = p.clone().add(new Vector3(s.dir.x, 0, s.dir.z));
      o.lookAt(look);
      o.rotateX(-s.dir.y * 0.6);
    }
    if (s.t >= 1) {
      api.flying = false;
      s.t = 1;
      onArrive();
    }
  });
  return (
    <group ref={g} scale={scale}>
      <mesh castShadow position={[0, 0.35, 0]} scale={[0.42, 0.52, 0.38]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#8a5a3a" flatShading />
      </mesh>
      <mesh position={[0, 0.3, 0.2]} scale={[0.3, 0.36, 0.22]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#e8d2ad" flatShading />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.15, 0.55, 0.3]} scale={0.11}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#fff7e0" />
          </mesh>
          <mesh position={[s * 0.15, 0.55, 0.39]} scale={0.055}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#1d2a2a" />
          </mesh>
          <mesh
            position={[s * 0.24, 0.85, 0]}
            rotation={[0, 0, -s * 0.4]}
            scale={[0.07, 0.18, 0.07]}
          >
            <coneGeometry args={[1, 1, 4]} />
            <meshStandardMaterial color="#6d4329" flatShading />
          </mesh>
        </group>
      ))}
      <mesh
        position={[0, 0.47, 0.38]}
        rotation={[Math.PI * 0.55, 0, 0]}
        scale={[0.04, 0.09, 0.04]}
      >
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color="#d79a3c" />
      </mesh>
      <group ref={wl} position={[0.38, 0.45, -0.02]}>
        <mesh position={[0.28, -0.05, 0]} scale={[0.32, 0.05, 0.26]} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#6d4329" flatShading />
        </mesh>
      </group>
      <group ref={wr} position={[-0.38, 0.45, -0.02]}>
        <mesh
          position={[-0.28, -0.05, 0]}
          scale={[0.32, 0.05, 0.26]}
          castShadow
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#6d4329" flatShading />
        </mesh>
      </group>
    </group>
  );
});
