"use client";
// The 3D island. Ported from labs/island (src/lab/App.tsx World + Rig).
import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  EffectComposer,
  SMAA,
  TiltShift2,
  Vignette,
} from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import { createToonUniforms, toonifyTree } from "../shared/toon";
import { InkEdgesEffect } from "./InkEdges";
import { type Color, MathUtils, Vector3 } from "three";
import { season as seasonTokens } from "@/design/tokens";
import { mix4, U } from "./world/season";
import type { CameraView, IslandPartProps, Location } from "@/contracts";
import {
  DriftIce,
  FlowerField,
  Sea,
  SeasonDriver,
  Weather,
} from "./world/Environment";
import { buildField, type Field } from "./world/field";
import { AREAS, FLOWER_FIELD, RIVER } from "./world/island";
import { Areas } from "./world/Areas";
import { Owl, type OwlApi } from "./world/Owl";
import { anchorPos, PinTracker, PlaceMarker } from "./world/Places";
import { Terrain } from "./world/Terrain";
import { type Clearing, Trees } from "./world/Trees";
import { Lake, River } from "./world/Water";

export type WorldProps = IslandPartProps & {
  onSelect: (l: Location) => void;
  pins: React.RefObject<Map<string, HTMLElement>>;
  fx: boolean;
};

export function World(props: WorldProps) {
  const { content, season, prefs, emit, view, locationId } = props;
  const island = content.island;
  const field = useMemo(() => buildField(island), [island]);
  const locations = island.locations;
  const clearings = useMemo<Clearing[]>(() => {
    const out: Clearing[] = locations.map((l) => ({
      x: l.anchor[0],
      z: l.anchor[2],
      r: 1.9,
    }));
    out.push(
      { x: island.owlHome[0], z: island.owlHome[2], r: 0.7 },
      { ...FLOWER_FIELD, r: 2.0 },
      ...AREAS.map((a) => ({ x: a.x, z: a.z, r: a.r })),
    );
    for (const l of locations) {
      if (!l.arrivalView) continue;
      const [ax, , az] = l.anchor;
      const [ex, , ez] = l.arrivalView.eye;
      for (let t = 0.2; t <= 1.2; t += 0.1)
        out.push({ x: ax + (ex - ax) * t, z: az + (ez - az) * t, r: 1.4 + t });
    }
    for (let k = 0; k < RIVER.length - 1; k++)
      for (let t = 0; t < 1; t += 0.1) {
        const [ax, az] = RIVER[k];
        const [bx, bz] = RIVER[k + 1];
        out.push({
          x: ax + (bx - ax) * t,
          z: az + (bz - az) * t,
          r: 0.6 + k * 0.15,
        });
      }
    return out;
  }, [locations, island.owlHome]);
  const home = useMemo(() => {
    const [x, , z] = island.owlHome;
    return new Vector3(x, field.groundY(x, z) + 0.2, z);
  }, [field, island.owlHome]);
  const flying = view === "travel";
  const loc = locations.find((l) => l.id === locationId) ?? null;
  const target = useMemo(() => {
    if (!loc || !flying) return null;
    return new Vector3(...anchorPos(field, loc)).add(
      new Vector3(...loc.owlPerch),
    );
  }, [field, loc, flying]);
  const arrivedFor = useRef<string | null>(null);
  if (!flying) arrivedFor.current = null;
  const onArrive = () => {
    if (!loc || !flying || arrivedFor.current === loc.id) return;
    arrivedFor.current = loc.id;
    emit({ type: "owl.arrived", locationId: loc.id });
  };
  // Hover on a place's area lights its pin, like hover on the pin itself.
  const hoverPlace = (l: Location, on: boolean) => {
    const live = on && l.status === "open" && view === "island";
    props.pins.current?.get(l.id)?.toggleAttribute("data-hover", live);
    document.body.style.cursor = live ? "pointer" : "";
  };
  const owl = useRef<OwlApi>(null);
  const ink = useMemo(() => new InkEdgesEffect(), []);
  return (
    <>
      <SeasonDriver
        season={season.value}
        playing={season.playing}
        speed={season.speed}
      />
      <Terrain field={field} />
      <Sea field={field} />
      <Lake />
      <River field={field} />
      <DriftIce field={field} />
      <Trees field={field} count={9000} clearings={clearings} scale={2} />
      <FlowerField field={field} x={FLOWER_FIELD.x} z={FLOWER_FIELD.z} />
      <Areas field={field} still={prefs.reducedMotion} />
      {!prefs.reducedMotion && <Weather />}
      {locations.map((l) => (
        <PlaceMarker
          key={l.id}
          field={field}
          loc={l}
          roofOpen={false}
          active={locationId === l.id}
          onSelect={() => props.onSelect(l)}
          onHover={(on) => hoverPlace(l, on)}
        />
      ))}
      <PinTracker field={field} locations={locations} pins={props.pins} />
      <Owl
        ref={owl}
        field={field}
        perch={home}
        target={target}
        onArrive={onArrive}
        trail={!prefs.reducedMotion}
      />
      <ToonLook ink={ink} />
      <Rig
        owl={owl}
        loc={flying ? loc : null}
        field={field}
        cut={prefs.reducedMotion}
        overview={island.overview}
      />
      {props.fx && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <primitive object={ink} />
          <TiltShift2
            blur={0.07}
            taper={0.7}
            start={[0.0, 0.45]}
            end={[1.0, 0.45]}
            samples={8}
          />
          <Vignette offset={0.25} darkness={0.45} />
          <SMAA />
        </EffectComposer>
      )}
    </>
  );
}

