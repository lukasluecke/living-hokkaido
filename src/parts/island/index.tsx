"use client";
// Island part: HTML fallback stub. Replace the body with the 3D island
// (port from labs/island). Keep this list as the keyboard / no-WebGL path.
import { useEffect } from "react";
import type { IslandPartProps } from "@/contracts";
import s from "../shared/Fallback.module.css";

export function IslandPart({
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
