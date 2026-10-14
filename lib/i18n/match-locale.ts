import { defaultLocale, hasLocale, type Locale } from "./config";

/**
 * Picks the best supported locale from an `Accept-Language` header.
 * Ranges are sorted by `q` (ties keep header order), regional tags are
 * reduced to their base language (`de-AT` → `de`), and `en` is the fallback.
 */
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranges = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return {
        base: tag.trim().toLowerCase().split("-")[0],
        q: Number.isNaN(q) ? 0 : q,
        index,
      };
    })
    .filter((range) => range.base && range.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const { base } of ranges) {
    if (hasLocale(base)) return base;
  }

  return defaultLocale;
}
