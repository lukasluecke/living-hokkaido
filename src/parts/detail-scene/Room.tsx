"use client";
// The 3D detail scene. Ported from labs/detail-scene (variant A, low-poly):
// roof-lift entry, dollhouse home view, hover glow, focus camera move-in.
import { HighlightProps } from "./room/HighlightProps";
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
import {
  activeModelSource,
  type CameraView,
  type DetailScenePartProps,
  SCALE,
} from "@/contracts";
import { useQuality } from "../shared/QualityGovernor";
import { createToonUniforms, toonifyTree } from "../shared/toon";
import { AreaStatic, isAreaSetting } from "./room/AreaSets";
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
  HouseYard,
  Lantern,
  Surroundings,
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
  finish,
}: {
  controls: React.RefObject<CameraControls | null>;
  lift: { current: number };
  props: DetailScenePartProps;
  onInside: () => void;
  /** Set to a function that ends the entry at once (a click on an object
   *  during the entry). */
  finish: React.RefObject<(() => void) | null>;
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
      if (entered.current) return;
      entered.current = true;
      c.smoothTime = 0.45;
      onInside();
      emit({ type: "scene.ready", sceneId: scene.id });
    };
    // Objects work during the entry (Lukas: the slow end was too long). A
    // click ends the entry: roof up, normal camera speed, scene ready.
    finish.current = () => {
      cancelled = true;
      liftTarget.current = 1;
      c.smoothTime = 0.45;
      done();
    };
    // The scene counts as ready once the camera is on its way home; the
    // slow settle at the end no longer blocks the objects.
    const home = (smooth: boolean) => {
      look(c, scene.views.home, smooth);
      return wait(smooth ? 450 : 0);
    };
    (async () => {
      if (scene.entry === "fly-in" && !prefs.reducedMotion) {
        // Outdoor: no roof; glide from high above down to the home view.
        c.smoothTime = 0.7;
        await look(c, scene.views.outside, false);
        await wait(200);
        if (cancelled) return;
        await home(true);
        if (cancelled) return;
        done();
        return;
      }
      if (prefs.reducedMotion || scene.entry !== "roof-lift") {
        liftTarget.current = 1;
        lift.current = 1;
        await home(false);
        done();
        return;
      }
      c.smoothTime = 0.6;
      liftTarget.current = 0;
      lift.current = 0;
      await look(c, scene.views.outside, false);
      await wait(350);
      if (cancelled) return;
      liftTarget.current = 1;
      await wait(800);
      if (cancelled) return;
      await home(true);
      if (cancelled) return;
      done();
    })();
    return () => {
      cancelled = true;
      finish.current = null;
    };
  }, [scene.id]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    // A card or key picked an object during the entry: end the entry first.
    if (!entered.current && focusedArtifactId) finish.current?.();
    if (!entered.current) return;
    const p = scene.placements.find((x) => x.artifactId === focusedArtifactId);
    look(c, p ? p.focusView : scene.views.home, !prefs.reducedMotion);
  }, [focusedArtifactId, scene, controls, prefs.reducedMotion, finish]);
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
  const { scene, focusedArtifactId, emit, hovered, setHovered, prefs } = props;
  const { extraFx } = useQuality(SCALE.maxDpr);
  const controls = useRef<CameraControls>(null);
  const lift = useRef(0);
  const [inside, setInside] = useState(false);
  const finish = useRef<(() => void) | null>(null);
  return (
    <>
      <Setting kind={scene.setting} lift={lift} {...props} />
      <RoomToon />
      {scene.placements.map((p) => (
        <ArtifactShell
          key={p.artifactId}
          placement={p}
          hovered={hovered === p.artifactId}
          focused={focusedArtifactId === p.artifactId}
          onHover={setHovered}
          onSelect={(id) => {
            // During the entry a click ends it, then focuses the object.
            if (!inside) finish.current?.();
            if (focusedArtifactId === id) emit({ type: "artifact.blur" });
            else emit({ type: "artifact.focus", artifactId: id });
          }}
        >
          <RoomObject
            artifactId={p.artifactId}
            source={(() => {
              const a = props.artifacts.find((x) => x.id === p.artifactId);
              return a && activeModelSource(a, prefs);
            })()}
          />
        </ArtifactShell>
      ))}
      <HighlightProps
        highlights={props.content.highlights.filter(
          (h) => h.locationId === scene.locationId && h.marker,
        )}
        emit={emit}
      />
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
        finish={finish}
      />
      <Projector overlay={props.overlay} />
      <EffectComposer multisampling={0}>
        {extraFx ? (
          <Bloom luminanceThreshold={0.85} intensity={0.7} mipmapBlur />
        ) : (
          <></>
        )}
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
  if (kind === "grove" || kind === "clearing" || isAreaSetting(kind))
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
          {isAreaSetting(kind) ? (
            <AreaStatic kind={kind} season={season} />
          ) : kind === "grove" ? (
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
      <hemisphereLight args={["#b4c4ea", "#6a4c34", 0.95]} />
      <CameraFill />
      <directionalLight
        position={[8, 12, 6]}
        intensity={0.45}
        color="#dfe8ff"
      />
      {kind === "cabin" ? (
        <>
          <MergeStatic>
            <CabinStatic lift={lift} season={season} />
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
            <HouseStatic lift={lift} outside={false} />
            <Surroundings season={season}>
              {(m) => <HouseYard m={m} season={season} />}
            </Surroundings>
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

/**
 * Soft light from the camera, so the side of an object that the visitor
 * looks at is never in deep shade (the loom was near black in its focus
 * view: the hearth and the window light it from behind).
 */
function CameraFill() {
  const light = useRef<THREE.DirectionalLight>(null);
  const ahead = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const l = light.current;
    if (!l) return;
    l.position.copy(camera.position);
    camera.getWorldDirection(ahead);
    l.target.position.copy(camera.position).add(ahead);
    l.target.updateMatrixWorld();
  });
  return <directionalLight ref={light} intensity={0.85} color="#fff0dc" />;
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
