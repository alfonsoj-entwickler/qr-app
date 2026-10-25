import type { Metadata } from "next";
import { lang as getLang } from "next/root-params";
import { QrGlyph } from "@/components/qr-glyph";
import { Scanner } from "@/components/scanner/scanner";
import { hasLocale } from "@/lib/i18n/config";
import { buildAlternates, buildOpenGraph, siteUrl } from "@/lib/seo";
import { getDictionary } from "./dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const currentLang = await getLang();
  const dict = await getDictionary();
  const lang = hasLocale(currentLang) ? currentLang : "en";

  return {
    title: { absolute: dict.meta.homeTitle },
    description: dict.meta.homeDescription,
    alternates: buildAlternates(lang),
    openGraph: {
      ...buildOpenGraph(lang, dict.meta.title),
      title: dict.meta.homeTitle,
      description: dict.meta.homeDescription,
      url: `/${lang}`,
    },
  };
}

export default async function Home() {
  const currentLang = await getLang();
  const dict = await getDictionary();
  const lang = hasLocale(currentLang) ? currentLang : "en";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: dict.meta.title,
        url: siteUrl,
        inLanguage: lang,
      },
      {
        "@type": "WebApplication",
        name: dict.meta.title,
        url: `${siteUrl}/${lang}`,
        description: dict.meta.homeDescription,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        browserRequirements:
          "Requires JavaScript and a camera for live scanning",
        inLanguage: lang,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <main
      id="main"
      className="mx-auto grid w-full max-w-5xl flex-1 content-start gap-10 px-4 py-8 sm:px-6 md:content-center sm:py-20 md:grid-cols-[1fr_auto] md:items-center md:gap-16"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col gap-5">
        <h1 className="max-w-[14ch] text-[2.25rem] leading-[1.1] font-semibold tracking-tight sm:text-5xl md:text-6xl">
          {dict.home.title}
        </h1>
        <Scanner />
      </div>
      {/* On phones the scanner is the whole page; the mark returns at md. */}
      <QrGlyph className="hidden md:block md:w-80" />
    </main>
  );
}
