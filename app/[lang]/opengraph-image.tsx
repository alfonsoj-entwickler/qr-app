import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { defaultLocale, hasLocale } from "@/lib/i18n/config";
import { getDictionaryForLocale } from "./dictionaries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Doesn't depend on request data, so read it once at module scope.
const logoData = await readFile(
  join(process.cwd(), "public/icons/android-chrome-512x512.png"),
  "base64",
);
const logoSrc = `data:image/png;base64,${logoData}`;

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionaryForLocale(
    hasLocale(lang) ? lang : defaultLocale,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          padding: "80px 96px",
          background: "#0f1328",
          color: "#e7eaf6",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 36,
            fontWeight: 600,
            color: "#8c9bff",
          }}
        >
          <img src={logoSrc} width={48} height={48} style={{ borderRadius: 12 }} alt="" />
          {dict.meta.title}
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
          {dict.home.title}
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#b7bde0", maxWidth: 900 }}>
          {dict.meta.homeDescription}
        </div>
      </div>
    ),
    size,
  );
}
