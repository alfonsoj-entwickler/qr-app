"use client";

import { Download, Mail, Phone } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { parseContent, parseVCardData } from "@/lib/scan/parse-content";
import type { ContentKind, ScanResult } from "@/lib/scan/types";
import { CopyButton } from "./copy-button";
import { WiFiActions } from "./wifi-actions";
import { SmsActions } from "./sms-actions";
import { ICalendarActions } from "./icalendar-actions";
import { GeoActions } from "./geo-actions";
import { TelegramActions } from "./telegram-actions";
import { WhatsAppActions } from "./whatsapp-actions";
import { SlackActions } from "./slack-actions";

export const primaryClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90";
export const secondaryClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-medium hover:bg-background";

interface Props {
  result: ScanResult;
}

export function ScanResultActions({ result }: Props) {
  const dict = useDictionary();
  const t = dict.scanner.result;

  switch (result.kind) {
    case "EMAIL":
      return (
        <>
          <EmailButton text={result.text} />
          <CopyButton text={result.text} label={t.copy} className={secondaryClass} />
        </>
      );
    case "PHONE":
      return (
        <>
          <CallButton text={result.text} />
          <CopyButton text={result.text} label={t.copy} className={secondaryClass} />
        </>
      );
    case "VCARD":
      return (
        <>
          <SaveContactButton text={result.text} />
          <CopyButton text={result.text} label={t.copy} className={secondaryClass} />
        </>
      );
    case "URL":
      return (
        <>
          <OpenLinkButton text={result.text} format={result.format} />
          <CopyButton text={result.text} label={t.copy} className={secondaryClass} />
        </>
      );
    case "WIFI":
      return <WiFiActions text={result.text} />;
    case "SMS":
      return <SmsActions text={result.text} />;
    case "ICALENDAR":
      return <ICalendarActions text={result.text} />;
    case "GEO":
      return <GeoActions text={result.text} />;
    case "TELEGRAM":
      return <TelegramActions text={result.text} />;
    case "WHATSAPP":
      return <WhatsAppActions text={result.text} />;
    case "SLACK":
      return <SlackActions text={result.text} />;
    case "TEXT":
      return <CopyButton text={result.text} label={t.copy} className={secondaryClass} />;
    default:
      return null;
  }
}

function EmailButton({ text }: { text: string }) {
  const dict = useDictionary();
  // Extract email from mailto: prefix if present, otherwise use raw text
  const email = text.replace(/^mailto:/i, "").split("?")[0];

  return (
    <a
      href={`mailto:${encodeURI(email)}`}
      className={primaryClass}
    >
      <Mail aria-hidden="true" className="size-4" />
      {dict.scanner.result.sendEmail}
    </a>
  );
}

function CallButton({ text }: { text: string }) {
  const dict = useDictionary();
  // Extract phone number from tel: prefix if present
  const number = text.replace(/^tel:/i, "");

  return (
    <a
      href={`tel:${number.replace(/[\s().\-]/g, "")}`}
      className={primaryClass}
    >
      <Phone aria-hidden="true" className="size-4" />
      {dict.scanner.result.call}
    </a>
  );
}

function SaveContactButton({ text }: { text: string }) {
  const dict = useDictionary();

  function downloadVcard() {
    const vcard = parseVCardData(text);
    const safeName = vcard?.name
      ?.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);

    const blob = new Blob([text], { type: "text/vcard;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${safeName || "contact"}.vcf`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 0);
  }

  return (
    <button
      type="button"
      onClick={downloadVcard}
      className={primaryClass}
    >
      <Download aria-hidden="true" className="size-4" />
      {dict.scanner.result.saveContact}
    </button>
  );
}

function OpenLinkButton({
  text,
  format,
}: {
  text: string;
  format: ScanResult["format"];
}) {
  const dict = useDictionary();
  const parsed = parseContent(text, format);
  if (parsed.kind !== "url") return null;

  return (
    <a
      href={parsed.url}
      target="_blank"
      rel="noopener noreferrer"
      className={primaryClass}
    >
      {dict.scanner.result.open}
      <span className="sr-only"> {dict.scanner.result.newTab}</span>
    </a>
  );
}

