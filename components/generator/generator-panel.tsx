"use client";

import { Download, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { useGeneratorStore } from "@/lib/generator/store";
import { useHistoryStore } from "@/lib/history/store";
import { detectContentKind, parseContent } from "@/lib/scan/parse-content";
import {
  downloadQRCode,
  generateQRCode,
  getGeneratedCodeKind,
} from "@/lib/generator/encoder";
import {
  ContentTypeSelector,
  type ContentFormData,
} from "./content-type-selector";

type Size = "small" | "medium" | "large";

export function GeneratorPanel() {
  const dict = useDictionary();
  const t = dict.generate;
  const [size, setSize] = useState<Size>("medium");
  const [generating, setGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrText, setQrText] = useState<string | null>(null);
  const [error, setError] = useState<"generate" | "download" | null>(null);

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  // Set right before clearing the result, so focus only moves on that action.
  const pendingFocus = useRef<"result" | "form" | null>(null);

  useEffect(() => {
    if (pendingFocus.current === "result") resultHeadingRef.current?.focus();
    else if (pendingFocus.current === "form")
      document.getElementById("content-type")?.focus();
    pendingFocus.current = null;
  }, [qrDataUrl]);

  function buildVCardText(data: ContentFormData["vcard"]): string {
    if (!data) return "";
    const lines = ["BEGIN:VCARD", "VERSION:3.0"];

    if (data.name) {
      lines.push(`FN:${data.name}`);
    }
    if (data.email) {
      lines.push(`EMAIL:${data.email}`);
    }
    if (data.phone) {
      lines.push(`TEL:${data.phone}`);
    }
    if (data.organization) {
      lines.push(`ORG:${data.organization}`);
    }
    if (data.jobTitle) {
      lines.push(`TITLE:${data.jobTitle}`);
    }
    if (data.url) {
      lines.push(`URL:${data.url}`);
    }

    lines.push("END:VCARD");
    return lines.join("\n");
  }

  function buildWiFiText(data: ContentFormData["wifi"]): string {
    if (!data) return "";
    const security = data.security === "WPA3" ? "WPA" : "WPA";
    return `WIFI:T:${security};S:${data.ssid};P:${data.password};;`;
  }

  function buildSmsText(data: ContentFormData["sms"]): string {
    if (!data) return "";
    const message = encodeURIComponent(data.message);
    return `sms:${data.phone}?body=${message}`;
  }

  function buildICalendarText(data: ContentFormData["icalendar"]): string {
    if (!data) return "";
    const dateTime = `${data.date.replace(/-/g, "")}T${data.time.replace(/:/g, "")}00`;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:3.0",
      "PRODID:-//QRVault//QRVault 1.0//EN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@qrvault`,
      `DTSTART:${dateTime}`,
      `SUMMARY:${data.title}`,
    ];

    if (data.location) {
      lines.push(`LOCATION:${data.location}`);
    }
    if (data.description) {
      lines.push(`DESCRIPTION:${data.description}`);
    }
    if (data.notification) {
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push("TRIGGER:-PT" + data.notification + "M");
      lines.push("END:VALARM");
    }

    lines.push("END:VEVENT");
    lines.push("END:VCALENDAR");
    return lines.join("\n");
  }

  function buildGeoText(data: ContentFormData["geo"]): string {
    if (!data) return "";
    return `geo:${data.latitude},${data.longitude}?z=${data.zoomLevel}`;
  }

  function buildTelegramText(data: ContentFormData["telegram"]): string {
    if (!data) return "";
    if (data.type === "user") {
      const username = data.username.startsWith("@")
        ? data.username
        : `@${data.username}`;
      return `t.me/${username}`;
    }
    return data.inviteLink || "";
  }

  function buildWhatsAppText(data: ContentFormData["whatsapp"]): string {
    if (!data) return "";
    const digits = data.phone.replace(/[^\d]/g, "");
    if (!data.message.trim()) return `https://wa.me/${digits}`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(data.message)}`;
  }

  function buildSlackText(data: ContentFormData["slack"]): string {
    if (!data) return "";
    return data.url;
  }

  function encodeContent(formData: ContentFormData): string {
    switch (formData.type) {
      case "Text":
        return formData.text || "";
      case "Email":
        return `mailto:${formData.email}`;
      case "Phone":
        return `tel:${formData.phone}`;
      case "vCard":
        return buildVCardText(formData.vcard);
      case "WiFi":
        return buildWiFiText(formData.wifi);
      case "SMS":
        return buildSmsText(formData.sms);
      case "iCalendar":
        return buildICalendarText(formData.icalendar);
      case "Geo":
        return buildGeoText(formData.geo);
      case "Telegram":
        return buildTelegramText(formData.telegram);
      case "WhatsApp":
        return buildWhatsAppText(formData.whatsapp);
      case "Slack":
        return buildSlackText(formData.slack);
      default:
        return "";
    }
  }

  async function handleContentSubmit(formData: ContentFormData) {
    const content = encodeContent(formData);
    if (!content.trim()) return;

    setGenerating(true);
    setError(null);
    try {
      const blob = await generateQRCode(content, size);
      const url = URL.createObjectURL(blob);
      pendingFocus.current = "result";
      setQrDataUrl(url);
      setQrText(content);

      const generatedAt = Date.now();
      const kind = getGeneratedCodeKind(content);

      // Add to generator store
      useGeneratorStore.getState().add({
        text: content,
        kind,
        generatedAt,
      });

      // Add to history store with source: 'generated'
      useHistoryStore.getState().add(
        {
          text: content,
          format: "QR_CODE",
          kind: detectContentKind(content, "QR_CODE"),
          source: "scanned",
          scannedAt: generatedAt,
        },
        "generated"
      );
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      setError("generate");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload() {
    if (!qrDataUrl) return;

    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      downloadQRCode(blob);
    } catch (error) {
      console.error("Failed to download QR code:", error);
      setError("download");
    }
  }

  function handleGenerateAnother() {
    pendingFocus.current = "form";
    setQrDataUrl(null);
    setQrText(null);
    setError(null);
  }

  function handleSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSize(e.currentTarget.value as Size);
  }

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (qrDataUrl) URL.revokeObjectURL(qrDataUrl);
    };
  }, [qrDataUrl]);

  const qrAlt = qrText
    ? `${t.qrAlt}: ${dict.scanner.result.kinds[parseContent(qrText, "QR_CODE").kind]}`
    : t.qrAlt;

  return (
    <div className="flex flex-col gap-4">
      {!qrDataUrl ? (
        <>
          <ContentTypeSelector
            onSubmit={handleContentSubmit}
            isLoading={generating}
          />

          <div className="space-y-2">
            <label htmlFor="size-select" className="block text-sm font-medium">
              {t["size-label"]}
            </label>
            <select
              id="size-select"
              value={size}
              onChange={handleSizeChange}
              disabled={generating}
              className="w-full rounded-lg border border-field-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="small">{t["size-small"]} (200×200)</option>
              <option value="medium">{t["size-medium"]} (400×400)</option>
              <option value="large">{t["size-large"]} (600×600)</option>
            </select>
          </div>

          {error === "generate" && (
            <p role="alert" className="text-sm text-danger">
              {t["generate-error"]}
            </p>
          )}
        </>
      ) : null}

      {qrDataUrl && (
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-background p-4">
          <h2
            ref={resultHeadingRef}
            tabIndex={-1}
            className="text-sm font-medium focus:outline-none"
          >
            {t["result-title"]}
          </h2>

          <div className="flex justify-center">
            <img
              src={qrDataUrl}
              alt={qrAlt}
              className="rounded border border-line max-h-64"
            />
          </div>

          {error === "download" && (
            <p role="alert" className="text-sm text-danger">
              {t["generate-error"]}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              <Download className="size-4" />
              {t["download-button"]}
            </button>
            <button
              onClick={handleGenerateAnother}
              className="flex items-center justify-center gap-2 flex-1 rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-background"
            >
              {t["generate-button"]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
