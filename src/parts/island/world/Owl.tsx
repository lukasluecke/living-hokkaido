// Spirit-like owl guide + flight along a curve that clears the real terrain.
import { useFrame } from "@react-three/fiber";
import {
  Component,
  forwardRef,
  type ReactNode,
  Suspense,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  AdditiveBlending,
  Box3,
  CanvasTexture,
  Color,
  Group as GroupClass,
  CatmullRomCurve3,
  type Group,
  type InstancedMesh,
  Matrix4,
  type Mesh,
  type MeshStandardMaterial,
  MeshToonMaterial,
  type Object3D,
  Quaternion,
  Vector3,
} from "three";
import { ISLAND } from "@/contracts";
import { useGlbClone } from "../../shared/Glb";
import type { Field } from "./field";

/**
 * Generated body (Hyper3D Rodin, text prompt only; public/models/ATTRIBUTION.md).
 * Loaded lazily; the code-built body shows while it loads or if it fails.
 * The code wings, glow halo and trail stay, so the flap still works.
 */
const OWL_GLB = "/models/owl.glb";

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
    /** Light trail while flying; off for reduced motion. */
    trail?: boolean;
  }
>(function Owl(
  {
    field,
    perch,
    target,
    onArrive,
    scale = ISLAND.owlWingspan / 2,
    trail = true,
  },
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
    // The generated body has folded wings: its code wings show only in flight.
    for (const w of [wl.current, wr.current])
      if (w) w.visible = !w.userData.flyOnly || s.t < 1;
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
    <>
      <group ref={g} scale={scale}>
        <OwlBody wl={wl} wr={wr} />
      </group>
      <Trail owl={g} api={api} enabled={trail} />
    </>
  );
});

// Fictional spirit-like guide (not a depiction of any kamuy; see PROJECT.md
// and docs/RESEARCH.md § Owl). Snow-white, round, soft blue glow.
const SNOW = "#f7fbff";
const FROST = "#d6e6f5";
const GLOW = "#bfe0ff";
const INK = "#3b4a5e";

type Wings = {
  wl: React.RefObject<Group | null>;
  wr: React.RefObject<Group | null>;
};

class Fallback extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function OwlBody(p: Wings) {
  const code = <SpiritOwlBody {...p} />;
  return (
    <Fallback fallback={code}>
      <Suspense fallback={code}>
        <GlbOwlBody {...p} />
      </Suspense>
    </Fallback>
  );
}

/** Snow-white toon look with a soft blue glow, like the code body. */
function glow(o: Object3D) {
  o.traverse((c) => {
    const m = c as Mesh;
    if (!m.isMesh) return;
    const src = m.material as MeshStandardMaterial;
    m.material = new MeshToonMaterial({
      color: src?.color ?? new Color(SNOW),
      map: src?.map ?? null,
      emissive: new Color(GLOW),
      emissiveIntensity: 0.3,
    });
    m.castShadow = true;
  });
  // Fit: base on y=0, about 1 unit tall (the code body is ~0.95 tall).
  const box = new Box3().setFromObject(o);
  const size = box.getSize(new Vector3());
  const k = 0.95 / (size.y || 1);
  const wrap = new GroupClass();
  o.scale.setScalar(k);
  o.position.set(
    -((box.min.x + box.max.x) / 2) * k,
    -box.min.y * k - 0.05,
    -((box.min.z + box.max.z) / 2) * k,
  );
  wrap.add(o);
  return wrap;
}

function GlbOwlBody({ wl, wr }: Wings) {
  const obj = useGlbClone(OWL_GLB, glow);
  const halo = useMemo(() => glowTexture(), []);
  return (
    <>
      <primitive object={obj} />
      <CodeWings wl={wl} wr={wr} flyOnly />
      <sprite position={[0, 0.42, 0]} scale={2.4}>
        <spriteMaterial
          map={halo}
          color={GLOW}
          transparent
          opacity={0.45}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </>
  );
}

