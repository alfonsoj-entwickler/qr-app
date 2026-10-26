import type { StateStorage } from "zustand/middleware";

const PROBE_KEY = "qrvault-probe";

// localStorage wrapped in try/catch. A test write at creation decides whether
// it is usable; if not (server, private mode, blocked site data) everything
// lives in an in-memory Map for this page only. Never throws and never logs,
// unlike zustand's default storage.
export function createSafeStorage(): {
  storage: StateStorage<void>;
  persistent: boolean;
} {
  const memory = new Map<string, string>();
  const persistent = probe();

  const storage: StateStorage<void> = {
    getItem(name) {
      if (persistent) {
        try {
          return localStorage.getItem(name);
        } catch {}
      }
      return memory.get(name) ?? null;
    },
    setItem(name, value) {
      memory.set(name, value);
      if (!persistent) return;
      try {
        localStorage.setItem(name, value);
      } catch {}
    },
    removeItem(name) {
      memory.delete(name);
      if (!persistent) return;
      try {
        localStorage.removeItem(name);
      } catch {}
    },
  };

  return { storage, persistent };
}

function probe(): boolean {
  try {
    localStorage.setItem(PROBE_KEY, "1");
    localStorage.removeItem(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}
