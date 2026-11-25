// The finds in the street: a small cream museum label with a gold frame,
// floating over a glowing ring on the ice. Collected ones shrink away.
import * as THREE from "three";
import { FIND_HEIGHT, type FindSpot } from "../core/finds";
import { frameAt, frameQuat, pointAt } from "../core/path";
import type { Track } from "../core/track";
import { PALETTE } from "../style/palette";

export function createFindMarkers(
  scene: THREE.Scene,
  track: Track,
  spots: FindSpot[],
  reducedMotion: boolean,
) {
  const card = new THREE.BoxGeometry(0.7, 0.48, 0.05);
  const frame = new THREE.BoxGeometry(0.8, 0.58, 0.03);
  const ring = new THREE.RingGeometry(0.55, 0.75, 32);
  const paper = new THREE.MeshStandardMaterial({
    color: PALETTE.cream,
    emissive: PALETTE.cream,
    emissiveIntensity: 0.35,
    roughness: 0.6,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: PALETTE.accent,
    emissive: PALETTE.lamp,
    emissiveIntensity: 0.9,
    roughness: 0.4,
  });
  const glow = new THREE.MeshBasicMaterial({
    color: PALETTE.lamp,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const lineMat = new THREE.MeshBasicMaterial({ color: PALETTE.ink });
  const textLine = new THREE.BoxGeometry(0.46, 0.04, 0.06);

  const markers = spots.map((f) => {
    const g = new THREE.Group();
    g.position.set(...pointAt(track.path, f.x, 0, f.s));
    g.quaternion.set(...frameQuat(frameAt(track.path, f.s), true));
    const label = new THREE.Group();
    label.position.y = FIND_HEIGHT;
    label.add(new THREE.Mesh(frame, gold), new THREE.Mesh(card, paper));
    // Three "text" bars, like a gallery label.
    for (const [y, w] of [
      [0.1, 1],
      [0, 0.8],
      [-0.1, 0.9],
    ] as const) {
      const l = new THREE.Mesh(textLine, lineMat);
      l.position.set(0, y, 0);
      l.scale.x = w;
      label.add(l);
    }
    const halo = new THREE.Mesh(ring, glow);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.03;
    g.add(label, halo);
    scene.add(g);
    return { id: f.id, g, label, gone: 0 };
  });

  return {
    /** Spin and bob; shrink the collected ones. `t` in seconds. */
    update(t: number, dt: number, collected: readonly string[]) {
      for (const [i, m] of markers.entries()) {
        const got = collected.includes(m.id);
        if (got) m.gone = Math.min(1, m.gone + dt * 3);
        else m.gone = 0;
        m.g.visible = m.gone < 1;
        const k = 1 - m.gone;
        m.label.scale.setScalar(Math.max(0.001, k));
        if (!reducedMotion) {
          m.label.rotation.y = Math.sin(t * 1.4 + i) * 0.6;
          m.label.position.y = FIND_HEIGHT + Math.sin(t * 2 + i) * 0.06;
        }
      }
    },
  };
}
