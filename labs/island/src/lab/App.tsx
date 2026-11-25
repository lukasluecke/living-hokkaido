// Island lab shell. The <World> component follows IslandPartProps from
// @/contracts (content, season, prefs, emit, view, locationId) so it ports to
// src/parts/island with little change. This file plays the role of the app
// shell: it owns state, listens to events and passes new props.
import {
  createEventBus, DEFAULT_SEASON, type ExperienceEvent, type IslandPartProps, type Location,
} from "@/contracts";
import { defaultPack } from "@/content";
import { CameraControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, N8AO, SMAA, TiltShift2, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { MathUtils, Vector3 } from "three";
import { DriftIce, FlowerField, Sea, SeasonDriver, Weather } from "../world/Environment";
import { buildField, type Field } from "../world/field";
import { HexTerrain } from "../world/HexTerrain";
import { FLOWER_FIELD, OWL_HOME, RIVER } from "../world/island";
import { Owl, type OwlApi } from "../world/Owl";
import { anchorPos, PinTracker, PlaceMarker } from "../world/Places";
import { SEASON_NOTES, SEASONS } from "../world/season";
import { Terrain } from "../world/Terrain";
import type { Clearing } from "../world/Trees";
import { Trees } from "../world/Trees";
import { Lake, River } from "../world/Water";
import { Perf } from "./Perf";
import "./lab.css";

const q = new URLSearchParams(location.search);
type Style = "painted" | "terrace" | "hex";
type Fx = "none" | "tilt" | "full";
type LabOpts = { style: Style; trees: number; treeScale: number; fx: Fx; labels: boolean };

export default function App() {
  const content = defaultPack;
  const bus = useMemo(() => createEventBus(), []);
  const [style, setStyle] = useState<Style>((q.get("style") as Style) ?? "painted");
  const [trees, setTrees] = useState(Number(q.get("trees") ?? 9000));
  const [season, setSeason] = useState({ ...DEFAULT_SEASON, value: Number(q.get("season") ?? 0), playing: q.get("play") === "1", speed: 0.12 });
  const [shown, setShown] = useState(Math.round(season.value) % 4);
  const [fx, setFx] = useState<Fx>((q.get("fx") as Fx) ?? "tilt");
  const [reducedMotion, setReducedMotion] = useState(q.get("cam") === "cut" || matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [locationId, setLocationId] = useState<string | null>(q.get("dest"));
  const [view, setView] = useState<IslandPartProps["view"]>("island");
  const [log, setLog] = useState<string[]>([]);
  const shot = q.has("shot");
  const pins = useRef(new Map<string, HTMLElement>());

  // Shell behaviour: react to the part's events.
  useEffect(
    () =>
      bus.on((e: ExperienceEvent) => {
        console.info("[event]", e);
        setLog((l) => [JSON.stringify(e), ...l].slice(0, 5));
        if (e.type === "location.select") { setView("island"); setLocationId(e.locationId); }
        if (e.type === "owl.arrived") setView("scene"); // the real shell opens the detail scene here
      }),
    [bus],
  );
  const select = (l: Location) => { if (l.status === "open") bus.emit({ type: "location.select", locationId: l.id }); };
  const props: IslandPartProps = {
    content, season, prefs: { reducedMotion } as IslandPartProps["prefs"], emit: bus.emit, view, locationId,
  };
  const opts: LabOpts = { style, trees, treeScale: Number(q.get("treeScale") ?? 2), fx, labels: !shot || q.has("labels") };
  const arrived = view === "scene" && locationId;

  return (
    <div className="lab">
      <Canvas
        shadows dpr={[1, Math.min(1.5, Number(q.get("dpr") ?? 1.5))]}
        camera={{ position: content.island.overview.eye, fov: content.island.overview.fov ?? 32, near: 0.5, far: 500 }}
        gl={{ antialias: fx === "none", powerPreference: "high-performance", preserveDrawingBuffer: shot }}
      >
        <Suspense fallback={null}>
          <World {...props} opts={opts} onSeasonShown={setShown} onSelect={select} pins={pins} />
        </Suspense>
        <Perf />
      </Canvas>
      {opts.labels && (
        <div className="pins">
          {content.island.locations.map((l) => (
            <button key={l.id} type="button" className={`pin${l.status === "open" ? "" : " soon"}`}
              ref={(el) => { if (el) pins.current.set(l.id, el); else pins.current.delete(l.id); }}
              aria-disabled={l.status !== "open"} onClick={() => select(l)}>
              {l.title}{l.status === "open" ? "" : " · soon"}
            </button>
          ))}
        </div>
      )}
      <div className="badge">
        <span>ISLAND · LAB</span>
        <b>{SEASONS[shown]} · {SEASON_NOTES[shown]}</b>
      </div>
      {!shot && (
        <aside className="panel">
          <Group label="Places (keyboard path)">
            {content.island.locations.map((l) => (
              <Btn key={l.id} on={locationId === l.id} disabled={l.status !== "open"} onClick={() => select(l)}>
                {l.title}{l.status === "open" ? "" : " · soon"}
              </Btn>
            ))}
            <Btn on={locationId === null} onClick={() => { setView("island"); setLocationId(null); }}>Overview</Btn>
          </Group>
          <Group label="Season">
            {SEASONS.map((s, i) => <Btn key={s} on={!season.playing && Math.round(season.value) % 4 === i} onClick={() => setSeason({ ...season, playing: false, value: i })}>{s}</Btn>)}
            <Btn on={season.playing} onClick={() => setSeason({ ...season, playing: !season.playing })}>{season.playing ? "Pause" : "Timelapse"}</Btn>
          </Group>
          <Group label="Camera">
            <Btn on={!reducedMotion} onClick={() => setReducedMotion(false)}>follow</Btn>
            <Btn on={reducedMotion} onClick={() => setReducedMotion(true)}>cut (reduced motion)</Btn>
          </Group>
          <Group label="Terrain">
            {(["painted", "terrace", "hex"] as Style[]).map((s) => <Btn key={s} on={style === s} onClick={() => setStyle(s)}>{s}</Btn>)}
          </Group>
          <Group label="Trees">
            {[0, 4000, 9000, 18000].map((n) => <Btn key={n} on={trees === n} onClick={() => setTrees(n)}>{n / 1000}k</Btn>)}
          </Group>
          <Group label="Post FX">
            {(["none", "tilt", "full"] as Fx[]).map((f) => <Btn key={f} on={fx === f} onClick={() => setFx(f)}>{f}</Btn>)}
          </Group>
          <p id="perf" className="perf">…</p>
          <ol className="events" aria-label="Emitted events">{log.map((l, i) => <li key={`${i}${l}`}>{l}</li>)}</ol>
        </aside>
      )}
      {arrived && !shot && (
        <div className="card">
          <b>{content.island.locations.find((l) => l.id === locationId)?.title}</b>
          <p>The owl has landed and the roof lifts. Here the detail scene takes over.</p>
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return <fieldset><legend>{label}</legend>{children}</fieldset>;
}
function Btn({ on, onClick, disabled, children }: { on: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} aria-disabled={disabled} className={`${on ? "on" : ""}${disabled ? " closed" : ""}`}
      onClick={disabled ? undefined : onClick}>{children}</button>
  );
}

/** The island part. Props = IslandPartProps + lab-only options. */
function World(props: IslandPartProps & { opts: LabOpts; onSeasonShown: (s: number) => void; onSelect: (l: Location) => void; pins: React.RefObject<Map<string, HTMLElement>> }) {
  const { content, season, prefs, emit, view, locationId, opts } = props;
  const field = useMemo(() => buildField(), []);
  const locations = content.island.locations;
  const clearings = useMemo<Clearing[]>(() => {
    const out: Clearing[] = locations.map((l) => ({ x: l.anchor[0], z: l.anchor[2], r: 1.9 }));
    out.push({ ...OWL_HOME, r: 0.7 }, { ...FLOWER_FIELD, r: 2.0 });
    // keep the arrival camera's line of sight free of trees
    for (const l of locations) {
      if (!l.arrivalView) continue;
      const [ax, , az] = l.anchor, [ex, , ez] = l.arrivalView.eye;
      for (let t = 0.2; t <= 1.2; t += 0.1) out.push({ x: ax + (ex - ax) * t, z: az + (ez - az) * t, r: 1.4 + t });
    }
    for (let k = 0; k < RIVER.length - 1; k++)
      for (let t = 0; t < 1; t += 0.1) {
        const [ax, az] = RIVER[k], [bx, bz] = RIVER[k + 1];
        out.push({ x: ax + (bx - ax) * t, z: az + (bz - az) * t, r: 0.6 + k * 0.15 });
      }
    return out;
  }, [locations]);
  const home = useMemo(() => {
    const [x, , z] = content.island.owlHome;
    return new Vector3(x, field.groundY(x, z) + 0.2, z);
  }, [field, content]);
  const loc = locations.find((l) => l.id === locationId) ?? null;
  const target = useMemo(() => {
    if (!loc) return null;
    return new Vector3(...anchorPos(field, loc)).add(new Vector3(...loc.owlPerch));
  }, [field, loc]);
  // emit owl.arrived exactly once per flight
  const arrivedFor = useRef<string | null>(null);
  const onArrive = () => {
    if (!loc || arrivedFor.current === loc.id) return;
    arrivedFor.current = loc.id;
    emit({ type: "owl.arrived", locationId: loc.id });
  };
  if (!loc) arrivedFor.current = null;
  const owl = useRef<OwlApi>(null);
  return (
    <>
      <SeasonDriver season={season.value} playing={season.playing} speed={season.speed} onSeason={props.onSeasonShown} />
      {opts.style === "hex" ? <HexTerrain field={field} radius={0.5} /> : <Terrain field={field} terrace={opts.style === "terrace" ? 160 : 0} flat={opts.style === "terrace"} />}
      <Sea field={field} />
      {opts.style !== "hex" && <><Lake /><River field={field} /></>}
      <DriftIce field={field} />
      {opts.style !== "hex" && opts.trees > 0 && <Trees field={field} count={opts.trees} clearings={clearings} scale={opts.treeScale} />}
      <FlowerField field={field} x={FLOWER_FIELD.x} z={FLOWER_FIELD.z} />
      <Weather />
      {locations.map((l) => (
        <PlaceMarker key={l.id} field={field} loc={l}
          roofOpen={view === "scene" && locationId === l.id} active={locationId === l.id} onSelect={() => props.onSelect(l)} />
      ))}
      <PinTracker field={field} locations={locations} pins={props.pins} />
      <Owl ref={owl} field={field} perch={home} target={target} onArrive={onArrive} />
      <Rig owl={owl} loc={loc} field={field} cut={prefs.reducedMotion} arrived={view === "scene"} overview={content.island.overview} />
      {opts.fx !== "none" && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          {opts.fx === "full" ? <N8AO aoRadius={1.2} intensity={2.2} distanceFalloff={1.2} halfRes /> : <></>}
          <TiltShift2 blur={0.07} taper={0.7} start={[0.0, 0.45]} end={[1.0, 0.45]} samples={8} />
          <Vignette offset={0.25} darkness={0.45} />
          <SMAA />
        </EffectComposer>
      )}
    </>
  );
}

const T = !q.has("instant");

function Rig({ owl, loc, field, cut, arrived, overview }: {
  owl: React.RefObject<OwlApi | null>; loc: Location | null; field: Field; cut: boolean; arrived: boolean;
  overview: { eye: readonly number[]; target: readonly number[] };
}) {
  const cc = useRef<CameraControls>(null);
  const tmp = useMemo(() => ({ p: new Vector3(), l: new Vector3(), back: new Vector3() }), []);
  useEffect(() => {
    const c = cc.current;
    if (!c) return;
    c.smoothTime = 0.9;
    if (!loc) { c.setLookAt(...(overview.eye as [number, number, number]), ...(overview.target as [number, number, number]), T); return; }
    const [x, , z] = loc.anchor, y = field.groundY(x, z);
    const v = loc.arrivalView ?? { eye: [x + 4, y + 5, z + 6], target: [x, y + 0.6, z] };
    if (arrived || cut) {
      c.smoothTime = arrived ? 0.8 : 1.2;
      c.setLookAt(...(v.eye as [number, number, number]), ...(v.target as [number, number, number]), T);
    }
  }, [loc, cut, arrived, field, overview]);
  // chase camera while the owl flies
  useFrame(() => {
    const c = cc.current, o = owl.current;
    if (!c || !o?.group || !o.flying || cut) return;
    c.smoothTime = 0.35;
    const p = o.group.position;
    tmp.back.set(o.dir.x, 0, o.dir.z).normalize().multiplyScalar(-9);
    tmp.p.copy(p).add(tmp.back).add(new Vector3(0, 5, 0));
    tmp.l.copy(p).addScaledVector(o.dir, 4);
    c.setLookAt(tmp.p.x, tmp.p.y, tmp.p.z, tmp.l.x, tmp.l.y, tmp.l.z, true);
  });
  return <CameraControls ref={cc} makeDefault minDistance={3} maxDistance={110} minPolarAngle={0.15} maxPolarAngle={MathUtils.degToRad(72)} dollyToCursor />;
}
