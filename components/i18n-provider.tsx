"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n/config";

type I18nContextValue = { locale: Locale; dict: Dictionary };

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: I18nContextValue & { children: ReactNode }) {
  return <I18nContext value={{ locale, dict }}>{children}</I18nContext>;
}

function useI18n(hookName: string): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error(`${hookName}() must be used inside <I18nProvider>.`);
  }
  return value;
}

export function useDictionary(): Dictionary {
  return useI18n("useDictionary").dict;
}

export function useLocale(): Locale {
  return useI18n("useLocale").locale;
}
