"use client";

import { ChevronDown, Scan, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { kindIcons, ScanResult } from "@/components/scanner/scan-result";
import { summarize } from "@/lib/history/filter";
import type { HistoryEntry } from "@/lib/history/store";
import { parseContent } from "@/lib/scan/parse-content";
import { RelativeTime } from "./relative-time";

const sourceIcons = { generated: Sparkles, scanned: Scan };

/** Id of the row's toggle button, so the list can move focus after a delete. */
export const toggleId = (entryId: string) => `history-toggle-${entryId}`;

export function HistoryItem({
  entry,
  now,
  onDelete,
}: {
  entry: HistoryEntry;
  now: number;
  onDelete: () => void;
}) {
  const dict = useDictionary();
  const [expanded, setExpanded] = useState(false);
  const content = parseContent(entry.text, entry.format);
  const Icon = kindIcons[content.kind];
  const SourceIcon = sourceIcons[entry.source];
  const panelId = `history-panel-${entry.id}`;

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
            {/* Wraps on phones instead of cutting the format or the time. */}
            <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
              <span className="shrink-0 text-foreground">
                {dict.scanner.result.kinds[content.kind]}
              </span>
              <span className="truncate">
                {dict.scanner.formats[entry.format]}
              </span>
              <span
                title={dict.history.sources[entry.source]}
                className="inline-flex shrink-0 items-center"
              >
                <SourceIcon aria-hidden="true" className="size-4" />
                <span className="sr-only">
                  {dict.history.sources[entry.source]}
                </span>
              </span>
              <span className="shrink-0 tabular-nums sm:ml-auto sm:pl-1">
                <RelativeTime timestamp={entry.scannedAt} now={now} />
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
          aria-label={`${dict.history.delete}: ${summarize(content)}`}
          title={dict.history.delete}
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
        {/* Mounted only while open, so 50 rows do not render 50 cards. The
            row already shows the kind and format, so the card skips them. */}
        {expanded && <ScanResult result={entry} headless />}
      </div>
    </li>
  );
}
