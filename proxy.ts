import { NextResponse, type NextRequest } from "next/server";
import { hasLocale, LOCALE_COOKIE, locales } from "@/lib/i18n/config";
import { matchLocale } from "@/lib/i18n/match-locale";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (pathnameHasLocale) return;

  // Explicit choice (cookie) wins over the browser's Accept-Language.
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale =
    cookieLocale && hasLocale(cookieLocale)
      ? cookieLocale
      : matchLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  const response = NextResponse.redirect(url);
  // The redirect target depends on the cookie and Accept-Language, so a CDN
  // or browser must not cache it for a different visitor/locale.
  response.headers.set("Vary", "Accept-Language, Cookie");
  return response;
}

export const config = {
  // Skip Next internals, API routes and anything with a file extension
  // (favicon.ico, future manifest/sw.js, images…).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
