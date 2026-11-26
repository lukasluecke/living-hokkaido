// One running game: wires the pure rules (src/core) to physics, rendering,
// HUD and input. Fixed 60 Hz simulation, rendering every animation frame.
import type RAPIER from "@dimforge/rapier3d-compat";
import { WOBBLE } from "./core/balance";
import { passedCaptions, placeCaptions } from "./core/captions";
import {
  displayLabel,
  noticeAt,
  pickExhibits,
  placeExhibits,
  slidPast,
} from "./core/exhibits";
import {
  NO_STREAK,
  runTitle,
  type Streak,
  streakStep,
  stylePoints,
} from "./core/score";
import { buildingAt } from "./core/where";
import { strings } from "./i18n";
import {
  canShareImage,
  deliverCard,
  type ScoreCardData,
  scoreCard,
} from "./render/scorecard";
import { rng } from "./core/random";
import {
  initialRun,
  type RunAction,
  type RunState,
  reduceRun,
  resultScore,
  score,
} from "./core/run";
import { frameAt, frameQuat, type Quat } from "./core/path";
import { generateTrack } from "./core/track";
import { easeLean } from "./input/controls";
import { attachInput } from "./input/input";
import type { SlopeProps } from "./integration/contracts";
import { createPhysics, mul, PLAYER, SOFT } from "./physics/world";
import { createSfx } from "./audio/sfx";
import { closeCalls, shouldComment } from "./core/style";
import { createExhibits } from "./render/exhibits";
import { createHud } from "./render/hud";
import { createView } from "./render/view";

const STEP = 1 / 60;
/** Slow motion after a crash: time scale and how long it lasts (real s). */
const SLOWMO = { scale: 0.25, seconds: 1.4 };

/** Upright and facing down the street, swaying with the lean and the
 *  wobble. Rolls about the figure's own forward axis. */
function standingPose(
  track: ReturnType<typeof generateTrack>,
  s: number,
  lean: number,
  wobble: number,
): Quat {
  const roll = -(lean * 0.22 + (wobble / WOBBLE.accel) * 0.35);
  return mul(frameQuat(frameAt(track.path, s), true), [
    0,
    0,
    Math.sin(roll / 2),
    Math.cos(roll / 2),
  ]);
}

