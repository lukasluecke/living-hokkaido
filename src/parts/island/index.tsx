"use client";
// Island part. 3D island from labs/island when WebGL works; the HTML list
// below is the keyboard / no-WebGL path and the stub "flight".
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { type IslandPartProps, type Location, SCALE } from "@/contracts";
import s from "../shared/Fallback.module.css";
import attn from "../shared/Attention.module.css";
import c from "./Island.module.css";
import { World } from "./World";

export function IslandPart(props: IslandPartProps) {
  const { content, prefs, emit, view } = props;
  const pins = useRef(new Map<string, HTMLElement>());
  if (!prefs.webgl) return <IslandList {...props} />;
  const select = (l: Location) => {
    if (l.status === "open" && view === "island")
      emit({ type: "location.select", locationId: l.id });
  };
  const o = content.island.overview;
  return (
    <div className={c.stage}>
      <Canvas
        shadows
        dpr={[1, SCALE.maxDpr]}
        camera={{
          position: o.eye,
          fov: o.fov ?? SCALE.defaultFov,
          near: 0.5,
          far: 500,
        }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <World {...props} onSelect={select} pins={pins} fx />
        </Suspense>
      </Canvas>
      <div className={c.pins}>
        {content.island.locations.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`${c.pin} ${l.status === "open" ? `${attn.pulse} ${attn.touchOnly}` : c.soon}`}
            data-still={props.prefs.reducedMotion || undefined}
            ref={(el) => {
              if (el) pins.current.set(l.id, el);
              else pins.current.delete(l.id);
            }}
            aria-disabled={l.status !== "open"}
            onClick={() => select(l)}
          >
            {l.title}
            {l.status === "open" ? "" : " · soon"}
          </button>
        ))}
      </div>
      {view === "island" && <PlaceTray {...props} onSelect={select} />}
    </div>
  );
}

/** Field-label tray: every place as a card. Same action as its pin. */
function PlaceTray({
  content,
  onSelect,
}: IslandPartProps & { onSelect: (l: Location) => void }) {
  const locations = content.island.locations;
  const open = locations.filter((l) => l.status === "open").length;
  return (
    <nav className={c.tray} aria-label="Places on the island">
      <div className={c.trayHead}>
        <span className={c.cap}>Places on the island</span>
        <span className={c.count}>
          {open} open · {locations.length - open} soon
        </span>
      </div>
      <ul className={c.cards}>
        {locations.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              className={c.card}
              aria-disabled={l.status !== "open"}
              data-open={l.status === "open" || undefined}
              onClick={() => onSelect(l)}
            >
              <span className={c.cardTitle}>{l.title}</span>
              <span className={c.state}>
                {l.status === "open" ? "Open" : "Soon"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function IslandList({
  content,
  view,
  locationId,
  prefs,
  emit,
}: IslandPartProps) {
  // Stub "flight": a real island emits owl.arrived when the owl lands.
  useEffect(() => {
    if (view !== "travel" || !locationId) return;
    const t = setTimeout(
      () => emit({ type: "owl.arrived", locationId }),
      prefs.reducedMotion ? 0 : 600,
    );
    return () => clearTimeout(t);
  }, [view, locationId, prefs.reducedMotion, emit]);

  return (
    <nav className={s.panel} aria-label="Places on the island">
      <h2>The island</h2>
      {view === "travel" && <p className={s.muted}>The owl is flying…</p>}
      <div className={s.row}>
        {content.island.locations.map((l) => (
          <button
            key={l.id}
            type="button"
            className={s.button}
            disabled={l.status !== "open" || view === "travel"}
            aria-pressed={l.id === locationId}
            onClick={() => emit({ type: "location.select", locationId: l.id })}
          >
            {l.title}
            {l.status === "soon" ? " · soon" : ""}
          </button>
        ))}
      </div>
    </nav>
  );
}
