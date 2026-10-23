"use client";

import { History, ScanLine, SearchX, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDictionary, useLocale } from "@/components/i18n-provider";
import { FinderFrame } from "@/components/scanner/finder-frame";
import { primaryClass, secondaryClass } from "@/components/scanner/scan-result";
import { filterEntries, type KindFilter } from "@/lib/history/filter";
import { ensureHydrated, useHistoryStore } from "@/lib/history/store";
import { HistoryItem, toggleId } from "./history-item";
import { HistoryToolbar } from "./history-toolbar";

// The page's <h1> (app/[lang]/history/page.tsx), focused when the list empties.
const TITLE_ID = "history-title";
const TICK_MS = 60_000;

export function HistoryView() {
  const dict = useDictionary();
  const locale = useLocale();
  const entries = useHistoryStore((state) => state.entries);
  const hydrated = useHistoryStore((state) => state.hydrated);
  const persistent = useHistoryStore((state) => state.persistent);
  const remove = useHistoryStore((state) => state.remove);
  const clear = useHistoryStore((state) => state.clear);
  // Shared clock for every row's relative time, refreshed on one interval.
  const [now, setNow] = useState(Date.now);
  // Local to the page, so they reset when leaving /history.
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const t = dict.history;
  const visible = filterEntries(entries, query, kind, locale);

  // The store skips hydration, so the server and the first client render
  // both see `hydrated: false` and paint the loading state.
  useEffect(ensureHydrated, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // Moves focus to the next visible row, else the previous one, else the
  // title, before the row (and its focused delete button) leaves the DOM.
  function deleteEntry(index: number) {
    const target = visible[index + 1] ?? visible[index - 1];
    document.getElementById(target ? toggleId(target.id) : TITLE_ID)?.focus();
    remove(visible[index].id);
  }

  // The toolbar unmounts with the list, so focus moves to the title first.
  function clearAll() {
    document.getElementById(TITLE_ID)?.focus();
    clear();
  }

  function resetFilters() {
    setQuery("");
    setKind("all");
  }

  if (!hydrated) {
    return (
      <p aria-busy="true" className="py-2 text-muted">
        {t.loading}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!persistent && (
        <p
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed"
        >
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-muted"
          />
          {t.storageUnavailable}
        </p>
      )}

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-3 sm:p-4">
          {/* An empty scan target, framed like the scanner's. */}
          <div className="relative flex flex-col items-center gap-5 rounded-xl bg-background px-8 py-12 text-center sm:py-16">
            <span aria-hidden="true" className="absolute inset-3 text-line">
              <FinderFrame className="size-6" />
            </span>
            <History aria-hidden="true" className="size-7 text-muted" />
            <p className="max-w-[34ch] leading-relaxed text-balance text-muted">
              {t.empty}
            </p>
            <Link href={`/${locale}`} className={primaryClass}>
              <ScanLine aria-hidden="true" className="size-4" />
              {t.goToScanner}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <HistoryToolbar
            entries={entries}
            query={query}
            kind={kind}
            onQueryChange={setQuery}
            onKindChange={setKind}
            onClear={clearAll}
          />
          <p role="status" aria-live="polite" className="sr-only">
            {query.trim() !== "" || kind !== "all"
              ? t.resultsCount.replace("{n}", String(visible.length))
              : ""}
          </p>
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
              <SearchX aria-hidden="true" className="size-6 text-muted" />
              <p role="status" className="text-muted">
                {t.noMatches}
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className={secondaryClass}
              >
                {t.resetFilters}
              </button>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {visible.map((entry, index) => (
                <HistoryItem
                  key={entry.id}
                  entry={entry}
                  now={now}
                  onDelete={() => deleteEntry(index)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
