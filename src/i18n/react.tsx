"use client";
// React access to the i18n layer. The shell owns the locale (state and
// storage) and wraps the app in <I18nProvider>. Parts call useT() for their
// own UI words; content text arrives already translated in the pack.
import { createContext, useContext, useMemo } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STATUS,
  type Locale,
  type Translate,
  translator,
} from "./core";

type I18n = { locale: Locale; t: Translate; draft: boolean };

const Ctx = createContext<I18n>({
  locale: DEFAULT_LOCALE,
  t: translator(DEFAULT_LOCALE),
  draft: false,
});

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      t: translator(locale),
      draft: LOCALE_STATUS[locale] === "draft",
    }),
    [locale],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The translate function for the current locale. */
export function useT(): Translate {
  return useContext(Ctx).t;
}

/** Locale, translate function, and whether the locale is a Draft. */
export function useI18n(): I18n {
  return useContext(Ctx);
}
