import type { BarcodeFormat, ScanResult, ScanSource } from "./types";
import { detectContentKind } from "./parse-content";

export const SUPPORTED_FORMATS: readonly BarcodeFormat[] = [
  "QR_CODE",
  "EAN_13",
  "EAN_8",
  "UPC_A",
  "UPC_E",
  "CODE_128",
  "CODE_39",
];

// Loads html5-qrcode on demand: it touches `window` on import, so it must
// never be imported statically (see CLAUDE.md). Call only from the browser.
// `elementId` must already be in the DOM.
export async function createDecoder(elementId: string) {
  const { Html5Qrcode, Html5QrcodeSupportedFormats } =
    await import("html5-qrcode");
  return new Html5Qrcode(elementId, {
    verbose: false,
    formatsToSupport: SUPPORTED_FORMATS.map(
      (format) => Html5QrcodeSupportedFormats[format],
    ),
  });
}

/** Lists the video inputs via `Html5Qrcode.getCameras()`, loading the library on demand. */
export async function listCameras() {
  const { Html5Qrcode } = await import("html5-qrcode");
  return Html5Qrcode.getCameras();
}

// Structural subset of html5-qrcode's Html5QrcodeResult, so this module needs
// no import from the library.
interface DecodedResult {
  decodedText: string;
  result: { format?: { formatName: string } };
}

function isSupportedFormat(name: string | undefined): name is BarcodeFormat {
  return SUPPORTED_FORMATS.includes(name as BarcodeFormat);
}

/** Maps a decoder result to a `ScanResult`, or `null` for a format outside the supported list. */
export function toScanResult(
  decoded: DecodedResult,
): ScanResult | null {
  const format = decoded.result.format?.formatName;
  if (!isSupportedFormat(format)) return null;
  return {
    text: decoded.decodedText,
    format,
    kind: detectContentKind(decoded.decodedText, format),
    source: "scanned",
    scannedAt: Date.now(),
  };
}
