import type { BarcodeFormat, ContentKind, VCardData } from "./types";

export type ParsedContent =
  | { kind: "url"; url: string } // solo http/https
  | { kind: "email"; to: string; subject?: string; body?: string }
  | { kind: "phone"; number: string }
  | {
      kind: "wifi";
      ssid: string;
      security: "WPA" | "WEP" | "nopass";
      password?: string;
      hidden: boolean;
    }
  | {
      kind: "vcard";
      name?: string;
      org?: string;
      title?: string;
      phones: string[];
      emails: string[];
      url?: string;
    }
  | { kind: "sms"; phone: string; message: string }
  | {
      kind: "icalendar";
      title: string;
      dateTime: string;
      location?: string;
      description?: string;
      notification?: number;
    }
  | {
      kind: "geo";
      latitude: number;
      longitude: number;
      zoomLevel?: number;
    }
  | {
      kind: "telegram";
      type: "user" | "group";
      identifier: string;
      inviteLink?: string;
    }
  | { kind: "whatsapp"; phone: string; message?: string }
  | {
      kind: "slack";
      inviteUrl: string;
      workspaceId?: string;
      channelId?: string;
    }
  | { kind: "text"; text: string };

/**
 * Detects what a decoded code contains. Only QR codes are inspected; linear
 * barcodes are always text. Rules run in order: WiFi, iCalendar, SMS, vCard,
 * email, phone, Geo, Telegram, WhatsApp, Slack, URL (http/https only), text.
 * Geo/Telegram/WhatsApp/Slack run before the generic URL check since they are
 * URIs/URLs themselves. Pure function, no browser APIs.
 */
