import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

declare global { interface Window { __perf?: Record<string, number> } }

/** fps, frame ms, draw calls, triangles → DOM #perf and window.__perf */
export function Perf() {
  const gl = useThree((s) => s.gl);
  const acc = useRef({ n: 0, t: 0, worst: 0 });
  useEffect(() => { gl.info.autoReset = false; }, [gl]);
  useFrame((_, dt) => {
    const a = acc.current;
    a.n++; a.t += dt; a.worst = Math.max(a.worst, dt);
    if (a.t > 0.5) {
      const r = gl.info.render;
      const p = {
        fps: Math.round(a.n / a.t), ms: +((a.t / a.n) * 1000).toFixed(1), worstMs: +(a.worst * 1000).toFixed(1),
        calls: Math.round(r.calls / a.n), tris: Math.round(r.triangles / a.n), geometries: gl.info.memory.geometries,
      };
      window.__perf = p;
      const el = document.getElementById("perf");
      if (el) el.textContent = `${p.fps} fps · ${p.ms} ms · ${p.calls} draws · ${(p.tris / 1000).toFixed(0)}k tris`;
      a.n = 0; a.t = 0; a.worst = 0;
      gl.info.reset();
    }
  }, -1000);
  return null;
}
