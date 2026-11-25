"use client";
// The shell composes the parts. It owns ExperienceState, the season clock and
// journal persistence. Parts get props and emit events; nothing else.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type ContentPack,
  type Emit,
  EMPTY_JOURNAL,
  type ExperienceEvent,
  type ExperienceState,
  JOURNAL_STORAGE_KEY,
  type JournalState,
  type PartContext,
  type ResolvedClaim,
  resolveClaim,
  SEASON_IDS,
  sanitizeJournal,
  seasonAt,
  wrapSeason,
} from "@/contracts";
import { seasonInk } from "@/design/tokens";
import { useSoundscape } from "@/audio/react";
import { Hud } from "./Hud";
import { record } from "./progress";
import { parts } from "./registry";
import { route } from "./route";
import s from "./Shell.module.css";
import { SidePanel } from "./SidePanel";
import { initialState, reduce } from "./state";

function detectPrefs() {
  if (typeof window === "undefined")
    return { reducedMotion: false, webgl: true };
  let webgl = false;
  try {
    webgl = !!document.createElement("canvas").getContext("webgl2");
  } catch {}
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
    webgl,
  };
}

/** Our own fictional guide: a snow-white round owl with a pale blue trail. */
function OwlMark() {
  return (
    <svg className={s.owlMark} viewBox="0 0 80 80" aria-hidden="true">
      <path
        d="M6 70 Q30 58 44 62"
        stroke="#cfe7ff"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <ellipse cx="44" cy="44" rx="26" ry="27" fill="#fff" />
      <ellipse cx="44" cy="52" rx="15" ry="14" fill="#f2f7fc" />
      <circle cx="35" cy="38" r="8.5" fill="#eaf3fb" />
      <circle cx="53" cy="38" r="8.5" fill="#eaf3fb" />
      <circle cx="35" cy="39" r="4" fill="#2b2118" />
      <circle cx="53" cy="39" r="4" fill="#2b2118" />
      <path d="M41 45 L44 50 L47 45 Z" fill="#e8c27a" />
    </svg>
  );
}

function claimsFor(pack: ContentPack, knowledgeId: string, ids: string[]) {
  const out: Record<string, ResolvedClaim> = {};
  for (const id of ids) {
    const c = resolveClaim(pack, knowledgeId, id);
    if (c) out[id] = c;
  }
  return out;
}

