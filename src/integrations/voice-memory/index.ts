// Picks the voice-memory provider from server env. No key = offline mock.
//   VOICE_MEMORY_PROVIDER=elevenlabs (default when a key is set) | mock
//   ELEVENLABS_API_KEY=...          (server only; never NEXT_PUBLIC_)
import type { VoiceMemoryProvider } from "@/domain/voice-memory";
import { createElevenLabsVoiceMemory } from "./elevenlabs";
import { mockVoiceMemory } from "./mock";

export function voiceMemoryProvider(
  env: Record<string, string | undefined> = process.env,
): VoiceMemoryProvider {
  const key = env.ELEVENLABS_API_KEY?.trim();
  if (env.VOICE_MEMORY_PROVIDER === "mock" || !key) return mockVoiceMemory;
  return createElevenLabsVoiceMemory(key);
}

export { mockVoiceMemory } from "./mock";
