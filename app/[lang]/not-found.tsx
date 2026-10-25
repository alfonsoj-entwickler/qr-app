import Link from "next/link";
import { lang } from "next/root-params";
import { QrGlyph } from "@/components/qr-glyph";
import { getDictionary } from "./dictionaries";

export default async function NotFound() {
  const [locale, dict] = await Promise.all([lang(), getDictionary()]);

  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 content-center gap-10 px-4 py-12 sm:px-6 sm:py-20 md:grid-cols-[1fr_auto] md:items-center md:gap-16">
      <div className="flex flex-col items-start gap-5">
        <h1 className="max-w-[14ch] text-[2.25rem] leading-[1.1] font-semibold tracking-tight sm:text-5xl md:text-6xl">
          {dict.notFound.title}
        </h1>
        <p className="max-w-[46ch] text-lg leading-relaxed text-muted sm:text-[1.3125rem]">
          {dict.notFound.body}
        </p>
        <Link
          href={`/${locale}`}
          className="mt-2 inline-flex h-11 items-center rounded-full bg-foreground px-5 font-medium text-background hover:opacity-90"
        >
          {dict.notFound.backHome}
        </Link>
      </div>
      <QrGlyph variant="torn" className="w-full max-w-64 md:w-80 md:max-w-none" />
    </main>
  );
}