export function parseContent(
  text: string,
  format: BarcodeFormat,
): ParsedContent {
  if (format !== "QR_CODE") return { kind: "text", text };

  const trimmed = text.trim();

  if (/^WIFI:/i.test(trimmed)) {
    return parseWifi(trimmed.slice(5)) ?? { kind: "text", text };
  }

  if (/^BEGIN:VCALENDAR/i.test(trimmed) && /^BEGIN:VEVENT/i.test(trimmed)) {
    const ical = parseICalendar(trimmed);
    if (ical) return ical;
  }

  if (/^sms:/i.test(trimmed) || /^smsto:/i.test(trimmed)) {
    const sms = parseSms(trimmed);
    if (sms) return sms;
  }

  if (/^BEGIN:VCARD/i.test(trimmed)) return parseVcard(trimmed);

  const email = parseEmail(trimmed);
  if (email) return email;

  if (/^tel:/i.test(trimmed)) {
    const number = safeDecode(trimmed.slice(4)).trim();
    return number ? { kind: "phone", number } : { kind: "text", text };
  }

  if (/^geo:/i.test(trimmed)) {
    const geo = parseGeo(trimmed);
    if (geo) return geo;
  }

  const telegram = parseTelegram(trimmed);
  if (telegram) return telegram;

  const whatsapp = parseWhatsApp(trimmed);
  if (whatsapp) return whatsapp;

  const slack = parseSlack(trimmed);
  if (slack) return slack;

  const url = parseHttpUrl(trimmed);
  if (url) return { kind: "url", url };

  return { kind: "text", text };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Splits `input` on `separator` characters that are not escaped with `\`.
 * Escapes are kept so each part can be unescaped once it is isolated.
 */
function splitUnescaped(input: string, separator: string): string[] {
  const parts: string[] = [];
  let current = "";
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === "\\" && i + 1 < input.length) {
      current += char + input[i + 1];
      i++;
    } else if (char === separator) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

/** `\;` `\,` `\:` `\\` → literal character (WIFI: and MATMSG: escaping). */
function unescapeMecard(value: string): string {
  return value.replace(/\\([;,:\\"])/g, "$1");
}

/** Parses `KEY:value;KEY:value;;` into an upper-cased key map. */
function parseMecardFields(body: string): Map<string, string> {
  const fields = new Map<string, string>();
  for (const part of splitUnescaped(body, ";")) {
    const colon = part.indexOf(":");
    if (colon <= 0) continue;
    const key = part.slice(0, colon).trim().toUpperCase();
    if (!fields.has(key)) {
      fields.set(key, unescapeMecard(part.slice(colon + 1)));
    }
  }
  return fields;
}

function parseWifi(body: string): ParsedContent | null {
  const fields = parseMecardFields(body);
  const ssid = fields.get("S");
  if (!ssid) return null;

  const type = (fields.get("T") ?? "").trim().toUpperCase();
  let security: "WPA" | "WEP" | "nopass";
  if (type.startsWith("WPA") || type === "SAE") security = "WPA";
  else if (type === "WEP") security = "WEP";
  else if (type === "" || type === "NOPASS") security = "nopass";
  else return null;

  const password = fields.get("P") || undefined;
  const hidden = (fields.get("H") ?? "").trim().toLowerCase() === "true";

  return { kind: "wifi", ssid, security, password, hidden };
}

function parseSms(input: string): ParsedContent | null {
  const match = /^sms(?:to)?:([^?]+)(?:\?(.*))?$/i.exec(input);
  if (!match) return null;

  const phone = safeDecode(match[1]).trim();
  if (!phone) return null;

  let message = "";
  if (match[2]) {
    const params = new URLSearchParams(match[2]);
    message = safeDecode(params.get("body") || "").trim();
  }

  return { kind: "sms", phone, message };
}

function parseICalendar(input: string): ParsedContent | null {
  const lines = input.split(/\r?\n/);
  let title = "";
  let dateTime = "";
  let location: string | undefined;
  let description: string | undefined;
  let notification: number | undefined;

  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon <= 0) continue;

    const fieldName = line.slice(0, colon).split(";")[0].trim().toUpperCase();
    const value = line.slice(colon + 1).trim();

    switch (fieldName) {
      case "SUMMARY":
        title = value;
        break;
      case "DTSTART":
        dateTime = value;
        break;
      case "LOCATION":
        location = value;
        break;
      case "DESCRIPTION":
        description = value;
        break;
      case "VALARM":
        // Extract TRIGGER value (minutes before event)
        const triggerMatch = value.match(/-PT(\d+)M/);
        if (triggerMatch) {
          notification = parseInt(triggerMatch[1], 10);
        }
        break;
    }
  }

  if (!title || !dateTime) return null;

  return {
    kind: "icalendar",
    title,
    dateTime,
    location: location || undefined,
    description: description || undefined,
    notification: notification || undefined,
  };
}

/** RFC 5870 `geo:lat,lon?z=zoom` (an optional altitude/params segment is ignored). */
function parseGeo(input: string): ParsedContent | null {
  const match =
    /^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,-?\d+(?:\.\d+)?)?(?:;[^?]*)?(?:\?z=(\d+))?$/i.exec(
      input,
    );
  if (!match) return null;

  const latitude = parseFloat(match[1]);
  const longitude = parseFloat(match[2]);
  if (latitude < -90 || latitude > 90) return null;
  if (longitude < -180 || longitude > 180) return null;

  const zoomLevel = match[3] ? parseInt(match[3], 10) : undefined;
  return { kind: "geo", latitude, longitude, zoomLevel };
}

/** `t.me/@usuario` (user) or `https://t.me/+token` / `t.me/joinchat/token` (group invite). */
function parseTelegram(input: string): ParsedContent | null {
  const match = /^(?:https?:\/\/)?t\.me\/(.+)$/i.exec(input);
  if (!match) return null;

  const rest = match[1].trim();
  if (!rest) return null;

  if (rest.startsWith("+") || /^joinchat\//i.test(rest)) {
    return {
      kind: "telegram",
      type: "group",
      identifier: rest.replace(/^joinchat\//i, "").replace(/^\+/, ""),
      inviteLink: /^https?:\/\//i.test(input) ? input : `https://t.me/${rest}`,
    };
  }

  const username = rest.replace(/^@/, "");
  if (!username) return null;
  return { kind: "telegram", type: "user", identifier: `@${username}` };
}

/** `https://wa.me/1234567890?text=mensaje` or `wa.me/1234567890`. */
function parseWhatsApp(input: string): ParsedContent | null {
  const match = /^(?:https?:\/\/)?wa\.me\/(\d+)(?:\?(.*))?$/i.exec(input);
  if (!match) return null;

  const phone = match[1];
  let message: string | undefined;
  if (match[2]) {
    const params = new URLSearchParams(match[2]);
    const text = params.get("text");
    if (text) message = safeDecode(text);
  }

  return { kind: "whatsapp", phone, message };
}

/** `https://slack.com/app_redirect?channel=...` or `https://join.slack.com/...`. */
function parseSlack(input: string): ParsedContent | null {
  const isAppRedirect = /^https:\/\/slack\.com\/app_redirect\?/i.test(input);
  const isJoinInvite = /^https:\/\/join\.slack\.com\//i.test(input);
  if (!isAppRedirect && !isJoinInvite) return null;

  let workspaceId: string | undefined;
  let channelId: string | undefined;
  try {
    const url = new URL(input);
    if (isAppRedirect) {
      channelId = url.searchParams.get("channel") || undefined;
      workspaceId = url.searchParams.get("team") || undefined;
    } else {
      const parts = url.pathname.split("/").filter(Boolean);
      const teamIndex = parts.indexOf("t");
      if (teamIndex !== -1) workspaceId = parts[teamIndex + 1];
    }
  } catch {
    // keep workspaceId/channelId undefined
  }

  return { kind: "slack", inviteUrl: input, workspaceId, channelId };
}

/** vCard values escape `\n`, `\,`, `\;` and `\\`. */
function unescapeVcard(value: string): string {
  return value.replace(/\\([nN,;\\])/g, (_, char: string) =>
    char === "n" || char === "N" ? "\n" : char,
  );
}

function parseVcard(input: string): ParsedContent {
  // Unfold continuation lines (RFC 6350 §3.2) before splitting.
  const lines = input.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);

  let fn: string | undefined;
  let n: string | undefined;
  let org: string | undefined;
  let title: string | undefined;
  let url: string | undefined;
  const phones: string[] = [];
  const emails: string[] = [];

  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    // `item1.TEL;TYPE=CELL` → `TEL`
    const name = line.slice(0, colon).split(";")[0].split(".").pop()!;
    const rawValue = line.slice(colon + 1).trim();
    if (!rawValue) continue;

    switch (name.trim().toUpperCase()) {
      case "FN":
        fn ??= unescapeVcard(rawValue).trim();
        break;
      case "N":
        n ??= formatStructuredName(rawValue);
        break;
      case "ORG":
        org ??= joinComponents(rawValue, ", ");
        break;
      case "TITLE":
        title ??= unescapeVcard(rawValue).trim();
        break;
      case "TEL": {
        const phone = unescapeVcard(rawValue).replace(/^tel:/i, "").trim();
        if (phone) phones.push(phone);
        break;
      }
      case "EMAIL": {
        const email = unescapeVcard(rawValue).replace(/^mailto:/i, "").trim();
        if (email) emails.push(email);
        break;
      }
      case "URL":
        url ??= unescapeVcard(rawValue).trim();
        break;
    }
  }

  return {
    kind: "vcard",
    name: fn || n || undefined,
    org: org || undefined,
    title: title || undefined,
    phones,
    emails,
    url: url || undefined,
  };
}

