// Source research for the reviewer (docs/INGEST.md). Server only.
//
// Linkup (Hack Hokkaido partner) web search suggests MORE SOURCES that a
// reviewer may open. Suggestions are never claims and never citations: to
// use one, the reviewer reads it and ingests it as its own source.
//
// API (read 2026-11-26, https://docs.linkup.so/api-reference/search/search):
//   POST https://api.linkup.so/v1/search, "Authorization: Bearer <key>",
//   body { q, depth: "fast"|"standard"|"deep"|"flash",
//          outputType: "searchResults", maxResults, includeDomains? }
//   reply { results: [{ type: "text", name, url, content }, ...] }
// Not yet called live (no key in the sandbox).
//
//   LINKUP_API_KEY = ...   (server only)
import { z } from "zod";

type Env = Record<string, string | undefined>;

export type SourceSuggestion = {
  name: string;
  url: string;
  snippet: string;
};

export type ResearchResult = {
  mode: "live" | "unavailable";
  notice: string;
  suggestions: SourceSuggestion[];
};

const replySchema = z.object({
  results: z.array(
    z.object({
      type: z.string().optional(),
      name: z.string().default(""),
      url: z.string(),
      content: z.string().optional(),
    }),
  ),
});

export function researchAvailable(env: Env = process.env): boolean {
  return !!env.LINKUP_API_KEY?.trim();
}

/** Turns a Linkup reply into at most `max` safe suggestions. */
export function parseLinkup(json: unknown, max = 5): SourceSuggestion[] {
  const parsed = replySchema.safeParse(json);
  if (!parsed.success) return [];
  const out: SourceSuggestion[] = [];
  for (const r of parsed.data.results) {
    if (r.type && r.type !== "text") continue;
    if (!/^https:\/\//.test(r.url) || out.some((o) => o.url === r.url))
      continue;
    const snippet = (r.content ?? "").replace(/\s+/g, " ").trim();
    out.push({
      name: r.name.trim().slice(0, 160) || r.url,
      url: r.url,
      snippet: snippet.length > 280 ? `${snippet.slice(0, 279)}…` : snippet,
    });
    if (out.length >= max) break;
  }
  return out;
}

/** Heritage institutions for the owl's "read more" links. */
export const HERITAGE_DOMAINS = [
  "ainu-upopoy.jp",
  "ff-ainu.or.jp",
  "hm.pref.hokkaido.lg.jp",
  "jmapps.ne.jp",
];

export async function suggestSources(
  query: string,
  env: Env = process.env,
  signal?: AbortSignal,
  options: { includeDomains?: string[]; timeoutMs?: number } = {},
): Promise<ResearchResult> {
  const key = env.LINKUP_API_KEY?.trim();
  if (!key)
    return {
      mode: "unavailable",
      notice:
        "Linkup not connected (no key). With a key, this suggests more sources for the reviewer to open. Suggestions never become claims.",
      suggestions: [],
    };
  const timeout = AbortSignal.timeout(
    options.timeoutMs ?? (Number(env.LINKUP_TIMEOUT_MS) || 12_000),
  );
  try {
    const res = await fetch("https://api.linkup.so/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        depth: "fast",
        outputType: "searchResults",
        maxResults: 8,
        ...(options.includeDomains?.length
          ? { includeDomains: options.includeDomains }
          : {}),
      }),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!res.ok)
      return {
        mode: "unavailable",
        notice: `Linkup did not answer (HTTP ${res.status}). No suggestions.`,
        suggestions: [],
      };
    const suggestions = parseLinkup(await res.json());
    return {
      mode: "live",
      notice: suggestions.length
        ? "Linkup web search. Suggestions only: open each one before you use it."
        : "Linkup found no matching pages.",
      suggestions,
    };
  } catch (err) {
    console.warn("[research] linkup failed:", (err as Error).message);
    return {
      mode: "unavailable",
      notice: "Linkup did not answer in time. No suggestions.",
      suggestions: [],
    };
  }
}
