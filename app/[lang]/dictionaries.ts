import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import type en from "./dictionaries/en.json";

export type Dictionary = typeof en;

/**
 * Accepts a translated dictionary only if it has exactly the same keys as
 * en.json: missing keys fail the `extends` constraint, extra keys collapse
 * the parameter to `never`. Either way `npm run build` fails.
 */
const sameKeys = <T extends Dictionary>(
  dict: T & (Dictionary extends T ? unknown : never),
): Dictionary => dict;

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  es: () =>
    import("./dictionaries/es.json").then((module) => sameKeys(module.default)),
  de: () =>
    import("./dictionaries/de.json").then((module) => sameKeys(module.default)),
};

export const getDictionary = async (): Promise<Dictionary> => {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return dictionaries[locale]();
};

// Route Handlers (e.g. opengraph-image.tsx) can't use next/root-params's
// lang(), so they read the [lang] segment from their own `params` prop and
// pass it here instead of going through getDictionary().
export const getDictionaryForLocale = (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]();
