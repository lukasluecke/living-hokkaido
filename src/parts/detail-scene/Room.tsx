"use client";
// The 3D detail scene. Ported from labs/detail-scene (variant A, low-poly):
// roof-lift entry, dollhouse home view, hover glow, focus camera move-in.
import { CameraControls, ContactShadows } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { CameraView, DetailScenePartProps } from "@/contracts";
import { createToonUniforms, toonifyTree } from "../shared/toon";
import { ArtifactShell, RoomObject } from "./room/Artifacts";
import { Dust, Hearth, WindowLight } from "./room/Hearth";
import { HouseStatic, Roof } from "./room/House";
import { MergeStatic } from "./room/MergeStatic";
import {
  blend4,
  CABIN_SCALE,
  CabinStatic,
  ClearingStatic,
  GroveStatic,
  Lantern,
} from "./room/Outdoor";
import { season as tone } from "@/design/tokens";

type V3 = [number, number, number];
const look = (c: CameraControls, v: CameraView, smooth: boolean) =>
  c.setLookAt(...(v.eye as V3), ...(v.target as V3), smooth);

export type RoomProps = DetailScenePartProps & {
  hovered: string | null;
  setHovered: (id: string | null) => void;
  overlay: React.RefObject<HTMLDivElement | null>;
};

/** Entry, home and focus camera moves. Emits scene.ready once per entry. */
function Director({
  controls,
  lift,
  props,
  onInside,
}: {
  controls: React.RefObject<CameraControls | null>;
  lift: { current: number };
  props: DetailScenePartProps;
  onInside: () => void;
}) {
  const { scene, prefs, emit, focusedArtifactId } = props;
  const liftTarget = useRef(0);
  const entered = useRef(false);
  useFrame((_, dt) => {
    lift.current = THREE.MathUtils.damp(
      lift.current,
      liftTarget.current,
      2.2,
      dt,
    );
  });
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once per scene
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    entered.current = false;
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const done = () => {
      entered.current = true;
      onInside();
      emit({ type: "scene.ready", sceneId: scene.id });
    };
    (async () => {
      if (scene.entry === "fly-in" && !prefs.reducedMotion) {
        // Outdoor: no roof; glide from high above down to the home view.
        c.smoothTime = 1.1;
        await look(c, scene.views.outside, false);
        await wait(300);
        if (cancelled) return;
        await look(c, scene.views.home, true);
        if (cancelled) return;
        c.smoothTime = 0.45;
        done();
        return;
      }
      if (prefs.reducedMotion || scene.entry !== "roof-lift") {
        liftTarget.current = 1;
        lift.current = 1;
        await look(c, scene.views.home, false);
        done();
        return;
      }
      c.smoothTime = 0.9;
      liftTarget.current = 0;
      lift.current = 0;
      await look(c, scene.views.outside, false);
      await wait(500);
      if (cancelled) return;
      liftTarget.current = 1;
      await wait(1100);
      if (cancelled) return;
      await look(c, scene.views.home, true);
      if (cancelled) return;
      c.smoothTime = 0.45;
      done();
    })();
    return () => {
      cancelled = true;
    };
  }, [scene.id]);

  useEffect(() => {
    const c = controls.current;
    if (!c || !entered.current) return;
    const p = scene.placements.find((x) => x.artifactId === focusedArtifactId);
    look(c, p ? p.focusView : scene.views.home, !prefs.reducedMotion);
  }, [focusedArtifactId, scene, controls, prefs.reducedMotion]);
  return null;
}

/** One DOM overlay: moves elements with data-x/y/z to screen space. */
function Projector({
  overlay,
}: {
  overlay: React.RefObject<HTMLDivElement | null>;
}) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const root = overlay.current;
    if (!root) return;
    for (const el of root.querySelectorAll<HTMLElement>("[data-x]")) {
      v.set(
        Number(el.dataset.x),
        Number(el.dataset.y),
        Number(el.dataset.z),
      ).project(camera);
      el.style.visibility = v.z > 1 ? "hidden" : "visible";
      el.style.transform = `translate(-50%, -100%) translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`;
    }
  });
  return null;
}

