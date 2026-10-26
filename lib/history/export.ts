import type { ScanResult } from "@/lib/scan/types";
import type { HistoryEntry } from "./store";

const pad = (n: number) => String(n).padStart(2, "0");

/** `qrvault-history-YYYY-MM-DD.json`, with the local date. */
function fileName(date: Date) {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `qrvault-history-${day}.json`;
}

/**
 * Downloads every entry as a JSON array of ScanResult (no internal id), in
 * the given order, through a Blob and a temporary `<a download>`.
 */
export function exportHistory(entries: HistoryEntry[]): void {
  const results: ScanResult[] = entries.map(
    ({ text, format, kind, source, scannedAt }) => ({
      text,
      format,
      kind,
      source,
      scannedAt,
    }),
  );
  const blob = new Blob([JSON.stringify(results, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName(new Date());
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked on the next task so the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url));
}
