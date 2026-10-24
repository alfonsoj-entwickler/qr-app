"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useLayoutEffect, useSyncExternalStore } from "react";
import { useDictionary } from "@/components/i18n-provider";
import {
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

const order: ThemePreference[] = ["system", "light", "dark"];
const icons = { system: Monitor, light: Sun, dark: Moon };
const darkQuery = "(prefers-color-scheme: dark)";

// Preference store backed by localStorage. If storage throws (private mode,
// blocked site data) the choice lives in memory for this page only.
let memoryPreference: ThemePreference = "system";
const listeners = new Set<() => void>();

const isPreference = (value: unknown): value is ThemePreference =>
  order.includes(value as ThemePreference);

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(stored) ? stored : "system";
  } catch {
    return memoryPreference;
  }
}

function writePreference(preference: ThemePreference) {
  memoryPreference = preference;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep tabs in sync when another tab changes the theme.
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function applyTheme(preference: ThemePreference) {
  const resolved: ResolvedTheme =
    preference === "system"
      ? matchMedia(darkQuery).matches
        ? "dark"
        : "light"
      : preference;
  document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeToggle() {
  const dict = useDictionary();
  // The server (and hydration) render "system"; React then switches to the
  // stored value without a hydration mismatch.
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    () => "system" as const,
  );

  // Applies the theme on change, re-applies it after React's dev remount
  // clears <html data-theme>, and follows the OS while in "system" mode.
  // Reads the store instead of `preference`: during hydration `preference`
  // is still the server's "system" and would briefly undo the inline script.
  useLayoutEffect(() => {
    const current = readPreference();
    applyTheme(current);
    if (current !== "system") return;
    const media = matchMedia(darkQuery);
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  const next = order[(order.indexOf(preference) + 1) % order.length];
  const Icon = icons[preference];
  const label = `${dict.header.theme.label}: ${dict.header.theme[preference]}`;

  return (
    <button
      type="button"
      onClick={() => writePreference(next)}
      aria-label={label}
      title={label}
      className="inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
