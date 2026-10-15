"use client";

import {
  Calendar,
  Contact,
  Eye,
  EyeOff,
  Hash,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Text,
  Wifi,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useDictionary } from "@/components/i18n-provider";
import { parseContent, type ParsedContent } from "@/lib/scan/parse-content";
import type { ScanResult as ScanResultData } from "@/lib/scan/types";
import { ScanResultActions } from "./scan-result-actions";

export const primaryClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90";
export const secondaryClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-medium hover:bg-background";
// Inline actions next to a vCard phone or email.
const inlineClass =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-medium hover:bg-background";

export const kindIcons = {
  url: Link2,
  email: Mail,
  phone: Phone,
  wifi: Wifi,
  sms: MessageSquare,
  icalendar: Calendar,
  vcard: Contact,
  geo: MapPin,
  telegram: Send,
  whatsapp: MessageCircle,
  slack: Hash,
  text: Text,
} satisfies Record<ParsedContent["kind"], unknown>;

// For links and text the raw text is the content, so it reads large; the
// other kinds show their fields first and the raw text as the source.
const sourceClass = "max-h-40 p-3 font-mono text-xs text-muted";
const rawClass: Record<ParsedContent["kind"], string> = {
  url: "max-h-64 p-4 font-mono text-[0.9375rem]",
  text: "max-h-64 p-4 text-base",
  email: sourceClass,
  phone: sourceClass,
  wifi: sourceClass,
  sms: sourceClass,
  icalendar: sourceClass,
  vcard: sourceClass,
  geo: sourceClass,
  telegram: sourceClass,
  whatsapp: sourceClass,
  slack: sourceClass,
};

/**
 * `headless` drops the icon, kind and format header for places that already
 * show them, like an expanded history row; the card keeps its accessible name.
 */
export function ScanResult({
  result,
  headless = false,
  autoFocusTitle = false,
}: {
  result: ScanResultData;
  headless?: boolean;
  autoFocusTitle?: boolean;
}) {
  const dict = useDictionary();
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const content = useMemo(
    () => parseContent(result.text, result.format),
    [result.text, result.format],
  );
  const t = dict.scanner.result;

  const Icon = kindIcons[content.kind];

  useEffect(() => {
    if (autoFocusTitle) titleRef.current?.focus();
    // Only on mount: a new result means a new ScanResult instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <article
      aria-labelledby={headless ? undefined : titleId}
      aria-label={headless ? `${t.title}: ${t.kinds[content.kind]}` : undefined}
      className="scan-reveal flex flex-col gap-4"
    >
      {!headless && (
        <header className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h2
              id={titleId}
              ref={titleRef}
              tabIndex={-1}
              className="text-lg leading-tight font-semibold focus:outline-none"
            >
              <span className="sr-only">{t.title}: </span>
              {t.kinds[content.kind]}
            </h2>
            <p className="text-sm text-muted">
              {dict.scanner.formats[result.format]}
            </p>
          </div>
        </header>
      )}

      <Details content={content} />

      <p
        tabIndex={0}
        role="region"
        aria-label={t.rawContent}
        className={`overflow-y-auto rounded-xl bg-background leading-relaxed whitespace-pre-wrap wrap-anywhere ${rawClass[content.kind]}`}
      >
        {result.text}
      </p>

      <div className="flex flex-wrap gap-2">
        <ScanResultActions result={result} />
      </div>
    </article>
  );
}

function Details({ content }: { content: ParsedContent }) {
  const dict = useDictionary();
  const f = dict.scanner.result.fields;

  switch (content.kind) {
    case "email":
      return (
        <Fields>
          <Field label={f.to}>{content.to}</Field>
          {content.subject && (
            <Field label={f.subject}>{content.subject}</Field>
          )}
          {content.body && <Field label={f.body}>{content.body}</Field>}
        </Fields>
      );
    case "phone":
      return (
        <p className="text-2xl font-medium tracking-tight wrap-anywhere">
          {content.number}
        </p>
      );
    case "wifi":
      return (
        <Fields>
          <Field label={f.ssid}>{content.ssid}</Field>
          <Field label={f.security}>
            {content.security === "nopass" ? f.noPassword : content.security}
          </Field>
          {content.password && (
            <Field label={f.password}>
              <WifiPassword password={content.password} />
            </Field>
          )}
        </Fields>
      );
    case "vcard": {
      const url = content.url && httpUrl(content.url);
      return (
        <Fields>
          {content.name && <Field label={f.name}>{content.name}</Field>}
          {content.org && <Field label={f.org}>{content.org}</Field>}
          {content.title && <Field label={f.title}>{content.title}</Field>}
          {content.phones.length > 0 && (
            <Field label={f.phones}>
              <ul className="flex flex-col gap-1.5">
                {content.phones.map((phone, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    <span>{phone}</span>
                    <CallLink number={phone} />
                  </li>
                ))}
              </ul>
            </Field>
          )}
          {content.emails.length > 0 && (
            <Field label={f.emails}>
              <ul className="flex flex-col gap-1.5">
                {content.emails.map((email, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    <span className="wrap-anywhere">{email}</span>
                    <EmailLink to={email} />
                  </li>
                ))}
              </ul>
            </Field>
          )}
          {content.url && (
            <Field label={f.url}>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  {content.url}
                </a>
              ) : (
                content.url
              )}
            </Field>
          )}
        </Fields>
      );
    }
    case "sms":
      return (
        <Fields>
          <Field label={f.phone}>{content.phone}</Field>
          {content.message && (
            <Field label={f.message}>{content.message}</Field>
          )}
        </Fields>
      );
    case "icalendar":
      return (
        <Fields>
          <Field label={f.title}>{content.title}</Field>
          <Field label={f.dateTime}>{content.dateTime}</Field>
          {content.location && (
            <Field label={f.location}>{content.location}</Field>
          )}
          {content.description && (
            <Field label={f.description}>{content.description}</Field>
          )}
          {content.notification && (
            <Field label={f.notification}>{content.notification} min</Field>
          )}
        </Fields>
      );
    case "geo":
      return (
        <Fields>
          <Field label={f.latitude}>{content.latitude}</Field>
          <Field label={f.longitude}>{content.longitude}</Field>
          {content.zoomLevel !== undefined && (
            <Field label={f.zoomLevel}>{content.zoomLevel}</Field>
          )}
        </Fields>
      );
    case "telegram":
      return (
        <Fields>
          <Field label={f.telegramType}>
            {content.type === "user" ? f.telegramUser : f.telegramGroup}
          </Field>
          <Field label={f.telegramIdentifier}>{content.identifier}</Field>
          {content.inviteLink && (
            <Field label={f.telegramInviteLink}>{content.inviteLink}</Field>
          )}
        </Fields>
      );
    case "whatsapp":
      return (
        <Fields>
          <Field label={f.phone}>{content.phone}</Field>
          {content.message && (
            <Field label={f.message}>{content.message}</Field>
          )}
        </Fields>
      );
    case "slack":
      return (
        <Fields>
          {content.workspaceId && (
            <Field label={f.slackWorkspace}>{content.workspaceId}</Field>
          )}
          {content.channelId && (
            <Field label={f.slackChannel}>{content.channelId}</Field>
          )}
        </Fields>
      );
    default:
      return null;
  }
}

