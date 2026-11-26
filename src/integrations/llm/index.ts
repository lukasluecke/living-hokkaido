// Server-only chat model for "Ask the owl". Provider-agnostic: any
// OpenAI-compatible chat-completions endpoint. No key = no live mode.
//
//   LLM_PROVIDER = zai | carbonforge | openai-compatible | none (default: zai when a key is set)
//   LLM_API_KEY  = ...                              (server only; never NEXT_PUBLIC_)
//   LLM_BASE_URL = override the endpoint base       (zai default below)
//   LLM_MODEL    = override the model id            (zai default: glm-5.3-flash)
//   LLM_TIMEOUT_MS = request timeout (default 15000)
//
// Z.ai docs (read 2026-11-25): POST {base}/chat/completions, header
// "Authorization: Bearer <key>", OpenAI-compatible body and reply
// (choices[0].message.content). GLM-5.3-Flash cannot turn thinking off;
// reasoning_effort "low" keeps it short. It has no response_format field, so
// the prompt asks for JSON and src/domain/ask.ts parses and validates it.
// https://docs.z.ai/api-reference/llm/chat-completion
import type { ChatMessage } from "@/domain/ask";

export type ChatModel = {
  id: string;
  model: string;
  complete(
    messages: ChatMessage[],
    signal?: AbortSignal,
    options?: CompleteOptions,
  ): Promise<string>;
};

/** Per-call overrides (ingestion needs longer replies than the owl). */
export type CompleteOptions = { maxTokens?: number; timeoutMs?: number };

type Env = Record<string, string | undefined>;

const PRESETS: Record<
  string,
  { baseUrl: string; model: string; extra: Record<string, unknown> }
> = {
  // Hack Hokkaido sponsor access (temporary). Values from the organiser's
  // perks email: OpenAI-compatible, base URL ending in /v1. Not yet called
  // from CI or the cloud sandbox (network blocked there).
  carbonforge: {
    baseUrl: "https://endpoint.carbonforge.ai/v1",
    model: "carbonforge-flash",
    extra: {},
  },
  // OrcaRouter: OpenAI-compatible gateway with input guardrails (prompt
  // injection, jailbreak, PII, secrets) attached to the key in its console.
  // https://www.orcarouter.ai/ (read 2026-11-26). Used by src/integrations/guard.
  orcarouter: {
    baseUrl: "https://api.orcarouter.ai/v1",
    model: "orcarouter/auto",
    extra: {},
  },
  zai: {
    baseUrl: "https://api.z.ai/api/paas/v4",
    model: "glm-5.3-flash",
    extra: { thinking: { type: "enabled" }, reasoning_effort: "low" },
  },
};

export class LlmError extends Error {}

/** The configured model, or null (no key, LLM_PROVIDER=none, bad config). */
export function chatModel(env: Env = process.env): ChatModel | null {
  const key = env.LLM_API_KEY?.trim();
  const provider = (env.LLM_PROVIDER?.trim() || "zai").toLowerCase();
  if (!key || provider === "none") return null;
  const preset = PRESETS[provider];
  const baseUrl = (env.LLM_BASE_URL?.trim() || preset?.baseUrl || "").replace(
    /\/+$/,
    "",
  );
  const model = env.LLM_MODEL?.trim() || preset?.model || "";
  if (
    !baseUrl.startsWith("https://") &&
    !baseUrl.startsWith("http://localhost")
  )
    return null;
  if (!model) return null;
  const timeout = Number(env.LLM_TIMEOUT_MS) || 15_000;
  return {
    id: provider,
    model,
    async complete(messages, signal, options) {
      const ms = options?.timeoutMs ?? timeout;
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: options?.maxTokens ?? 1200,
          stream: false,
          ...preset?.extra,
        }),
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(ms)])
          : AbortSignal.timeout(ms),
      });
      if (!res.ok) {
        // Never echo the key; keep only a short provider message.
        const body = (await res.text().catch(() => "")).slice(0, 200);
        throw new LlmError(`${provider} HTTP ${res.status}: ${body}`);
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const content = json.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim())
        throw new LlmError(`${provider}: empty reply`);
      return content;
    },
  };
}