function CodeWings({ wl, wr, flyOnly = false }: Wings & { flyOnly?: boolean }) {
  return (
    <>
      {[
        [wl, 1],
        [wr, -1],
      ].map(([ref, s]) => (
        <group
          key={s as number}
          ref={ref as React.RefObject<Group>}
          position={[(s as number) * 0.36, 0.45, -0.04]}
          userData={{ flyOnly }}
        >
          <mesh
            position={[(s as number) * 0.3, -0.04, 0]}
            scale={[0.36, 0.06, 0.24]}
            castShadow
          >
            <sphereGeometry args={[1, 14, 8]} />
            <meshToonMaterial
              color={SNOW}
              emissive={GLOW}
              emissiveIntensity={0.4}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function SpiritOwlBody({
  wl,
  wr,
}: {
  wl: React.RefObject<Group | null>;
  wr: React.RefObject<Group | null>;
}) {
  const halo = useMemo(() => glowTexture(), []);
  return (
    <>
      <mesh castShadow position={[0, 0.38, 0]} scale={[0.46, 0.5, 0.42]}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshToonMaterial
          color={SNOW}
          emissive={GLOW}
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh position={[0, 0.3, 0.18]} scale={[0.32, 0.34, 0.26]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshToonMaterial
          color={FROST}
          emissive={GLOW}
          emissiveIntensity={0.25}
        />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.16, 0.56, 0.3]} scale={[0.15, 0.15, 0.08]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh position={[s * 0.16, 0.55, 0.37]} scale={0.085}>
            <sphereGeometry args={[1, 14, 10]} />
            <meshBasicMaterial color={INK} />
          </mesh>
          <mesh position={[s * 0.14, 0.59, 0.44]} scale={0.025}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh
            position={[s * 0.26, 0.82, 0.02]}
            rotation={[0, 0, -s * 0.5]}
            scale={[0.08, 0.14, 0.06]}
          >
            <sphereGeometry args={[1, 10, 8]} />
            <meshToonMaterial
              color={SNOW}
              emissive={GLOW}
              emissiveIntensity={0.35}
            />
          </mesh>
        </group>
      ))}
      <mesh
        position={[0, 0.46, 0.41]}
        rotation={[Math.PI * 0.55, 0, 0]}
        scale={[0.035, 0.07, 0.035]}
      >
        <coneGeometry args={[1, 1, 8]} />
        <meshToonMaterial color="#9fb4c8" />
      </mesh>
      <CodeWings wl={wl} wr={wr} />
      <sprite position={[0, 0.42, 0]} scale={2.4}>
        <spriteMaterial
          map={halo}
          color={GLOW}
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </>
  );
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d");
  if (x) {
    const r = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,255,255,0.9)");
    r.addColorStop(0.35, "rgba(255,255,255,0.25)");
    r.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = r;
    x.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(c);
}

const TRAIL = 28;

/** Fading light motes behind the owl, in world space. One draw call. */
function Trail({
  owl,
  api,
  enabled,
}: {
  owl: React.RefObject<Group | null>;
  api: OwlApi;
  enabled: boolean;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const st = useMemo(
    () => ({
      pts: Array.from({ length: TRAIL }, () => new Vector3()),
      age: new Float32Array(TRAIL).fill(9),
      head: 0,
      acc: 0,
      m: new Matrix4(),
      q: new Quaternion(),
      v: new Vector3(),
      sc: new Vector3(),
    }),
    [],
  );
  useFrame((_, dt) => {
    const im = mesh.current,
      o = owl.current;
    if (!im || !o) return;
    st.acc += dt;
    if (enabled && api.flying && st.acc > 0.035) {
      st.acc = 0;
      st.head = (st.head + 1) % TRAIL;
      st.pts[st.head]
        .copy(o.position)
        .add(
          st.v
            .set(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5)
            .multiplyScalar(0.25),
        );
      st.age[st.head] = 0;
    }
    for (let i = 0; i < TRAIL; i++) {
      st.age[i] += dt;
      const life = 1 - st.age[i] / 1.1;
      const k = life > 0 ? 0.06 * life : 0;
      st.pts[i].y += dt * 0.15;
      st.m.compose(st.pts[i], st.q, st.sc.setScalar(k));
      im.setMatrixAt(i, st.m);
    }
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, TRAIL]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial
        color="#8cc4ff"
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
