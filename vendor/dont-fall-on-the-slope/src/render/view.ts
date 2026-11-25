// Renderer, lights, the player's figure and the chase camera.
import * as THREE from "three";
import { frameAt, pointAt, type Quat, type Vec3 } from "../core/path";
import type { Track } from "../core/track";
import { obstaclePose, PLAYER } from "../physics/world";
import { PALETTE } from "../style/palette";
import { buildStreet } from "../world/street";

/** What the view needs about the player each frame. */
export type Pose = {
  pos: Vec3;
  rot: Quat;
  /** Track position, for the camera. */
  s: number;
  x: number;
  speed: number;
};

export type View = ReturnType<typeof createView>;

export function createView(
  host: HTMLElement,
  track: Track,
  reducedMotion: boolean,
) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  Object.assign(renderer.domElement.style, {
    display: "block",
    width: "100%",
    height: "100%",
    touchAction: "none",
  });
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.dusk);
  scene.fog = new THREE.Fog(PALETTE.dusk, 30, 120);

  // Evening light: cool sky fill, a warm key from high on the left, a cool
  // fill from the right so no facade goes black, shadows near the player.
  scene.add(new THREE.HemisphereLight(PALETTE.duskHigh, PALETTE.wood, 1.6));
  scene.add(new THREE.AmbientLight(PALETTE.lamp, 0.35));
  const fill = new THREE.DirectionalLight(PALETTE.glassGlow, 0.9);
  fill.position.set(10, 8, 4);
  scene.add(fill);
  const key = new THREE.DirectionalLight(PALETTE.lamp, 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  const sc = key.shadow.camera;
  sc.left = sc.bottom = -14;
  sc.right = sc.top = 14;
  sc.near = 1;
  sc.far = 60;
  key.shadow.bias = -0.0005;
  scene.add(key, key.target);
  // Gas-lamp light from both sides of the street, so the facades on either
  // side read (the key light alone left one side nearly black).
  const sideL = new THREE.DirectionalLight(PALETTE.lamp, 0.9);
  const sideR = new THREE.DirectionalLight(PALETTE.window, 0.7);
  scene.add(sideL, sideL.target, sideR, sideR.target);

  scene.add(buildStreet(track));

  // A soft halo around every gas lamp.
  const haloTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    if (g) {
      const r = g.createRadialGradient(32, 32, 2, 32, 32, 32);
      r.addColorStop(0, "rgba(255,214,150,0.9)");
      r.addColorStop(0.35, "rgba(255,194,119,0.35)");
      r.addColorStop(1, "rgba(255,194,119,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, 64, 64);
    }
    return new THREE.CanvasTexture(c);
  })();
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  for (const o of track.obstacles) {
    if (o.kind !== "lamp-post") continue;
    const { pos } = obstaclePose(track, o);
    const halo = new THREE.Sprite(haloMat);
    halo.position.set(pos[0], pos[1] + o.h / 2 + 0.25, pos[2]);
    halo.scale.setScalar(2.4);
    scene.add(halo);
  }

  // Falling snow around the camera (none with reduced motion).
  const FLAKES = reducedMotion ? 0 : 1400;
  const BOX = { x: 14, y: 9, z: 22 } as const;
  const flakePos = new Float32Array(FLAKES * 3);
  for (let i = 0; i < FLAKES; i++) {
    flakePos[i * 3] = (Math.random() * 2 - 1) * BOX.x;
    flakePos[i * 3 + 1] = Math.random() * BOX.y * 2 - BOX.y;
    flakePos[i * 3 + 2] = (Math.random() * 2 - 1) * BOX.z;
  }
  const flakeGeo = new THREE.BufferGeometry();
  flakeGeo.setAttribute("position", new THREE.BufferAttribute(flakePos, 3));
  const flakes = new THREE.Points(
    flakeGeo,
    new THREE.PointsMaterial({
      color: PALETTE.snow,
      size: 0.07,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
  );
  flakes.frustumCulled = false;
  if (FLAKES) scene.add(flakes);
  let snowT = 0;

  // The player: a small figure in a red coat and blue scarf. Same capsule
  // as the physics body; the ragdoll replaces it in M4.
  const player = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({
    color: PALETTE.coat,
    roughness: 0.8,
  });
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      PLAYER.radius,
      PLAYER.halfHeight * 2 - 0.35,
      4,
      12,
    ),
    coat,
  );
  torso.position.y = -0.17;
  torso.castShadow = true;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, 16, 12),
    new THREE.MeshStandardMaterial({ color: PALETTE.skin, roughness: 0.7 }),
  );
  head.position.y = 0.58;
  head.castShadow = true;
  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.06, 8, 16),
    new THREE.MeshStandardMaterial({ color: PALETTE.scarf, roughness: 0.9 }),
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 0.4;
  const hat = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: PALETTE.scarf, roughness: 0.9 }),
  );
  hat.position.y = 0.62;
  player.add(torso, head, scarf, hat);
  scene.add(player);

  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 300);
  const camPos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  let placed = false;
  const W = track.halfWidth;

  function resize() {
    const w = Math.max(1, host.clientWidth);
    const h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the street's width in view on a narrow (portrait) screen.
    camera.fov = w / h < 1 ? 72 : 58;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  return {
    /** Draw one frame. `dt` is real time, for camera smoothing. */
    render(pose: Pose, dt: number) {
      player.position.set(...pose.pos);
      player.quaternion.set(...pose.rot);
      const p = player.position;
      // Behind and slightly above along the street, looking a little ahead;
      // never inside a shopfront.
      const cx = Math.max(-W + 0.8, Math.min(W - 0.8, pose.x * 0.6));
      tmp.set(...pointAt(track.path, cx, 3, pose.s - 6.5));
      if (!placed) {
        camPos.copy(tmp);
        look.set(...pointAt(track.path, pose.x * 0.5, 0.9, pose.s + 7));
        placed = true;
      }
      camPos.lerp(tmp, 1 - Math.exp(-dt * 6));
      camera.position.copy(camPos);
      lookTarget.set(...pointAt(track.path, pose.x * 0.5, 0.9, pose.s + 7));
      look.lerp(lookTarget, 1 - Math.exp(-dt * 8));
      camera.lookAt(look);
      const speed = pose.speed;
      if (!reducedMotion) {
        const base = camera.aspect < 1 ? 72 : 58;
        const fov = base + Math.min(10, speed * 0.45);
        if (Math.abs(camera.fov - fov) > 0.05) {
          camera.fov += (fov - camera.fov) * (1 - Math.exp(-dt * 3));
          camera.updateProjectionMatrix();
        }
      }
      key.position.set(p.x - 5, p.y + 24, p.z + 4);
      key.target.position.copy(p);
      const fr = frameAt(track.path, pose.s).right;
      sideL.position.set(p.x - fr[0] * 12, p.y + 6, p.z - fr[2] * 12);
      sideL.target.position.copy(p);
      sideR.position.set(p.x + fr[0] * 12, p.y + 6, p.z + fr[2] * 12);
      sideR.target.position.copy(p);
      if (FLAKES) {
        // Flakes fall and drift; each wraps around the camera's box.
        snowT += dt;
        const c = camera.position;
        const a = flakeGeo.attributes.position as THREE.BufferAttribute;
        const arr = a.array as Float32Array;
        const wrap = (v: number, centre: number, half: number) =>
          v - centre > half
            ? v - half * 2
            : v - centre < -half
              ? v + half * 2
              : v;
        for (let i = 0; i < FLAKES; i++) {
          const j = i * 3;
          arr[j + 1] -= dt * (0.9 + (i % 7) * 0.12);
          arr[j] += Math.sin(snowT * 0.8 + i) * dt * 0.3;
          arr[j] = wrap(arr[j]!, c.x, BOX.x);
          arr[j + 1] = wrap(arr[j + 1]!, c.y, BOX.y);
          arr[j + 2] = wrap(arr[j + 2]!, c.z, BOX.z);
        }
        a.needsUpdate = true;
      }
      renderer.render(scene, camera);
    },
    canvas: renderer.domElement,
    /** The three scene, for extra markers (finds). */
    scene,
    /** Snap the camera back behind the player (after a restart). */
    snap() {
      placed = false;
    },
    destroy() {
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material)
          ? m.material
          : m.material
            ? [m.material]
            : [];
        for (const x of mats) {
          (x as THREE.MeshStandardMaterial).map?.dispose();
          x.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
