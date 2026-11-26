// The exhibits in the street (see core/exhibits.ts): a pair of shachihoko
// on a warehouse ridge, straw sacks, a hand cart with sacks, stacked
// herring boxes. The warehouse wall is the building itself. A soft glow on
// the ice shows where to pass to notice each one; it fades once noticed.
// Simple stand-ins built in code, so real models can replace them.
import * as THREE from "three";
import type { ExhibitSpot } from "../core/exhibits";
import { frameAt, frameQuat, pointAt } from "../core/path";
import type { Track } from "../core/track";
import { buildingBox, obstaclePose } from "../physics/world";
import { PALETTE, type PaletteName } from "../style/palette";

const std = (
  name: PaletteName,
  extra: THREE.MeshStandardMaterialParameters = {},
) =>
  new THREE.MeshStandardMaterial({
    color: PALETTE[name],
    roughness: 0.8,
    ...extra,
  });

export function createExhibits(
  scene: THREE.Scene,
  track: Track,
  spots: readonly ExhibitSpot[],
  reducedMotion: boolean,
) {
  const mat = {
    straw: std("straw"),
    strawShade: std("strawShade"),
    wood: std("wood"),
    woodDark: std("woodDark"),
    herring: std("herring", { roughness: 0.35, metalness: 0.3 }),
    ceramic: std("ceramic", {
      roughness: 0.3,
      metalness: 0.2,
      emissive: PALETTE.lamp,
      emissiveIntensity: 0.12,
    }),
    snow: std("snow"),
  };
  // A warm ring on the ice (bright snow needs a strong, untoned colour)
  // and a small glint over the exhibit: where to pass, and what to look at.
  const glow = new THREE.MeshBasicMaterial({
    color: PALETTE.accent,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });
  const disc = new THREE.RingGeometry(0.75, 1.05, 40);
  const sparkGeo = new THREE.OctahedronGeometry(0.16);
  const sparkMat = new THREE.MeshBasicMaterial({
    color: PALETTE.lamp,
    toneMapped: false,
  });
  const added: THREE.Object3D[] = [];
  const add = (o: THREE.Object3D) => {
    o.traverse((c) => {
      if (c instanceof THREE.Mesh) c.castShadow = true;
    });
    scene.add(o);
    added.push(o);
    return o;
  };
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material) =>
    new THREE.Mesh(g, m);

  function sack(x: number, y: number, z: number, turn = 0) {
    const m = mesh(new THREE.CapsuleGeometry(0.2, 0.42, 4, 10), mat.straw);
    m.rotation.set(Math.PI / 2, turn, 0);
    m.scale.set(1, 1, 0.8);
    m.position.set(x, y, z);
    const tie = mesh(
      new THREE.TorusGeometry(0.17, 0.025, 6, 16),
      mat.strawShade,
    );
    tie.position.set(x, y, z + 0.28);
    return [m, tie];
  }

  function shachihoko(): THREE.Group {
    // A fish standing on its head, tail curled up: body, tail fin, side fins.
    const g = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.22, 16, 12), mat.ceramic);
    body.scale.set(0.8, 1.9, 0.9);
    body.position.y = 0.42;
    const tail = mesh(new THREE.ConeGeometry(0.2, 0.36, 3), mat.ceramic);
    tail.rotation.z = Math.PI;
    tail.position.y = 0.95;
    tail.scale.set(1.3, 1, 0.35);
    const finL = mesh(new THREE.ConeGeometry(0.08, 0.25, 3), mat.ceramic);
    finL.position.set(-0.2, 0.4, 0);
    finL.rotation.z = 0.9;
    const finR = finL.clone();
    finR.position.x = 0.2;
    finR.rotation.z = -0.9;
    g.add(body, tail, finL, finR);
    return g;
  }

  const rings: {
    id: string;
    ring: THREE.Mesh;
    spark: THREE.Mesh;
    y: number;
    fade: number;
  }[] = [];

  for (const e of spots) {
    if (e.look === "canal") continue;
    const W = track.halfWidth;
    const b = track.buildings.find((x) => x.id === e.buildingId);
    // Where to pass: a glow on the ice in front of it.
    const ringS =
      e.look === "warehouse-wall" || e.look === "shachihoko"
        ? (e.s0 + e.s1) / 2
        : e.s0;
    const ring = mesh(disc, glow.clone());
    ring.position.set(...pointAt(track.path, e.side * (W - 1.8), 0.04, ringS));
    ring.quaternion.set(...frameQuat(frameAt(track.path, ringS)));
    ring.rotateX(-Math.PI / 2);
    scene.add(ring);
    added.push(ring);
    // The glint: over the wall's middle (3.2 m up), or over the prop.
    const onWall = e.look === "warehouse-wall" || e.look === "shachihoko";
    const sy = onWall
      ? e.look === "shachihoko"
        ? (b?.h ?? 6) + 2.6
        : 3.2
      : 1.9;
    const spark = mesh(sparkGeo, sparkMat);
    spark.position.set(
      ...pointAt(track.path, onWall ? e.side * (W - 0.2) : e.x, 0, ringS),
    );
    spark.position.y += sy;
    scene.add(spark);
    added.push(spark);
    rings.push({ id: e.id, ring, spark, y: spark.position.y, fade: 0 });

    if (e.look === "shachihoko" && b) {
      const box = buildingBox(track, b);
      const len = b.s1 - b.s0;
      const roofH = 1.6 + b.depth * 0.12;
      const root = new THREE.Group();
      root.position.set(...box.pos);
      root.quaternion.set(...box.rot);
      // box.pos is the wall's centre; the ridge is on top of the wall.
      const top = box.half[1];
      for (const z of [-(len / 2 - 0.35), len / 2 - 0.35]) {
        const f = shachihoko();
        f.scale.setScalar(2.2);
        f.position.set(0, top + roofH - 0.1, z);
        f.rotation.y = z > 0 ? 0 : Math.PI;
        root.add(f);
      }
      add(root);
      continue;
    }
    const o = track.obstacles.find((x) => x.id === `exhibit-${e.id}`);
    if (!o) continue;
    const { pos, rot } = obstaclePose(track, o);
    const root = new THREE.Group();
    root.position.set(...pos);
    root.quaternion.set(...rot);
    const base = -o.h / 2;
    if (e.look === "straw-sacks") {
      for (const [x, y, z, t] of [
        [-0.2, 0.2, -0.5, 0.1],
        [0.22, 0.2, -0.45, -0.1],
        [-0.2, 0.2, 0.15, 0],
        [0.22, 0.2, 0.2, 0.12],
        [0, 0.56, -0.15, 0.05],
      ] as const)
        root.add(...sack(x, base + y, z, t));
    } else if (e.look === "sack-cart") {
      const bed = mesh(new THREE.BoxGeometry(0.9, 0.1, 1.4), mat.wood);
      bed.position.set(0, base + 0.5, 0);
      root.add(bed);
      for (const x of [-0.5, 0.5]) {
        const wheel = mesh(
          new THREE.CylinderGeometry(0.36, 0.36, 0.08, 16),
          mat.woodDark,
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, base + 0.36, 0.1);
        root.add(wheel);
        const handle = mesh(
          new THREE.BoxGeometry(0.06, 0.06, 0.9),
          mat.woodDark,
        );
        handle.position.set(x * 0.8, base + 0.6, 1.0);
        handle.rotation.x = -0.25;
        root.add(handle);
      }
      root.add(
        ...sack(-0.2, base + 0.75, -0.3),
        ...sack(0.22, base + 0.75, -0.25, 0.1),
        ...sack(0, base + 0.75, 0.35, -0.1),
      );
    } else if (e.look === "herring-boxes") {
      for (let k = 0; k < 3; k++) {
        const box = mesh(new THREE.BoxGeometry(0.75, 0.24, 0.6), mat.wood);
        box.position.set(0, base + 0.12 + k * 0.26, k === 1 ? 0.62 : 0);
        if (k === 2) box.position.z = 0.3;
        root.add(box);
      }
      // A layer of herring in the top box.
      for (let i = 0; i < 5; i++) {
        const fish = mesh(new THREE.SphereGeometry(0.05, 8, 6), mat.herring);
        fish.scale.set(1, 0.6, 5);
        fish.position.set(-0.28 + i * 0.14, base + 0.8, 0.3);
        root.add(fish);
      }
    }
    add(root);
  }

  return {
    /** Pulse the glows; fade the noticed ones. `t` in seconds. */
    update(t: number, dt: number, noticed: readonly string[]) {
      for (const [i, r] of rings.entries()) {
        const got = noticed.includes(r.id);
        r.fade = got ? Math.min(1, r.fade + dt * 2) : 0;
        const m = r.ring.material as THREE.MeshBasicMaterial;
        const pulse = reducedMotion ? 1 : 0.75 + Math.sin(t * 2.4 + i) * 0.25;
        m.opacity = 0.9 * pulse * (1 - r.fade);
        r.ring.visible = r.fade < 1;
        r.spark.visible = r.fade < 1;
        r.spark.scale.setScalar(Math.max(0.001, 1 - r.fade));
        if (!reducedMotion) {
          r.spark.rotation.y = t * 2 + i;
          r.spark.position.y = r.y + Math.sin(t * 3 + i) * 0.12;
        }
      }
    },
    destroy() {
      for (const o of added) scene.remove(o);
    },
  };
}
