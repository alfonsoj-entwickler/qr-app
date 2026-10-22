"use client";

import { useEffect, useState } from "react";
import { parseContent } from "@/lib/scan/parse-content";
import type { GeneratedCode } from "@/lib/generator/types";
import { generateQRCode } from "@/lib/generator/encoder";

export function GeneratorItemDisplay({
  code,
  headless,
}: {
  code: GeneratedCode;
  headless?: boolean;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const content = parseContent(code.text, "QR_CODE");

  useEffect(() => {
    let mounted = true;

    const loadQR = async () => {
      try {
        const blob = await generateQRCode(code.text, "medium");
        if (mounted) {
          const url = URL.createObjectURL(blob);
          setQrDataUrl(url);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to regenerate QR code:", error);
        if (mounted) setLoading(false);
      }
    };

    loadQR();

    return () => {
      mounted = false;
    };
  }, [code.text]);

  useEffect(() => {
    return () => {
      if (qrDataUrl) URL.revokeObjectURL(qrDataUrl);
    };
  }, [qrDataUrl]);

  if (loading) {
    return <div className="text-center text-sm text-muted">Loading QR code...</div>;
  }

  if (!qrDataUrl) {
    return <div className="text-center text-sm text-muted">Failed to generate QR code</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {!headless && (
        <>
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Original content:</p>
            <p className="text-muted break-all font-mono text-xs bg-background p-2 rounded">
              {code.text}
            </p>
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Kind:</p>
            <p className="text-muted text-xs">
              {content.kind === "url" ? "URL" : "Text"}
            </p>
          </div>
        </>
      )}
      <div className="flex justify-center">
        <img
          src={qrDataUrl}
          alt="QR code"
          className="rounded border border-line max-w-[400px]"
        />
      </div>
    </div>
  );
}
