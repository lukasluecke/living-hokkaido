"use client";
// The shell composes the parts. It owns ExperienceState, the season clock and
// journal persistence. Parts get props and emit events; nothing else.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type ContentPack,
  type Emit,
  EMPTY_JOURNAL,
  highlightDone,
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
import { SHOW_DISCLAIMERS } from "@/design/disclaimers";
import { seasonInk } from "@/design/tokens";
import { useSoundscape } from "@/audio/react";
import {
  pauseVoiceLine,
  playVoiceLine,
  resumeVoiceLine,
  stopVoiceLine,
} from "@/audio/voice";
import {
  DEFAULT_LOCALE,
  I18nProvider,
  isLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
  localizePack,
  translator,
} from "@/i18n";
import { Hud } from "./Hud";
import { record } from "./progress";
import { parts, preloadParts } from "./registry";
import {
  highlightIcon,
  Icon,
  kindIconPath,
  UI_ICON,
} from "@/parts/shared/Icon";
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

export function Shell({ pack: source }: { pack: ContentPack }) {
  // Language (src/i18n): the shell owns the locale. Parts get the pack with
  // translated text; ids stay the same, so state and journal do not change.
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const pack = useMemo(() => localizePack(source, locale), [source, locale]);
  const t = useMemo(() => translator(locale), [locale]);
  const [state, setState] = useState<ExperienceState>(() =>
    initialState({ reducedMotion: false, webgl: true }),
  );
  const [journal, setJournal] = useState<JournalState>(EMPTY_JOURNAL);
  const [toast, setToast] = useState<string | null>(null);
  // Guide line and toast hold English text; they are translated on render.
  const startLine = source.guide.find((g) => g.on === "start")?.text ?? "";
  const [guideLine, setGuideLine] = useState(startLine);
  const journalRef = useRef(journal);
  journalRef.current = journal;
  // Sound (src/audio): ambient follows view + season; events play cues.
  const sound = useSoundscape(state);
  const soundEvent = sound.onEvent;
  // The owl reads its line in a pre-generated AI voice (labelled in the
  // bubble) when sound is on and the bubble shows. Captions stay primary.
  const [guideVoiced, setGuideVoiced] = useState(false);
  // Progressive disclosure (Lukas): "Explore freely" shows the full island
  // UI (tray, labels, route, Ask) before the first trip.
  const [explore, setExplore] = useState(false);
  // One owl: the tour bubble's "Ask me a question" opens Ask the owl.
  const [askSignal, setAskSignal] = useState(0);
  // Tour start (Lukas): wait for the island's first frame, count down
  // 3 s ("Starting the tour in 3…", Cancel = explore freely), then the owl
  // speaks and the camera pulls out from the owl to the island.
  const [islandReady, setIslandReady] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [introDone, setIntroDone] = useState(false);
  // Pause / resume the tour's voice-over.
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setState((st) => ({ ...st, prefs: detectPrefs() }));
    try {
      const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
      const j = raw ? sanitizeJournal(pack, JSON.parse(raw)) : null;
      if (j) setJournal(j);
    } catch {}
  }, [pack]);

  // Lazy parts (registry.ts): fetch them once the island had time to draw.
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    const t = setTimeout(() => {
      if (w.requestIdleCallback)
        w.requestIdleCallback(preloadParts, { timeout: 3000 });
      else preloadParts();
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // Locale: ?lang=ja|en wins, then the stored choice.
  useEffect(() => {
    let next: unknown = new URLSearchParams(window.location.search).get("lang");
    try {
      if (!isLocale(next)) next = localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {}
    if (isLocale(next)) setLocale(next);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const chooseLocale = useCallback((next: Locale) => {
    setLocale(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {}
  }, []);

  const emit = useCallback(
    (e: ExperienceEvent) => {
      setState((st) => reduce(pack, st, e));
      soundEvent(e);
      if (e.type === "island.ready") setIslandReady(true);
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
      const line = source.guide.find(
        (g) => g.on === e.type && (!g.targetId || g.targetId === target),
      );
      if (line) setGuideLine(line.text);
      // The welcome is for the first look at the island only: once the
      // visitor sets off, it must not come back (or be read out) later.
      else if (e.type === "location.select" || e.type === "highlight.open")
        setGuideLine((prev) => (prev === startLine ? "" : prev));
      for (const id of earned) {
        soundEvent({ type: "stamp.earned", stampId: id });
        setToast(source.stamps.find((x) => x.id === id)?.title ?? id);
        // The toast already names the stamp; keep a place's own line (for
        // example its welcome on arrival) and only fall back to this one.
        const stampLine = source.guide.find((g) => g.on === "stamp.earned");
        if (stampLine && !line) setGuideLine(stampLine.text);
      }
    },
    [pack, source, soundEvent],
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
      // The side panel takes focus when it opens; it counts as "nothing".
      const t = ev.target as HTMLElement | null;
      const free = t === document.body || t?.dataset.arrowSteps !== undefined;
      if (free && (ev.key === "ArrowLeft" || ev.key === "ArrowRight"))
        stepRef.current?.(ev.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [emit]);

  // Overlays (journal, reveal, timeline) are modal: the page behind is
  // inert, focus moves in on open and goes back to the opener on close.
  const overlayBox = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (!overlayBox.current?.contains(el)) lastFocus.current = el;
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);
  const covered = state.overlay !== null;
  useEffect(() => {
    if (!covered) {
      const el = opener.current;
      opener.current = null;
      if (el?.isConnected) el.focus({ preventScroll: true });
      return;
    }
    if (!opener.current) opener.current = lastFocus.current;
    const box = overlayBox.current;
    if (!box || box.contains(document.activeElement)) return;
    const first = box.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    first?.focus({ preventScroll: true });
  }, [covered, state.overlay]);

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

  const { stations, next } = route(pack, state, journal, t);
  const nextEvent = next?.event;
  const nextIcon =
    nextEvent?.type === "activity.start"
      ? kindIconPath(
          pack.activities.find((a) => a.id === nextEvent.activityId)?.kind ??
            "",
        )
      : nextEvent?.type === "highlight.open"
        ? highlightIcon(
            pack.highlights.find((h) => h.id === nextEvent.highlightId)?.icon,
          )
        : nextEvent?.type === "artifact.focus"
          ? UI_ICON.look
          : nextEvent?.type === "journal.open"
            ? UI_ICON.journal
            : UI_ICON.place;
  const tourHighlight =
    nextEvent?.type === "highlight.open"
      ? pack.highlights.find((h) => h.id === nextEvent.highlightId)
      : undefined;
  // One line per moment: on the island (after the first visit), in the
  // highlight's own place, and on the tour once this place's highlights are
  // done, the owl says the highlight's line, so the tour reads as one story
  // (Lukas). In a place you picked yourself it keeps that place's own line.
  const owlLine =
    tourHighlight?.owl &&
    (state.view === "island"
      ? journal.visited.length > 0
      : tourHighlight.locationId === state.locationId || state.touring)
      ? tourHighlight.owl
      : guideLine;
  // No bubble while the owl flies: the arrival line follows on landing.
  const owlShown =
    !!owlLine &&
    state.view !== "activity" &&
    state.view !== "travel" &&
    !state.overlay &&
    // The film has the stage; the owl speaks again once it closes or ends.
    !state.filmOpen &&
    // Before the tour starts, the countdown card shows instead.
    (introDone || journal.visited.length > 0 || explore);
  // Voice file ids (scripts/audio/voices.ts): guide ids, "highlight-<id>".
  const owlVoiceId =
    source.guide.find((g) => g.text === owlLine)?.id ??
    (tourHighlight?.owl === owlLine && tourHighlight
      ? `highlight-${tourHighlight.id}`
      : undefined);
  const lastVoice = useRef<string | undefined>(undefined);
  useEffect(() => {
    const same = lastVoice.current === owlVoiceId;
    lastVoice.current = owlVoiceId;
    if (paused) {
      // Paused: hold the line; a new line drops the old one and waits.
      if (same) pauseVoiceLine();
      else stopVoiceLine();
      return;
    }
    if (same && owlShown && !sound.muted && resumeVoiceLine()) return;
    setGuideVoiced(false);
    if (!owlShown || sound.muted || !owlVoiceId) return stopVoiceLine();
    let live = true;
    // Highlight lines are checked against their text (in the page's
    // language), so a file made from an older line stays silent.
    const said = owlVoiceId.startsWith("highlight-") ? t(owlLine) : undefined;
    void playVoiceLine("owl", owlVoiceId, 0.9, said).then(
      (ok) => live && setGuideVoiced(ok),
    );
    return () => {
      live = false;
    };
  }, [owlVoiceId, owlShown, sound.muted, paused]);
  // First look: the owl's line and one step only, until the visitor goes
  // somewhere (any visit) or picks "Explore freely".
  const calm =
    state.view === "island" && journal.visited.length === 0 && !explore;
  // Countdown: starts once the island is drawn, only on the first look.
  const counting = calm && !introDone;
  useEffect(() => {
    if (!counting || !islandReady) return;
    if (count === null) return setCount(3);
    if (count <= 0) {
      setIntroDone(true);
      setCount(null);
      return;
    }
    const id = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(id);
  }, [counting, islandReady, count]);
  // Not the first look (saved journal, or the visitor went on): no intro.
  useEffect(() => {
    if (!calm && !introDone) setIntroDone(true);
  }, [calm, introDone]);
  const ink = seasonInk[SEASON_IDS.indexOf(seasonAt(state.season.value))];

  const stage =
    state.view === "island" || state.view === "travel" ? (
      <Island
        {...ctx}
        view={state.view}
        locationId={state.locationId}
        calm={calm}
        closeUp={counting}
        doneHighlightIds={pack.highlights
          .filter((h) => highlightDone(h, journal))
          .map((h) => h.id)}
      />
    ) : scene ? (
      <Scene
        {...ctx}
        scene={scene}
        artifacts={pack.artifacts.filter((a) =>
          scene.placements.some((p) => p.artifactId === a.id),
        )}
        // An open activity of a placed object (the Omusha case) frames that
        // object, so it stays visible above the activity sheet.
        focusedArtifactId={
          state.artifactId ??
          (state.view === "activity" &&
          activity?.artifactId &&
          scene.placements.some((p) => p.artifactId === activity.artifactId)
            ? activity.artifactId
            : null)
        }
        inspectedArtifactIds={journal.inspected}
        filmOpen={!!state.filmOpen}
      />
    ) : null;

  return (
    <I18nProvider locale={locale}>
      <main
        className={s.shell}
        data-view={state.view}
        data-overlay={state.overlay ?? undefined}
        style={{ "--fl-season": ink } as React.CSSProperties}
      >
        <div className={s.stage} inert={covered}>
          {stage}
        </div>
        <Hud
          inert={covered}
          calm={calm}
          season={state.season}
          emit={emit}
          stamps={journal.stamps.length}
          total={pack.stamps.length}
          sound={sound}
          stations={stations}
          locale={locale}
          onLocale={chooseLocale}
          onResetProgress={() => {
            // Demo: forget stamps and highlights done (language and sound
            // stay), then reload so the first-visit welcome shows again.
            try {
              localStorage.removeItem(JOURNAL_STORAGE_KEY);
            } catch {}
            window.location.reload();
          }}
          onOverTime={
            localTimeline
              ? () =>
                  emit({ type: "timeline.open", timelineId: localTimeline.id })
              : undefined
          }
        />
        {counting && islandReady && count !== null && (
          <section className={s.countdown} aria-label={t("Owl guide")}>
            <p aria-live="polite">
              {t("Starting the tour in {n}…", { n: Math.max(count, 1) })}
            </p>
            <div className={s.countdownActions}>
              <button
                type="button"
                className={s.next}
                // A tap also lets the browser play the owl's voice.
                onClick={() => setIntroDone(true)}
              >
                {t("Start now")}
              </button>
              <button
                type="button"
                className={s.explore}
                onClick={() => {
                  setIntroDone(true);
                  setExplore(true);
                }}
              >
                {t("Cancel")}
              </button>
            </div>
          </section>
        )}
        {owlShown && (
          <section
            className={s.owl}
            aria-label={t("Owl guide")}
            data-calm={calm || undefined}
          >
            <OwlMark />
            <div className={s.bubble}>
              <p
                key={owlLine}
                className={s.line}
                aria-live="polite"
                data-still={state.prefs.reducedMotion || undefined}
              >
                <span className={s.visuallyHidden}>{t("Owl: ")}</span>
                {t(owlLine)}
              </p>
              {SHOW_DISCLAIMERS && guideVoiced && (
                <p className={s.voiceNote}>{t("AI voice · ElevenLabs")}</p>
              )}
              {next && (
                <button
                  type="button"
                  className={s.next}
                  aria-label={next.label}
                  onClick={() => emit(next.event)}
                >
                  <Icon d={nextIcon} size={18} />
                  {/* The icon says "look" or "try", so show only the name. */}
                  <span>{next.name ?? next.label}</span>
                  <Icon d={UI_ICON.go} size={16} className={s.nextGo} />
                </button>
              )}
              {(guideVoiced || paused) && !sound.muted && (
                <button
                  type="button"
                  className={s.pause}
                  aria-pressed={paused}
                  onClick={() => setPaused((v) => !v)}
                >
                  <Icon
                    d={paused ? "M8 5l11 7-11 7Z" : "M8 5v14M16 5v14"}
                    size={16}
                  />
                  {paused ? t("Resume") : t("Pause")}
                </button>
              )}
              {calm && (
                <button
                  type="button"
                  className={s.explore}
                  onClick={() => setExplore(true)}
                >
                  {t("Explore freely")}
                </button>
              )}
              {!calm && (
                <button
                  type="button"
                  className={s.explore}
                  onClick={() => setAskSignal((n) => n + 1)}
                >
                  {t("Ask me a question")}
                </button>
              )}
            </div>
          </section>
        )}
        {!calm && (
          <Ask
            {...ctx}
            // Retrieval matches English words, so the owl answers from the
            // English pack for now (src/i18n/AGENTS.md, limitations).
            content={source}
            view={state.view}
            locationId={state.locationId}
            sceneId={state.sceneId}
            artifactId={state.artifactId}
            covered={state.overlay !== null}
            openSignal={askSignal}
            // One owl: while the bubble shows, its link opens the box.
            hideTrigger={owlShown}
            backLabel={next ? t("Back to the tour") : undefined}
          />
        )}
        {toast && (
          <output className={s.toast}>
            {t("New stamp: {title}", { title: t(toast) })}
          </output>
        )}
        <aside className={s.side} inert={covered}>
          {artifact && state.view === "focus" && (
            <SidePanel
              key="card"
              title={artifact.label}
              closeLabel={t("Close (put it back)")}
              onClose={() => emit({ type: "artifact.blur" })}
              index={placed.indexOf(artifact.id)}
              total={placed.length}
              onPrev={placed.length > 1 ? () => step(-1) : undefined}
              onNext={placed.length > 1 ? () => step(1) : undefined}
            >
              <Viewer
                {...ctx}
                artifact={artifact}
                claims={claimsFor(
                  pack,
                  artifact.knowledgeId,
                  artifact.claimIds,
                )}
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
              closeLabel={t("Close activity")}
              onClose={() =>
                emit({ type: "activity.close", activityId: activity.id })
              }
            >
              <Activity
                {...ctx}
                activity={activity}
                claims={claimsFor(
                  pack,
                  activity.knowledgeId,
                  activity.claimIds,
                )}
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
          <div ref={overlayBox} className={s.timeline}>
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
              {t("Close")}
            </button>
          </div>
        )}
        {state.overlay && state.overlay !== "timeline" && (
          <div
            ref={overlayBox}
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
                  pack.artifacts.find(
                    (a) => a.id === state.reveal?.artifactId,
                  ) ?? null
                }
              />
            )}
          </div>
        )}
      </main>
    </I18nProvider>
  );
}
