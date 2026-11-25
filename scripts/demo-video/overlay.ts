// Page-side helpers, injected before any page script runs. Draws a visible
// cursor (headless video has none), a click ripple, an optional caption and a
// countdown. Also logs shell events if the shell exposes the test hook
// (see HANDBACK.md). Everything is pointer-events: none and sits on top.
//
// This function is serialised by Playwright, so it must not use imports or
// closures from this module.
export function installOverlay(opts: { cursor: boolean }) {
  type Win = Window & {
    __demoEvents?: { type: string; at: number }[];
    __demo?: {
      caption: (text: string | null) => void;
      countdown: (n: number) => Promise<void>;
    };
  };
  const w = window as Win;
  w.__demoEvents = [];
  window.addEventListener("lh:event", (ev) => {
    const detail = (ev as CustomEvent<{ type?: string }>).detail;
    if (detail?.type)
      w.__demoEvents?.push({ type: detail.type, at: performance.now() });
  });

  const mount = () => {
    if (document.getElementById("__demo-root")) return;
    const root = document.createElement("div");
    root.id = "__demo-root";
    root.setAttribute("aria-hidden", "true");
    root.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:2147483647;";
    const css = document.createElement("style");
    css.textContent = `
      #__demo-cursor{position:absolute;left:0;top:0;width:22px;height:22px;
        margin:-3px 0 0 -3px;transform:translate(-100px,-100px);
        transition:opacity .3s;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
      .__demo-ripple{position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;
        border-radius:50%;border:3px solid rgba(255,255,255,.9);
        animation:__demo-ripple .5s ease-out forwards}
      @keyframes __demo-ripple{from{transform:scale(.3);opacity:1}to{transform:scale(1.4);opacity:0}}
      #__demo-caption{position:absolute;left:50%;bottom:7%;transform:translateX(-50%);
        max-width:70%;padding:.55em 1.1em;border-radius:.6em;
        font:600 28px/1.3 system-ui,sans-serif;color:#fff;background:rgba(20,24,28,.72);
        opacity:0;transition:opacity .4s}
      #__demo-count{position:absolute;inset:0;display:grid;place-items:center;
        font:700 160px system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.35);
        opacity:0;transition:opacity .2s}`;
    root.appendChild(css);
    const cursor = document.createElement("div");
    cursor.id = "__demo-cursor";
    cursor.innerHTML =
      '<svg viewBox="0 0 22 22" width="22" height="22"><path d="M3 2l15 9-6.5 1.5L8.5 19z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    if (!opts.cursor) cursor.style.display = "none";
    const cap = document.createElement("div");
    cap.id = "__demo-caption";
    const count = document.createElement("div");
    count.id = "__demo-count";
    root.append(cursor, cap, count);
    document.documentElement.appendChild(root);

    window.addEventListener(
      "mousemove",
      (e) => {
        cursor.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      },
      { capture: true, passive: true },
    );
    window.addEventListener(
      "mousedown",
      (e) => {
        if (!opts.cursor) return;
        const r = document.createElement("div");
        r.className = "__demo-ripple";
        r.style.left = `${e.clientX}px`;
        r.style.top = `${e.clientY}px`;
        root.appendChild(r);
        setTimeout(() => r.remove(), 600);
      },
      { capture: true, passive: true },
    );
    w.__demo = {
      caption(text) {
        if (text) cap.textContent = text;
        cap.style.opacity = text ? "1" : "0";
      },
      async countdown(n) {
        count.style.opacity = "1";
        for (let i = n; i > 0; i--) {
          count.textContent = String(i);
          await new Promise((r) => setTimeout(r, 1000));
        }
        count.style.opacity = "0";
      },
    };
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", mount);
  else mount();
}
