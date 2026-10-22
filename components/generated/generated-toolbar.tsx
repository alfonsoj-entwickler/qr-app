"use client";

import { Download, Search } from "lucide-react";
import { useId, useRef, type KeyboardEvent } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { exportGenerated } from "@/lib/generator/export";
import type { KindFilter } from "@/lib/generator/filter";
import type { GeneratedCode } from "@/lib/generator/types";
import { ClearAll, toolbarButtonClass } from "./clear-all";

const kinds: KindFilter[] = ["all", "url", "text"];

// Only mounted with at least one entry (generated-view.tsx), so Export and
// Clear all never show on an empty history.
export function GeneratedToolbar({
  entries,
  query,
  kind,
  onQueryChange,
  onKindChange,
  onClear,
}: {
  entries: GeneratedCode[];
  query: string;
  kind: KindFilter;
  onQueryChange: (query: string) => void;
  onKindChange: (kind: KindFilter) => void;
  onClear: () => void;
}) {
  const dict = useDictionary();
  const id = useId();
  const chipRefs = useRef<
    Partial<Record<KindFilter, HTMLButtonElement | null>>
  >({});
  const t = dict.generated;

  function select(next: KindFilter) {
    onKindChange(next);
    chipRefs.current[next]?.focus();
  }

  // WAI-ARIA radio group: arrow keys move the selection and the focus.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = kinds.indexOf(kind);
    const last = kinds.length - 1;
    const next = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(kinds[next]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor={`${id}-search`} className="sr-only">
            {t.search}
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted"
          />
          <input
            id={`${id}-search`}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t.search}
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-full rounded-full border border-line bg-surface pr-4 pl-10 placeholder:text-muted hover:border-muted"
          />
        </div>
        {/* Always the full list, regardless of the search and filter. */}
        <button
          type="button"
          onClick={() => exportGenerated(entries)}
          title={t.export}
          className={toolbarButtonClass}
        >
          <Download aria-hidden="true" className="size-4" />
          <span className="sr-only sm:not-sr-only">{t.export}</span>
        </button>
        <ClearAll onConfirm={onClear} />
      </div>
      {/* One scrolling row on phones, wrapped from sm on. */}
      <div
        role="radiogroup"
        aria-label={t.filter}
        onKeyDown={onKeyDown}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {kinds.map((option) => {
          const checked = option === kind;
          return (
            <button
              key={option}
              ref={(node) => {
                chipRefs.current[option] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => onKindChange(option)}
              className={`inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm ${
                checked
                  ? "border-foreground bg-foreground font-medium text-background"
                  : "border-line bg-surface text-muted hover:border-muted hover:text-foreground"
              }`}
            >
              {option === "all"
                ? t.all
                : dict.scanner.result.kinds[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
