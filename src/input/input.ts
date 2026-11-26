// Keyboard, touch buttons and drag → Held + drag, scoped to the host
// element. Keys only reach the game while the host has focus; Esc is left
// to the host app.
import {
  type Controls,
  controlsFrom,
  DRAG_FULL,
  type Held,
  swipeDecay,
  swipeLean,
} from "./controls";

export type InputButtons = {
  left: HTMLElement;
  brace: HTMLElement;
  right: HTMLElement;
};

export function attachInput(
  host: HTMLElement,
  surface: HTMLElement,
  buttons: InputButtons,
  onAction: () => void,
) {
  const held: Held = { left: false, right: false, brace: false };
  const keys: Held = { left: false, right: false, brace: false };
  const pads: Held = { left: false, right: false, brace: false };
  let drag: { id: number; x: number; moved: boolean } | null = null;
  let dragPx: number | null = null;
  const off: (() => void)[] = [];
  const on = <E extends Event>(
    t: EventTarget,
    type: string,
    f: (e: E) => void,
  ) => {
    t.addEventListener(type, f as EventListener);
    off.push(() => t.removeEventListener(type, f as EventListener));
  };
  const sync = () => {
    held.left = keys.left || pads.left;
    held.right = keys.right || pads.right;
    held.brace = keys.brace || pads.brace;
  };

  const KEY: Record<string, keyof Held> = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ArrowDown: "brace",
    KeyS: "brace",
    Space: "brace",
  };
  on<KeyboardEvent>(host, "keydown", (e) => {
    if (e.code === "Enter" || e.code === "Space") {
      // Space braces while sliding and also starts/restarts from a card.
      if (!e.repeat) onAction();
    }
    const k = KEY[e.code];
    if (k) keys[k] = true;
    if (k || e.code === "Enter") {
      e.preventDefault();
      // Keep keys on the game even if a button had focus.
      if (document.activeElement !== host) host.focus({ preventScroll: true });
    }
    sync();
  });
  on<KeyboardEvent>(host, "keyup", (e) => {
    const k = KEY[e.code];
    if (k) keys[k] = false;
    // Space must only brace: never press a focused button (mute, share).
    if (e.code === "Space") e.preventDefault();
    sync();
  });
  on(host, "blur", () => {
    keys.left = keys.right = keys.brace = false;
    sync();
  });

  for (const name of ["left", "brace", "right"] as const) {
    const b = buttons[name];
    const set = (v: boolean) => (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      pads[name] = v;
      sync();
    };
    on(b, "pointerdown", set(true));
    on(b, "pointerup", set(false));
    on(b, "pointercancel", set(false));
    on(b, "pointerleave", set(false));
    on(b, "contextmenu", (e) => e.preventDefault());
  }

  // Drag anywhere on the game to lean, relative to where the finger went
  // down. A short tap starts or restarts a run.
  on<PointerEvent>(surface, "pointerdown", (e) => {
    drag = { id: e.pointerId, x: e.clientX, moved: false };
    surface.setPointerCapture?.(e.pointerId);
    host.focus({ preventScroll: true });
  });
  on<PointerEvent>(surface, "pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 8) drag.moved = true;
    dragPx = drag.moved ? dx : null;
  });
  const up = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && e.type === "pointerup") onAction();
    drag = null;
    dragPx = null;
  };
  on(surface, "pointerup", up);
  on(surface, "pointercancel", up);

  // Two-finger trackpad swipes steer too (most players try the trackpad
  // first). Sideways scrolling is captured so it never swipes the browser
  // back a page; vertical scrolling is left alone.
  let swipe = 0;
  let lastSwipe = 0;
  let lastPoll = performance.now();
  const onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    const px = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX;
    swipe = swipeLean(swipe, px);
    lastSwipe = performance.now();
  };
  host.addEventListener("wheel", onWheel, { passive: false });
  off.push(() => host.removeEventListener("wheel", onWheel));

  return {
    controls(): Controls {
      const now = performance.now();
      swipe = swipeDecay(
        swipe,
        (now - lastSwipe) / 1000,
        (now - lastPoll) / 1000,
      );
      lastPoll = now;
      const px = dragPx ?? (swipe !== 0 ? swipe * DRAG_FULL : null);
      return controlsFrom(held, px);
    },
    destroy() {
      for (const f of off) f();
    },
  };
}
