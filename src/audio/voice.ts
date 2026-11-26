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

/** Stop the line that is playing, if any. */
export function stopVoiceLine() {
  current?.pause();
  current = null;
}

/**
 * Play one line. Resolves true when it started, false when it has no file,
 * the page is not in English, or the browser blocked playback.
 */
export async function playVoiceLine(
  group: string,
  lineId: string,
  volume = 0.9,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const index = await loadIndex(group);
  if (!index?.lines[lineId]) return false;
  stopVoiceLine();
  const audio = new Audio(`${voiceDir(group, pageLang())}/${lineId}.mp3`);
  audio.volume = volume;
  current = audio;
  try {
    await audio.play();
    return true;
  } catch {
    if (current === audio) current = null;
    return false;
  }
}
