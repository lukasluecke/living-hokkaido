// The street's centre line: a path that pitches (steeper and gentler
// sections) and yaws (gentle curves). Pure math, no three/Rapier.
//
// Positions on the street use track coordinates: s = distance downhill along
// the path, x = across the street (+ is right when facing downhill), h =
// height above the ice. World space is Y-up; the path starts at the origin
// heading toward -Z.

export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];

export type Section = {
  /** Length of the section (m). */
  length: number;
  /** Steepness (degrees). */
  pitch: number;
  /** Turn rate (radians per metre, + turns right). */
  curve: number;
};

export type Path = {
  /** Sample spacing (m). Sample i is at s = i * step. */
  step: number;
  pos: Vec3[];
  yaw: number[];
  pitch: number[];
};

export type Frame = {
  pos: Vec3;
  forward: Vec3;
  right: Vec3;
  up: Vec3;
  yaw: number;
  pitch: number;
};

const DEG = Math.PI / 180;

/** Moving average, so section changes blend instead of kinking. */
function smooth(xs: number[], radius: number): number[] {
  return xs.map((_, i) => {
    let sum = 0;
    let n = 0;
    for (let j = i - radius; j <= i + radius; j++) {
      const v = xs[Math.max(0, Math.min(xs.length - 1, j))];
      if (v !== undefined) {
        sum += v;
        n++;
      }
    }
    return sum / n;
  });
}

function forwardOf(yaw: number, pitch: number): Vec3 {
  return [
    Math.sin(yaw) * Math.cos(pitch),
    -Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch),
  ];
}

/** Integrate sections into a sampled path. Pitch blends over ~15 m, curves
 *  over ~25 m. */
export function buildPath(sections: Section[], step = 1): Path {
  const rawPitch: number[] = [];
  const rawCurve: number[] = [];
  for (const sec of sections) {
    const n = Math.max(1, Math.round(sec.length / step));
    for (let i = 0; i < n; i++) {
      rawPitch.push(sec.pitch * DEG);
      rawCurve.push(sec.curve);
    }
  }
  rawPitch.push(rawPitch.at(-1) ?? 0);
  rawCurve.push(0);
  const pitch = smooth(rawPitch, Math.round(7 / step));
  const curve = smooth(rawCurve, Math.round(12 / step));
  const yaw: number[] = [0];
  const pos: Vec3[] = [[0, 0, 0]];
  for (let i = 1; i < pitch.length; i++) {
    const y0 = yaw[i - 1] ?? 0;
    const y1 = y0 + (curve[i - 1] ?? 0) * step;
    yaw.push(y1);
    const f = forwardOf(
      (y0 + y1) / 2,
      ((pitch[i - 1] ?? 0) + (pitch[i] ?? 0)) / 2,
    );
    const p = pos[i - 1] ?? [0, 0, 0];
    pos.push([p[0] + f[0] * step, p[1] + f[1] * step, p[2] + f[2] * step]);
  }
  return { step, pos, yaw, pitch };
}

/** Length the path covers (m). */
export function pathLength(path: Path): number {
  return (path.pos.length - 1) * path.step;
}

function frameFrom(pos: Vec3, yaw: number, pitch: number): Frame {
  const forward = forwardOf(yaw, pitch);
  const right: Vec3 = [Math.cos(yaw), 0, Math.sin(yaw)];
  // up = right × forward
  const up: Vec3 = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ];
  return { pos, forward, right, up, yaw, pitch };
}

/** Frame at distance s, interpolated; extrapolated straight past the ends. */
export function frameAt(path: Path, s: number): Frame {
  const last = path.pos.length - 1;
  const u = s / path.step;
  const i = Math.max(0, Math.min(last - 1, Math.floor(u)));
  const t = u - i;
  const a = path.pos[i] ?? [0, 0, 0];
  const b = path.pos[i + 1] ?? a;
  const yaw =
    (path.yaw[i] ?? 0) +
    ((path.yaw[i + 1] ?? 0) - (path.yaw[i] ?? 0)) * Math.min(1, Math.max(0, t));
  const pitch =
    (path.pitch[i] ?? 0) +
    ((path.pitch[i + 1] ?? 0) - (path.pitch[i] ?? 0)) *
      Math.min(1, Math.max(0, t));
  if (t >= 0 && t <= 1) {
    return frameFrom(
      [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
      ],
      yaw,
      pitch,
    );
  }
  // Outside the samples: continue straight from the nearest end.
  const end = t < 0 ? a : b;
  const f = frameFrom(end, yaw, pitch);
  const d = t < 0 ? t * path.step : (t - 1) * path.step;
  return frameFrom(
    [
      end[0] + f.forward[0] * d,
      end[1] + f.forward[1] * d,
      end[2] + f.forward[2] * d,
    ],
    yaw,
    pitch,
  );
}

