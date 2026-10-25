import { notFound } from "next/navigation";

// Catches every unknown path under a locale so it renders the translated
// app/[lang]/not-found.tsx instead of Next's default 404.
export default function CatchAll() {
  notFound();
}
