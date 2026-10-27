import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { lang as getLang } from "next/root-params";
import { I18nProvider } from "@/components/i18n-provider";
import { SiteHeader } from "@/components/site-header";
import { ThemeScript } from "@/components/theme-script";
import { hasLocale, locales } from "@/lib/i18n/config";
import { buildAlternates, buildOpenGraph, siteUrl } from "@/lib/seo";
import { getDictionary } from "./dictionaries";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const currentLang = await getLang();
  const dict = await getDictionary();
  const lang = hasLocale(currentLang) ? currentLang : "en";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: `%s · ${dict.meta.title}`,
      default: dict.meta.title,
    },
    description: dict.meta.description,
    alternates: buildAlternates(lang),
    openGraph: buildOpenGraph(lang, dict.meta.title),
    twitter: {
      card: "summary_large_image",
    },
  };
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary();

  return (
    <html
      lang={lang}
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-background"
        >
          {dict.common.skipToContent}
        </a>
        <I18nProvider locale={lang} dict={dict}>
          <SiteHeader />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
