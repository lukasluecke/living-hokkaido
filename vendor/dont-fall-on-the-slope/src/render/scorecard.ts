// The shareable 1080×1920 score card (step 8), drawn on a canvas like a
// museum wall: a framed still of the run, a dry title, the numbers, and the
// link to the same slope. Plus share-or-download, after Out of Place's
// deliverClip (src/game/clip.ts there).
import { type Strings, strings } from "../i18n";
import { css } from "../style/palette";

export type ScoreCardData = {
  title: string;
  distance: number;
  best: number;
  captions: [number, number];
  closeCalls: number;
  streak: number;
  style: number;
  outcome: string;
  seed: number;
  link?: string;
};

const W = 1080;
const H = 1920;
const serif = "Georgia, 'Hiragino Mincho ProN', 'Times New Roman', serif";
const sans = "system-ui, 'Hiragino Sans', sans-serif";

/** Draw the card; resolves to a PNG blob. */
export function scoreCard(
  still: HTMLCanvasElement | null,
  d: ScoreCardData,
  t: Strings = strings("en"),
): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return Promise.reject(new Error("2D canvas unavailable"));
  g.fillStyle = css("dusk");
  g.fillRect(0, 0, W, H);

  // The still, cropped to a square, in a gallery frame.
  const fx = 90;
  const fy = 150;
  const fs = 900;
  g.fillStyle = css("woodDark");
  g.fillRect(fx - 28, fy - 28, fs + 56, fs + 56);
  g.fillStyle = css("paper");
  g.fillRect(fx - 10, fy - 10, fs + 20, fs + 20);
  if (still && still.width > 0) {
    const side = Math.min(still.width, still.height);
    g.drawImage(
      still,
      (still.width - side) / 2,
      (still.height - side) / 2,
      side,
      side,
      fx,
      fy,
      fs,
      fs,
    );
  } else {
    g.fillStyle = css("duskHigh");
    g.fillRect(fx, fy, fs, fs);
  }

  // The wall label.
  const lx = 90;
  const ly = 1150;
  g.fillStyle = css("paper");
  g.fillRect(lx, ly, W - 180, 600);
  g.fillStyle = css("ink");
  const it = t.lang === "ja" ? "" : "italic "; // no fake slant in Japanese
  g.font = `${it}700 58px ${serif}`;
  wrap(g, d.title, lx + 50, ly + 100, W - 280, 66);
  g.font = `${it}34px ${serif}`;
  g.fillText(t.card.medium(d.outcome), lx + 50, ly + 250);
  g.font = `600 40px ${sans}`;
  const rows: [string, string][] = [
    [t.card.distance, t.card.distanceValue(d.distance, d.best)],
    [t.card.captions, t.card.captionsValue(d.captions[0], d.captions[1])],
    [t.card.style, t.card.styleValue(d.style, d.closeCalls, d.streak)],
  ];
  rows.forEach(([k, v], i) => {
    const y = ly + 340 + i * 70;
    g.globalAlpha = 0.6;
    g.fillText(k, lx + 50, y);
    g.globalAlpha = 1;
    g.fillText(v, lx + 330, y);
  });
  g.font = `28px ${sans}`;
  g.globalAlpha = 0.6;
  g.fillText(t.card.honesty, lx + 50, ly + 560);
  g.globalAlpha = 1;

  // Footer: the game and the same-slope link.
  g.fillStyle = css("cream");
  g.font = `700 44px ${sans}`;
  g.fillText(t.title, 90, 1860 - 40);
  g.font = `30px ${sans}`;
  g.fillText(d.link ? t.card.link(d.link) : t.card.slope(d.seed), 90, 1868);

  return new Promise((ok, fail) =>
    c.toBlob(
      (b) => (b ? ok(b) : fail(new Error("toBlob failed"))),
      "image/png",
    ),
  );
}

function wrap(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  max: number,
  lh: number,
) {
  let line = "";
  const spaced = text.includes(" ");
  for (const word of spaced ? text.split(" ") : [...text]) {
    const next = line ? (spaced ? `${line} ${word}` : line + word) : word;
    if (g.measureText(next).width > max && line) {
      g.fillText(line, x, y);
      line = word;
      y += lh;
    } else line = next;
  }
  g.fillText(line, x, y);
}

/** Can this device share an image through its share sheet? */
export function canShareImage(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  const touch =
    typeof matchMedia !== "undefined" &&
    matchMedia("(pointer: coarse)").matches;
  try {
    const f = new File([new Uint8Array(1)], "x.png", { type: "image/png" });
    return touch && navigator.canShare({ files: [f] });
  } catch {
    return false;
  }
}

/** Share sheet on phones, download elsewhere (or if sharing is refused). */
export async function deliverCard(
  blob: Blob,
  text: string,
  title = "Don't Fall on the Slope",
): Promise<"shared" | "downloaded"> {
  const name = `dont-fall-on-the-slope-${new Date().toISOString().slice(0, 10)}.png`;
  const file = new File([blob], name, { type: "image/png" });
  if (canShareImage()) {
    try {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return "shared";
    } catch {
      // Cancelled or refused: fall back to a download.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "downloaded";
}
