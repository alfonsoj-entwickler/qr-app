import type { GeneratedCodeKind } from "./types";
import { parseContent } from "@/lib/scan/parse-content";

// Loads html5-qrcode on demand to generate QR codes.
// Call only from the browser in a "use client" component.
export async function generateQRCode(
  text: string,
  size: "small" | "medium" | "large",
): Promise<Blob> {
  const sizeMap = { small: 200, medium: 400, large: 600 };
  const dimension = sizeMap[size];

  const QRCode = await import("qrcode");

  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, {
    width: dimension,
    margin: 1,
    color: {
      dark: getThemeColor("foreground"),
      light: getThemeColor("background"),
    },
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to generate QR code"));
    }, "image/png");
  });
}

// Reads the CSS custom property for the given theme color.
// Falls back to light theme defaults if not available.
function getThemeColor(
  color: "foreground" | "background",
): string {
  const htmlElement = document.documentElement;
  const themeValue = htmlElement.getAttribute("data-theme") ?? "light";

  const colorMap = {
    light: {
      foreground: "#141a33",
      background: "#f3f5f8",
    },
    dark: {
      foreground: "#e7eaf6",
      background: "#0f1328",
    },
  };

  const theme = themeValue === "dark" ? "dark" : "light";
  return colorMap[theme][color];
}

// Determines if text is a URL or plain text for the GeneratedCode kind.
export function getGeneratedCodeKind(text: string): GeneratedCodeKind {
  const parsed = parseContent(text, "QR_CODE");
  return parsed.kind === "url" ? "url" : "text";
}

// Downloads the QR code blob as a PNG file with a timestamp-based filename.
export function downloadQRCode(blob: Blob): void {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const MM = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const filename = `qr-${yyyy}-${mm}-${dd}-${hh}-${MM}-${ss}.png`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