/** Track coordinates (x, h, s) → world position. */
export function pointAt(path: Path, x: number, h: number, s: number): Vec3 {
  const f = frameAt(path, s);
  return [
    f.pos[0] + f.right[0] * x + f.up[0] * h,
    f.pos[1] + f.right[1] * x + f.up[1] * h,
    f.pos[2] + f.right[2] * x + f.up[2] * h,
  ];
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** World position → track coordinates. `hint` (a recent s) keeps the search
 *  local and fast; without it the whole path is searched. */
export function project(
  path: Path,
  p: Vec3,
  hint?: number,
): { s: number; x: number; h: number } {
  const last = path.pos.length - 1;
  let lo = 0;
  let hi = last;
  if (hint !== undefined) {
    const c = Math.round(hint / path.step);
    lo = Math.max(0, c - 12);
    hi = Math.min(last, c + 12);
  }
  let best = lo;
  let bestD = Infinity;
  for (let i = lo; i <= hi; i++) {
    const q = path.pos[i];
    if (!q) continue;
    const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  const f = frameAt(path, best * path.step);
  const rel: Vec3 = [p[0] - f.pos[0], p[1] - f.pos[1], p[2] - f.pos[2]];
  const s = best * path.step + dot(rel, f.forward);
  const g = frameAt(path, s);
  const rel2: Vec3 = [p[0] - g.pos[0], p[1] - g.pos[1], p[2] - g.pos[2]];
  return { s, x: dot(rel2, g.right), h: dot(rel2, g.up) };
}

/** Rotation whose X, Y, Z axes are the given orthonormal vectors. */
export function quatFromBasis(x: Vec3, y: Vec3, z: Vec3): Quat {
  const [m00, m10, m20] = x;
  const [m01, m11, m21] = y;
  const [m02, m12, m22] = z;
  const tr = m00 + m11 + m22;
  if (tr > 0) {
    const k = 0.5 / Math.sqrt(tr + 1);
    return [(m21 - m12) * k, (m02 - m20) * k, (m10 - m01) * k, 0.25 / k];
  }
  if (m00 > m11 && m00 > m22) {
    const k = 2 * Math.sqrt(1 + m00 - m11 - m22);
    return [0.25 * k, (m01 + m10) / k, (m02 + m20) / k, (m21 - m12) / k];
  }
  if (m11 > m22) {
    const k = 2 * Math.sqrt(1 + m11 - m00 - m22);
    return [(m01 + m10) / k, 0.25 * k, (m12 + m21) / k, (m02 - m20) / k];
  }
  const k = 2 * Math.sqrt(1 + m22 - m00 - m11);
  return [(m02 + m20) / k, (m12 + m21) / k, 0.25 * k, (m10 - m01) / k];
}

/** Orientation at s: lying on the ice (axes right, up, back), or standing
 *  upright in the world but facing down the street. */
export function frameQuat(f: Frame, upright = false): Quat {
  if (upright) {
    const back: Vec3 = [-Math.sin(f.yaw), 0, Math.cos(f.yaw)];
    return quatFromBasis(f.right, [0, 1, 0], back);
  }
  const back: Vec3 = [-f.forward[0], -f.forward[1], -f.forward[2]];
  return quatFromBasis(f.right, f.up, back);
}

/** A strip across the street following the path: vertices at the given x
 *  offsets (and height h) for every sample from s0 to s1. Indices are two
 *  triangles per cell, facing up. v (for textures) is s in metres. */
export function ribbon(
  path: Path,
  xs: number[],
  s0: number,
  s1: number,
  h = 0,
): { positions: Float32Array; uvs: Float32Array; indices: Uint32Array } {
  const rows: number[] = [];
  for (let s = s0; s < s1; s += path.step) rows.push(s);
  rows.push(s1);
  const cols = xs.length;
  const positions = new Float32Array(rows.length * cols * 3);
  const uvs = new Float32Array(rows.length * cols * 2);
  rows.forEach((s, r) => {
    xs.forEach((x, c) => {
      const p = pointAt(path, x, h, s);
      const k = r * cols + c;
      positions.set(p, k * 3);
      uvs.set(
        [(x - (xs[0] ?? 0)) / ((xs.at(-1) ?? 1) - (xs[0] ?? 0)), s],
        k * 2,
      );
    });
  });
  const indices: number[] = [];
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const d = a + cols;
      const e = d + 1;
      // Rows run downhill (-Z), columns run right (+X): a, d, b faces up.
      indices.push(a, b, d, b, e, d);
    }
  }
  return { positions, uvs, indices: Uint32Array.from(indices) };
}
