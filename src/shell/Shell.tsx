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
  SEASON_IDS,
  resolveClaim,
  sanitizeJournal,
  seasonAt,
  wrapSeason,
} from "@/contracts";
import { SoundToggle, useSoundscape } from "@/audio/react";
import { record } from "./progress";
import { parts } from "./registry";
import s from "./Shell.module.css";
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
  const {
    island: Island,
    "detail-scene": Scene,
    artifacts: Viewer,
    activities: Activity,
    journal: Journal,
    reveal: Reveal,
  } = parts;

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
      />
    ) : null;

  return (
    <main
      className={s.shell}
      data-view={state.view}
      data-overlay={state.overlay ?? undefined}
    >
      <div className={s.stage}>{stage}</div>
      <header className={s.hud}>
        <strong>Living Hokkaido</strong>
        <span>Season: {seasonAt(state.season.value)}</span>
        {SEASON_IDS.map((id, i) => (
          <button
            key={id}
            type="button"
            onClick={() => emit({ type: "season.set", value: i })}
          >
            {id}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            emit({ type: "season.play", playing: !state.season.playing })
          }
        >
          {state.season.playing ? "Pause" : "Timelapse"}
        </button>
        <button type="button" onClick={() => emit({ type: "journal.open" })}>
          Journal ({journal.stamps.length}/{pack.stamps.length})
        </button>
        <SoundToggle sound={sound} />
        <a href="/contribute">Contribute a story</a>
      </header>
      {guideLine && (
        <p className={s.guide} aria-live="polite">
          Owl: {guideLine}
        </p>
      )}
      {toast && <output className={s.toast}>New stamp: {toast}</output>}
      <aside className={s.side}>
        {artifact && state.view === "focus" && (
          <Viewer
            {...ctx}
            artifact={artifact}
            claims={claimsFor(pack, artifact.knowledgeId, artifact.claimIds)}
            read={journal.hotspotsRead
              .filter((k) => k.startsWith(`${artifact.id}/`))
              .map((k) => k.slice(artifact.id.length + 1))}
          />
        )}
        {activity && state.view === "activity" && (
          <Activity
            {...ctx}
            activity={activity}
            claims={claimsFor(pack, activity.knowledgeId, activity.claimIds)}
          />
        )}
      </aside>
      {state.overlay && (
        <div className={s.overlay}>
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
