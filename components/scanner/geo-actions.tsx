"use client";

import { MapPin } from "lucide-react";
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

export function GeoActions({ text }: Props) {
  const dict = useDictionary();
  const content = parseContent(text, "QR_CODE");

  if (content.kind !== "geo") return null;

  return (
    <>
      <OpenMapsButton latitude={content.latitude} longitude={content.longitude} />
      <CopyButton
        text={`${content.latitude}, ${content.longitude}`}
        label={dict.scanner.result.geoCopyLocation}
        className={secondaryClass}
      />
    </>
  );
}

function OpenMapsButton({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const dict = useDictionary();

  return (
    <a
      href={`https://maps.google.com/?q=${latitude},${longitude}`}
      target="_blank"
      rel="noopener noreferrer"
      className={primaryClass}
    >
      <MapPin aria-hidden="true" className="size-4" />
      {dict.scanner.result.geoOpenMaps}
      <span className="sr-only"> {dict.scanner.result.newTab}</span>
    </a>
  );
}
