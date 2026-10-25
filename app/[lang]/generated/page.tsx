import type { Metadata } from "next";
import { lang as getLang } from "next/root-params";
import { GeneratedView } from "@/components/generated/generated-view";
import { hasLocale } from "@/lib/i18n/config";
import { buildAlternates } from "@/lib/seo";
import { getDictionary } from "../dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const currentLang = await getLang();
  const dict = await getDictionary();
  const lang = hasLocale(currentLang) ? currentLang : "en";

  return {
    title: dict.generated.title,
    alternates: buildAlternates(lang, "/generated"),
    // Content lives in the browser's localStorage, so the server renders an
    // empty shell per-locale: nothing here is worth indexing.
    robots: { index: false, follow: true },
  };
}

export default async function Generated() {
  const dict = await getDictionary();

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-14"
    >
      {/* Focus target when deleting the last entry (generated-view.tsx). */}
      <h1
        id="generated-title"
        tabIndex={-1}
        className="text-[2.25rem] leading-[1.1] font-semibold tracking-tight sm:text-5xl outline-none"
      >
        {dict.generated.title}
      </h1>
      <GeneratedView />
    </main>
  );
}
