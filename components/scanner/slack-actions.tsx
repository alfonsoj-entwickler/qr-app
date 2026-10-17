"use client";

import { useDictionary } from "@/components/i18n-provider";
import { parseContent } from "@/lib/scan/parse-content";
import { CopyButton } from "./copy-button";

const secondaryClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-medium hover:bg-background";

interface Props {
  text: string;
}

export function SlackActions({ text }: Props) {
  const dict = useDictionary();
  const content = parseContent(text, "QR_CODE");

  if (content.kind !== "slack") return null;

  return (
    <CopyButton
      text={content.inviteUrl}
      label={dict.scanner.result.slackCopyInvite}
      className={secondaryClass}
    />
  );
}
