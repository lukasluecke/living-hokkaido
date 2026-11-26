// Rapier world for one street: icy ground following the path, one collider
// per shopfront, obstacles and the player. M1/M2 player = an upright capsule
// (rotations locked); the active ragdoll replaces it in M4. Reports contacts
// by obstacle label; the rules in src/core decide what a contact means.
import type RAPIER from "@dimforge/rapier3d-compat";
import { wobbleAccel } from "../core/balance";
import {
  frameAt,
  frameQuat,
  pointAt,
  project,
  type Quat,
  ribbon,
  type Vec3,
} from "../core/path";
import type { Obstacle, Track } from "../core/track";
import type { Controls } from "../input/controls";

type R = typeof RAPIER;

export const PLAYER = { radius: 0.3, halfHeight: 0.5, startS: 3 } as const;
/** Centre height of the capsule above the ice. */
const PLAYER_H = PLAYER.halfHeight + PLAYER.radius + 0.03;

export const TUNING = {
  iceFriction: 0.02,
  /** Sideways push from a full lean (m/s²). */
  lean: 6,
  /** Lean authority while bracing. Raised from 0.5 after playtesting:
   *  bracing felt like the steering broke. */
  braceLean: 0.7,
  /** Deceleration while bracing (m/s²); gravity along the slope ≈ 1.5–3. */
  // Raised from 3.4 after playtesting: at the slower top speed the old
  // brace barely beat gravity, so it felt like nothing happened.
  brace: 5,
  /** Sideways damping so a lean can be caught (1/s). Raised from 0.8
   *  after playtesting: less sideways drift, so taps don't zigzag. */
  sideDamping: 1.2,
  /** Quadratic air drag (1/m); top speed ≈ 9–17 m/s by steepness.
   *  Tuned over four playtests: 0.004 → 0.0058 → 0.008 → 0.012 → 0.010
   *  (slow enough to read the signs, then a touch faster again). */
  drag: 0.01,
  /** Push when the player slips at the start (m/s). */
  slip: 1.5,
};

/**
 * Soft obstacles: the body ploughs through and slows down instead of
 * crashing. `keep` is the share of speed left after one.
 */
export const SOFT: Record<string, { keep: number }> = {
  "snow-pile": { keep: 0.62 },
};

/** Wall-label sizes: how far shopfront colliders sink below the ice. */
const SINK = 3;

export type Physics = ReturnType<typeof createPhysics>;

const vec = (p: Vec3) => ({ x: p[0], y: p[1], z: p[2] });
const quat = (q: Quat) => ({ x: q[0], y: q[1], z: q[2], w: q[3] });

/** Where an obstacle's collider centre goes, and how it is turned. */
export function obstaclePose(
  track: Track,
  o: Obstacle,
): { pos: Vec3; rot: Quat; upright: boolean } {
  const f = frameAt(track.path, o.s);
  const upright = o.kind !== "snow-pile" && o.kind !== "crate";
  const base = frameQuat(f, upright);
  // Turn about the object's own vertical axis.
  const half = o.turn / 2;
  const spin: Quat = [0, Math.sin(half), 0, Math.cos(half)];
  const rot = mul(base, spin);
  if (upright) {
    const g = pointAt(track.path, o.x, 0, o.s);
    return { pos: [g[0], g[1] + o.h / 2, g[2]], rot, upright };
  }
  return { pos: pointAt(track.path, o.x, o.h / 2, o.s), rot, upright };
}

