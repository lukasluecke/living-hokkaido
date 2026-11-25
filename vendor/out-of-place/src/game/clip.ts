// Vertical 9:16 clips (720×1280) for TikTok / Reels / Shorts.
// Each frame: a title band, a square crop of the game around the hider, and the
// history card underneath. Recorded with MediaRecorder from a canvas stream,
// plus the synthesised sting if a sound stream is given.
import { css } from "../style/palette";

export const CLIP_W = 720;
export const CLIP_H = 1280;
const TOP = 210;
const CROP = 720;

export type ClipLayout = {
  title: string;
  subtitle: string;
  lines: { label?: string; text: string }[];
  footer: string;
};

const CANDIDATES: [string, string][] = [
  ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "mp4"],
  ["video/mp4;codecs=avc1", "mp4"],
  ["video/mp4", "mp4"],
  ["video/webm;codecs=vp9,opus", "webm"],
  ["video/webm;codecs=vp8,opus", "webm"],
  ["video/webm", "webm"],
];

/** The best recording format this browser supports (MP4 first), or null. */
export function clipSupport(): { mime: string; ext: string } | null {
  if (
    typeof MediaRecorder === "undefined" ||
    typeof HTMLCanvasElement.prototype.captureStream !== "function"
  ) {
    return null;
  }
  for (const [mime, ext] of CANDIDATES)
    if (MediaRecorder.isTypeSupported(mime)) return { mime, ext };
  return null;
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

export type ClipRecording = {
  stop(): Promise<Blob>;
  mime: string;
  ext: string;
};

/**
 * Start recording. `source` is the game canvas; `crop()` says which square of it
 * to show (in canvas pixels). Text fades in after `textAfterMs`.
 */
export function startVerticalClip(opts: {
  source: HTMLCanvasElement;
  crop: () => { x: number; y: number; size: number };
  layout: ClipLayout;
  textAfterMs: number;
  audio: MediaStream | null;
  format: { mime: string; ext: string };
}): ClipRecording {
  const canvas = document.createElement("canvas");
  canvas.width = CLIP_W;
  canvas.height = CLIP_H;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const t0 = performance.now();
  let raf = 0;

  const draw = () => {
    const t = performance.now() - t0;
    const textAlpha = Math.min(1, Math.max(0, (t - opts.textAfterMs) / 400));
    ctx.fillStyle = css("backdropDeep");
    ctx.fillRect(0, 0, CLIP_W, CLIP_H);

    // Game crop
    const c = opts.crop();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(opts.source, c.x, c.y, c.size, c.size, 0, TOP, CROP, CROP);
    ctx.strokeStyle = css("outline");
    ctx.lineWidth = 8;
    ctx.strokeRect(4, TOP, CLIP_W - 8, CROP);

    // Title band
    ctx.textAlign = "center";
    ctx.fillStyle = css("creamSoft");
    ctx.font = "28px Georgia, serif";
    ctx.fillText(opts.layout.subtitle, CLIP_W / 2, 64);
    ctx.globalAlpha = textAlpha;
    ctx.font = "bold 64px Georgia, serif";
    ctx.lineWidth = 10;
    ctx.strokeStyle = css("outline");
    ctx.strokeText(opts.layout.title, CLIP_W / 2, 160);
    ctx.fillStyle = css("sunGlow");
    ctx.fillText(opts.layout.title, CLIP_W / 2, 160);

    // History card
    ctx.textAlign = "left";
    let y = TOP + CROP + 60;
    for (const l of opts.layout.lines) {
      if (l.label) {
        ctx.font = "bold 26px Georgia, serif";
        ctx.fillStyle = css("sunGlow");
        ctx.fillText(l.label, 40, y);
        y += 36;
      }
      ctx.font = "28px Georgia, serif";
      ctx.fillStyle = css("cream");
      for (const row of wrap(ctx, l.text, CLIP_W - 80)) {
        ctx.fillText(row, 40, y);
        y += 38;
      }
      y += 18;
    }
    ctx.globalAlpha = 1;
    ctx.font = "20px Georgia, serif";
    ctx.fillStyle = css("creamSoft");
    ctx.textAlign = "center";
    ctx.fillText(opts.layout.footer, CLIP_W / 2, CLIP_H - 28);

    raf = requestAnimationFrame(draw);
  };
  draw();

  const stream = canvas.captureStream(30);
  for (const track of opts.audio?.getAudioTracks() ?? [])
    stream.addTrack(track);
  const recorder = new MediaRecorder(stream, {
    mimeType: opts.format.mime,
    videoBitsPerSecond: 4_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  recorder.start(250);

  return {
    mime: opts.format.mime,
    ext: opts.format.ext,
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          cancelAnimationFrame(raf);
          for (const track of stream.getVideoTracks()) track.stop();
          resolve(new Blob(chunks, { type: opts.format.mime.split(";")[0] }));
        };
        recorder.stop();
      }),
  };
}

/** Hand the clip to the share sheet on phones, or download it elsewhere. */
export async function deliverClip(
  blob: Blob,
  ext: string,
): Promise<"shared" | "downloaded"> {
  const name = `out-of-place-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${ext}`;
  const file = new File([blob], name, { type: blob.type });
  const touch =
    typeof matchMedia !== "undefined" &&
    matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Out of Place" });
      return "shared";
    } catch {
      // Share cancelled or refused: fall back to a download.
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
