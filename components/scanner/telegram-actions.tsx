"use client";

import { useDictionary } from "@/components/i18n-provider";
import { parseContent } from "@/lib/scan/parse-content";
import { CopyButton } from "./copy-button";

const secondaryClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-medium hover:bg-background";

interface Props {
  text: string;
}

export function TelegramActions({ text }: Props) {
  const dict = useDictionary();
  const content = parseContent(text, "QR_CODE");

  if (content.kind !== "telegram") return null;

  const link =
    content.type === "user"
      ? `https://t.me/${content.identifier.replace(/^@/, "")}`
      : content.inviteLink;

  if (!link) return null;

  return (
    <CopyButton
      text={link}
      label={dict.scanner.result.telegramCopyLink}
      className={secondaryClass}
    />
  );
}
