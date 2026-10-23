import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import type { GeneratedCode, GeneratedCodeKind } from "./types";
import { createSafeStorage } from "@/lib/history/storage";

export const GENERATOR_KEY = "qrvault-generated";
export const GENERATOR_VERSION = 1;
export const GENERATOR_LIMIT = 50;

interface GeneratorState {
  entries: GeneratedCode[]; // más reciente primero, como máximo GENERATOR_LIMIT
  hydrated: boolean; // true tras leer localStorage (o fallar al leerlo)
  persistent: boolean; // false si localStorage no está disponible
  add(code: { text: string; kind: GeneratedCodeKind; generatedAt: number }): void;
  remove(id: string): void;
  clear(): void;
}

type PersistedGenerator = Pick<GeneratorState, "entries">;

const { storage: safeStorage, persistent } = createSafeStorage();

// JSON layer over the safe storage. Corrupt JSON reads as "nothing stored",
// so hydration starts empty without throwing or logging.
const jsonStorage: PersistStorage<PersistedGenerator, void> = {
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

function newId(generatedAt: number) {
  return `${generatedAt.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isEntry(value: unknown): value is GeneratedCode {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    entry.id !== "" &&
    typeof entry.text === "string" &&
    entry.text !== "" &&
    (entry.kind === "text" || entry.kind === "url") &&
    typeof entry.generatedAt === "number" &&
    Number.isFinite(entry.generatedAt)
  );
}

// Keeps only the known fields, so extra keys in storage are not carried along.
function pick({ id, text, kind, generatedAt }: GeneratedCode) {
  return { id, text, kind, generatedAt };
}

const sameCode = (a: GeneratedCode, b: { text: string }) => a.text === b.text;

// Validates what was read from storage: drops malformed entries, removes
// duplicates (text) keeping the newest, sorts newest first and caps
// at GENERATOR_LIMIT.
function sanitize(persisted: unknown): GeneratedCode[] {
  const raw =
    typeof persisted === "object" && persisted !== null
      ? (persisted as { entries?: unknown }).entries
      : undefined;
  if (!Array.isArray(raw)) return [];

  const sorted = raw
    .filter(isEntry)
    .map(pick)
    .sort((a, b) => b.generatedAt - a.generatedAt);
  const unique: GeneratedCode[] = [];
  for (const entry of sorted) {
    if (!unique.some((kept) => sameCode(kept, entry))) unique.push(entry);
  }
  return unique.slice(0, GENERATOR_LIMIT);
}

export const useGeneratorStore = create<GeneratorState>()(
  persist(
    (set) => ({
      entries: [],
      hydrated: false,
      persistent,
      add(code: { text: string; kind: GeneratedCodeKind; generatedAt: number }) {
        ensureHydrated();
        set(({ entries }) => {
          const codeWithoutId = { text: code.text, kind: code.kind, generatedAt: code.generatedAt };
          const existing = entries.find((entry) => sameCode(entry, codeWithoutId));
          const entry: GeneratedCode = {
            id: existing?.id ?? newId(code.generatedAt),
            text: code.text,
            kind: code.kind,
            generatedAt: code.generatedAt,
          };
          const rest = entries.filter((item) => item !== existing);
          return { entries: [entry, ...rest].slice(0, GENERATOR_LIMIT) };
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
      name: GENERATOR_KEY,
      version: GENERATOR_VERSION,
      storage: jsonStorage,
      skipHydration: true,
      partialize: ({ entries }) => ({ entries }),
      // Another version starts empty instead of logging "couldn't be migrated".
      migrate: () => ({ entries: [] }),
      merge: (persisted, current) => ({
        ...current,
        entries: sanitize(persisted),
        hydrated: true,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) useGeneratorStore.setState({ hydrated: true });
      },
    },
  ),
);

// Hidrata el store si todavía no lo está. Lo llaman add() y la página /generated.
// The storage is synchronous, so the state is up to date when this returns.
export function ensureHydrated(): void {
  if (useGeneratorStore.getState().hydrated) return;
  void useGeneratorStore.persist.rehydrate();
}