function Fields({ children }: { children: ReactNode }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(6rem,auto)_1fr]">
      {children}
    </dl>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:col-span-2 sm:grid-cols-subgrid sm:items-baseline">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 wrap-anywhere">{children}</dd>
    </div>
  );
}

function WifiPassword({ password }: { password: string }) {
  const dict = useDictionary();
  const t = dict.scanner.result;
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <span className="flex flex-wrap items-center gap-2">
      {visible ? (
        <span className="font-mono">{password}</span>
      ) : (
        <>
          <span aria-hidden="true" className="font-mono">
            {"•".repeat(Math.min(password.length, 12))}
          </span>
          <span className="sr-only">{t.passwordHidden}</span>
        </>
      )}
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-medium hover:bg-background"
      >
        <Icon aria-hidden="true" className="size-3.5" />
        {visible ? t.hidePassword : t.showPassword}
      </button>
    </span>
  );
}

function CallLink({ number, primary }: { number: string; primary?: boolean }) {
  const dict = useDictionary();
  return (
    <a
      href={`tel:${number.replace(/[\s().-]/g, "")}`}
      className={primary ? primaryClass : inlineClass}
    >
      <Phone aria-hidden="true" className="size-4" />
      {dict.scanner.result.call}
    </a>
  );
}

function EmailLink({
  to,
  subject,
  body,
  primary,
}: {
  to: string;
  subject?: string;
  body?: string;
  primary?: boolean;
}) {
  const dict = useDictionary();
  const query = new URLSearchParams();
  if (subject) query.set("subject", subject);
  if (body) query.set("body", body);
  // mailto: wants %20 for spaces, not URLSearchParams' "+".
  const search = query.toString().replace(/\+/g, "%20");
  // encodeURIComponent (not encodeURI) so a `to` smuggled from scanned/vCard
  // content can't inject its own `?bcc=`/`&body=` query parameters.
  const address = encodeURIComponent(to);

  return (
    <a
      href={`mailto:${address}${search ? `?${search}` : ""}`}
      className={primary ? primaryClass : inlineClass}
    >
      <Mail aria-hidden="true" className="size-4" />
      {dict.scanner.result.sendEmail}
    </a>
  );
}

/** Returns the URL only when it parses as http(s), so other schemes never become links. */
function httpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

