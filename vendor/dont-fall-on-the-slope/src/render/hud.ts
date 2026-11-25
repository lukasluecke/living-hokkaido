// HTML overlay inside the host element: distance, the guide's card, touch
// controls and an aria-live region. Plain DOM, so it reads without WebGL.
import { css } from "../style/palette";

export type Hud = ReturnType<typeof createHud>;

export type CardContent = {
  heading: string;
  body: string;
  stats?: string;
  action: string;
  /** Exhibits noticed this run, each explained by its claim. */
  noticed?: { label: string; text: string; source?: string; fresh: boolean }[];
  /** One passed but missed exhibit, explained too. */
  past?: { label: string; text: string; source?: string };
  /** Street notebook: exhibits seen in all runs, of the pool. */
  notebook?: [number, number];
};

const font =
  "ui-rounded, 'Hiragino Maru Gothic ProN', 'Nunito', system-ui, sans-serif";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration>,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  Object.assign(e.style, style);
  if (text) e.textContent = text;
  return e;
}

export function createHud(host: HTMLElement, touch: boolean) {
  const root = el("div", {
    position: "absolute",
    inset: "0",
    pointerEvents: "none",
    fontFamily: font,
    color: css("cream"),
    userSelect: "none",
    webkitUserSelect: "none",
  });

  const meter = el("div", {
    position: "absolute",
    top: "12px",
    left: "16px",
    padding: "6px 12px",
    borderRadius: "10px",
    background: css("ink", 0.55),
    fontSize: "18px",
    fontWeight: "700",
    fontVariantNumeric: "tabular-nums",
  });

  // Centred with margin auto, not translate(-50%): a half-pixel translate
  // makes the browser draw the card's text blurry.
  const card = el("div", {
    position: "absolute",
    inset: "0",
    margin: "auto",
    height: "fit-content",
    maxHeight: "calc(100% - 32px)",
    overflowY: "auto",
    boxSizing: "border-box",
    width: "min(460px, calc(100% - 32px))",
    padding: "18px 20px",
    borderRadius: "16px",
    background: css("cream"),
    color: css("ink"),
    boxShadow: `0 10px 30px ${css("ink", 0.35)}`,
    pointerEvents: "auto",
    textAlign: "center",
  });
  const label = el("div", {
    fontSize: "11px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    opacity: "0.65",
    marginBottom: "6px",
  });
  const heading = el("h2", { margin: "0 0 8px", fontSize: "22px" });
  const body = el("p", {
    margin: "0 0 10px",
    lineHeight: "1.45",
    fontSize: "15px",
  });
  const stats = el("p", {
    margin: "0 0 12px",
    fontWeight: "700",
    fontVariantNumeric: "tabular-nums",
  });
  // What was noticed (and one missed exhibit), each with its cited claim.
  const finds = el("div", {
    textAlign: "left",
    margin: "0 0 12px",
    maxHeight: "40vh",
    overflowY: "auto",
  });
  const button = el("button", {
    font: `700 16px ${font}`,
    minHeight: "44px",
    padding: "10px 20px",
    borderRadius: "12px",
    border: `2px solid ${css("ink")}`,
    background: css("accent"),
    color: css("ink"),
    cursor: "pointer",
  });
  button.type = "button";
  const hint = el("p", {
    margin: "10px 0 0",
    fontSize: "12px",
    opacity: "0.7",
  });
  hint.textContent = touch
    ? "Drag sideways or use the buttons to lean. Hold Brace to slow down."
    : "← → or A D to lean · ↓ or Space to brace · Enter to start";
  card.append(label, heading, body, stats, finds, button, hint);

  // Short pop-up when something is collected or ploughed through.
  const toast = el("div", {
    position: "absolute",
    top: "56px",
    left: "0",
    right: "0",
    margin: "0 auto",
    width: "fit-content",
    padding: "8px 16px",
    borderRadius: "12px",
    background: css("cream"),
    color: css("ink"),
    border: `2px solid ${css("accent")}`,
    fontWeight: "700",
    fontSize: "16px",
    display: "none",
    whiteSpace: "nowrap",
  });
  let toastTimer = 0;

  // Touch controls: lean left, brace, lean right. 64px targets.
  const pad = el("div", {
    position: "absolute",
    left: "0",
    right: "0",
    bottom: "max(12px, env(safe-area-inset-bottom))",
    display: touch ? "flex" : "none",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: "0 16px",
    pointerEvents: "none",
  });
  const padButton = (text: string, aria: string) => {
    const b = el("button", {
      pointerEvents: "auto",
      minWidth: "64px",
      height: "64px",
      padding: "0 14px",
      borderRadius: "18px",
      border: `2px solid ${css("cream", 0.7)}`,
      background: css("ink", 0.45),
      color: css("cream"),
      font: `700 18px ${font}`,
      touchAction: "none",
    });
    b.type = "button";
    b.textContent = text;
    b.setAttribute("aria-label", aria);
    return b;
  };
  const left = padButton("◀", "Lean left");
  const brace = padButton("Brace", "Brace");
  const right = padButton("▶", "Lean right");
  pad.append(left, brace, right);

  const live = el("div", {
    position: "absolute",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  });
  live.setAttribute("aria-live", "polite");
  live.setAttribute("role", "status");

  root.append(meter, toast, card, pad);
  host.append(root, live);

  return {
    buttons: { left, brace, right, action: button },
    setMeter(metres: number, best: number, found?: [number, number]) {
      const parts = [`${metres} m`];
      if (best > 0) parts.push(`best ${best} m`);
      if (found && found[1] > 0) parts.push(`noticed ${found[0]}/${found[1]}`);
      meter.textContent = parts.join(" · ");
    },
    toast(text: string) {
      toast.textContent = text;
      toast.style.display = "block";
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.style.display = "none";
      }, 1800);
    },
    showCard(kind: string, c: CardContent) {
      label.textContent = kind;
      heading.textContent = c.heading;
      body.textContent = c.body;
      stats.textContent = c.stats ?? "";
      stats.style.display = c.stats ? "block" : "none";
      button.textContent = c.action;
      finds.replaceChildren();
      const small = (t: string) =>
        el(
          "div",
          {
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: "0.65",
            margin: "4px 0 6px",
          },
          t,
        );
      const item = (
        f: { label: string; text: string; source?: string },
        tag?: string,
      ) => {
        const box = el("div", {
          borderLeft: `4px solid ${css("accent")}`,
          padding: "4px 0 4px 10px",
          margin: "0 0 8px",
        });
        const head = el(
          "strong",
          { display: "block", fontSize: "15px" },
          f.label,
        );
        if (tag)
          head.append(
            el(
              "span",
              {
                marginLeft: "8px",
                padding: "1px 6px",
                borderRadius: "6px",
                background: css("accent"),
                fontSize: "11px",
              },
              tag,
            ),
          );
        box.append(
          head,
          el(
            "p",
            { margin: "2px 0", fontSize: "14px", lineHeight: "1.4" },
            f.text,
          ),
        );
        if (f.source)
          box.append(
            el("small", { opacity: "0.7", fontSize: "12px" }, f.source),
          );
        return box;
      };
      const list = c.noticed ?? [];
      if (list.length) {
        finds.append(small("What you noticed"));
        for (const f of list)
          finds.append(item(f, f.fresh ? "New" : undefined));
      }
      if (c.past) {
        finds.append(small("You slid past"));
        finds.append(item(c.past));
      }
      if (c.notebook && c.notebook[1] > 0) {
        const [n, total] = c.notebook;
        finds.append(
          el(
            "p",
            { margin: "6px 0 0", fontSize: "13px", fontWeight: "700" },
            n >= total
              ? `Street notebook complete: all ${total} seen.`
              : `Street notebook: ${n} of ${total} seen.`,
          ),
        );
      }
      card.style.display = "block";
    },
    hideCard() {
      card.style.display = "none";
    },
    announce(text: string) {
      live.textContent = text;
    },
    destroy() {
      window.clearTimeout(toastTimer);
      root.remove();
      live.remove();
    },
  };
}
