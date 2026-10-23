"use client";

import { useLocale } from "@/components/i18n-provider";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * `<time>` with the time elapsed since `timestamp` in the active locale
 * ("now", "5 minutes ago"…), or the medium date from 7 days on. `now` comes
 * from the page, which refreshes it on a single interval.
 */
export function RelativeTime({
  timestamp,
  now,
}: {
  timestamp: number;
  now: number;
}) {
  const locale = useLocale();
  const date = new Date(timestamp);
  // A read a few ms after the page's `now` would otherwise be "in 0 seconds".
  const elapsed = Math.max(0, now - timestamp);
  const fullDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(date);

  return (
    <time dateTime={date.toISOString()} title={fullDate}>
      {format(locale, elapsed, date)}
      {/* The title tooltip is unreachable by keyboard and touch. */}
      <span className="sr-only"> ({fullDate})</span>
    </time>
  );
}

function format(locale: string, elapsed: number, date: Date) {
  if (elapsed >= WEEK) {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      date,
    );
  }
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (elapsed < MINUTE)
    return rtf.format(-Math.floor(elapsed / 1000), "second");
  if (elapsed < HOUR)
    return rtf.format(-Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return rtf.format(-Math.floor(elapsed / HOUR), "hour");
  return rtf.format(-Math.floor(elapsed / DAY), "day");
}
