"use client";
// Island part. 3D island from labs/island when WebGL works; the HTML list
// below is the keyboard / no-WebGL path and the stub "flight".
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { type IslandPartProps, type Location, SCALE } from "@/contracts";
import { useT } from "@/i18n";
import s from "../shared/Fallback.module.css";
import { QualityGovernor, useQuality } from "../shared/QualityGovernor";
import attn from "../shared/Attention.module.css";
import { highlightIcon, Icon, KindIcon, UI_ICON } from "../shared/Icon";
import {
  ActivitySheet,
  kindSummary,
  placeActivities,
  placeKinds,
} from "./Guide";
import c from "./Island.module.css";
import { FirstFrame, LoadScreen } from "./LoadScreen";
import { World } from "./World";

export function IslandPart(props: IslandPartProps) {
  const { content, prefs, emit, view } = props;
  const pins = useRef(new Map<string, HTMLElement>());
  const t = useT();
  const q = useQuality(SCALE.maxDpr);
  const [drawn, setDrawn] = useState(false);
  if (!prefs.webgl) return <IslandList {...props} />;
  const select = (l: Location) => {
    if (l.status === "open" && view === "island")
      emit({ type: "location.select", locationId: l.id });
  };
  const o = content.island.overview;
  return (
    <div className={c.stage}>
      <Canvas
        // Screen readers use the HTML buttons over and beside the canvas.
        aria-hidden
        shadows={q.shadows}
        dpr={q.dpr}
        camera={{
          position: o.eye,
          fov: o.fov ?? SCALE.defaultFov,
          near: 0.5,
          far: 500,
        }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <World
            {...props}
            onSelect={select}
            pins={pins}
            fx
            extraFx={q.extraFx}
          />
          <FirstFrame onDrawn={() => setDrawn(true)} />
        </Suspense>
        <QualityGovernor />
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
            {l.status === "open" ? "" : t(" · soon")}
          </button>
        ))}
      </div>
      {view === "island" && (
        <PlaceTray
          {...props}
          onSelect={select}
          onHighlight={(id) =>
            view === "island" &&
            emit({ type: "highlight.open", highlightId: id })
          }
        />
      )}
      <LoadScreen drawn={drawn} />
    </div>
  );
}

/** Field-label tray: every place as a card (same action as its pin), with
 *  what you can do there, and a sheet that lists every activity. */
