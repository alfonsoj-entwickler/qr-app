import Link from "next/link";
import { lang } from "next/root-params";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SiteNav } from "@/components/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export async function SiteHeader() {
  const locale = await lang();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 self-stretch sm:gap-5">
          <Link
            href={`/${locale}`}
            className="flex shrink-0 items-center gap-2 rounded-sm text-base font-semibold tracking-tight"
          >
            <img src="/logo.svg" alt="" className="size-6" />
            <span className="sr-only sm:not-sr-only">QR Vault</span>
          </Link>
          <SiteNav />
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-6">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