/** Two-tone shading, two-colour fog and ink colour, blended per season. */
function ToonLook({ ink }: { ink: InkEdgesEffect }) {
  const { scene } = useThree();
  const T = useMemo(() => createToonUniforms(), []);
  const n = useRef(0);
  useFrame(() => {
    // Patch new materials (mounts, LOD swaps) a few times a second.
    if (n.current++ % 20 === 0) toonifyTree(scene, T);
    mix4(U.uW.value, seasonTokens.shade, T.uShade.value);
    mix4(U.uW.value, seasonTokens.fogNear, T.uFogNear.value);
    const c = ink.uniforms.get("ink")?.value as Color | undefined;
    if (c) mix4(U.uW.value, seasonTokens.ink, c);
  });
  return null;
}

const up = new Vector3(0, 5, 0);

function Rig({
  owl,
  loc,
  field,
  cut,
  overview,
}: {
  owl: React.RefObject<OwlApi | null>;
  loc: Location | null;
  field: Field;
  cut: boolean;
  overview: CameraView;
}) {
  const cc = useRef<CameraControls>(null);
  const tmp = useMemo(
    () => ({ p: new Vector3(), l: new Vector3(), back: new Vector3() }),
    [],
  );
  useEffect(() => {
    const c = cc.current;
    if (!c) return;
    c.smoothTime = 0.9;
    if (!loc) {
      c.setLookAt(...overview.eye, ...overview.target, true);
      return;
    }
    if (cut) {
      const [x, , z] = loc.anchor;
      const y = field.groundY(x, z);
      const v = loc.arrivalView ?? {
        eye: [x + 4, y + 5, z + 6],
        target: [x, y + 0.6, z],
      };
      c.setLookAt(
        ...(v.eye as [number, number, number]),
        ...(v.target as [number, number, number]),
        false,
      );
    }
  }, [loc, cut, field, overview]);
  useFrame(() => {
    const c = cc.current;
    const o = owl.current;
    if (!c || !o?.group || !o.flying || cut) return;
    c.smoothTime = 0.35;
    const p = o.group.position;
    tmp.back.set(o.dir.x, 0, o.dir.z).normalize().multiplyScalar(-9);
    tmp.p.copy(p).add(tmp.back).add(up);
    tmp.l.copy(p).addScaledVector(o.dir, 4);
    c.setLookAt(tmp.p.x, tmp.p.y, tmp.p.z, tmp.l.x, tmp.l.y, tmp.l.z, true);
  });
  return (
    <CameraControls
      ref={cc}
      makeDefault
      minDistance={3}
      maxDistance={110}
      minPolarAngle={0.15}
      maxPolarAngle={MathUtils.degToRad(72)}
      dollyToCursor
    />
  );
}
