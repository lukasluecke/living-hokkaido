// Prompt-injection guard for the ingestion model call (docs/INGEST.md).
//
// OrcaRouter (Hack Hokkaido partner) is an OpenAI-compatible gateway: the
// guardrails (injection and jailbreak rules, PII, secrets, LLM judge) are
// attached to the API key in the OrcaRouter console, and requests are checked
// before the model sees them. So "using the guard" = sending the ingestion
// call through https://api.orcarouter.ai/v1 with that key.
// Source: https://www.orcarouter.ai/ and its 2026-06-18 blog post (read
// 2026-11-26). The docs pages did not say which HTTP status a blocked request
// gets, so ANY non-2xx reply from OrcaRouter counts as "blocked or failed"
// and the studio falls back to the mock draft. Not yet called live (no key).
//
//   ORCAROUTER_API_KEY = ...         (server only)
//   ORCAROUTER_MODEL   = model id    (default orcarouter/auto)
//
// Without the key, only the local rules run (quote check, risk flags,
// "instruction" flag). The studio says so; it never claims a firewall.
import { type ChatModel, chatModel } from "@/integrations/llm";

type Env = Record<string, string | undefined>;

export type GuardStatus = {
  provider: "orcarouter" | "local";
  active: boolean;
  notice: string;
};

/** The model routed through OrcaRouter, or null when no key is set. */
export function guardedModel(env: Env = process.env): ChatModel | null {
  const key = env.ORCAROUTER_API_KEY?.trim();
  if (!key) return null;
  return chatModel({
    LLM_PROVIDER: "orcarouter",
    LLM_API_KEY: key,
    LLM_MODEL: env.ORCAROUTER_MODEL,
    LLM_BASE_URL: env.ORCAROUTER_BASE_URL,
    LLM_TIMEOUT_MS: env.LLM_TIMEOUT_MS,
  });
}

export function guardStatus(env: Env = process.env): GuardStatus {
  return guardedModel(env)
    ? {
        provider: "orcarouter",
        active: true,
        notice:
          "OrcaRouter guardrails check the text before the model sees it.",
      }
    : {
        provider: "local",
        active: false,
        notice:
          "OrcaRouter not connected (no key). Local rules only: quote check and risk flags.",
      };
}
