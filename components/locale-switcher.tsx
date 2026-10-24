"use client";

import { Languages } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useDictionary, useLocale } from "@/components/i18n-provider";
import { LOCALE_COOKIE, locales, type Locale } from "@/lib/i18n/config";

// Each language is named in itself, so it is recognizable whatever the UI language.
const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
};

const ONE_YEAR = 60 * 60 * 24 * 365;

export function LocaleSwitcher() {
  const dict = useDictionary();
  const locale = useLocale();
  const pathname = usePathname();
  const id = useId();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Swap only the locale prefix, keeping the rest of the path and the query.
  const rest = pathname.replace(/^\/[^/]+/, "");

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-1.5 rounded-full border border-field-border bg-surface px-3 text-sm hover:border-muted sm:gap-2 sm:px-3.5"
      >
        <Languages aria-hidden="true" className="size-4 text-muted" />
        <span className="sr-only sm:not-sr-only">
          {localeNames[locale]}
        </span>
        <span className="sr-only">{dict.header.language}</span>
      </button>

      {open && (
        <ul
          id={id}
          role="listbox"
          aria-label={dict.header.language}
          className="absolute top-full right-0 z-10 mt-2 min-w-32 rounded-xl border border-field-border bg-surface p-1 shadow-lg"
        >
          {locales.map((value) => (
            <li key={value} role="presentation">
              <a
                href={`/${value}${rest}${typeof window !== "undefined" ? window.location.search : ""}`}
                hrefLang={value}
                lang={value}
                role="option"
                aria-selected={value === locale}
                onClick={() => {
                  document.cookie = `${LOCALE_COOKIE}=${value}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
                }}
                className={`block rounded-lg px-3 py-2 text-sm hover:bg-background ${
                  value === locale ? "font-medium text-foreground" : ""
                }`}
              >
                {localeNames[value]}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
