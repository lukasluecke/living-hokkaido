// Renderer, lights, the player's figure and the chase camera.
import * as THREE from "three";
import { frameAt, pointAt, type Quat, type Vec3 } from "../core/path";
import { cameraRaise, flashNow, isPhotographer } from "../core/tourists";
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
  /** 0 = steady, 1 = losing it: the arms windmill (step 7). */
  balance: number;
  /** Bracing: the figure crouches. */
  brace: boolean;
  /** The canal ending: in the air, or floating after the splash. */
  ending?: "flying" | "floating";
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
  // Warm evening: a little more lamp-coloured ambient.
  scene.add(new THREE.AmbientLight(PALETTE.lamp, 0.45));
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
  // Arms on shoulder pivots, so they can windmill when balance goes.
  const armGeo = new THREE.CapsuleGeometry(0.07, 0.42, 3, 8).translate(
    0,
    -0.26,
    0,
  );
  const arms = ([-1, 1] as const).map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * (PLAYER.radius + 0.04), 0.3, 0);
    const arm = new THREE.Mesh(armGeo, coat);
    arm.castShadow = true;
    const mitten = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 6),
      new THREE.MeshStandardMaterial({ color: PALETTE.scarf, roughness: 0.9 }),
    );
    mitten.position.y = -0.55;
    pivot.add(arm, mitten);
    player.add(pivot);
    return { pivot, side };
  });
  let windmill = 0;
  let flail = 0;
  let crouch = 0;
  let bobT = 0;

  // Splash: an expanding ring on the water and (unless reduced motion)
  // droplets thrown up and falling back.
  const splashMat = new THREE.MeshBasicMaterial({
    color: PALETTE.iceStreak,
    transparent: true,
    depthWrite: false,
  });
  type Drop = { mesh: THREE.Mesh; v: THREE.Vector3 };
  let splash: { ring: THREE.Mesh; drops: Drop[]; t: number; y: number } | null =
    null;
  const clearSplash = () => {
    if (!splash) return;
    scene.remove(splash.ring);
    for (const d of splash.drops) scene.remove(d.mesh);
    splash = null;
  };
  scene.add(player);

  // Tourists with cameras: an arm that raises the camera as the slider
  // comes, and a brief flash at the moment of the photo.
  const flashTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    if (g) {
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,250,235,1)");
      grad.addColorStop(1, "rgba(255,250,235,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    }
    return new THREE.CanvasTexture(c);
  })();
  const camMat = new THREE.MeshStandardMaterial({
    color: PALETTE.iron,
    roughness: 0.4,
    metalness: 0.3,
  });
  const lensMat = new THREE.MeshStandardMaterial({
    color: PALETTE.cream,
    emissive: PALETTE.cream,
    emissiveIntensity: 0.6,
  });
  const sleeveMat = new THREE.MeshStandardMaterial({
    color: PALETTE.trousers,
    roughness: 0.9,
  });
  const shooters = track.obstacles.filter(isPhotographer).map((o) => {
    const { pos } = obstaclePose(track, o);
    // Upright group at the tourist's head height; it turns to face the
    // slider, so the camera and flash read from the chase camera.
    const root = new THREE.Group();
    root.position.set(pos[0], pos[1] - o.h / 2 + 1.35, pos[2]);
    const arm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.06, 0.32, 3, 6).rotateX(Math.PI / 2),
      sleeveMat,
    );
    const cam = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.17, 0.12),
      camMat,
    );
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.08, 10).rotateX(Math.PI / 2),
      lensMat,
    );
    lens.position.z = 0.09;
    cam.add(body, lens);
    const flash = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: flashTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0,
      }),
    );
    flash.scale.setScalar(2.6);
    root.add(arm, cam, flash);
    scene.add(root);
    return { o, root, arm, cam, flash, prev: Infinity, glow: 0 };
  });
  let onPhoto: (() => void) | null = null;

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
      // Bracing: crouch (squash and lower so the feet stay on the ice).
      crouch += ((pose.brace ? 1 : 0) - crouch) * (1 - Math.exp(-dt * 12));
      const squash = 1 - 0.2 * crouch;
      player.scale.set(1 + 0.08 * crouch, squash, 1 + 0.08 * crouch);
      player.position.y -= (1 - squash) * 0.83;
      // Floating in the canal: a gentle bob.
      if (pose.ending === "floating") {
        bobT += dt;
        player.position.y += Math.sin(bobT * 2.2) * 0.05;
        player.rotateZ(Math.sin(bobT * 1.6) * 0.06);
      }
      if (splash) {
        splash.t += dt;
        const k = splash.t / 1.3;
        splash.ring.scale.setScalar(1 + k * 9);
        (splash.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(
          0,
          0.9 - k,
        );
        for (const d of splash.drops) {
          d.v.y -= 9.8 * dt;
          d.mesh.position.addScaledVector(d.v, dt);
          d.mesh.visible = d.mesh.position.y > splash.y - 0.1;
        }
        if (k > 1.2) clearSplash();
      }
      // Arms: hang when steady; past a wobble threshold they swing wider and
      // faster until they windmill.
      flail += (pose.balance - flail) * (1 - Math.exp(-dt * 6));
      windmill += dt * (3 + 11 * flail);
      for (const { pivot, side } of arms) {
        const swing = Math.max(0, flail - 0.2) * 1.25;
        pivot.rotation.x =
          Math.sin(windmill + (side > 0 ? Math.PI : 0)) * swing * Math.PI;
        pivot.rotation.z = side * (0.18 + flail * 1.1);
      }
      for (const t of shooters) {
        const ahead = t.o.s - pose.s;
        const k = cameraRaise(ahead);
        t.root.visible = ahead > -8 && ahead < 40;
        if (!t.root.visible) continue;
        // Face the slider (local +z points at them).
        t.root.lookAt(pose.pos[0], t.root.position.y, pose.pos[2]);
        // Camera rises from the chest to the eye; the arm follows it.
        t.cam.position.set(0.12, -0.25 + k * 0.3, 0.18 + k * 0.08);
        t.cam.rotation.x = (1 - k) * 0.7;
        t.arm.position.set(0.16, -0.32 + k * 0.22, 0.08 + k * 0.04);
        t.arm.rotation.x = -0.9 + k * 0.9;
        if (k > 0.9 && flashNow(t.prev, ahead) && !reducedMotion) {
          t.glow = 1;
          onPhoto?.();
        }
        t.prev = ahead;
        t.glow = Math.max(0, t.glow - dt * 5);
        const m = t.flash.material as THREE.SpriteMaterial;
        m.opacity = t.glow;
        t.flash.visible = t.glow > 0;
        t.flash.position.set(
          t.cam.position.x,
          t.cam.position.y,
          t.cam.position.z + 0.2,
        );
      }
      const p = player.position;
      // Behind and slightly above along the street, looking a little ahead;
      // never inside a shopfront. In the canal ending the camera stays on
      // the embankment and looks down at the figure, keeping it in the
      // upper half of the screen (the end card rises from the bottom).
      const cx = Math.max(-W + 0.8, Math.min(W - 0.8, pose.x * 0.6));
      // Follows the flight from behind, then drops to just above the water
      // a few metres back, so the floating figure reads large.
      if (pose.ending === "floating")
        tmp.set(...pointAt(track.path, cx * 0.5, -1.0, pose.s - 4.5));
      else if (pose.ending)
        tmp.set(...pointAt(track.path, cx * 0.5, 1.8, pose.s - 6));
      else tmp.set(...pointAt(track.path, cx, 3, pose.s - 6.5));
      if (!placed) {
        camPos.copy(tmp);
        look.set(...pointAt(track.path, pose.x * 0.5, 0.9, pose.s + 7));
        placed = true;
      }
      camPos.lerp(tmp, 1 - Math.exp(-dt * 6));
      camera.position.copy(camPos);
      if (pose.ending)
        // Aim below the figure so it sits in the upper third, above the card.
        lookTarget.set(pose.pos[0], pose.pos[1] - 1.6, pose.pos[2]);
      else
        lookTarget.set(...pointAt(track.path, pose.x * 0.5, 0.9, pose.s + 7));
      look.lerp(lookTarget, 1 - Math.exp(-dt * 8));
      if (pose.ending && reducedMotion) {
        camera.position.copy(tmp);
        look.copy(lookTarget);
      }
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
    /** A still of the current view (for the score card). Renders now and
     *  copies the frame, so it works without preserveDrawingBuffer. */
    /** A splash where the figure hits the water. */
    splash(pos: Vec3) {
      clearSplash();
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.25, 0.4, 24).rotateX(-Math.PI / 2),
        splashMat.clone(),
      );
      ring.position.set(pos[0], pos[1] - 0.05, pos[2]);
      scene.add(ring);
      const drops: Drop[] = [];
      if (!reducedMotion)
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * Math.PI * 2;
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 5, 4),
            splashMat,
          );
          mesh.position.set(pos[0], pos[1], pos[2]);
          const out = 1 + Math.random() * 1.5;
          drops.push({
            mesh,
            v: new THREE.Vector3(
              Math.cos(a) * out,
              3 + Math.random() * 2.5,
              Math.sin(a) * out,
            ),
          });
          scene.add(mesh);
        }
      splash = { ring, drops, t: 0, y: pos[1] - 0.2 };
    },
    capture(): HTMLCanvasElement {
      renderer.render(scene, camera);
      const src = renderer.domElement;
      const c = document.createElement("canvas");
      c.width = src.width;
      c.height = src.height;
      c.getContext("2d")?.drawImage(src, 0, 0);
      return c;
    },
    /** Called when a tourist takes a photo (for the shutter sound). */
    onPhoto(f: () => void) {
      onPhoto = f;
    },
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
