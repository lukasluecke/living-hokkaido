// Imperative Gaussian splat viewer for the splat-look kind. Plain three.js
// plus Spark (@sparkjsdev/spark, MIT), the same loader as Shaw's
// vendor/sapporo-omusha. Loaded with import() only when a visitor opens
// the capture, so the island never pays for it.
//
// Spots are DOM buttons projected over the canvas every frame (one overlay,
// like the detail-scene lab), so they work with keyboard and screen readers.
// The React panel next to the canvas lists the same spots.
import type { Vec3 } from "@/contracts";

export type SplatSpot = { id: string; label: string; position: Vec3 };

export type SplatViewerOptions = {
  url: string;
  /** Rotate 180° about X (Y-down exports). */
  flip: boolean;
  view: { eye: Vec3; target: Vec3 };
  spots: SplatSpot[];
  onPick: (spotId: string) => void;
  onProgress?: (loaded: number, total: number) => void;
  reducedMotion: boolean;
};

export type SplatViewer = {
  ready: Promise<void>;
  focus(spotId: string): void;
  select(spotId: string | null): void;
  destroy(): void;
};

/** WebGL2 is required by Spark. */
export function canRenderSplats(): boolean {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/** Phones and small-memory devices get a lower pixel ratio and fewer splats. */
export function lowPower(): boolean {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (
    matchMedia("(pointer: coarse)").matches || (mem !== undefined && mem <= 4)
  );
}

export async function mountSplatViewer(
  host: HTMLElement,
  o: SplatViewerOptions,
): Promise<SplatViewer> {
  const [THREE, { OrbitControls }, { SparkRenderer, SplatMesh }] =
    await Promise.all([
      import("three"),
      import("three/examples/jsm/controls/OrbitControls.js"),
      import("@sparkjsdev/spark"),
    ]);

  const weak = lowPower();
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block";
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:absolute;inset:0;pointer-events:none;overflow:hidden";
  host.append(canvas, overlay);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, weak ? 1.25 : 2));
  renderer.setClearColor(0x14110e);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 500);
  // Shaw's settings: the capture was trained anti-aliased, so a small blur
  // filter; the scene has about 2.2M splats, phones draw at most 1M.
  scene.add(
    new SparkRenderer({
      renderer,
      blurAmount: 0.1,
      lodSplatCount: weak ? 1e6 : 2.5e6,
    }),
  );
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, {
    enableDamping: !o.reducedMotion,
    dampingFactor: 0.08,
    rotateSpeed: weak ? 0.6 : 0.8,
    screenSpacePanning: true,
  });

  const root = new THREE.Group();
  if (o.flip) root.quaternion.set(1, 0, 0, 0);
  scene.add(root);
  const toWorld = (p: Vec3) => {
    root.updateMatrixWorld(true);
    return root.localToWorld(new THREE.Vector3(...p));
  };

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  camera.position.copy(toWorld(o.view.eye));
  controls.target.copy(toWorld(o.view.target));
  const dist = camera.position.distanceTo(controls.target);
  controls.minDistance = dist * 0.05;
  controls.maxDistance = dist * 4;
  controls.update();

  // ------------------------------------------------------------ markers
  const markers = o.spots.map((s) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "●";
    b.title = s.label;
    b.setAttribute("aria-label", s.label);
    b.dataset.spot = s.id;
    b.style.cssText =
      "position:absolute;left:0;top:0;pointer-events:auto;box-sizing:border-box;padding:0;min-height:0;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;border:2px solid #fff8e6;background:rgba(40,30,20,.55);color:#f2c14e;font-size:12px;line-height:1;cursor:pointer;display:none";
    b.addEventListener("click", () => o.onPick(s.id));
    overlay.append(b);
    return { spot: s, el: b, world: toWorld(s.position) };
  });
  let selected: string | null = null;
  const v = new THREE.Vector3();
  const placeMarkers = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    for (const m of markers) {
      v.copy(m.world).project(camera);
      const visible = v.z < 1 && Math.abs(v.x) <= 1.05 && Math.abs(v.y) <= 1.05;
      m.el.style.display = visible ? "block" : "none";
      if (!visible) continue;
      const x = ((v.x + 1) / 2) * w;
      const y = ((1 - v.y) / 2) * h;
      m.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      const on = m.spot.id === selected;
      m.el.style.background = on ? "#f2c14e" : "rgba(40,30,20,.55)";
      m.el.style.color = on ? "#2a1d10" : "#f2c14e";
      m.el.setAttribute("aria-pressed", String(on));
    }
  };

  // ------------------------------------------------------------ fly-to
  let fly: {
    t: number;
    fromT: InstanceType<typeof THREE.Vector3>;
    toT: InstanceType<typeof THREE.Vector3>;
    fromP: InstanceType<typeof THREE.Vector3>;
    toP: InstanceType<typeof THREE.Vector3>;
  } | null = null;
  const focus = (id: string) => {
    const m = markers.find((x) => x.spot.id === id);
    if (!m) return;
    const offset = camera.position
      .clone()
      .sub(controls.target)
      .setLength(Math.max(dist * 0.35, controls.minDistance * 2));
    const toP = m.world.clone().add(offset);
    if (o.reducedMotion) {
      controls.target.copy(m.world);
      camera.position.copy(toP);
      controls.update();
      return;
    }
    fly = {
      t: 0,
      fromT: controls.target.clone(),
      toT: m.world.clone(),
      fromP: camera.position.clone(),
      toP,
    };
  };
  controls.addEventListener("start", () => {
    fly = null;
  });

  // ------------------------------------------------------------ splat
  const mesh = new SplatMesh({
    url: o.url,
    fileName: o.url.split("/").pop(),
    onProgress: (e: ProgressEvent) => {
      if (e.lengthComputable) o.onProgress?.(e.loaded, e.total);
    },
  });
  root.add(mesh);

  let last = performance.now();
  renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (fly) {
      fly.t = Math.min(fly.t + dt / 0.9, 1);
      const k = fly.t * fly.t * (3 - 2 * fly.t);
      controls.target.lerpVectors(fly.fromT, fly.toT, k);
      camera.position.lerpVectors(fly.fromP, fly.toP, k);
      if (fly.t >= 1) fly = null;
    }
    controls.update();
    renderer.render(scene, camera);
    placeMarkers();
  });

  let destroyed = false;
  return {
    ready: mesh.initialized.then(() => undefined),
    focus,
    select(id) {
      selected = id;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      controls.dispose();
      mesh.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      overlay.remove();
    },
  };
}