function joinComponents(raw: string, separator: string): string {
  return splitUnescaped(raw, ";")
    .map((part) => unescapeVcard(part).trim())
    .filter(Boolean)
    .join(separator);
}

/** `N:Family;Given;Additional;Prefix;Suffix` → "Prefix Given Additional Family Suffix". */
function formatStructuredName(raw: string): string {
  const [family, given, additional, prefix, suffix] = splitUnescaped(
    raw,
    ";",
  ).map((part) => unescapeVcard(part).trim());
  return [prefix, given, additional, family, suffix].filter(Boolean).join(" ");
}

function parseEmail(input: string): ParsedContent | null {
  if (/^mailto:/i.test(input)) {
    const rest = input.slice(7);
    const query = rest.indexOf("?");
    const to = safeDecode(query === -1 ? rest : rest.slice(0, query)).trim();
    if (!to) return null;

    let subject: string | undefined;
    let body: string | undefined;
    if (query !== -1) {
      for (const pair of rest.slice(query + 1).split("&")) {
        const eq = pair.indexOf("=");
        if (eq === -1) continue;
        const key = pair.slice(0, eq).toLowerCase();
        const value = safeDecode(pair.slice(eq + 1));
        if (key === "subject" && subject === undefined) subject = value;
        else if (key === "body" && body === undefined) body = value;
      }
    }
    return { kind: "email", to, subject: subject || undefined, body: body || undefined };
  }

  if (/^MATMSG:/i.test(input)) {
    const fields = parseMecardFields(input.slice(7));
    const to = fields.get("TO")?.trim();
    if (!to) return null;
    return {
      kind: "email",
      to,
      subject: fields.get("SUB") || undefined,
      body: fields.get("BODY") || undefined,
    };
  }

  if (EMAIL_RE.test(input)) return { kind: "email", to: input };

  return null;
}

