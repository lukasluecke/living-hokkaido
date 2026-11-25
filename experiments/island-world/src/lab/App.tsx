import { CameraControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, N8AO, SMAA, TiltShift2, Vignette } from "@react-three/postprocessing";
import { Suspense, use, useEffect, useMemo, useRef, useState } from "react";
import { MathUtils, Vector3 } from "three";
import { type Field, flattenPads, loadField } from "../world/field";
import { DriftIce, FlowerField, Sea, SeasonDriver, Weather } from "../world/Environment";
import { HexTerrain } from "../world/HexTerrain";
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
  const [res, setRes] = useState(Number(q.get("res") ?? 512));
  const [trees, setTrees] = useState(Number(q.get("trees") ?? 15000));
  const [season, setSeason] = useState(Number(q.get("season") ?? 0));
  const [playing, setPlaying] = useState(q.get("play") === "1");
  const [shown, setShown] = useState(Math.round(season) % 4);
  const [fx, setFx] = useState<Fx>((q.get("fx") as Fx) ?? "tilt");
  const [cam, setCam] = useState<Cam>((q.get("cam") as Cam) ?? "follow");
  const [dest, setDest] = useState<string | null>(q.get("dest"));
  const [arrived, setArrived] = useState(false);
  const shot = q.has("shot");
  const fieldP = useMemo(() => loadField(res), [res]);
  return (
    <div className="lab">
      <Canvas
        shadows dpr={[1, Math.min(1.5, Number(q.get("dpr") ?? 1.5))]}
        camera={{ position: [3, 40, 42], fov: 32, near: 0.1, far: 300 }}
        gl={{ antialias: fx === "none", powerPreference: "high-performance", preserveDrawingBuffer: shot }}
      >
        <Suspense fallback={null}>
          <World
            fieldP={fieldP} style={style} trees={trees} season={season} playing={playing} onSeason={setShown}
            fx={fx} cam={cam} dest={dest} arrived={arrived}
            onArrive={() => setArrived(true)} onSelect={(id) => { setArrived(false); setDest(id); }}
            labels={!shot || q.has("labels")}
          />
        </Suspense>
        <Perf />
      </Canvas>
      <div className="badge">
        <span>HOKKAIDO · LAB</span>
        <b>{SEASONS[shown]} · {SEASON_NOTES[shown]}</b>
      </div>
      {!shot && (
        <aside className="panel">
          <Group label="Terrain">
            {(["painted", "terrace", "hex"] as Style[]).map((s) => <Btn key={s} on={style === s} onClick={() => setStyle(s)}>{s}</Btn>)}
          </Group>
          <Group label="Heightfield">
            {[256, 512].map((r) => <Btn key={r} on={res === r} onClick={() => setRes(r)}>{r}px</Btn>)}
          </Group>
          <Group label="Trees">
            {[0, 5000, 15000, 40000].map((n) => <Btn key={n} on={trees === n} onClick={() => setTrees(n)}>{n / 1000}k</Btn>)}
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
  fieldP: Promise<Field>; style: Style; trees: number; season: number; playing: boolean; onSeason: (s: number) => void;
  fx: Fx; cam: Cam; dest: string | null; arrived: boolean; onArrive: () => void; onSelect: (id: string) => void; labels: boolean;
}) {
  const field = use(props.fieldP);
  const clearings = useMemo<Clearing[]>(() => {
    const out = [...PLACES, HOME].map((p) => { const [x, z] = field.toWorld(p.lon, p.lat); return { x, z, r: 1.3 }; });
    flattenPads(field, out);
    const [fx, fz] = field.toWorld(FLOWER_FIELD.lon, FLOWER_FIELD.lat);
    out.push({ x: fx, z: fz, r: 0.7 });
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
      <DriftIce field={field} />
      {props.style !== "hex" && props.trees > 0 && <Trees field={field} count={props.trees} clearings={clearings} scale={Number(q.get("treeScale") ?? 1.25)} />}
      <FlowerField field={field} lon={FLOWER_FIELD.lon} lat={FLOWER_FIELD.lat} />
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
const OVERVIEW = { pos: new Vector3(3, 40, 42), look: new Vector3(0.5, 0, 0.5) };

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
      ref={cc} makeDefault minDistance={1.5} maxDistance={60}
      minPolarAngle={0.15} maxPolarAngle={MathUtils.degToRad(72)}
      onStart={() => {}} dollyToCursor
    />
  );
}
