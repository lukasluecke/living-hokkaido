// ElevenLabs adapter (server only). Endpoints from the official API reference,
// read 2026-11-25:
// - POST /v1/speech-to-text            https://elevenlabs.io/docs/api-reference/speech-to-text/convert
// - POST /v1/dubbing                   https://elevenlabs.io/docs/api-reference/legacy/dubbing/create
// - GET  /v1/dubbing/{id}              https://elevenlabs.io/docs/api-reference/legacy/dubbing/get
// - GET  /v1/dubbing/{id}/audio/{lang} https://elevenlabs.io/docs/api-reference/legacy/dubbing/audio/get
// - GET  /v1/dubbing/{id}/transcript/{lang}?format_type=srt
// The dubbing endpoints are marked legacy; the project-based API
// (/v1/dubbing/project) replaces them. Move when this path is verified live.
// Dubbing clones each speaker's voice unless disable_voice_cloning is true;
// we set it to true unless the speaker granted voice-clone consent.
import { z } from "zod";
import type { ProviderResult } from "@/domain/contracts";
import {
  type TranslateJob,
  translationGate,
  type VoiceMemoryProvider,
} from "@/domain/voice-memory";

const API = "https://api.elevenlabs.io";
const STT_MODEL = process.env.ELEVENLABS_STT_MODEL ?? "scribe_v2";

const sttSchema = z.object({ text: z.string(), language_code: z.string() });
const createSchema = z.object({
  dubbing_id: z.string().min(1),
  expected_duration_sec: z.number().optional(),
});
const statusSchema = z.object({
  status: z.string(),
  error: z.string().nullish(),
});

/** ISO 639 code from a BCP 47 tag ("pt-BR" -> "pt"). */
const iso = (lang: string) => lang.toLowerCase().split("-")[0];

/** Plain text from SRT: drop counters and timecodes. */
export function srtToText(srt: string) {
  return srt
    .split(/\r?\n/)
    .filter((l) => l.trim() && !/^\d+$/.test(l.trim()) && !l.includes("-->"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function fail<T>(notice: string): ProviderResult<T | null> {
  return { mode: "unavailable", value: null, notice };
}

export function createElevenLabsVoiceMemory(
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): VoiceMemoryProvider {
  const call = (path: string, init: RequestInit, timeoutMs: number) =>
    fetchImpl(`${API}${path}`, {
      ...init,
      headers: { "xi-api-key": apiKey, ...init.headers },
      signal: AbortSignal.timeout(timeoutMs),
    });

  return {
    id: "elevenlabs",
    async transcribe({ audio, lang }) {
      try {
        const form = new FormData();
        form.set("model_id", STT_MODEL);
        form.set("file", audio, "memory.webm");
        if (lang) form.set("language_code", iso(lang));
        const res = await call(
          "/v1/speech-to-text",
          { method: "POST", body: form },
          60_000,
        );
        if (!res.ok) return fail(`Speech-to-text failed (HTTP ${res.status}).`);
        const out = sttSchema.safeParse(await res.json());
        if (!out.success)
          return fail("Speech-to-text returned an unexpected shape.");
        return {
          mode: "live",
          value: { text: out.data.text, lang: lang ?? out.data.language_code },
          notice:
            "Machine transcript (ElevenLabs Scribe). The curator must check it.",
        };
      } catch (e) {
        return fail(`Speech-to-text unavailable: ${(e as Error).name}.`);
      }
    },
    async startTranslation(req) {
      const gate = translationGate(req);
      if (!gate.ok) return fail(gate.reason);
      try {
        const form = new FormData();
        form.set("file", req.audio, "memory.webm");
        form.set("name", "living-hokkaido-memory");
        form.set("source_lang", iso(req.sourceLang));
        form.set("target_lang", iso(req.targetLang));
        form.set("num_speakers", "1");
        form.set("watermark", "true");
        form.set("disable_voice_cloning", gate.allowClone ? "false" : "true");
        const res = await call(
          "/v1/dubbing",
          { method: "POST", body: form },
          30_000,
        );
        if (!res.ok)
          return fail(`Dubbing request failed (HTTP ${res.status}).`);
        const out = createSchema.safeParse(await res.json());
        if (!out.success) return fail("Dubbing returned an unexpected shape.");
        return {
          mode: "live",
          notice: "Dubbing started (ElevenLabs).",
          value: {
            jobId: out.data.dubbing_id,
            targetLang: req.targetLang,
            status: "running",
            expectedSec: out.data.expected_duration_sec,
          },
        };
      } catch (e) {
        return fail(`Dubbing unavailable: ${(e as Error).name}.`);
      }
    },
    async checkTranslation(jobId, targetLang, cloneAllowed) {
      try {
        const id = encodeURIComponent(jobId);
        const lang = encodeURIComponent(iso(targetLang));
        const res = await call(`/v1/dubbing/${id}`, { method: "GET" }, 15_000);
        if (!res.ok) return fail(`Dubbing status failed (HTTP ${res.status}).`);
        const st = statusSchema.safeParse(await res.json());
        if (!st.success) return fail("Dubbing status had an unexpected shape.");
        const job: TranslateJob = { jobId, targetLang, status: "running" };
        if (st.data.error)
          return {
            mode: "live",
            notice: st.data.error,
            value: { ...job, status: "failed" },
          };
        if (st.data.status !== "dubbed")
          return {
            mode: "live",
            notice: `Dubbing: ${st.data.status}.`,
            value: job,
          };
        const [audio, srt] = await Promise.all([
          call(`/v1/dubbing/${id}/audio/${lang}`, { method: "GET" }, 30_000),
          call(
            `/v1/dubbing/${id}/transcript/${lang}?format_type=srt`,
            { method: "GET" },
            15_000,
          ),
        ]);
        if (!audio.ok || !srt.ok)
          return fail("Could not download the dubbed audio or transcript.");
        const type = audio.headers.get("content-type") ?? "audio/mpeg";
        const bytes = Buffer.from(await audio.arrayBuffer()).toString("base64");
        return {
          mode: "live",
          notice:
            "Machine translation and synthetic voice (ElevenLabs Dubbing).",
          value: {
            ...job,
            status: "done",
            result: {
              text: srtToText(await srt.text()),
              audioDataUrl: `data:${type};base64,${bytes}`,
              voice: cloneAllowed ? "cloned" : "stock",
            },
          },
        };
      } catch (e) {
        return fail(`Dubbing status unavailable: ${(e as Error).name}.`);
      }
    },
  };
}
