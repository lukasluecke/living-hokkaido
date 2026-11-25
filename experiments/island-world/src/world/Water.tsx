// Inland water: the lake surface and a river ribbon. They freeze in winter.
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, DoubleSide, MeshStandardMaterial, Vector3 } from "three";
import { type Field, heightFromElev } from "./field";
import { LAKE, LAKE_LEVEL, RIVER } from "./island";
import { mix4, num4, U } from "./season";

const WATER: [string, string, string, string] = ["#5aa7c4", "#3f9bc9", "#4d8ea3", "#e4edf4"];

function useWaterMaterial() {
  const m = useMemo(() => new MeshStandardMaterial({ roughness: 0.2, metalness: 0.05, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }), []);
  useFrame(() => {
    mix4(U.uW.value, WATER, m.color);
    m.roughness = num4(U.uW.value, [0.2, 0.15, 0.25, 0.6]);
  });
  return m;
}

export function Lake() {
  const m = useWaterMaterial();
  return (
    <mesh rotation-x={-Math.PI / 2} position={[LAKE.x, heightFromElev(LAKE_LEVEL), LAKE.z]} material={m} receiveShadow>
      <circleGeometry args={[LAKE.r * 1.08, 48]} />
    </mesh>
  );
}

export function River({ field }: { field: Field }) {
  const m = useWaterMaterial();
  const geo = useMemo(() => {
    const curve = new CatmullRomCurve3(RIVER.map(([x, z]) => new Vector3(x, 0, z)));
    // stop where the river meets the sea
    let end = 1;
    for (let t = 0.12; t <= 1; t += 0.005) if (field.elevAt(curve.getPointAt(t).x, curve.getPointAt(t).z) <= 0) { end = t + 0.01; break; }
    const n = 120, pos: number[] = [], idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      const t = 0.12 + (i / n) * (end - 0.12);
      const p = curve.getPointAt(t), d = curve.getTangentAt(t);
      const side = new Vector3(-d.z, 0, d.x).normalize().multiplyScalar(0.06 + t * 0.16);
      const y = Math.max(0.06, field.groundY(p.x, p.z) + 0.04);
      pos.push(p.x + side.x, y, p.z + side.z, p.x - side.x, y, p.z - side.z);
      if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [field]);
  return <mesh geometry={geo} material={m} receiveShadow />;
}