/** Quaternion product a·b. */
export function mul(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

/** Box of one shopfront: centre, rotation and half extents (upright). */
export function buildingBox(
  track: Track,
  b: Track["buildings"][number],
): { pos: Vec3; rot: Quat; half: Vec3; sink: number } {
  const len = b.s1 - b.s0;
  const mid = b.s0 + len / 2;
  const f = frameAt(track.path, mid);
  const ground = pointAt(
    track.path,
    b.side * (track.halfWidth + b.depth / 2),
    0,
    mid,
  );
  // The street drops along the facade: sink the base so both ends meet it.
  const sink = (len / 2) * Math.tan(f.pitch) + SINK;
  const half: Vec3 = [b.depth / 2, (b.h + sink) / 2, len / 2];
  return {
    pos: [ground[0], ground[1] + (b.h - sink) / 2, ground[2]],
    rot: frameQuat(f, true),
    half,
    sink,
  };
}

export function createPhysics(R: R, track: Track, seed = 1, startAt = 0) {
  const world = new R.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = 1 / 60;
  const events = new R.EventQueue(true);
  const labels = new Map<number, string>();
  const W = track.halfWidth;
  const L = track.length;

  const fixed = (
    pos: Vec3,
    rot: Quat,
    shape: RAPIER.ColliderDesc,
    label?: string,
  ) => {
    const body = world.createRigidBody(
      R.RigidBodyDesc.fixed()
        .setTranslation(...pos)
        .setRotation(quat(rot)),
    );
    const c = world.createCollider(
      shape
        .setFriction(TUNING.iceFriction)
        .setFrictionCombineRule(R.CoefficientCombineRule.Min),
      body,
    );
    if (label) labels.set(c.handle, label);
    return c;
  };

  // Ice: a trimesh following the path, from behind the start to just past
  // the canal edge.
  const ground = ribbon(track.path, [-(W + 12), 0, W + 12], -20, L + 8);
  fixed(
    [0, 0, 0],
    [0, 0, 0, 1],
    R.ColliderDesc.trimesh(
      ground.positions,
      ground.indices,
      R.TriMeshFlags.FIX_INTERNAL_EDGES,
    ),
  );

  // Shopfronts: one box per building, the same box the renderer draws.
  for (const b of track.buildings) {
    const box = buildingBox(track, b);
    fixed(box.pos, box.rot, R.ColliderDesc.cuboid(...box.half), "shopfront");
  }
  // Backstop walls just behind the facades, in case a curve leaves a seam.
  for (const side of [-1, 1]) {
    const xs = [side * (W + 1.2)];
    const lo = ribbon(track.path, xs, -20, L + 8, -1);
    const hi = ribbon(track.path, xs, -20, L + 8, 6);
    const rows = lo.positions.length / 3;
    const pos = new Float32Array(rows * 2 * 3);
    for (let i = 0; i < rows; i++) {
      pos.set(lo.positions.subarray(i * 3, i * 3 + 3), i * 6);
      pos.set(hi.positions.subarray(i * 3, i * 3 + 3), i * 6 + 3);
    }
    const idx: number[] = [];
    for (let i = 0; i < rows - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    fixed(
      [0, 0, 0],
      [0, 0, 0, 1],
      R.ColliderDesc.trimesh(pos, Uint32Array.from(idx)),
      "shopfront",
    );
  }
  // A wall behind the start so nobody slides off the top.
  const f0 = frameAt(track.path, -2);
  fixed(
    pointAt(track.path, 0, 2.5, -2),
    frameQuat(f0),
    R.ColliderDesc.cuboid(W, 3, 0.5),
    "shopfront",
  );

  for (const o of track.obstacles) {
    const { pos, rot } = obstaclePose(track, o);
    const shape =
      o.kind === "lamp-post"
        ? R.ColliderDesc.cylinder(o.h / 2, o.w / 2)
        : o.kind === "tourist"
          ? R.ColliderDesc.capsule(o.h / 2 - o.w / 2, o.w / 2)
          : R.ColliderDesc.cuboid(o.w / 2, o.h / 2, o.d / 2);
    if (SOFT[o.kind]) shape.setSensor(true);
    fixed(pos, rot, shape, o.kind);
  }

  // Player: an upright capsule that slides on the ice.
  const startS = PLAYER.startS + startAt;
  const start = pointAt(track.path, 0, PLAYER_H, startS);
  const body = world.createRigidBody(
    R.RigidBodyDesc.dynamic()
      .setTranslation(...start)
      .setCcdEnabled(true)
      .lockRotations()
      .setCanSleep(false),
  );
  const collider = world.createCollider(
    R.ColliderDesc.capsule(PLAYER.halfHeight, PLAYER.radius)
      .setDensity(80)
      .setFriction(TUNING.iceFriction)
      .setFrictionCombineRule(R.CoefficientCombineRule.Min)
      .setRestitution(0.2)
      .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS),
    body,
  );

  const phase = [seed * 0.37, seed * 1.91 + 1, seed * 2.73 + 2] as const;
  let crashed = false;
  let stopped = false;
  /** The canal ending: slide to the edge, fly off it, splash, float. */
  let ending: "none" | "sliding" | "flying" | "floating" = "none";
  // Water level (the canal's surface is drawn at h -2.5 past the edge).
  const waterY = pointAt(track.path, 0, -2.5, track.length + 30)[1];
  /** Where the embankment edge is (the ice ends a little after it). */
  const EDGE = track.length + 6.8;
  let time = 0;
  let s: number = startS;
  let lastWobble = 0;

  function local() {
    const t = body.translation();
    const q = project(track.path, [t.x, t.y, t.z], s);
    s = q.s;
    return q;
  }

  /** One fixed step. Returns the label of anything the player touched. */
  function step(controls: Controls, dt: number): string | null {
    world.timestep = dt;
    time += dt;
    if (!crashed && !stopped) {
      local();
      const f = frameAt(track.path, s);
      const m = body.mass();
      const v = body.linvel();
      const vv: Vec3 = [v.x, v.y, v.z];
      const down =
        vv[0] * f.forward[0] + vv[1] * f.forward[1] + vv[2] * f.forward[2];
      const sideV = vv[0] * f.right[0] + vv[2] * f.right[2];
      const speed = Math.hypot(v.x, v.y, v.z);
      const lean = controls.lean * (controls.brace ? TUNING.braceLean : 1);
      lastWobble = wobbleAccel(speed, time, phase, controls.brace);
      let side = lean * TUNING.lean - sideV * TUNING.sideDamping + lastWobble;
      let along = -TUNING.drag * down * Math.abs(down);
      if (controls.brace && down > 0.5) along -= TUNING.brace;
      side *= m * dt;
      along *= m * dt;
      body.applyImpulse(
        {
          x: f.right[0] * side + f.forward[0] * along,
          y: f.forward[1] * along,
          z: f.right[2] * side + f.forward[2] * along,
        },
        true,
      );
    }
    world.step(events);
    let hit: string | null = null;
    events.drainCollisionEvents((h1, h2, started) => {
      if (!started || hit) return;
      const other =
        h1 === collider.handle ? h2 : h2 === collider.handle ? h1 : -1;
      hit = labels.get(other) ?? null;
    });
    if (ending === "sliding" && local().s > EDGE) {
      // Off the embankment: a hop up and forward, and a comic forward flip.
      ending = "flying";
      const m = body.mass();
      const f = frameAt(track.path, s);
      body.lockRotations(false, true);
      body.setAngularDamping(0.3);
      body.applyImpulse(
        { x: f.forward[0] * 1.5 * m, y: 4.5 * m, z: f.forward[2] * 1.5 * m },
        true,
      );
      body.applyTorqueImpulse(
        { x: f.right[0] * 0.9 * m, y: 0, z: f.right[2] * 0.9 * m },
        true,
      );
    } else if (ending === "flying" && body.translation().y < waterY + 0.1) {
      // Splash down, then float upright with the head above the water.
      ending = "floating";
      const t = body.translation();
      body.setGravityScale(0, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      body.lockRotations(true, true);
      body.setTranslation({ x: t.x, y: waterY + 0.1, z: t.z }, true);
    }
    const soft = hit ? SOFT[hit] : undefined;
    if (soft && !crashed) {
      const v = body.linvel();
      body.setLinvel(
        { x: v.x * soft.keep, y: v.y * soft.keep, z: v.z * soft.keep },
        true,
      );
    }
    return hit;
  }

  return {
    step,
    /** Nudge the player off their feet at the start of a run. */
    slip() {
      const m = body.mass();
      const f = frameAt(track.path, startS);
      body.applyImpulse(
        vec(f.forward.map((d) => d * TUNING.slip * m) as Vec3),
        true,
      );
    },
    /** The body goes limp: rotations free, a comic spin and hop. */
    crash(random: () => number) {
      crashed = true;
      body.lockRotations(false, true);
      body.setAngularDamping(0.4);
      const m = body.mass();
      body.applyImpulse(
        { x: (random() - 0.5) * 2 * m, y: 3.5 * m, z: 0 },
        true,
      );
      body.applyTorqueImpulse(
        {
          x: (random() - 0.5) * 1.5 * m,
          y: (random() - 0.5) * 1 * m,
          z: (random() - 0.5) * 2 * m,
        },
        true,
      );
    },
    /** Reached the canal: no more steering; keep sliding to the edge and
     *  fly off it into the water (see step). */
    flyOff() {
      stopped = true;
      ending = "sliding";
      const v = body.linvel();
      const f = frameAt(track.path, s);
      const down = v.x * f.forward[0] + v.y * f.forward[1] + v.z * f.forward[2];
      if (down < 5) {
        const m = body.mass();
        const add = (5 - down) * m;
        body.applyImpulse(
          {
            x: f.forward[0] * add,
            y: f.forward[1] * add,
            z: f.forward[2] * add,
          },
          true,
        );
      }
    },
    /** Glide to a stop (kept for hosts or tests that want no splash). */
    stop() {
      stopped = true;
      body.setLinearDamping(5);
    },
    /** In the air over the canal (rotation is free). */
    flying: () => ending === "flying",
    /** In the water after the splash. */
    floating: () => ending === "floating",
    reset() {
      crashed = false;
      stopped = false;
      ending = "none";
      body.setGravityScale(1, true);
      time = 0;
      s = startS;
      lastWobble = 0;
      body.setLinearDamping(0);
      body.setAngularDamping(0);
      body.setTranslation(vec(start), true);
      body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      body.lockRotations(true, true);
      events.clear();
    },
    position(): Vec3 {
      const t = body.translation();
      return [t.x, t.y, t.z];
    },
    /** Body rotation; identity (upright) until a crash frees it. */
    rotation(): Quat {
      const r = body.rotation();
      return [r.x, r.y, r.z, r.w];
    },
    crashed: () => crashed,
    /** Track position (s, x, h) of the player. */
    local,
    /** Metres slid from the start line. */
    distance(): number {
      return local().s - PLAYER.startS;
    },
    /** Current sideways push from losing balance (m/s²), for the sway. */
    wobble: () => lastWobble,
    /** Speed in m/s. */
    speed(): number {
      const l = body.linvel();
      return Math.hypot(l.x, l.y, l.z);
    },
    free() {
      events.free();
      world.free();
    },
  };
}
