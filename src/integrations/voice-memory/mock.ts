// Offline voice-memory provider. No network, no AI. It never pretends to
// transcribe or translate: the curator types the transcript, and the
// "translation" is the original text with a clear mock label.
import type { VoiceMemoryProvider } from "@/domain/voice-memory";
import { translationGate } from "@/domain/voice-memory";

export const mockVoiceMemory: VoiceMemoryProvider = {
  id: "mock",
  async transcribe() {
    return {
      mode: "mock",
      value: null,
      notice:
        "Mock mode: no speech-to-text runs. Type or paste what the curator said.",
    };
  },
  async startTranslation(req) {
    const gate = translationGate(req);
    if (!gate.ok)
      return { mode: "unavailable", value: null, notice: gate.reason };
    return {
      mode: "mock",
      notice:
        "Mock mode: nothing was translated and no voice was made. Set ELEVENLABS_API_KEY for the live provider.",
      value: {
        jobId: `mock-${req.targetLang}`,
        targetLang: req.targetLang,
        status: "done",
        result: {
          text: `[Mock, not translated to ${req.targetLang}] ${req.transcript}`,
          audioDataUrl: null,
          voice: "none",
        },
      },
    };
  },
  async checkTranslation(jobId, targetLang) {
    return {
      mode: "mock",
      notice: "Mock mode: the job finished at once.",
      value: { jobId, targetLang, status: "done" },
    };
  },
};
