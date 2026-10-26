import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { SUPPORTED_FORMATS } from "@/lib/scan/decoder";
import type { ContentKind, ScanResult, ScanSource } from "@/lib/scan/types";
import { createSafeStorage } from "./storage";

export const HISTORY_KEY = "qrvault-history";
export const HISTORY_VERSION = 1;
export const HISTORY_LIMIT = 50;

// Una entrada del historial: el ScanResult de SPEC 02 más un id estable
// (clave de React, borrado y estado desplegado).
export interface HistoryEntry extends ScanResult {
  id: string;
}

interface HistoryState {
  entries: HistoryEntry[]; // más reciente primero, como máximo HISTORY_LIMIT
  hydrated: boolean; // true tras leer localStorage (o fallar al leerlo)
  persistent: boolean; // false si localStorage no está disponible
  add(result: ScanResult, source?: "generated" | "scanned"): void;
  remove(id: string): void;
  clear(): void;
}

type PersistedHistory = Pick<HistoryState, "entries">;

const SOURCES: readonly ScanSource[] = ["generated", "scanned"];

const CONTENT_KINDS: readonly ContentKind[] = [
  "URL",
  "TEXT",
  "EMAIL",
  "PHONE",
  "VCARD",
  "WIFI",
  "SMS",
  "ICALENDAR",
  "GEO",
  "TELEGRAM",
  "WHATSAPP",
  "SLACK",
];

const { storage: safeStorage, persistent } = createSafeStorage();

// JSON layer over the safe storage. Corrupt JSON reads as "nothing stored",
// so hydration starts empty without throwing or logging.
const jsonStorage: PersistStorage<PersistedHistory, void> = {
  getItem(name) {
    const raw = safeStorage.getItem(name) as string | null;
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => safeStorage.setItem(name, JSON.stringify(value)),
  removeItem: (name) => safeStorage.removeItem(name),
};

function newId(scannedAt: number) {
  return `${scannedAt.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    entry.id !== "" &&
    typeof entry.text === "string" &&
    entry.text !== "" &&
    SUPPORTED_FORMATS.includes(entry.format as ScanResult["format"]) &&
    CONTENT_KINDS.includes(entry.kind as ContentKind) &&
    SOURCES.includes(entry.source as ScanSource) &&
    typeof entry.scannedAt === "number" &&
    Number.isFinite(entry.scannedAt)
  );
}

// Keeps only the known fields, so extra keys in storage are not carried along.
function pick({ id, text, format, kind, source, scannedAt }: HistoryEntry) {
  return { id, text, format, kind, source, scannedAt };
}

const sameCode = (a: ScanResult, b: ScanResult) =>
  a.text === b.text && a.format === b.format;

// Validates what was read from storage: drops malformed entries, removes
// duplicates (text + format) keeping the newest, sorts newest first and caps
// at HISTORY_LIMIT.
function sanitize(persisted: unknown): HistoryEntry[] {
  const raw =
    typeof persisted === "object" && persisted !== null
      ? (persisted as { entries?: unknown }).entries
      : undefined;
  if (!Array.isArray(raw)) return [];

  const sorted = raw
    .filter(isEntry)
    .map(pick)
    .sort((a, b) => b.scannedAt - a.scannedAt);
  const unique: HistoryEntry[] = [];
  for (const entry of sorted) {
    if (!unique.some((kept) => sameCode(kept, entry))) unique.push(entry);
  }
  return unique.slice(0, HISTORY_LIMIT);
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      hydrated: false,
      persistent,
      add(result, source = "scanned") {
        ensureHydrated();
        set(({ entries }) => {
          const existing = entries.find((entry) => sameCode(entry, result));
          const entry: HistoryEntry = {
            id: existing?.id ?? newId(result.scannedAt),
            text: result.text,
            format: result.format,
            kind: result.kind,
            source,
            scannedAt: result.scannedAt,
          };
          const rest = entries.filter((item) => item !== existing);
          return { entries: [entry, ...rest].slice(0, HISTORY_LIMIT) };
        });
      },
      remove(id) {
        set(({ entries }) => ({
          entries: entries.filter((entry) => entry.id !== id),
        }));
      },
      clear() {
        set({ entries: [] });
      },
    }),
    {
      name: HISTORY_KEY,
      version: HISTORY_VERSION,
      storage: jsonStorage,
      skipHydration: true,
      partialize: ({ entries }) => ({ entries }),
      // Another version (e.g. a future v2 opened by an older build) starts
      // empty instead of logging "couldn't be migrated".
      migrate: () => ({ entries: [] }),
      merge: (persisted, current) => ({
        ...current,
        entries: sanitize(persisted),
        hydrated: true,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) useHistoryStore.setState({ hydrated: true });
      },
    },
  ),
);

// Hidrata el store si todavía no lo está. Lo llaman add() y la página /history.
// The storage is synchronous, so the state is up to date when this returns.
export function ensureHydrated(): void {
  if (useHistoryStore.getState().hydrated) return;
  void useHistoryStore.persist.rehydrate();
}
