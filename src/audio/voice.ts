// Pre-generated AI voice lines (scripts/audio/voices.ts): the owl guide's
// lines, read by an ElevenLabs voice. The owl is a fictional guide; the UI
// labels these "AI voice". English, plus Japanese drafts in /audio/voice/ja.
// Missing files fail quietly.
import { type VoiceIndex, voiceDir, voiceIndexSchema } from "@/contracts";

const indexes = new Map<string, Promise<VoiceIndex | null>>();
let current: HTMLAudioElement | null = null;

const pageLang = () => document.documentElement.lang;

function loadIndex(group: string) {
  const dir = voiceDir(group, pageLang());
  let p = indexes.get(dir);
  if (!p) {
    p = fetch(`${dir}/index.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => voiceIndexSchema.safeParse(j).data ?? null)
      .catch(() => null);
    indexes.set(dir, p);
  }
  return p;
}

// Each call gets a ticket; only the newest call may start. A stop or a
// newer call makes older waiting calls give up.
let ticket = 0;

/** Stop the line that is playing, if any, and drop any line that waits. */
export function stopVoiceLine() {
  ticket++;
  current?.pause();
  current = null;
}

/** Waits until the line now playing has ended (at most `maxMs`). */
function untilQuiet(maxMs: number): Promise<void> {
  const a = current;
  if (!a || a.paused || a.ended) return Promise.resolve();
  return new Promise((done) => {
    const t = setTimeout(finish, maxMs);
    function finish() {
      clearTimeout(t);
      a?.removeEventListener("ended", finish);
      a?.removeEventListener("pause", finish);
      done();
    }
    a.addEventListener("ended", finish);
    a.addEventListener("pause", finish);
  });
}

// Browsers block sound until the first tap or key. A line blocked on page
// load plays on that first gesture, if it is still the newest line.
let unlockArmed = false;
function retryOnGesture(retry: () => void, mine: number) {
  if (unlockArmed) return;
  unlockArmed = true;
  const go = () => {
    window.removeEventListener("pointerdown", go, true);
    window.removeEventListener("keydown", go, true);
    unlockArmed = false;
    // Let the gesture change the line first (a click on a place).
    setTimeout(() => {
      if (mine === ticket) retry();
    }, 250);
  };
  window.addEventListener("pointerdown", go, true);
  window.addEventListener("keydown", go, true);
}

/**
 * Play one line. A line that is still playing finishes first (lines queue,
 * they do not cut each other off); only the newest waiting line plays.
 * Resolves true when it started, false when it has no file, a newer line or a stop came first, or the browser
 * blocked playback (then it plays on the first tap or key).
 */
export async function playVoiceLine(
  group: string,
  lineId: string,
  volume = 0.9,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const mine = ++ticket;
  const index = await loadIndex(group);
  if (!index?.lines[lineId] || mine !== ticket) return false;
  await untilQuiet(12_000);
  if (mine !== ticket) return false;
  current?.pause();
  const audio = new Audio(`${voiceDir(group, pageLang())}/${lineId}.mp3`);
  audio.volume = volume;
  current = audio;
  try {
    await audio.play();
    return true;
  } catch (e) {
    if (current === audio) current = null;
    if ((e as DOMException)?.name === "NotAllowedError")
      retryOnGesture(() => {
        void playVoiceLine(group, lineId, volume);
      }, mine);
    return false;
  }
}
