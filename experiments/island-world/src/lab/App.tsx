import { CameraControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, N8AO, SMAA, TiltShift2, Vignette } from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { MathUtils, Vector3 } from "three";
import { buildField, type Field } from "../world/field";
import { DriftIce, FlowerField, Sea, SeasonDriver, Weather } from "../world/Environment";
import { HexTerrain } from "../world/HexTerrain";
import { RIVER } from "../world/island";
import { Lake, River } from "../world/Water";
import { Owl, type OwlApi } from "../world/Owl";
import { placePos, PlaceMarker } from "../world/Places";
import { FLOWER_FIELD, HOME, PLACES } from "../world/places";
import { SEASON_NOTES, SEASONS } from "../world/season";
import { Terrain } from "../world/Terrain";
import type { Clearing } from "../world/Trees";
import { Trees } from "../world/Trees";
import { Perf } from "./Perf";
import "./lab.css";

const q = new URLSearchParams(location.search);
type Style = "painted" | "terrace" | "hex";
type Fx = "none" | "tilt" | "full";
type Cam = "follow" | "cut";

export default function App() {
  const [style, setStyle] = useState<Style>((q.get("style") as Style) ?? "painted");
  const [trees, setTrees] = useState(Number(q.get("trees") ?? 3500));
  const [season, setSeason] = useState(Number(q.get("season") ?? 0));
  const [playing, setPlaying] = useState(q.get("play") === "1");
  const [shown, setShown] = useState(Math.round(season) % 4);
  const [fx, setFx] = useState<Fx>((q.get("fx") as Fx) ?? "tilt");
  const [cam, setCam] = useState<Cam>((q.get("cam") as Cam) ?? "follow");
  const [dest, setDest] = useState<string | null>(q.get("dest"));
  const [arrived, setArrived] = useState(false);
  const shot = q.has("shot");
  const field = useMemo(() => buildField(), []);
  return (
    <div className="lab">
      <Canvas
        shadows dpr={[1, Math.min(1.5, Number(q.get("dpr") ?? 1.5))]}
        camera={{ position: [2, 21, 24], fov: 32, near: 0.1, far: 300 }}
        gl={{ antialias: fx === "none", powerPreference: "high-performance", preserveDrawingBuffer: shot }}
      >
        <Suspense fallback={null}>
          <World
            field={field} style={style} trees={trees} season={season} playing={playing} onSeason={setShown}
            fx={fx} cam={cam} dest={dest} arrived={arrived}
            onArrive={() => setArrived(true)} onSelect={(id) => { setArrived(false); setDest(id); }}
            labels={!shot || q.has("labels")}
          />
        </Suspense>
        <Perf />
      </Canvas>
      <div className="badge">
        <span>ISLAND · LAB</span>
        <b>{SEASONS[shown]} · {SEASON_NOTES[shown]}</b>
      </div>
      {!shot && (
        <aside className="panel">
          <Group label="Terrain">
            {(["painted", "terrace", "hex"] as Style[]).map((s) => <Btn key={s} on={style === s} onClick={() => setStyle(s)}>{s}</Btn>)}
          </Group>
          <Group label="Trees">
            {[0, 1500, 3500, 8000].map((n) => <Btn key={n} on={trees === n} onClick={() => setTrees(n)}>{n / 1000}k</Btn>)}
          </Group>
          <Group label="Season">
            {SEASONS.map((s, i) => <Btn key={s} on={!playing && Math.round(season) % 4 === i} onClick={() => { setPlaying(false); setSeason(i); }}>{s}</Btn>)}
            <Btn on={playing} onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Timelapse"}</Btn>
          </Group>
          <Group label="Post FX">
            {(["none", "tilt", "full"] as Fx[]).map((f) => <Btn key={f} on={fx === f} onClick={() => setFx(f)}>{f}</Btn>)}
          </Group>
          <Group label="Camera">
            {(["follow", "cut"] as Cam[]).map((c) => <Btn key={c} on={cam === c} onClick={() => setCam(c)}>{c}</Btn>)}
          </Group>
          <Group label="Fly to">
            {PLACES.map((p) => <Btn key={p.id} on={dest === p.id} onClick={() => { setArrived(false); setDest(p.id); }}>{p.name}</Btn>)}
            <Btn on={dest === null} onClick={() => { setArrived(false); setDest(null); }}>Overview</Btn>
          </Group>
          <p id="perf" className="perf">…</p>
        </aside>
      )}
      {arrived && dest && !shot && (
        <div className="card">
          <b>{PLACES.find((p) => p.id === dest)?.name}</b>
          <p>The owl has landed and the roof lifts. Here the detail scene takes over.</p>
        </div>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return <fieldset><legend>{label}</legend>{children}</fieldset>;
}
function Btn({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={on} className={on ? "on" : ""} onClick={onClick}>{children}</button>;
}

function World(props: {
  field: Field; style: Style; trees: number; season: number; playing: boolean; onSeason: (s: number) => void;
  fx: Fx; cam: Cam; dest: string | null; arrived: boolean; onArrive: () => void; onSelect: (id: string) => void; labels: boolean;
}) {
  const { field } = props;
  const clearings = useMemo<Clearing[]>(() => {
    const out = [...PLACES, HOME].map((p) => ({ x: p.x, z: p.z, r: p.id === "home" ? 0.25 : 0.8 }));
    out.push({ ...FLOWER_FIELD, r: 0.8 });
    for (let k = 0; k < RIVER.length - 1; k++)
      for (let t = 0; t < 1; t += 0.12) {
        const [ax, az] = RIVER[k], [bx, bz] = RIVER[k + 1];
        out.push({ x: ax + (bx - ax) * t, z: az + (bz - az) * t, r: 0.28 + k * 0.06 });
      }
    return out;
  }, [field]);
  const perch = useMemo(() => new Vector3(...placePos(field, HOME)), [field]);
  const target = useMemo(() => {
    const p = PLACES.find((x) => x.id === props.dest);
    return p ? new Vector3(...placePos(field, p)) : null;
  }, [field, props.dest]);
  const owl = useRef<OwlApi>(null);
  return (
    <>
      <SeasonDriver season={props.season} playing={props.playing} onSeason={props.onSeason} />
      {props.style === "hex" ? <HexTerrain field={field} /> : <Terrain field={field} terrace={props.style === "terrace" ? 160 : 0} flat={props.style === "terrace"} />}
      <Sea field={field} />
      {props.style !== "hex" && <><Lake /><River field={field} /></>}
      <DriftIce field={field} />
      {props.style !== "hex" && props.trees > 0 && <Trees field={field} count={props.trees} clearings={clearings} scale={Number(q.get("treeScale") ?? 1.3)} />}
      <FlowerField field={field} x={FLOWER_FIELD.x} z={FLOWER_FIELD.z} />
      <Weather />
      {PLACES.map((p) => (
        <PlaceMarker key={p.id} field={field} place={p} labels={props.labels}
          open={props.arrived && props.dest === p.id} active={props.dest === p.id} onSelect={() => props.onSelect(p.id)} />
      ))}
      <Owl ref={owl} field={field} perch={perch} target={target} onArrive={props.onArrive} />
      <Rig owl={owl} target={target} cam={props.cam} arrived={props.arrived} />
      {props.fx !== "none" && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          {props.fx === "full" ? <N8AO aoRadius={0.6} intensity={2.2} distanceFalloff={0.6} halfRes /> : <></>}
          <TiltShift2 blur={0.07} taper={0.7} start={[0.0, 0.45]} end={[1.0, 0.45]} samples={8} />
          <Vignette offset={0.25} darkness={0.45} />
          <SMAA />
        </EffectComposer>
      )}
    </>
  );
}

const T = !q.has("instant");
const OVERVIEW = { pos: new Vector3(1.5, 17, 19.5), look: new Vector3(0, 0.4, 0.8) };

function Rig({ owl, target, cam, arrived }: { owl: React.RefObject<OwlApi | null>; target: Vector3 | null; cam: Cam; arrived: boolean }) {
  const cc = useRef<CameraControls>(null);
  const tmp = useMemo(() => ({ p: new Vector3(), l: new Vector3(), back: new Vector3() }), []);
  // discrete moves (overview, cut, arrival close-up)
  useEffect(() => {
    const c = cc.current;
    if (!c) return;
    c.smoothTime = 0.9;
    if (!target) { c.setLookAt(...OVERVIEW.pos.toArray(), ...OVERVIEW.look.toArray(), T); return; }
    if (arrived) {
      c.smoothTime = 0.8;
      c.setLookAt(target.x + 1.2, target.y + 3.6, target.z + 3.4, target.x, target.y + 0.3, target.z, T);
    } else if (cam === "cut") {
      c.setLookAt(target.x + 2, target.y + 9, target.z + 10, target.x, target.y, target.z, T);
    }
  }, [target, cam, arrived]);
  // chase camera while the owl flies
  useFrame(() => {
    const c = cc.current, o = owl.current;
    if (!c || !o?.group || !o.flying || cam !== "follow") return;
    c.smoothTime = 0.35;
    const p = o.group.position;
    tmp.back.set(o.dir.x, 0, o.dir.z).normalize().multiplyScalar(-4.5);
    tmp.p.copy(p).add(tmp.back).add(new Vector3(0, 2.6, 0));
    tmp.l.copy(p).addScaledVector(o.dir, 2);
    c.setLookAt(tmp.p.x, tmp.p.y, tmp.p.z, tmp.l.x, tmp.l.y, tmp.l.z, true);
  });
  return (
    <CameraControls
      ref={cc} makeDefault minDistance={1.5} maxDistance={40}
      minPolarAngle={0.15} maxPolarAngle={MathUtils.degToRad(72)}
      onStart={() => {}} dollyToCursor
    />
  );
}