export function startGame(
  R: typeof RAPIER,
  host: HTMLElement,
  props: SlopeProps,
) {
  const random = rng(Date.now());
  // Exhibits: this street shows a few from the pool, new ones first.
  const pool = props.finds ?? [];
  const seenBefore = props.seen ?? [];
  const picks = pickExhibits(pool, seenBefore, random);
  const seed = props.seed ?? 1;
  const { track, spots } = placeExhibits(generateTrack(seed), picks);
  if (import.meta.env?.DEV) console.info("[exhibits]", JSON.stringify(spots));
  const finishAt = track.length - PLAYER.startS;
  const physics = createPhysics(R, track, seed, props.startAt ?? 0);
  const view = createView(host, track, props.prefs.reducedMotion);
  view.onPhoto(() => sfx.shutter());
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const t = strings(props.lang);
  const hud = createHud(
    host,
    touch,
    props.prefs.reducedMotion,
    t,
    props.onLangChange
      ? () => props.onLangChange?.(t.lang === "ja" ? "en" : "ja")
      : undefined,
  );
  let state: RunState = {
    ...initialRun,
    best: Math.max(0, Math.floor(props.best ?? 0)),
  };
  /** Step 8: clean streak, runs this session, the still and the card. */
  let streak: Streak = NO_STREAK;
  let passed = 0;
  let runs = 0;
  let still: HTMLCanvasElement | null = null;
  let card: ScoreCardData | null = null;
  const sfx = createSfx(props.muted ?? false);
  hud.setMuted(sfx.muted);
  const toggleMute = () => {
    sfx.setMuted(!sfx.muted);
    hud.setMuted(sfx.muted);
    hud.announce(sfx.muted ? t.soundOffAnnounce : t.soundOnAnnounce);
  };
  hud.buttons.mute.addEventListener("click", () => {
    sfx.start();
    toggleMute();
    // Give the keys back to the game (Space would press this button).
    host.focus({ preventScroll: true });
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.code === "KeyM" && !e.repeat) {
      sfx.start();
      toggleMute();
    }
  };
  host.addEventListener("keydown", onKey);
  /** Gallery captions: labelled buildings, and those passed this run. */
  const captions = placeCaptions(track.buildings, finishAt);
  let collected = new Set<string>();
  /** Close calls this run (style points). */
  let close = new Set<string>();
  /** When the guide last commented on a close call (clock s). */
  let lastComment = -Infinity;
  let slowmo = 0;
  const exhibits = createExhibits(
    view.scene,
    track,
    spots,
    props.prefs.reducedMotion,
  );
  /** Noticed this run, and in any run of this street or before. */
  let noticed: string[] = [];
  const seen = new Set(seenBefore);
  let lean = 0;
  let clock = 0;
  const info = (id: string) => pool.find((x) => x.id === id);
  const explain = (id: string) => {
    const f = info(id);
    return f
      ? {
          label: displayLabel(f.label),
          text: f.text,
          source: f.source,
          image: f.image,
        }
      : undefined;
  };
  /** The end card's exhibits part: noticed ones (new tagged), one missed
   *  one passed on the way, and the notebook. Marks this run's as seen. */
  const exhibitCard = (reached: number) => {
    const list = noticed.flatMap((id) => {
      const e = explain(id);
      return e ? [{ ...e, fresh: !seen.has(id) }] : [];
    });
    const missed = slidPast(picks, [...seen], noticed, (id) => {
      const sp = spots.find((x) => x.id === id);
      return !!sp && sp.s1 < reached;
    });
    for (const id of noticed) seen.add(id);
    return {
      noticed: list,
      past: missed ? explain(missed.id) : undefined,
      notebook: [pool.filter((f) => seen.has(f.id)).length, pool.length] as [
        number,
        number,
      ],
    };
  };

  const input = attachInput(host, view.canvas, hud.buttons, () => onAction());
  hud.buttons.action.addEventListener("click", () => onAction());

  function onAction() {
    sfx.start();
    // A clicked card button disappears and takes focus with it; keep the
    // keys (A/D/S, arrows) reaching the game.
    host.focus({ preventScroll: true });
    if (state.phase === "ready") dispatch({ type: "start" });
    else if (state.phase === "crashed" || state.phase === "finished") {
      physics.reset();
      view.snap();
      slowmo = 0;
      noticed = [];
      close = new Set();
      ending = null;
      finishCard = null;
      lastComment = -Infinity;
      streak = NO_STREAK;
      passed = 0;
      still = null;
      card = null;
      collected = new Set();
      hud.clearCaptions();
      lean = 0;
      dispatch({ type: "restart" });
    }
  }

  function dispatch(action: RunAction) {
    const prev = state;
    state = reduceRun(state, action);
    // Reaching the canal notices it: it is the last exhibit.
    if (state.phase === "finished" && prev.phase !== "finished")
      for (const sp of spots)
        if (sp.look === "canal" && !noticed.includes(sp.id))
          noticed = [...noticed, sp.id];
    if (state.phase !== prev.phase) enter(state);
    // Every run ends with a result: the host's journal keeps what was
    // noticed, so the next street brings new exhibits.
    if (state.runsEnded > prev.runsEnded) {
      props.emit({
        type: "activity.complete",
        result: {
          activityId: props.activityId,
          completed: true,
          score: resultScore(state.distance, finishAt),
          at: new Date().toISOString(),
          found: noticed,
        },
      });
    }
  }

  /** Wrap up a run: summary for the page/host, data for the score card. */
  function endRun(s: RunState, hit: string | null) {
    runs++;
    const style = stylePoints(close.size, streak.longest);
    const finished = s.phase === "finished";
    const title = runTitle(
      seed,
      runs,
      hit,
      finished,
      new Date().getFullYear(),
      t.runTitles,
    );
    props.onRunEnd?.({
      seed,
      distance: score(s),
      finished,
      captions: collected.size,
      closeCalls: close.size,
      streak: streak.longest,
      style,
      title,
    });
    card = {
      title,
      distance: score(s),
      best: s.best,
      captions: [collected.size, captions.length],
      closeCalls: close.size,
      streak: streak.longest,
      style,
      outcome: finished ? t.outcomeFinished : t.outcomeContact,
      seed,
      link: props.shareUrl,
    };
    return { style, title };
  }

  /** The end card's second button: share sheet or download. */
  function shareAction() {
    return {
      label: canShareImage() ? t.share : t.download,
      onClick: async () => {
        if (!card) return;
        const blob = await scoreCard(still, card, t);
        if (props.onScoreCard) {
          props.onScoreCard(blob);
          return;
        }
        const text = t.shareText(
          card.title,
          card.distance,
          card.captions[0],
          card.captions[1],
          props.shareUrl,
        );
        const how = await deliverCard(blob, text, t.title);
        hud.announce(how === "shared" ? t.shared : t.downloaded);
      },
    };
  }

  function enter(s: RunState) {
    // Just distance and best (playtest: the rest was clutter; captions,
    // close calls and style points are on the score card).
    const stats = [t.metres(score(s)), s.best > 0 ? t.best(s.best) : ""]
      .filter(Boolean)
      .join(" · ");
    switch (s.phase) {
      case "ready":
        showReady();
        break;
      case "sliding":
        hud.hideCard();
        physics.slip();
        hud.announce(t.slipAnnounce);
        // The start card is gone: keep the keys in view for the first runs.
        if (!touch && runs < 2) hud.toast(t.controlsToast, 4000);
        break;
      case "crashed": {
        hud.clearCaptions();
        // Physics only says "shopfront"; find which one from where we are.
        const where = physics.local();
        const glass =
          s.hit === "shopfront" &&
          buildingAt(track.buildings, where.s, where.x)?.kind ===
            "glass-workshop";
        if (glass) {
          sfx.chime();
          hud.caption({
            title: t.glassTitle,
            label: t.glassLabel,
            quip: "",
            count: "",
          });
        } else sfx.crash();
        physics.crash(random);
        if (!props.prefs.reducedMotion) slowmo = SLOWMO.seconds;
        const line = glass ? t.glassLine : t.crash(s.hit);
        const end = endRun(s, glass ? "glass" : s.hit);
        // Mid-tumble still for the score card, before the card covers it.
        window.setTimeout(
          () => {
            if (state === s) still = view.capture();
          },
          props.prefs.reducedMotion ? 150 : 450,
        );
        // Let the tumble play for a moment before the card covers it.
        window.setTimeout(
          () => {
            if (state !== s) return;
            hud.showCard(t.exhibitTouched, {
              heading: glass
                ? t.glassName
                : (t.hit[s.hit ?? ""] ?? t.hit.exhibit ?? ""),
              body: line,
              stats,
              action: t.slideAgain,
              share: shareAction(),
              ...exhibitCard(physics.local().s),
            });
          },
          props.prefs.reducedMotion ? 300 : 1200,
        );
        hud.announce(
          t.crashedAnnounce(
            score(s),
            line,
            end.title,
            collected.size,
            captions.length,
            end.style,
          ),
        );
        break;
      }
      case "finished": {
        sfx.finish();
        // Off the embankment into the canal; the card waits for the splash.
        physics.flyOff();
        const end = endRun(s, null);
        ending = { at: clock, splashAt: null, shown: false };
        finishCard = () =>
          hud.showCard(
            t.canalKind,
            {
              heading: t.madeIt,
              body: t.finishLine,
              stats,
              action: t.slideAgain,
              share: shareAction(),
              ...exhibitCard(track.length + 10),
            },
            "bottom",
          );
        hud.announce(
          t.finishedAnnounce(
            score(s),
            t.finishLine,
            end.title,
            collected.size,
            captions.length,
            end.style,
          ),
        );
        break;
      }
    }
  }

  function showReady() {
    hud.showCard(t.readyKind, {
      heading: t.title,
      body: t.readyLine,
      action: t.begin,
    });
    hud.announce(t.readyAnnounce);
  }

  let shownLean = 0;
  /** The canal ending in progress (finish → splash → end card). */
  let ending: { at: number; splashAt: number | null; shown: boolean } | null =
    null;
  let finishCard: (() => void) | null = null;
  /** Bracing right now (for the crouch and the scrape sound). */
  let braced = false;
  let raf = 0;
  let last = performance.now();
  let acc = 0;
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const real = Math.min(0.1, (now - last) / 1000);
    last = now;
    let scale = 1;
    if (slowmo > 0) {
      slowmo -= real;
      scale = SLOWMO.scale;
    }
    if (state.phase !== "ready") {
      // Slow motion takes smaller steps at the same rate, not fewer steps:
      // skipping steps would show the same pose for several frames (judder).
      const dt = STEP * scale;
      acc += real;
      while (acc >= STEP) {
        acc -= STEP;
        const want = input.controls();
        if (want.brace && !braced && state.phase === "sliding") sfx.scrape();
        braced = want.brace && state.phase === "sliding";
        lean = easeLean(lean, want.lean, dt);
        const hit = physics.step({ ...want, lean }, dt);
        if (state.phase === "sliding") {
          dispatch({ type: "progress", distance: physics.distance() });
          const here = physics.local();
          // Clean streak: obstacles passed since the last snow pile.
          for (
            let o = track.obstacles[passed];
            o && here.s > o.s + o.d / 2;
            o = track.obstacles[++passed]
          )
            streak = streakStep(streak, "pass");
          for (const id of noticeAt(spots, noticed, here.s, here.x)) {
            noticed = [...noticed, id];
            const f = info(id);
            if (f) {
              sfx.notice();
              hud.toast(t.noticedToast(displayLabel(f.label), !seen.has(id)));
              hud.announce(t.noticedAnnounce(displayLabel(f.label)));
            }
          }
          if (!hit)
            for (const c of passedCaptions(captions, collected, here.s)) {
              collected.add(c.id);
              // Short on purpose: the key fact must read in 2 seconds.
              const g = t.gallery[c.index] ?? {
                title: c.title,
                short: c.short,
              };
              hud.caption({
                title: g.title,
                label: g.short,
                quip: "",
                count: t.captionCount(collected.size, captions.length),
              });
              hud.announce(
                t.captionAnnounce(
                  collected.size,
                  captions.length,
                  g.title,
                  g.short,
                ),
              );
            }
          if (!hit)
            for (const id of closeCalls(
              track.obstacles,
              close,
              here.s,
              here.x,
              PLAYER.radius,
            )) {
              close.add(id);
              sfx.closeCall();
              // The guide comments now and then, never over a gallery card.
              if (
                !shouldComment(close.size, lastComment, clock) ||
                !hud.captionIdle()
              )
                continue;
              lastComment = clock;
              const o = track.obstacles.find((x) => x.id === id);
              const line =
                t.closeCalls[(close.size - 1) % t.closeCalls.length] ?? "";
              hud.caption({
                title: line,
                label: t.closePassed(
                  t.hit[o?.kind ?? ""] ?? t.hit.exhibit ?? "",
                  Math.round(physics.speed() * 3.6),
                ),
                quip: "",
                count: t.closeCount(close.size),
                footer: t.stylePoints,
              });
              hud.announce(t.closeAnnounce(line));
            }
          if (hit && SOFT[hit]) {
            streak = streakStep(streak, "soft");
            hud.toast(t.snowToast);
            hud.announce(t.snowAnnounce);
          } else if (hit) dispatch({ type: "crash", what: hit });
          else if (physics.distance() >= finishAt) dispatch({ type: "finish" });
        }
      }
    }
    hud.setMeter(
      score(state),
      state.best,
      [noticed.length, spots.length],
      [collected.size, captions.length],
    );
    sfx.speed(state.phase === "sliding" ? physics.speed() : 0);
    clock += real;
    // The canal ending: splash when the figure hits the water, then the end
    // card rises from the bottom with the figure still in view above it.
    if (state.phase === "finished" && ending && !ending.shown) {
      if (physics.floating() && ending.splashAt === null) {
        ending.splashAt = clock;
        sfx.splash();
        view.splash(physics.position());
        const e = ending;
        window.setTimeout(() => {
          if (ending === e) still = view.capture();
        }, 350);
      }
      const ready =
        ending.splashAt !== null
          ? clock - ending.splashAt > 1.1
          : clock - ending.at > 5;
      if (ready) {
        ending.shown = true;
        if (!still) still = view.capture();
        finishCard?.();
      }
    }
    exhibits.update(clock, real, noticed);
    const at = physics.local();
    // Visual lean eases toward the input so the sway reads as weight.
    const target = state.phase === "sliding" ? lean : 0;
    shownLean += (target - shownLean) * (1 - Math.exp(-real * 8));
    view.render(
      {
        pos: physics.position(),
        rot:
          physics.crashed() || physics.flying()
            ? physics.rotation()
            : standingPose(track, at.s, shownLean, physics.wobble()),
        s: at.s,
        x: at.x,
        speed: physics.speed(),
        brace: braced && !physics.crashed(),
        ending: physics.flying()
          ? "flying"
          : physics.floating()
            ? "floating"
            : undefined,
        balance:
          physics.crashed() || physics.flying()
            ? 1
            : Math.min(
                1,
                (Math.abs(physics.wobble()) / WOBBLE.accel) * 1.6 +
                  Math.max(0, Math.abs(shownLean) - 0.6) * 1.5,
              ),
      },
      real,
    );
  }

  showReady();
  hud.setMeter(0, 0);
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      input.destroy();
      hud.destroy();
      host.removeEventListener("keydown", onKey);
      sfx.destroy();
      exhibits.destroy();
      view.destroy();
      physics.free();
    },
  };
}