export function Room(props: RoomProps) {
  const { scene, focusedArtifactId, emit, hovered, setHovered } = props;
  const controls = useRef<CameraControls>(null);
  const lift = useRef(0);
  const [inside, setInside] = useState(false);
  return (
    <>
      <Setting kind={scene.setting} lift={lift} {...props} />
      <RoomToon />
      {scene.placements.map((p) => (
        <ArtifactShell
          key={p.artifactId}
          placement={p}
          hovered={inside && hovered === p.artifactId}
          focused={focusedArtifactId === p.artifactId}
          onHover={setHovered}
          onSelect={(id) => {
            if (!inside) return;
            if (focusedArtifactId === id) emit({ type: "artifact.blur" });
            else emit({ type: "artifact.focus", artifactId: id });
          }}
        >
          <RoomObject
            artifactId={p.artifactId}
            source={
              props.artifacts.find((a) => a.id === p.artifactId)?.model.source
            }
          />
        </ArtifactShell>
      ))}
      <ContactShadows
        position={[0, 0.015, 0]}
        scale={8}
        opacity={0.5}
        blur={2.5}
        far={2}
      />
      <CameraControls
        ref={controls}
        makeDefault
        minDistance={0.3}
        maxDistance={inside ? 12 : 40}
        maxPolarAngle={Math.PI * 0.48}
        minPolarAngle={inside ? Math.PI * 0.12 : 0}
        smoothTime={0.45}
        truckSpeed={0}
      />
      <Director
        controls={controls}
        lift={lift}
        props={props}
        onInside={() => setInside(true)}
      />
      <Projector overlay={props.overlay} />
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.85} intensity={0.7} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.AGX} />
        <Vignette offset={0.3} darkness={0.55} />
      </EffectComposer>
    </>
  );
}

/** Same two-tone look as the island, with a cool blue shade (no fog). */
/** The set around the objects, by `scene.setting` (unknown = "house"). */
function Setting({
  kind,
  lift,
  season,
  prefs,
}: RoomProps & { kind: string; lift: { current: number } }) {
  if (kind === "grove" || kind === "clearing")
    return (
      <>
        <OutdoorSky season={season.value} />
        <hemisphereLight args={["#dfeaf5", "#6a7a4c", 1.7]} />
        <directionalLight
          position={[6, 10, 4]}
          intensity={1.6}
          color="#fff1df"
        />
        <MergeStatic>
          {kind === "grove" ? (
            <GroveStatic season={season} />
          ) : (
            <ClearingStatic season={season} />
          )}
        </MergeStatic>
      </>
    );
  return (
    <>
      <color attach="background" args={["#1a1d24"]} />
      <fog attach="fog" args={["#1a1d24", 14, 40]} />
      <hemisphereLight args={["#9fb4e8", "#4a3424", 0.6]} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={0.45}
        color="#dfe8ff"
      />
      {kind === "cabin" ? (
        <>
          <MergeStatic>
            <CabinStatic lift={lift} />
          </MergeStatic>
          <group scale={CABIN_SCALE}>
            <Roof lift={lift} />
          </group>
          <Lantern />
          <WindowLight shadows={false} />
        </>
      ) : (
        <>
          <MergeStatic>
            <HouseStatic lift={lift} />
          </MergeStatic>
          <Roof lift={lift} />
          <Hearth shadows={false} />
          <WindowLight shadows={false} />
        </>
      )}
      {!prefs.reducedMotion && <Dust />}
    </>
  );
}

/** Season sky as background and far fog for the outdoor sets. */
function OutdoorSky({ season }: { season: number }) {
  const { scene } = useThree();
  const sky = useMemo(() => new THREE.Color(), []);
  const s = useRef(season);
  s.current = season;
  useEffect(() => {
    scene.background = sky;
    scene.fog = new THREE.Fog(sky, 16, 42);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, sky]);
  useFrame(() => {
    blend4(sky, tone.sky, s.current);
    if (scene.fog) scene.fog.color.copy(sky);
  });
  return null;
}

function RoomToon() {
  const { scene } = useThree();
  const T = useMemo(() => {
    const t = createToonUniforms();
    t.uShade.value.set("#6f7fa6");
    t.uBand.value = 0.18;
    return t;
  }, []);
  const n = useRef(0);
  useFrame(() => {
    if (n.current++ % 20 === 0) toonifyTree(scene, T);
  });
  return null;
}
