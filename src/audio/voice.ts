// Pre-generated AI voice lines (scripts/audio/voices.ts): the owl guide's
// lines, read by an ElevenLabs voice. The owl is a fictional guide; the UI
// labels these "AI voice". English only. Missing files fail quietly.
import { type VoiceIndex, voiceIndexSchema } from "@/contracts";

const indexes = new Map<string, Promise<VoiceIndex | null>>();
let current: HTMLAudioElement | null = null;

function loadIndex(group: string) {
  let p = indexes.get(group);
  if (!p) {
    p = fetch(`/audio/voice/${group}/index.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => voiceIndexSchema.safeParse(j).data ?? null)
      .catch(() => null);
    indexes.set(group, p);
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
  if (document.documentElement.lang === "ja") return false;
  const index = await loadIndex(group);
  if (!index?.lines[lineId]) return false;
  stopVoiceLine();
  const audio = new Audio(`/audio/voice/${group}/${lineId}.mp3`);
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
