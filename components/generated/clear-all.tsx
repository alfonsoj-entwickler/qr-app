"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useDictionary } from "@/components/i18n-provider";

// Icon-only below sm, next to the search field; the label stays for screen readers.
export const toolbarButtonClass =
  "inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full border border-line bg-surface text-sm font-medium hover:border-muted sm:px-4";

/**
 * "Clear all" with an inline confirmation. Opening it moves focus to
 * "Cancel"; Cancel or Escape closes it and returns focus to "Clear all".
 */
export function ClearAll({ onConfirm }: { onConfirm: () => void }) {
  const dict = useDictionary();
  const id = useId();
  const [confirming, setConfirming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Set right before toggling, so focus only moves on user actions.
  const pendingFocus = useRef<"trigger" | "cancel" | null>(null);
  const t = dict.generated;

  useEffect(() => {
    const target = pendingFocus.current === "cancel" ? cancelRef : triggerRef;
    if (pendingFocus.current) target.current?.focus();
    pendingFocus.current = null;
  }, [confirming]);

  function open() {
    pendingFocus.current = "cancel";
    setConfirming(true);
  }

  function cancel() {
    pendingFocus.current = "trigger";
    setConfirming(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    cancel();
  }

  if (!confirming) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        title={t.clearAll}
        className={toolbarButtonClass}
      >
        <Trash2 aria-hidden="true" className="size-4" />
        <span className="sr-only sm:not-sr-only">{t.clearAll}</span>
      </button>
    );
  }

  // Takes a full row of the toolbar, so the question never wraps around the
  // buttons on a phone.
  return (
    <div
      role="group"
      aria-labelledby={`${id}-question`}
      onKeyDown={onKeyDown}
      className="scan-reveal flex basis-full flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-line bg-surface py-3 pr-3 pl-4"
    >
      <p
        id={`${id}-question`}
        className="flex min-w-0 flex-1 basis-48 items-center gap-2 font-medium"
      >
        <Trash2 aria-hidden="true" className="size-4 shrink-0 text-muted" />
        {t.confirmClear}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90"
        >
          {t.confirm}
        </button>
        <button
          ref={cancelRef}
          type="button"
          onClick={cancel}
          className="inline-flex h-10 items-center rounded-full border border-line px-5 text-sm font-medium hover:bg-background"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
