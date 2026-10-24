"use client";

import { History, ScanLine, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDictionary, useLocale } from "@/components/i18n-provider";

type NavKey = "scanner" | "history" | "generated";

const items: { key: NavKey; path: string; Icon: LucideIcon }[] = [
  { key: "scanner", path: "", Icon: ScanLine },
  { key: "history", path: "/history", Icon: History },
  { key: "generated", path: "/generated", Icon: Sparkles },
];

// Underlined tabs on the header's bottom edge, so the page nav never reads
// like the scanner's filled Camera / Image switch below it.
export function SiteNav() {
  const dict = useDictionary();
  const locale = useLocale();
  // The path without its locale prefix: "" on the home, "/history" on the history.
  const rest = usePathname().replace(/^\/[^/]+/, "");

  return (
    <nav aria-label={dict.header.nav.label} className="self-stretch">
      <ul className="flex h-full items-stretch">
        {items.map(({ key, path, Icon }) => {
          const active = rest === path;
          return (
            <li key={key} className="flex">
              <Link
                href={`/${locale}${path}`}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex min-w-10 items-center justify-center gap-2 px-2.5 text-sm outline-offset-[-6px] after:absolute after:inset-x-1.5 after:-bottom-px after:h-0.5 after:rounded-full sm:px-3 ${
                  active
                    ? "font-medium text-foreground after:bg-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Icon aria-hidden="true" className="size-5 sm:size-4" />
                <span className="sr-only sm:not-sr-only">
                  {dict.header.nav[key]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
