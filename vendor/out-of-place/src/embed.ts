// Mount the game into any element. This is the integration surface for a host
// app (living-hokkaido's activities part, or the standalone page in main.ts).
//
// - Safe to import on a server (Next.js): Phaser and the scene load lazily
//   inside mountOutOfPlace, never at import time.
// - Scoped to the host element: canvas, keyboard input and the aria-live
//   region all live inside it, and destroy() removes them again.
// - Validates the activity and its claims at the boundary, so bad content fails
//   loudly instead of showing an uncited line.
import {
  type HideSeekActivity,
  hideSeekActivitySchema,
  type OutOfPlaceProps,
} from "./integration/contracts";
import { css } from "./style/palette";
import { pickRes, RES, setRes } from "./style/res";

export type OutOfPlaceHandle = {
  /** Resolves once the game is running (or right away if destroyed first). */
  ready: Promise<void>;
  /** Stop the game and remove everything it added to the host element. */
  destroy(): void;
};

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

/** Throws if an activity is invalid or a claim it needs is missing. */
export function checkProps(props: OutOfPlaceProps): {
  activity: HideSeekActivity;
  activities: HideSeekActivity[];
} {
  const activity = hideSeekActivitySchema.parse(props.activity);
  const activities = (props.activities ?? []).map((a) =>
    hideSeekActivitySchema.parse(a),
  );
  const missing = [activity, ...activities]
    .flatMap((a) => a.claimIds)
    .filter((id) => !props.claims[id]);
  if (missing.length) {
    throw new Error(
      `Out of Place: claims not provided (withdrawn or unknown): ${missing.join(", ")}`,
    );
  }
  return { activity, activities };
}

export function mountOutOfPlace(
  parent: HTMLElement,
  props: OutOfPlaceProps,
): OutOfPlaceHandle {
  const { activity, activities } = checkProps(props);
  let destroyed = false;
  let game: import("phaser").Game | null = null;

  // Screen-reader announcements (phase changes, misses, the reveal card).
  const live = document.createElement("div");
  live.setAttribute("aria-live", "polite");
  live.setAttribute("role", "status");
  Object.assign(live.style, {
    position: "absolute",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  });
  parent.append(live);

  // Keyboard play needs focus on the host; remember what we change to undo it.
  const hadTabIndex = parent.hasAttribute("tabindex");
  const hadLabel = parent.getAttribute("aria-label");
  if (!hadTabIndex) parent.tabIndex = 0;
  parent.setAttribute(
    "aria-label",
    `${activity.title}. A hide-and-seek game for two players on one device.`,
  );

  const ready = (async () => {
    const [{ default: Phaser }, { GameScene }, { SelectScene }] =
      await Promise.all([
        import("phaser"),
        import("./scenes/GameScene"),
        import("./scenes/SelectScene"),
      ]);
    if (destroyed) return;
    setRes(
      pickRes(
        parent.clientWidth || GAME_WIDTH,
        globalThis.devicePixelRatio || 1,
      ),
    );
    game = new Phaser.Game({
      type: props.prefs.webgl ? Phaser.AUTO : Phaser.CANVAS,
      parent,
      backgroundColor: css("backdrop"),
      banner: false,
      audio: { noAudio: true },
      disableContextMenu: true,
      input: { keyboard: { target: parent } },
      // preserveDrawingBuffer: the clip recorder copies frames from the game canvas.
      render: { roundPixels: true, preserveDrawingBuffer: true },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // Sharp text: a bigger canvas, the cameras zoom by RES (style/res.ts).
        width: GAME_WIDTH * RES,
        height: GAME_HEIGHT * RES,
      },
    });
    const data = {
      ...props,
      activity,
      activities,
      announce: (text: string) => {
        live.textContent = text;
      },
    };
    // Dev only (stripped from builds): lets tests step the game clock by hand.
    if (import.meta.env?.DEV)
      (parent as HTMLElement & { __phaserGame?: unknown }).__phaserGame = game;
    turnable(game, parent as HTMLElement);
    game.scene.add("Game", GameScene, false);
    game.scene.add("Select", SelectScene, false);
    // Two or more scenes: open on the scene select. One scene: straight in.
    game.scene.start(activities.length > 1 ? "Select" : "Game", data);
    parent.focus({ preventScroll: true });
  })();

  return {
    ready,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      game?.destroy(true);
      game = null;
      live.remove();
      if (!hadTabIndex) parent.removeAttribute("tabindex");
      if (hadLabel === null) parent.removeAttribute("aria-label");
      else parent.setAttribute("aria-label", hadLabel);
    },
  };
}

/**
 * A host may turn the stage a quarter turn clockwise (an ancestor with
 * data-rotate="90", e.g. a phone held upright). Phaser measures the screen
 * box, so size the game from the element's own layout size and map pointer
 * positions back into the turned canvas.
 */
function turnable(game: Phaser.Game, parent: HTMLElement) {
  const turned = () => !!parent.closest('[data-rotate="90"]');
  const scale = game.scale as unknown as {
    getParentBounds(): boolean;
    updateCenter(): void;
    parentSize: Phaser.Structs.Size;
  };
  const center = scale.updateCenter.bind(scale);
  scale.updateCenter = () => {
    center();
    if (!turned()) return;
    // Phaser centres with the screen box (turned); use the layout box.
    const c = game.canvas;
    c.style.marginLeft = `${Math.floor((parent.clientWidth - c.offsetWidth) / 2)}px`;
    c.style.marginTop = `${Math.floor((parent.clientHeight - c.offsetHeight) / 2)}px`;
  };
  const bounds = scale.getParentBounds.bind(scale);
  scale.getParentBounds = () => {
    if (!turned()) return bounds();
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (scale.parentSize.width === w && scale.parentSize.height === h)
      return false;
    scale.parentSize.setSize(w, h);
    return true;
  };
  const input = game.input as unknown as {
    transformPointer(
      p: Phaser.Input.Pointer,
      x: number,
      y: number,
      move: boolean,
    ): void;
  };
  const plain = input.transformPointer.bind(input);
  input.transformPointer = (pointer, pageX, pageY, wasMove) => {
    if (!turned()) return plain(pointer, pageX, pageY, wasMove);
    const r = game.canvas.getBoundingClientRect();
    const cx = pageX - window.scrollX;
    const cy = pageY - window.scrollY;
    pointer.prevPosition.x = pointer.position.x;
    pointer.prevPosition.y = pointer.position.y;
    // Clockwise turn: screen down is the canvas's x, screen left its y.
    pointer.position.x = ((cy - r.top) / r.height) * game.scale.width;
    pointer.position.y = ((r.right - cx) / r.width) * game.scale.height;
  };
  game.scale.refresh();
  // Layout size changes (turning, the browser bars) do not always reach
  // Phaser's own checks inside a turned box: refresh on every change.
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => {
      if (scale.getParentBounds()) game.scale.refresh();
    });
    ro.observe(parent);
    game.events.once("destroy", () => ro.disconnect());
  }
}