function parseHttpUrl(input: string): string | null {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// SPEC 05: Detect content kind from text. Applies to QR codes only.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[\d\s\-()]+$/;

export function detectContentKind(text: string, format: BarcodeFormat): ContentKind {
  if (format !== "QR_CODE") return "TEXT";

  const trimmed = text.trim();

  // WiFi
  if (/^WIFI:/i.test(trimmed)) return "WIFI";

  // iCalendar
  if (/^BEGIN:VCALENDAR/i.test(trimmed) && /BEGIN:VEVENT/i.test(trimmed)) {
    return "ICALENDAR";
  }

  // SMS
  if (/^sms:/i.test(trimmed) || /^smsto:/i.test(trimmed)) return "SMS";

  // vCard
  if (/^BEGIN:VCARD/i.test(trimmed) && /END:VCARD/i.test(trimmed)) {
    return "VCARD";
  }

  // mailto: or email pattern
  if (/^mailto:/i.test(trimmed)) return "EMAIL";
  if (EMAIL_PATTERN.test(trimmed)) return "EMAIL";

  // tel: or phone pattern
  if (/^tel:/i.test(trimmed)) return "PHONE";
  if (PHONE_PATTERN.test(trimmed)) return "PHONE";

  // geo: URI (RFC 5870)
  if (/^geo:/i.test(trimmed)) return "GEO";

  // Telegram
  if (/^(?:https?:\/\/)?t\.me\//i.test(trimmed)) return "TELEGRAM";

  // WhatsApp
  if (/^(?:https?:\/\/)?wa\.me\//i.test(trimmed)) return "WHATSAPP";

  // Slack
  if (
    /^https:\/\/slack\.com\/app_redirect\?/i.test(trimmed) ||
    /^https:\/\/join\.slack\.com\//i.test(trimmed)
  ) {
    return "SLACK";
  }

  // http/https URL
  if (/^https?:\/\//.test(trimmed)) return "URL";

  return "TEXT";
}

export function parseVCardData(text: string): VCardData | null {
  if (!/^BEGIN:VCARD/i.test(text)) return null;

  // Unfold continuation lines (RFC 6350 §3.2) before splitting.
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);

  let name: string | undefined;
  let email: string | undefined;
  let phone: string | undefined;
  let organization: string | undefined;
  let jobTitle: string | undefined;
  let url: string | undefined;

  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    // `item1.TEL;TYPE=CELL` → `TEL`
    const fieldName = line.slice(0, colon).split(";")[0].split(".").pop()!;
    const rawValue = line.slice(colon + 1).trim();
    if (!rawValue) continue;

    switch (fieldName.trim().toUpperCase()) {
      case "FN":
        if (!name) name = unescapeVcard(rawValue).trim();
        break;
      case "N":
        if (!name) name = formatStructuredName(rawValue);
        break;
      case "EMAIL":
        if (!email) email = unescapeVcard(rawValue).replace(/^mailto:/i, "").trim();
        break;
      case "TEL":
        if (!phone) phone = unescapeVcard(rawValue).replace(/^tel:/i, "").trim();
        break;
      case "ORG":
        if (!organization) organization = joinComponents(rawValue, ", ");
        break;
      case "TITLE":
        if (!jobTitle) jobTitle = unescapeVcard(rawValue).trim();
        break;
      case "URL":
        if (!url) url = unescapeVcard(rawValue).trim();
        break;
    }
  }

  // Name is required
  if (!name) return null;

  return {
    name,
    email,
    phone,
    organization,
    jobTitle,
    url,
  };
}
