"use client";

import { THEME_STORAGE_KEY } from "@/lib/theme";

// Runs synchronously while <head> is parsed, before the first paint:
// reads the stored preference (missing/invalid/unavailable ⇒ "system"),
// resolves "system" with prefers-color-scheme and sets <html data-theme>.
const script = `(function(){var p="system";try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(s==="light"||s==="dark"||s==="system")p=s}catch(e){}var t=p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p;document.documentElement.setAttribute("data-theme",t)})()`;

// Client Component so the `type` switch below sees `window`: executable in
// the server HTML, inert `text/plain` when React renders it on the client
// (e.g. switching locale remounts the root layout), which avoids React's
// "Encountered a script tag" error. `ThemeToggle` re-applies the theme then.
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
