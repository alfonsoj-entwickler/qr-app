"use client";

import { ChevronDown, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { kindIcons } from "@/components/scanner/scan-result";
import { summarize } from "@/lib/generator/filter";
import type { GeneratedCode } from "@/lib/generator/types";
import { parseContent } from "@/lib/scan/parse-content";
import { RelativeTime } from "./relative-time";
import { GeneratorItemDisplay } from "./generator-item-display";

/** Id of the row's toggle button, so the list can move focus after a delete. */
export const toggleId = (entryId: string) => `generated-toggle-${entryId}`;

export function GeneratedItem({
  entry,
  now,
  onDelete,
}: {
  entry: GeneratedCode;
  now: number;
  onDelete: () => void;
}) {
  const dict = useDictionary();
  const [expanded, setExpanded] = useState(false);
  const content = parseContent(entry.text, "QR_CODE");
  const Icon = kindIcons[content.kind];
  const panelId = `generated-panel-${entry.id}`;

  return (
    <li className={expanded ? "bg-background/60 dark:bg-background/40" : ""}>
      <div className="flex items-center gap-1 pr-1.5 sm:pr-3">
        <button
          type="button"
          id={toggleId(entry.id)}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded(!expanded)}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl py-3 pl-3 text-left outline-offset-[-2px] sm:gap-4 sm:py-3.5 sm:pl-4"
        >
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
              expanded
                ? "bg-foreground text-background"
                : "bg-background text-foreground group-hover:bg-line/60"
            }`}
          >
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span
              className={`truncate ${content.kind === "url" ? "font-mono text-[0.9375rem]" : ""} font-medium`}
            >
              {summarize(content)}
            </span>
            {/* Wraps on phones instead of cutting the kind or the time. */}
            <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
              <span className="shrink-0 text-foreground">
                {dict.scanner.result.kinds[content.kind]}
              </span>
              <span className="shrink-0 tabular-nums sm:ml-auto sm:pl-1">
                <RelativeTime timestamp={entry.generatedAt} now={now} />
              </span>
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`size-5 shrink-0 text-muted transition-transform motion-reduce:transition-none ${expanded ? "rotate-180 text-foreground" : ""}`}
          />
        </button>
        <button
          type="button"
          aria-label={`${dict.generated.delete}: ${summarize(content)}`}
          title={dict.generated.delete}
          onClick={onDelete}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground"
        >
          <Trash2 aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div
        id={panelId}
        hidden={!expanded}
        className="px-3 pb-4 sm:pr-[4.25rem] sm:pb-5 sm:pl-[4.5rem]"
      >
        {/* Mounted only while open, so 50 rows do not render 50 QR codes. */}
        {expanded && <GeneratorItemDisplay code={entry} />}
      </div>
    </li>
  );
}
