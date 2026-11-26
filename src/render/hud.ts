// HTML overlay inside the host element: distance, the guide's card, touch
// controls and an aria-live region. Plain DOM, so it reads without WebGL.
import { CAPTION_SECONDS } from "../core/captions";
import { type Strings, strings } from "../i18n";
import { css } from "../style/palette";

const CAPTION_MS = CAPTION_SECONDS * 1000;

export type Hud = ReturnType<typeof createHud>;

/** One exhibit on the end card. */
export type FindCard = {
  label: string;
  text: string;
  source?: string;
  /** A real photo (host-supplied, rights cleared), always with its credit. */
  image?: { src: string; alt: string; credit: string };
};

export type CardContent = {
  heading: string;
  body: string;
  stats?: string;
  action: string;
  /** Exhibits noticed this run, each explained by its claim. */
  noticed?: (FindCard & { fresh: boolean })[];
  /** One passed but missed exhibit, explained too. */
  past?: FindCard;
  /** Street notebook: exhibits seen in all runs, of the pool. */
  notebook?: [number, number];
  /** A second button, e.g. "Share" / "Download image" (step 8). */
  share?: { label: string; onClick: () => void };
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

/** One gallery wall label (step 5). */
export type WallLabel = {
  title: string;
  /** The wall-label line (from the research). */
  label: string;
  quip: string;
  /** e.g. "3 of 12". */
  count: string;
  /** Optional footer text (e.g. "Style points"); none by default. */
  footer?: string;
};

const serif = "Georgia, 'Hiragino Mincho ProN', 'Times New Roman', serif";

export function createHud(
  host: HTMLElement,
  touch: boolean,
  reducedMotion = false,
  t: Strings = strings("en"),
  onLang?: () => void,
) {
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
    // Clear of a phone's notch / rounded corners.
    top: "max(12px, env(safe-area-inset-top))",
    left: "max(16px, env(safe-area-inset-left))",
    padding: "6px 12px",
    borderRadius: "10px",
    background: css("ink", 0.55),
    fontSize: "18px",
    fontWeight: "700",
    fontVariantNumeric: "tabular-nums",
    // Leave room for the mute button at the top right; wrap on phones.
    maxWidth: "calc(100% - 150px)",
    boxSizing: "border-box",
    lineHeight: "1.3",
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
    margin: "6px 5px 0",
    padding: "10px 20px",
    borderRadius: "12px",
    border: `2px solid ${css("ink")}`,
    background: css("accent"),
    color: css("ink"),
    cursor: "pointer",
  });
  button.type = "button";
  const shareButton = el("button", {
    font: `700 16px ${font}`,
    minHeight: "44px",
    padding: "10px 20px",
    margin: "6px 5px 0",
    borderRadius: "12px",
    border: `2px solid ${css("ink")}`,
    background: css("paper"),
    color: css("ink"),
    cursor: "pointer",
    display: "none",
  });
  shareButton.type = "button";
  const hint = el("p", {
    margin: "10px 0 0",
    fontSize: "12px",
    opacity: "0.7",
  });
  if (touch) hint.textContent = t.hintTouch;
  else {
    // Keyboard: big keycaps, so nobody has to guess (playtest: players tried
    // the trackpad and arrows first and missed the small hint line).
    Object.assign(hint.style, { opacity: "1", fontSize: "13px" });
    const kbd = (k: string) =>
      el(
        "kbd",
        {
          display: "inline-block",
          minWidth: "28px",
          padding: "2px 7px",
          margin: "0 2px",
          border: `1.5px solid ${css("ink", 0.55)}`,
          borderBottomWidth: "3px",
          borderRadius: "6px",
          background: css("paper"),
          color: css("ink"),
          font: `700 14px ${font}`,
          textAlign: "center",
        },
        k,
      );
    // A familiar 2-row key block: the top key (W / ↑) is greyed out,
    // the bottom row is labelled left / brace / right.
    const cluster = (top: string, row3: [string, string, string]) => {
      const g = el("div", {
        display: "grid",
        gridTemplateColumns: "repeat(3, auto)",
        gap: "4px",
        justifyItems: "center",
        alignItems: "start",
      });
      const dim = kbd(top);
      Object.assign(dim.style, { opacity: "0.3", gridColumn: "2" });
      dim.setAttribute("aria-hidden", "true");
      g.append(dim);
      const names = [t.keysLeft, t.keysBrace, t.keysRight];
      row3.forEach((k, i) => {
        const cell = el("div", {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gridRow: "2",
        });
        cell.append(
          kbd(k),
          el(
            "span",
            { fontSize: "11px", marginTop: "2px", opacity: "0.75" },
            names[i] ?? "",
          ),
        );
        g.append(cell);
      });
      return g;
    };
    const blocks = el("div", {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "14px",
      margin: "6px 0 4px",
    });
    blocks.append(
      cluster("W", ["A", "S", "D"]),
      el("span", { opacity: "0.6" }, t.keysOr),
      cluster("↑", ["←", "↓", "→"]),
    );
    const small = (text: string) =>
      el("div", { marginTop: "4px", opacity: "0.7", fontSize: "12px" }, text);
    hint.append(blocks, small(t.keysNoW), small(t.keysTrackpad));
  }
  // Language button in the card's top corner (start and end cards only, so
  // it never covers the street during a run).
  const langButton = el("button", {
    position: "absolute",
    top: "10px",
    right: "12px",
    zIndex: "1", // above the card's kind label, which spans the width
    minHeight: "32px",
    padding: "4px 10px",
    borderRadius: "999px",
    border: `1.5px solid ${css("ink", 0.5)}`,
    background: "transparent",
    color: css("ink"),
    font: `600 13px ${font}`,
    cursor: "pointer",
    display: onLang ? "block" : "none",
  });
  langButton.type = "button";
  langButton.textContent = t.switchLang;
  langButton.setAttribute("aria-label", t.switchLangAria);
  langButton.lang = t.lang === "ja" ? "en" : "ja";
  if (onLang) langButton.addEventListener("click", () => onLang());
  card.append(
    langButton,
    label,
    heading,
    body,
    stats,
    finds,
    button,
    shareButton,
    hint,
  );

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

  // Gallery wall label: a small white card that slides in at the right edge
  // for CAPTION_SECONDS, below the mute button, clear of the player.
  const wall = el("div", {
    position: "absolute",
    top: "64px",
    right: "12px",
    width: "min(250px, 44%)",
    boxSizing: "border-box",
    padding: "10px 12px 9px",
    background: css("paper"),
    color: css("ink"),
    borderRadius: "3px",
    boxShadow: `0 4px 14px ${css("ink", 0.3)}`,
    fontFamily: serif,
    transform: "translateX(calc(100% + 24px))",
    opacity: "0",
    transition: reducedMotion
      ? "opacity 200ms ease"
      : "transform 320ms cubic-bezier(.2,.8,.2,1), opacity 200ms ease",
  });
  const wallTitle = el("div", {
    fontSize: "17px",
    fontWeight: "700",
    lineHeight: "1.25",
    marginBottom: "3px",
  });
  const wallMedium = el("div", {
    fontSize: "14px",
    // Japanese has no italics; a fake slant looks wrong.
    fontStyle: t.lang === "ja" ? "normal" : "italic",
    lineHeight: "1.35",
    marginBottom: "6px",
  });
  const wallQuip = el("div", { fontSize: "12.5px", lineHeight: "1.35" });
  const wallFoot = el("div", {
    marginTop: "7px",
    paddingTop: "5px",
    borderTop: `1px solid ${css("ink", 0.2)}`,
    fontFamily: font,
    fontSize: "10px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: "0.6",
    display: "flex",
    flexWrap: "wrap",
    gap: "2px 8px",
    justifyContent: "space-between",
  });
  const wallLabel = el("span", {});
  const wallCount = el("span", {});
  wallFoot.append(wallLabel, wallCount);
  wall.append(wallTitle, wallMedium, wallQuip, wallFoot);
  const wallQueue: WallLabel[] = [];
  let wallTimer = 0;
  let wallBusy = false;
  const nextWall = () => {
    const w = wallQueue.shift();
    if (!w) {
      wallBusy = false;
      return;
    }
    wallBusy = true;
    wallTitle.textContent = w.title;
    wallMedium.textContent = w.label;
    wallQuip.textContent = w.quip;
    wallQuip.style.display = w.quip ? "block" : "none";
    wallMedium.style.marginBottom = w.quip ? "6px" : "0";
    // No footer by default (Erina, playtest); close calls pass "Style points".
    wallLabel.textContent = w.footer ?? "";
    wallLabel.style.display = w.footer ? "inline" : "none";
    wallCount.textContent = w.count;
    wall.style.transform = "translateX(0)";
    wall.style.opacity = "1";
    wallTimer = window.setTimeout(() => {
      wall.style.transform = "translateX(calc(100% + 24px))";
      wall.style.opacity = "0";
      wallTimer = window.setTimeout(nextWall, 360);
    }, CAPTION_MS);
  };

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
  const left = padButton("◀", t.padLeft);
  const brace = padButton(t.padBrace, t.padBrace);
  const right = padButton("▶", t.padRight);
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

  // Sound on/off (M), top right.
  const mute = el("button", {
    position: "absolute",
    top: "max(12px, env(safe-area-inset-top))",
    right: "max(16px, env(safe-area-inset-right))",
    touchAction: "manipulation",
    minWidth: "44px",
    minHeight: "44px",
    padding: "6px 12px",
    borderRadius: "10px",
    border: `2px solid ${css("cream", 0.5)}`,
    background: css("ink", 0.55),
    color: css("cream"),
    font: `700 14px ${font}`,
    pointerEvents: "auto",
    cursor: "pointer",
  });
  mute.type = "button";

  // Phone layout: smaller meter on narrow screens, a compact card on short
  // (landscape) screens. Inline styles hold the defaults; these override.
  meter.className = "dfs-meter";
  card.className = "dfs-card";
  hint.className = "dfs-hint";
  const sheet = document.createElement("style");
  sheet.textContent = `
    .dfs-card button { touch-action: manipulation; }
    @media (max-width: 520px) {
      .dfs-meter { font-size: 14px !important; padding: 5px 10px !important; }
    }
    @media (max-height: 500px) {
      .dfs-card { padding: 10px 16px !important; max-height: calc(100% - 16px) !important; }
      .dfs-card h2 { font-size: 18px !important; margin: 2px 0 4px !important; }
      .dfs-card p { margin: 2px 0 6px !important; font-size: 13px !important; }
      .dfs-card button { min-height: 38px !important; padding: 6px 14px !important; }
      .dfs-hint > div:not(:first-child) { display: none !important; }
      .dfs-hint { margin-top: 4px !important; }
    }
  `;
  root.append(sheet, meter, toast, wall, card, pad, mute);
  host.append(root, live);

  return {
    buttons: { left, brace, right, action: button, mute },
    setMuted(m: boolean) {
      mute.textContent = m ? t.soundOff : t.soundOn;
      mute.setAttribute("aria-pressed", String(!m));
      mute.setAttribute("aria-label", m ? t.soundOffAria : t.soundOnAria);
    },
    setMeter(
      metres: number,
      best: number,
      found?: [number, number],
      labels?: [number, number],
    ) {
      const parts = [t.metres(metres)];
      if (best > 0) parts.push(t.best(best));
      if (labels && labels[1] > 0)
        parts.push(t.meterCaptions(labels[0], labels[1]));
      if (found && found[1] > 0) parts.push(t.meterNoticed(found[0], found[1]));
      meter.textContent = parts.join(" · ");
    },
    /** Queue a wall label; each shows for CAPTION_SECONDS. */
    caption(w: WallLabel) {
      wallQueue.splice(1); // never fall more than one label behind
      wallQueue.push(w);
      if (!wallBusy) nextWall();
    },
    /** True when no wall label is showing or queued. */
    captionIdle() {
      return !wallBusy && wallQueue.length === 0;
    },
    clearCaptions() {
      wallQueue.length = 0;
      window.clearTimeout(wallTimer);
      wallBusy = false;
      wall.style.transform = "translateX(calc(100% + 24px))";
      wall.style.opacity = "0";
    },
    toast(text: string, ms = 1800) {
      toast.textContent = text;
      toast.style.display = "block";
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.style.display = "none";
      }, ms);
    },
    /** `bottom`: the card rises from the bottom edge so the scene above it
     *  (the canal ending) stays visible. */
    showCard(
      kind: string,
      c: CardContent,
      place: "center" | "bottom" = "center",
    ) {
      Object.assign(
        card.style,
        place === "bottom"
          ? {
              inset: "auto 0 max(12px, env(safe-area-inset-bottom)) 0",
              margin: "0 auto",
              maxHeight: "56%",
            }
          : { inset: "0", margin: "auto", maxHeight: "calc(100% - 32px)" },
      );
      // The key diagram is not needed on the canal's end card; it would
      // push the card up over the figure in the water.
      hint.style.display = place === "bottom" ? "none" : "";
      // The touch buttons would cover the card's buttons on short screens.
      pad.style.visibility = "hidden";
      label.textContent = kind;
      heading.textContent = c.heading;
      body.textContent = c.body;
      stats.textContent = c.stats ?? "";
      stats.style.display = c.stats ? "block" : "none";
      button.textContent = c.action;
      shareButton.style.display = c.share ? "inline-block" : "none";
      shareButton.textContent = c.share?.label ?? "";
      shareButton.onclick = c.share ? () => c.share?.onClick() : null;
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
      const item = (f: FindCard, tag?: string) => {
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
        box.append(head);
        if (f.image) {
          const img = el("img", {
            display: "block",
            width: "100%",
            maxHeight: "140px",
            objectFit: "cover",
            borderRadius: "8px",
            margin: "6px 0 2px",
          });
          img.src = f.image.src;
          img.alt = f.image.alt;
          img.loading = "lazy";
          box.append(
            img,
            el("small", { opacity: "0.6", fontSize: "11px" }, f.image.credit),
          );
        }
        // No claim text, no placeholder: just the name.
        if (f.text)
          box.append(
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
        finds.append(small(t.whatYouNoticed));
        for (const f of list)
          finds.append(item(f, f.fresh ? t.newTag : undefined));
      }
      if (c.past) {
        finds.append(small(t.youSlidPast));
        finds.append(item(c.past));
      }
      if (c.notebook && c.notebook[1] > 0) {
        const [n, total] = c.notebook;
        finds.append(
          el(
            "p",
            { margin: "6px 0 0", fontSize: "13px", fontWeight: "700" },
            n >= total ? t.notebookDone(total) : t.notebook(n, total),
          ),
        );
      }
      card.style.display = "block";
    },
    hideCard() {
      card.style.display = "none";
      pad.style.visibility = "visible";
    },
    announce(text: string) {
      live.textContent = text;
    },
    destroy() {
      window.clearTimeout(toastTimer);
      window.clearTimeout(wallTimer);
      root.remove();
      live.remove();
    },
  };
}
