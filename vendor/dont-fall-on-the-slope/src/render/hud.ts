// HTML overlay inside the host element: distance, the guide's card, touch
// controls and an aria-live region. Plain DOM, so it reads without WebGL.
import { css } from "../style/palette";

export type Hud = ReturnType<typeof createHud>;

export type CardContent = {
  heading: string;
  body: string;
  stats?: string;
  action: string;
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

  const card = el("div", {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(420px, calc(100% - 32px))",
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
  card.append(label, heading, body, stats, button, hint);

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

  root.append(meter, card, pad);
  host.append(root, live);

  return {
    buttons: { left, brace, right, action: button },
    setMeter(metres: number, best: number) {
      meter.textContent =
        best > 0 ? `${metres} m · best ${best} m` : `${metres} m`;
    },
    showCard(kind: string, c: CardContent) {
      label.textContent = kind;
      heading.textContent = c.heading;
      body.textContent = c.body;
      stats.textContent = c.stats ?? "";
      stats.style.display = c.stats ? "block" : "none";
      button.textContent = c.action;
      card.style.display = "block";
    },
    hideCard() {
      card.style.display = "none";
    },
    announce(text: string) {
      live.textContent = text;
    },
    destroy() {
      root.remove();
      live.remove();
    },
  };
}
