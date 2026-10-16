"use client";

import {
  Calendar,
  Download,
} from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { parseContent } from "@/lib/scan/parse-content";

const primaryClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90";
const secondaryClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-medium hover:bg-background";

interface Props {
  text: string;
}

export function ICalendarActions({ text }: Props) {
  const content = parseContent(text, "QR_CODE");

  if (content.kind !== "icalendar") return null;

  return (
    <>
      <DownloadIcsButton text={text} />
      <OpenCalendarButton text={text} />
    </>
  );
}

function DownloadIcsButton({ text }: { text: string }) {
  const dict = useDictionary();

  function handleDownload() {
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[:-]/g, "")
      .replace(/\.\d{3}/, "");
    const filename = `icalendar-${timestamp}.ics`;

    const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 0);
  }

  return (
    <button type="button" onClick={handleDownload} className={primaryClass}>
      <Download aria-hidden="true" className="size-4" />
      {dict.scanner.result.icalendarDownload}
    </button>
  );
}

function OpenCalendarButton({ text }: { text: string }) {
  const dict = useDictionary();

  function handleOpen() {
    const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = href;
    link.type = "text/calendar";

    try {
      link.click();
    } finally {
      setTimeout(() => URL.revokeObjectURL(href), 100);
    }
  }

  return (
    <button type="button" onClick={handleOpen} className={secondaryClass}>
      <Calendar aria-hidden="true" className="size-4" />
      {dict.scanner.result.icalendarOpen}
    </button>
  );
}
