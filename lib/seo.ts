import { locales, type Locale } from "@/lib/i18n/config";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qrvault.app"
).replace(/\/+$/, "");

/**
 * Canonical + hreflang alternates for a path under /[lang].
 * x-default points at the locale-picking URL itself (proxy.ts redirects it),
 * not at /en, per Google's guidance for sites that auto-detect locale.
 */
export function buildAlternates(currentLang: Locale, path = "") {
  const languages: Record<string, string> = {};
  for (const locale of locales) languages[locale] = `/${locale}${path}`;
  languages["x-default"] = path || "/";

  return {
    canonical: `/${currentLang}${path}`,
    languages,
  };
}

const ogLocaleTags: Record<Locale, string> = {
  en: "en_US",
  es: "es_ES",
  de: "de_DE",
};

/**
 * `openGraph` is shallowly replaced (not merged) between a layout and a page
 * that both define it, so any page overriding title/description/url must
 * re-spread this to keep type/siteName/locale.
 */
export function buildOpenGraph(currentLang: Locale, siteName: string) {
  return {
    type: "website" as const,
    siteName,
    locale: ogLocaleTags[currentLang],
    alternateLocale: locales
      .filter((locale) => locale !== currentLang)
      .map((locale) => ogLocaleTags[locale]),
  };
}
