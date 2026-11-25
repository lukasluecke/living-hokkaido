// One running game: wires the pure rules (src/core) to physics, rendering,
// HUD and input. Fixed 60 Hz simulation, rendering every animation frame.
import type RAPIER from "@dimforge/rapier3d-compat";
import { WOBBLE } from "./core/balance";
import { collectAt, placeFinds } from "./core/finds";
import { crashLine, FINISH_LINE, READY_LINE, TITLE } from "./core/lines";
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
import { createFindMarkers } from "./render/finds";
import { createHud } from "./render/hud";
import { createView } from "./render/view";

const STEP = 1 / 60;
/** Slow motion after a crash: time scale and how long it lasts (real s). */
const SLOWMO = { scale: 0.25, seconds: 1.4 };

/** Wall-label titles for what was touched. */
const HIT_NAME: Record<string, string> = {
  shopfront: "Shopfront",
  "snow-pile": "Snow pile",
  "lamp-post": "Lamp post",
  crate: "Crate",
  bicycle: "Bicycle",
  tourist: "Fellow visitor",
};

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
  const track = generateTrack(props.seed ?? 1);
  const finishAt = track.length - PLAYER.startS;
  const physics = createPhysics(R, track, props.seed ?? 1, props.startAt ?? 0);
  const view = createView(host, track, props.prefs.reducedMotion);
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const hud = createHud(host, touch);
  const random = rng(Date.now());
  let state: RunState = initialRun;
  let slowmo = 0;
  // Finds: museum labels in the lane; collected ones are explained at the end.
  const findInfo = props.finds ?? [];
  const spots = placeFinds(
    track,
    findInfo.map((f) => f.id),
  );
  const markers = createFindMarkers(
    view.scene,
    track,
    spots,
    props.prefs.reducedMotion,
  );
  let collected: string[] = [];
  let lean = 0;
  let clock = 0;
  const findCard = () => ({
    finds: collected.flatMap((id) => {
      const f = findInfo.find((x) => x.id === id);
      return f ? [{ label: f.label, text: f.text, source: f.source }] : [];
    }),
    missed: spots.length - collected.length,
  });

  const input = attachInput(host, view.canvas, hud.buttons, () => onAction());
  hud.buttons.action.addEventListener("click", () => onAction());

  function onAction() {
    if (state.phase === "ready") dispatch({ type: "start" });
    else if (state.phase === "crashed" || state.phase === "finished") {
      physics.reset();
      view.snap();
      slowmo = 0;
      collected = [];
      lean = 0;
      dispatch({ type: "restart" });
    }
  }

  function dispatch(action: RunAction) {
    const prev = state;
    state = reduceRun(state, action);
    if (state.phase !== prev.phase) enter(state);
    if (prev.runsEnded === 0 && state.runsEnded === 1) {
      props.emit({
        type: "activity.complete",
        result: {
          activityId: props.activityId,
          completed: true,
          score: resultScore(state.distance, finishAt),
          at: new Date().toISOString(),
        },
      });
    }
  }

  function enter(s: RunState) {
    const stats = `${score(s)} m${s.best > 0 ? ` · best ${s.best} m` : ""}`;
    switch (s.phase) {
      case "ready":
        showReady();
        break;
      case "sliding":
        hud.hideCard();
        physics.slip();
        hud.announce("You slip. Lean with the arrow keys, brace with Space.");
        break;
      case "crashed": {
        physics.crash(random);
        if (!props.prefs.reducedMotion) slowmo = SLOWMO.seconds;
        const line = crashLine(s.hit);
        // Let the tumble play for a moment before the card covers it.
        window.setTimeout(
          () => {
            if (state !== s) return;
            hud.showCard("Exhibit touched", {
              heading: HIT_NAME[s.hit ?? ""] ?? "Exhibit",
              body: line,
              stats,
              action: "Slide again",
              ...findCard(),
            });
          },
          props.prefs.reducedMotion ? 300 : 1200,
        );
        hud.announce(`Crashed after ${score(s)} metres. ${line}`);
        break;
      }
      case "finished":
        physics.stop();
        hud.showCard("The canal", {
          heading: "You made it.",
          body: FINISH_LINE,
          stats,
          action: "Slide again",
          ...findCard(),
        });
        hud.announce(`Reached the canal: ${score(s)} metres. ${FINISH_LINE}`);
        break;
    }
  }

  function showReady() {
    hud.showCard("Gallery of the slope", {
      heading: TITLE,
      body: READY_LINE,
      action: "Slip",
    });
    hud.announce(`${TITLE}. ${READY_LINE} Press Enter to start.`);
  }

  let shownLean = 0;
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
      acc += real * scale;
      while (acc >= STEP) {
        acc -= STEP;
        const want = input.controls();
        lean = easeLean(lean, want.lean, STEP);
        const hit = physics.step({ ...want, lean }, STEP);
        if (state.phase === "sliding") {
          dispatch({ type: "progress", distance: physics.distance() });
          const here = physics.local();
          for (const id of collectAt(spots, collected, here.s, here.x)) {
            collected = [...collected, id];
            const f = findInfo.find((x) => x.id === id);
            if (f) {
              hud.toast(`Found: ${f.label}`);
              hud.announce(
                `Found a label: ${f.label}. ${collected.length} of ${spots.length}.`,
              );
            }
          }
          if (hit && SOFT[hit]) {
            hud.toast("Through the snow pile. Slower now.");
            hud.announce("You plough through a snow pile and slow down.");
          } else if (hit) dispatch({ type: "crash", what: hit });
          else if (physics.distance() >= finishAt) dispatch({ type: "finish" });
        }
      }
    }
    hud.setMeter(score(state), state.best, [collected.length, spots.length]);
    clock += real;
    markers.update(clock, real, collected);
    const at = physics.local();
    // Visual lean eases toward the input so the sway reads as weight.
    const target = state.phase === "sliding" ? lean : 0;
    shownLean += (target - shownLean) * (1 - Math.exp(-real * 8));
    view.render(
      {
        pos: physics.position(),
        rot: physics.crashed()
          ? physics.rotation()
          : standingPose(track, at.s, shownLean, physics.wobble()),
        s: at.s,
        x: at.x,
        speed: physics.speed(),
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
      view.destroy();
      physics.free();
    },
  };
}
