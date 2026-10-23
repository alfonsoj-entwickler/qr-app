import type { Locale } from "@/lib/i18n/config";
import { parseContent, type ParsedContent } from "@/lib/scan/parse-content";
import type { GeneratedCode } from "./types";

export type KindFilter = "all" | ParsedContent["kind"];

/**
 * Entries whose text contains `query` (trimmed, case-insensitive in `locale`)
 * and whose detected kind matches `kind`. An empty query does not filter.
 * Pure function, no browser APIs; keeps the input order.
 */
export function filterEntries(
  entries: GeneratedCode[],
  query: string,
  kind: KindFilter,
  locale: Locale,
): GeneratedCode[] {
  const needle = query.trim().toLocaleLowerCase(locale);
  return entries.filter(
    (entry) =>
      (kind === "all" || parseContent(entry.text, "QR_CODE").kind === kind) &&
      (needle === "" ||
        entry.text.toLocaleLowerCase(locale).includes(needle)),
  );
}

/** Short row text for the detected kind. Truncation is left to CSS. */
export function summarize(content: ParsedContent): string {
  switch (content.kind) {
    case "url":
      return content.url;
    case "email":
      return content.to;
    case "phone":
      return content.number;
    case "wifi":
      return content.ssid;
    case "vcard":
      return (
        content.name ??
        content.org ??
        content.phones[0] ??
        content.emails[0] ??
        content.url ??
        ""
      );
    case "sms":
      return content.phone;
    case "icalendar":
      return content.title;
    case "geo":
      return `${content.latitude}, ${content.longitude}`;
    case "telegram":
      return content.identifier;
    case "whatsapp":
      return content.phone;
    case "slack":
      return content.channelId ?? content.inviteUrl;
    case "text":
      return content.text.trim().split(/\r?\n/)[0];
  }
}
