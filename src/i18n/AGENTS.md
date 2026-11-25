# src/i18n: one language layer (English, Japanese)

English is the source text. `ja/*.ts` maps an exact English string to a
Japanese draft. A string with no entry stays English, so a change to English
text never breaks anything: it shows in English until the dictionary is
updated.

- **Content**: the shell calls `localizePack(pack, locale)`. Parts get the
  pack with translated text and unchanged ids. Parts do nothing.
- **UI words in a part or the shell**: `const t = useT()` from `@/i18n`, then
  `t("Close")` or `t("{n} of {total}", { n, total })`. Add the English key
  and the Japanese text to `ja/ui.ts`. `@/i18n` is a shared layer like
  `@/contracts` and `@/design`; a part may import it.
- **Pure functions** (for example `src/shell/route.ts`) take an optional
  `t: Translate = english`.
- The shell owns the locale: `?lang=ja|en`, then `localStorage`
  (`living-hokkaido.locale`), else English. It sets `<html lang>`.

## Rules

- Every Japanese string is a **machine translation and a Draft**
  (`LOCALE_STATUS.ja = "draft"`). The HUD shows a "Draft" label while Japanese
  is on. Never call a translation reviewed without a named, real reviewer.
- Never translate Ainu words. Objects with `lang: "ain"` keep `text`;
  `refrain`, `lyrics` and `tune` are kept whole. In Japanese sentences, Ainu
  words keep their own spelling (attus, cise, kotan, kamuy, sakehe) and their
  katakana where the source gives it. Ainu is not a Japanese dialect.
- Never translate source titles, attributions, locators, urls, ids or curator
  memories (the curator's own words and translations are separate, with
  their own consent).
- A translation must say the same as the English claim, no more. Do not add
  names, dates or details that the claim does not have.

## Limitations (2026-11-26)

- "Ask the owl" matches English words, so the shell gives it the English
  pack: answers stay English while Japanese is on.
- UI words inside parts are translated part by part (see git log).
- `/contribute` and `/over-time` routes are English only.
