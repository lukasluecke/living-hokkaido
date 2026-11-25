// DOM sound rules: hover and click sounds for any button, without imports in
// the parts. Parts can opt in or out with data attributes:
//   data-sound="stamp"        click plays the "stamp" cue
//   data-sound="off"          click is silent
//   data-sound-hover="off"    hover is silent
// A 3D part (no DOM element per object) can ask for a cue with:
//   window.dispatchEvent(new CustomEvent("lh:sound", { detail: "hover" }))
import type { ResolvedManifest } from "./types";

export const SOUND_DOM_EVENT = "lh:sound";

export function domCue(
  m: ResolvedManifest,
  kind: "hover" | "click",
  target: EventTarget | null,
): string | null {
  if (!(target instanceof Element)) return null;
  const attr = kind === "click" ? "data-sound" : "data-sound-hover";
  const own = target.closest(`[${attr}]`)?.getAttribute(attr);
  if (own) return own === "off" ? null : own;
  for (const rule of m.dom[kind]) {
    const hit = target.closest(rule.selector);
    if (hit) return rule.cue;
  }
  return null;
}

/** Element for hover tracking: so a hover plays once per element. */
export function hoverKey(
  m: ResolvedManifest,
  target: EventTarget | null,
): Element | null {
  if (!(target instanceof Element)) return null;
  for (const rule of m.dom.hover) {
    const hit = target.closest(rule.selector);
    if (hit) return hit;
  }
  return target.closest("[data-sound-hover]");
}
