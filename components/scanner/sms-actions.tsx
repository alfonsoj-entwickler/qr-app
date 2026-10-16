"use client";

import { useDictionary } from "@/components/i18n-provider";
import { parseContent } from "@/lib/scan/parse-content";
import { CopyButton } from "./copy-button";

const secondaryClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-medium hover:bg-background";

interface Props {
  text: string;
}

export function SmsActions({ text }: Props) {
  const dict = useDictionary();
  const content = parseContent(text, "QR_CODE");

  if (content.kind !== "sms") return null;

  return (
    <>
      <CopyButton
        text={content.phone}
        label={dict.scanner.result.smsCopyPhone}
        className={secondaryClass}
      />
      <CopyButton
        text={content.message}
        label={dict.scanner.result.smsCopyMessage}
        className={secondaryClass}
      />
    </>
  );
}
