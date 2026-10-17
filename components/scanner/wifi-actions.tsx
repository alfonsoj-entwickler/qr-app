"use client";

import { Smartphone, Wifi } from "lucide-react";
import { useId, useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { parseContent } from "@/lib/scan/parse-content";
import { CopyButton } from "./copy-button";

const primaryClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:opacity-90";
const secondaryClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-medium hover:bg-background";

interface Props {
  text: string;
}

export function WiFiActions({ text }: Props) {
  const dict = useDictionary();
  const t = dict.scanner.result;
  const content = parseContent(text, "QR_CODE");

  if (content.kind !== "wifi") return null;

  const isAndroid = /android/i.test(navigator.userAgent);

  return (
    <>
      {isAndroid ? (
        <ConnectWiFiButton ssid={content.ssid} password={content.password ?? ""} />
      ) : (
        <ManualWiFiButton ssid={content.ssid} security={content.security} />
      )}
      {content.password && (
        <CopyButton
          text={content.password}
          label={t.wifiCopyPassword}
          className={secondaryClass}
        />
      )}
    </>
  );
}

function ConnectWiFiButton({
  ssid,
  password,
}: {
  ssid: string;
  password: string;
}) {
  const dict = useDictionary();

  function handleConnect() {
    const wifiUrl = `wifi:SSID=${encodeURIComponent(ssid)};TYPE=WPA;PASSWORD=${encodeURIComponent(password)};;`;
    window.location.href = wifiUrl;
  }

  return (
    <button type="button" onClick={handleConnect} className={primaryClass}>
      <Wifi aria-hidden="true" className="size-4" />
      {dict.scanner.result.wifiConnect}
    </button>
  );
}

function ManualWiFiButton({
  ssid,
}: {
  ssid: string;
  security: string;
}) {
  const dict = useDictionary();
  const t = dict.scanner.result;
  const instructionsId = useId();
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={showInstructions}
        aria-controls={instructionsId}
        onClick={() => setShowInstructions(!showInstructions)}
        className={primaryClass}
      >
        <Smartphone aria-hidden="true" className="size-4" />
        {t.wifiHowToConnect}
      </button>
      {showInstructions && (
        <div
          id={instructionsId}
          className="col-span-full text-sm text-muted p-3 bg-background rounded-lg border border-line"
        >
          <p className="font-medium mb-2">{t.wifiInstructions}</p>
          <ol className="list-decimal list-inside space-y-1">
            {t.wifiSteps.map((step, i) => (
              <li key={i}>
                {i === 1 ? (
                  <>
                    {step} <span className="font-mono">{ssid}</span>
                  </>
                ) : (
                  step
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
