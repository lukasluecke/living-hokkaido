"use client";
// Island part. 3D island from labs/island when WebGL works; the HTML list
// below is the keyboard / no-WebGL path and the stub "flight".
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { type IslandPartProps, type Location, SCALE } from "@/contracts";
import s from "../shared/Fallback.module.css";
import attn from "../shared/Attention.module.css";
import { ActivitySheet, kindSummary, placeActivities } from "./Guide";
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

/** Field-label tray: every place as a card (same action as its pin), with
 *  what you can do there, and a sheet that lists every activity. */
function PlaceTray({
  content,
  onSelect,
}: IslandPartProps & { onSelect: (l: Location) => void }) {
  const [sheet, setSheet] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  // Open places first, then the closed ones, each in pack order.
  const locations = [...content.island.locations].sort(
    (a, b) => Number(b.status === "open") - Number(a.status === "open"),
  );
  const open = locations.filter((l) => l.status === "open").length;
  const closeSheet = () => {
    setSheet(false);
    opener.current?.focus();
  };
  return (
    <>
      {sheet && (
        <ActivitySheet
          content={content}
          onSelect={onSelect}
          onClose={closeSheet}
        />
      )}
      <nav className={c.tray} aria-label="Places on the island">
        <div className={c.trayHead}>
          <span className={c.cap}>Places on the island</span>
          <span className={c.count}>
            {open} open
            {locations.length > open
              ? ` · ${locations.length - open} soon`
              : ""}
          </span>
          <button
            ref={opener}
            type="button"
            className={c.allActs}
            aria-expanded={sheet}
            onClick={() => (sheet ? closeSheet() : setSheet(true))}
          >
            All activities
          </button>
        </div>
        <ul className={c.cards}>
          {locations.map((l) => {
            const acts = placeActivities(content, l.id);
            return (
              <li key={l.id}>
                <button
                  type="button"
                  className={c.card}
                  aria-disabled={l.status !== "open"}
                  data-open={l.status === "open" || undefined}
                  onClick={() => onSelect(l)}
                >
                  <span className={c.cardTitle}>{l.title}</span>
                  {l.status === "open" && acts.length > 0 ? (
                    <span className={c.cardActs}>
                      <span className={c.state}>
                        {acts.length}{" "}
                        {acts.length === 1 ? "activity" : "activities"}
                      </span>
                      <span className={c.kinds}>{kindSummary(acts)}</span>
                    </span>
                  ) : (
                    <span className={c.state}>
                      {l.status === "open" ? "Open" : "Soon"}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
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