function PlaceTray({
  content,
  locationId,
  doneHighlightIds = [],
  onSelect,
  onHighlight,
}: IslandPartProps & {
  onSelect: (l: Location) => void;
  onHighlight: (id: string) => void;
}) {
  const t = useT();
  const [sheet, setSheet] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const tray = useRef<HTMLElement>(null);
  // Keyboard path: back from a place (Esc), focus was on a button that is
  // gone; put it on that place's card so Tab goes on from there.
  // biome-ignore lint/correctness/useExhaustiveDependencies: on mount only
  useEffect(() => {
    if (!locationId) return;
    if (document.activeElement && document.activeElement !== document.body)
      return;
    tray.current
      ?.querySelector<HTMLButtonElement>(
        `button[data-location="${locationId}"]`,
      )
      ?.focus({ preventScroll: true });
  }, []);
  // Open places first, then the closed ones, each in pack order.
  const locations = [...content.island.locations].sort(
    (a, b) => Number(b.status === "open") - Number(a.status === "open"),
  );
  const open = locations.filter((l) => l.status === "open").length;
  const openIds = new Set(
    locations.filter((l) => l.status === "open").map((l) => l.id),
  );
  const highlights = content.highlights.filter((h) =>
    openIds.has(h.locationId),
  );
  const placeTitle = (id: string) =>
    content.island.locations.find((l) => l.id === id)?.title ?? "";
  const closeSheet = () => {
    setSheet(false);
    opener.current?.focus();
  };
  return (
    <>
      {sheet && (
        <ActivitySheet
          content={content}
          done={doneHighlightIds}
          onHighlight={onHighlight}
          onSelect={onSelect}
          onClose={closeSheet}
        />
      )}
      <nav ref={tray} className={c.tray} aria-label={t("Places on the island")}>
        <div className={c.trayHead}>
          <span className={c.cap}>
            {highlights.length > 0
              ? t("Start with a highlight")
              : t("Places on the island")}
          </span>
          {highlights.length === 0 && (
            <span className={c.count}>
              {t("{n} open", { n: open })}
              {locations.length > open
                ? ` · ${t("{n} soon", { n: locations.length - open })}`
                : ""}
            </span>
          )}
          <button
            ref={opener}
            type="button"
            className={c.allActs}
            aria-expanded={sheet}
            onClick={() => (sheet ? closeSheet() : setSheet(true))}
          >
            <Icon d={UI_ICON.try} size={16} />
            {t("All activities")}
          </button>
        </div>
        {highlights.length > 0 && (
          <ul className={c.heroes} aria-label={t("Highlights")}>
            {highlights.map((h) => {
              const done = doneHighlightIds.includes(h.id);
              return (
                <li key={h.id}>
                  <button
                    type="button"
                    className={c.hero}
                    data-done={done || undefined}
                    aria-label={`${t(h.title)}, ${placeTitle(h.locationId)}${done ? `, ${t("done")}` : ""}`}
                    onClick={() => onHighlight(h.id)}
                  >
                    <span className={c.heroIcon} aria-hidden="true">
                      <Icon d={highlightIcon(h.icon)} size={20} />
                      {done && (
                        <span className={c.heroDone}>
                          <Icon d={UI_ICON.check} size={11} />
                        </span>
                      )}
                    </span>
                    <span className={c.heroText} aria-hidden="true">
                      <span className={c.heroTitle}>{t(h.title)}</span>
                      <span className={c.heroPlace}>
                        {placeTitle(h.locationId)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <ul className={c.cards}>
          {locations.map((l) => {
            const acts = placeActivities(content, l.id);
            const heroIcons = highlights
              .filter((h) => h.locationId === l.id)
              .map((h) => h.icon);
            const kinds = placeKinds(acts).filter(
              (k) => !heroIcons.includes(k),
            );
            const shown = kinds.slice(0, Math.max(0, 3 - heroIcons.length));
            return (
              <li key={l.id}>
                <button
                  type="button"
                  className={c.card}
                  data-location={l.id}
                  aria-disabled={l.status !== "open"}
                  data-open={l.status === "open" || undefined}
                  aria-label={
                    l.status === "open" && acts.length > 0
                      ? `${l.title}, ${t(acts.length === 1 ? "{n} activity" : "{n} activities", { n: acts.length })}: ${kindSummary(acts, t)}`
                      : undefined
                  }
                  onClick={() => onSelect(l)}
                >
                  <span className={c.cardTitle}>{l.title}</span>
                  {l.status === "open" && acts.length > 0 ? (
                    <span className={c.cardActs} aria-hidden="true">
                      <span className={c.kinds}>
                        {heroIcons.map((k) => (
                          <span
                            key={k}
                            className={`${c.kindChip} ${c.heroChip}`}
                          >
                            <Icon d={highlightIcon(k)} size={16} />
                          </span>
                        ))}
                        {shown.map((k) => (
                          <span key={k} className={c.kindChip}>
                            <KindIcon kind={k} size={16} />
                          </span>
                        ))}
                        {kinds.length > shown.length && (
                          <span className={c.more}>
                            +{kinds.length - shown.length}
                          </span>
                        )}
                      </span>
                      <span className={c.state}>
                        <Icon d={UI_ICON.try} size={14} />
                        {acts.length}
                      </span>
                    </span>
                  ) : (
                    <span className={c.state}>
                      {l.status === "open" ? t("Open") : t("Soon")}
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
  const tr = useT();
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
    <nav className={s.panel} aria-label={tr("Places on the island")}>
      <h2>{tr("The island")}</h2>
      {view === "travel" && (
        <p className={s.muted}>{tr("The owl is flying…")}</p>
      )}
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
            {l.status === "soon" ? tr(" · soon") : ""}
          </button>
        ))}
      </div>
    </nav>
  );
}
