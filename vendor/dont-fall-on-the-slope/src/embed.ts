// Mount the game into any element. The integration surface for a host app
// (living-hokkaido's activities part, or the standalone page in main.ts).
//
// - Safe to import on a server (Next.js): three, Rapier and the game load
//   lazily inside mountSlope, never at import time.
// - Scoped to the host element: canvas, keyboard input and the aria-live
//   region live inside it; destroy() removes them again.
// - Without WebGL it shows an HTML card instead of a blank canvas.
import type { SlopeProps } from "./integration/contracts";
import { type Strings, strings } from "./i18n";
import { css } from "./style/palette";

export type SlopeHandle = {
  /** Resolves once the game is running (or right away if destroyed first). */
  ready: Promise<void>;
  /** Stop the game and remove everything it added to the host element. */
  destroy(): void;
};

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

function fallback(parent: HTMLElement, t: Strings): HTMLElement {
  const box = document.createElement("div");
  Object.assign(box.style, {
    position: "absolute",
    inset: "0",
    display: "grid",
    placeItems: "center",
    padding: "16px",
    background: css("dusk"),
    color: css("cream"),
    font: "16px/1.5 system-ui, sans-serif",
    textAlign: "center",
  });
  const p = document.createElement("p");
  p.style.maxWidth = "28em";
  p.textContent = t.noWebgl;
  box.append(p);
  parent.append(box);
  return box;
}

export function mountSlope(
  parent: HTMLElement,
  props: SlopeProps,
): SlopeHandle {
  let destroyed = false;
  let game: { destroy(): void } | null = null;
  let fb: HTMLElement | null = null;

  const hadTabIndex = parent.hasAttribute("tabindex");
  const hadLabel = parent.getAttribute("aria-label");
  const hadLang = parent.getAttribute("lang");
  const t = strings(props.lang);
  // Screen readers pronounce the game's text in its language, and browser
  // auto-translate stays out: the game has its own EN / 日本語 button (a
  // machine-translated Japanese page looked like a broken English one).
  parent.setAttribute("lang", t.lang);
  const hadTranslate = parent.getAttribute("translate");
  parent.setAttribute("translate", "no");
  parent.classList.add("notranslate");
  const hadPosition = parent.style.position;
  if (getComputedStyle(parent).position === "static")
    parent.style.position = "relative";
  if (!hadTabIndex) parent.tabIndex = 0;
  parent.setAttribute("aria-label", t.hostLabel);

  const ready = (async () => {
    if (!props.prefs.webgl || !webglAvailable()) {
      fb = fallback(parent, t);
      return;
    }
    const [{ default: R }, { startGame }] = await Promise.all([
      import("@dimforge/rapier3d-compat"),
      import("./game"),
    ]);
    await R.init();
    if (destroyed) return;
    game = startGame(R, parent, props);
    parent.focus({ preventScroll: true });
  })();

  return {
    ready,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      game?.destroy();
      game = null;
      fb?.remove();
      if (!hadTabIndex) parent.removeAttribute("tabindex");
      if (hadTranslate === null) parent.removeAttribute("translate");
      else parent.setAttribute("translate", hadTranslate);
      parent.classList.remove("notranslate");
      if (hadLang === null) parent.removeAttribute("lang");
      else parent.setAttribute("lang", hadLang);
      if (hadLabel === null) parent.removeAttribute("aria-label");
      else parent.setAttribute("aria-label", hadLabel);
      parent.style.position = hadPosition;
    },
  };
}
