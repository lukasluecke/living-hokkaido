// One i18n layer for the visitor app. Pure functions, no React.
//
// How it works: English stays the source text. A locale dictionary maps an
// exact English string to its translation. `t()` translates UI strings;
// `localizePack()` translates the strings of a content pack. A string that
// has no entry stays English, so a change to English text never breaks the
// app: it only shows English until the dictionary catches up.
//
// Rules (AGENTS.md): Ainu words are never translated (they keep their own
// text and katakana). Source titles, attributions, locators, urls, ids and
// curator memories are never translated. Every Japanese string here is a
// machine translation and is a Draft until a person reviews it.
import type { ContentPack } from "@/contracts";
import { jaContent } from "./ja/content";
import { jaUi } from "./ja/ui";

export const LOCALES = ["en", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "living-hokkaido.locale";

export type Dictionary = Readonly<Record<string, string>>;

/** Review status of a locale. "draft" = machine translation, not reviewed. */
export const LOCALE_STATUS: Record<Locale, "source" | "draft"> = {
  en: "source",
  ja: "draft",
};

/** Native names for the language switch. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
};

// UI words and content text are separate: UI keys such as "summer" are
// also enum values in the pack, so localizePack() uses content keys only.
const DICTIONARIES: Record<Locale, Dictionary> = {
  en: {},
  ja: { ...jaContent, ...jaUi },
};
const CONTENT: Record<Locale, Dictionary> = { en: {}, ja: jaContent };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function dictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type Params = Readonly<Record<string, string | number>>;
export type Translate = (text: string, params?: Params) => string;

/** Fill `{name}` slots. Unknown slots stay as they are. */
export function fill(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) =>
    k in params ? String(params[k]) : m,
  );
}

/** Translate one English string (with `{name}` slots) into `locale`. */
export function translate(
  locale: Locale,
  text: string,
  params?: Params,
): string {
  const dict = DICTIONARIES[locale];
  const out = Object.hasOwn(dict, text) ? (dict[text] ?? text) : text;
  return fill(out, params);
}

export function translator(locale: Locale): Translate {
  return (text, params) => translate(locale, text, params);
}

/** English identity translator, for pure functions with an optional `t`. */
export const english: Translate = (text, params) => fill(text, params);

// Keys whose string values are never translated, at any depth.
const KEEP_KEYS = new Set([
  "id",
  "url",
  "locator",
  "attribution",
  "sourceId",
  "romanised",
  "lang",
  "colour",
]);
// Subtrees that are never translated: sources (titles are citations),
// curator memories (the curator's own words and their own translations),
// model metadata, and Ainu text (refrain, lyrics, tune).
const KEEP_TREES = new Set([
  "sources",
  "memories",
  "model",
  "refrain",
  "lyrics",
  "tune",
]);

function walk(
  v: unknown,
  dict: Dictionary,
  key: string,
  ainu: boolean,
): unknown {
  if (typeof v === "string") {
    if (KEEP_KEYS.has(key)) return v;
    // In an object with `lang: "ain"`, `text` is the Ainu word itself.
    if (ainu && key === "text") return v;
    return Object.hasOwn(dict, v) ? (dict[v] ?? v) : v;
  }
  if (Array.isArray(v)) return v.map((x) => walk(x, dict, key, false));
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const isAinu = o.lang === "ain";
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(o))
      out[k] = KEEP_TREES.has(k) ? x : walk(x, dict, k, isAinu);
    return out;
  }
  return v;
}

/**
 * The same pack with translated strings. Ids, numbers, structure and every
 * kept field are unchanged, so state, journal and events work in any locale.
 */
export function localizePack(pack: ContentPack, locale: Locale): ContentPack {
  if (locale === DEFAULT_LOCALE) return pack;
  return walk(pack, CONTENT[locale], "", false) as ContentPack;
}

/**
 * Content strings that `localizePack()` would translate but that have no
 * entry yet (ids and enum values are skipped). For tests and translators.
 */
export function untranslated(pack: ContentPack, locale: Locale): string[] {
  const dict = CONTENT[locale];
  const out = new Set<string>();
  const visit = (v: unknown, key: string, ainu: boolean): void => {
    if (typeof v === "string") {
      if (KEEP_KEYS.has(key) || (ainu && key === "text")) return;
      if (!/[A-Za-z]/.test(v) || !/\s|[A-Z]/.test(v)) return;
      if (!Object.hasOwn(dict, v)) out.add(v);
    } else if (Array.isArray(v)) for (const x of v) visit(x, key, false);
    else if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      for (const [k, x] of Object.entries(o))
        if (!KEEP_TREES.has(k)) visit(x, k, o.lang === "ain");
    }
  };
  visit(pack, "", false);
  return [...out];
}