export function Shell({ pack }: { pack: ContentPack }) {
  const [state, setState] = useState<ExperienceState>(() =>
    initialState({ reducedMotion: false, webgl: true }),
  );
  const [journal, setJournal] = useState<JournalState>(EMPTY_JOURNAL);
  const [toast, setToast] = useState<string | null>(null);
  const [guideLine, setGuideLine] = useState(
    pack.guide.find((g) => g.on === "start")?.text ?? "",
  );
  const journalRef = useRef(journal);
  journalRef.current = journal;
  // Sound (src/audio): ambient follows view + season; events play cues.
  const sound = useSoundscape(state);
  const soundEvent = sound.onEvent;

  useEffect(() => {
    setState((st) => ({ ...st, prefs: detectPrefs() }));
    try {
      const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
      const j = raw ? sanitizeJournal(pack, JSON.parse(raw)) : null;
      if (j) setJournal(j);
    } catch {}
  }, [pack]);

  const emit = useCallback(
    (e: ExperienceEvent) => {
      setState((st) => reduce(pack, st, e));
      soundEvent(e);
      // Demo recorder and e2e hook: mirror every event as a DOM event.
      window.dispatchEvent(new CustomEvent("lh:event", { detail: e }));
      const { journal: next, earned } = record(pack, journalRef.current, e);
      if (next !== journalRef.current) {
        journalRef.current = next;
        setJournal(next);
        try {
          localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(next));
        } catch {}
      }
      const target =
        "locationId" in e
          ? e.locationId
          : "sceneId" in e
            ? e.sceneId
            : undefined;
      const line = pack.guide.find(
        (g) => g.on === e.type && (!g.targetId || g.targetId === target),
      );
      if (line) setGuideLine(line.text);
      for (const id of earned) {
        soundEvent({ type: "stamp.earned", stampId: id });
        setToast(pack.stamps.find((x) => x.id === id)?.title ?? id);
        const stampLine = pack.guide.find((g) => g.on === "stamp.earned");
        if (stampLine) setGuideLine(stampLine.text);
      }
    },
    [pack, soundEvent],
  );

  // Demo recorder and e2e hook (scripts/demo-video): scripts send the same
  // events the UI sends, through the same reducer. No new power.
  useEffect(() => {
    const w = window as Window & { __livingHokkaido?: { emit: Emit } };
    w.__livingHokkaido = { emit };
    return () => {
      delete w.__livingHokkaido;
    };
  }, [emit]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Season timelapse clock (shell-owned).
  const { playing, speed, value } = state.season;
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(
      () =>
        emit({ type: "season.set", value: wrapSeason(value + speed * 0.1) }),
      100,
    );
    return () => clearInterval(t);
  }, [playing, speed, value, emit]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") emit({ type: "nav.back" });
      // Arrows step objects only when nothing else has focus (the 3D
      // viewer and sliders use arrows themselves).
      const free = ev.target === document.body;
      if (free && (ev.key === "ArrowLeft" || ev.key === "ArrowRight"))
        stepRef.current?.(ev.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [emit]);

  const ctx: PartContext = useMemo(
    () => ({ content: pack, season: state.season, prefs: state.prefs, emit }),
    [pack, state.season, state.prefs, emit],
  );
  const scene = pack.scenes.find((x) => x.id === state.sceneId) ?? null;
  const artifact =
    pack.artifacts.find((a) => a.id === state.artifactId) ?? null;
  const activity =
    pack.activities.find((a) => a.id === state.activityId) ?? null;
  // Previous / next object in the order the scene places them.
  const placed = scene ? scene.placements.map((p) => p.artifactId) : [];
  const step = (d: number) => {
    if (!artifact || placed.length < 2) return;
    const i = placed.indexOf(artifact.id);
    const next = placed[(i + d + placed.length) % placed.length];
    if (next) emit({ type: "artifact.focus", artifactId: next });
  };
  const stepRef = useRef<((d: number) => void) | null>(null);
  stepRef.current = state.view === "focus" && !state.overlay ? step : null;
  const {
    island: Island,
    "detail-scene": Scene,
    artifacts: Viewer,
    activities: Activity,
    journal: Journal,
    reveal: Reveal,
    "over-time": OverTime,
    ask: Ask,
  } = parts;
  // "Over time" is offered inside a location that has a timeline.
  const localTimeline =
    state.view === "scene" || state.view === "focus"
      ? (pack.timelines.find(
          (t) =>
            scene?.timelineIds.includes(t.id) ||
            t.locationId === state.locationId,
        ) ?? null)
      : null;
  const openTimeline =
    state.overlay === "timeline"
      ? (pack.timelines.find((t) => t.id === state.timelineId) ?? null)
      : null;

  const { stations, next } = route(pack, state, journal);
  const ink = seasonInk[SEASON_IDS.indexOf(seasonAt(state.season.value))];

  const stage =
    state.view === "island" || state.view === "travel" ? (
      <Island {...ctx} view={state.view} locationId={state.locationId} />
    ) : scene ? (
      <Scene
        {...ctx}
        scene={scene}
        artifacts={pack.artifacts.filter((a) =>
          scene.placements.some((p) => p.artifactId === a.id),
        )}
        focusedArtifactId={state.artifactId}
        inspectedArtifactIds={journal.inspected}
      />
    ) : null;

  return (
    <main
      className={s.shell}
      data-view={state.view}
      data-overlay={state.overlay ?? undefined}
      style={{ "--fl-season": ink } as React.CSSProperties}
    >
      <div className={s.stage}>{stage}</div>
      <Hud
        season={state.season}
        emit={emit}
        stamps={journal.stamps.length}
        total={pack.stamps.length}
        sound={sound}
        stations={stations}
        onOverTime={
          localTimeline
            ? () =>
                emit({ type: "timeline.open", timelineId: localTimeline.id })
            : undefined
        }
      />
      {guideLine && state.view !== "activity" && !state.overlay && (
        <section className={s.owl} aria-label="Owl guide">
          <OwlMark />
          <div className={s.bubble}>
            <p className={s.cap} aria-hidden="true">
              Owl guide
            </p>
            <p
              key={guideLine}
              className={s.line}
              aria-live="polite"
              data-still={state.prefs.reducedMotion || undefined}
            >
              <span className={s.visuallyHidden}>Owl: </span>
              {guideLine}
            </p>
            {next && (
              <button
                type="button"
                className={s.next}
                onClick={() => emit(next.event)}
              >
                {next.label}
              </button>
            )}
          </div>
        </section>
      )}
      <Ask
        {...ctx}
        view={state.view}
        locationId={state.locationId}
        sceneId={state.sceneId}
        artifactId={state.artifactId}
        covered={state.overlay !== null}
      />
      {toast && <output className={s.toast}>New stamp: {toast}</output>}
      <aside className={s.side}>
        {artifact && state.view === "focus" && (
          <SidePanel
            key="card"
            title={artifact.label}
            closeLabel="Close (put it back)"
            onClose={() => emit({ type: "artifact.blur" })}
            index={placed.indexOf(artifact.id)}
            total={placed.length}
            onPrev={placed.length > 1 ? () => step(-1) : undefined}
            onNext={placed.length > 1 ? () => step(1) : undefined}
          >
            <Viewer
              {...ctx}
              artifact={artifact}
              claims={claimsFor(pack, artifact.knowledgeId, artifact.claimIds)}
              read={journal.hotspotsRead
                .filter((k) => k.startsWith(`${artifact.id}/`))
                .map((k) => k.slice(artifact.id.length + 1))}
              doneActivityIds={journal.completed}
            />
          </SidePanel>
        )}
        {activity && state.view === "activity" && (
          <SidePanel
            key="activity"
            header={false}
            title={activity.title}
            closeLabel="Close activity"
            onClose={() =>
              emit({ type: "activity.close", activityId: activity.id })
            }
          >
            <Activity
              {...ctx}
              activity={activity}
              claims={claimsFor(pack, activity.knowledgeId, activity.claimIds)}
              found={journal.found.flatMap((key) =>
                key.startsWith(`${activity.id}/`)
                  ? [key.slice(activity.id.length + 1)]
                  : [],
              )}
            />
          </SidePanel>
        )}
      </aside>
      {openTimeline && (
        <div className={s.timeline}>
          <OverTime
            {...ctx}
            timeline={openTimeline}
            claims={claimsFor(pack, openTimeline.knowledgeId, [
              ...openTimeline.claimIds,
              ...openTimeline.eras.flatMap((e) => e.claimIds),
            ])}
          />
          <button
            type="button"
            className={s.timelineClose}
            onClick={() => emit({ type: "nav.back" })}
          >
            Close
          </button>
        </div>
      )}
      {state.overlay && state.overlay !== "timeline" && (
        <div
          className={s.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) emit({ type: "nav.back" });
          }}
          role="presentation"
        >
          {state.overlay === "journal" && (
            <Journal {...ctx} journal={journal} />
          )}
          {state.overlay === "reveal" && state.reveal && (
            <Reveal
              {...ctx}
              knowledgeId={state.reveal.knowledgeId}
              claim={
                state.reveal.claimId
                  ? resolveClaim(
                      pack,
                      state.reveal.knowledgeId,
                      state.reveal.claimId,
                    )
                  : null
              }
              artifact={
                pack.artifacts.find((a) => a.id === state.reveal?.artifactId) ??
                null
              }
            />
          )}
        </div>
      )}
    </main>
  );
}
