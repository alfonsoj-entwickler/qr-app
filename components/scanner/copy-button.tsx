"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDictionary } from "@/components/i18n-provider";

const COPIED_MS = 2000;

/**
 * Shared copy-to-clipboard button: the visible label never changes (so its
 * accessible name stays stable), a sibling sr-only status announces
 * "Copied", and a failed clipboard write shows a visible alert instead of
 * failing silently.
 */
export function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className: string;
}) {
  const dict = useDictionary();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setFailed(true);
      return;
    }
    setFailed(false);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  const Icon = copied ? Check : Copy;
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={copy} className={className}>
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? dict.scanner.result.copied : ""}
      </span>
      {failed && (
        <span role="alert" className="text-xs text-danger">
          {dict.scanner.result.copyFailed}
        </span>
      )}
    </span>
  );
}
