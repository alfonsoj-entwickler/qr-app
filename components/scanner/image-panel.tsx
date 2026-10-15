"use client";

import { ImageUp } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useDictionary } from "@/components/i18n-provider";
import { useHistoryStore } from "@/lib/history/store";
import { createDecoder, toScanResult } from "@/lib/scan/decoder";
import {
  playSuccessFeedback,
  readSoundOn,
  unlockAudio,
} from "@/lib/scan/feedback";
import { parseContent } from "@/lib/scan/parse-content";
import type { ScanResult as ScanResultData } from "@/lib/scan/types";
import { FinderFrame } from "./finder-frame";
import { ScanResult } from "./scan-result";

type Decoder = Awaited<ReturnType<typeof createDecoder>>;

type ImageState =
  | { status: "idle" }
  | { status: "not-image" }
  | { status: "decoding"; preview: string }
  | { status: "result"; preview: string; result: ScanResultData }
  | { status: "not-found"; preview: string };

export function ImagePanel() {
  const dict = useDictionary();
  const t = dict.scanner.image;
  // html5-qrcode draws its working canvases into this hidden element.
  const decoderId = `${useId()}-decoder`;
  const [state, setState] = useState<ImageState>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const decoder = useRef<Decoder | null>(null);
  const preview = useRef<string | null>(null);
  // Ignores results of a file that was replaced while it was decoding.
  const latest = useRef(0);

  function replacePreview(next: string | null) {
    if (preview.current) URL.revokeObjectURL(preview.current);
    preview.current = next;
  }

  async function scan(file: File) {
    const request = ++latest.current;
    if (!file.type.startsWith("image/")) {
      replacePreview(null);
      setLiveMessage(dict.scanner.errors.notImage);
      setState({ status: "not-image" });
      return;
    }
    const url = URL.createObjectURL(file);
    replacePreview(url);
    setState({ status: "decoding", preview: url });
    setLiveMessage(t.decoding);

    let result: ScanResultData | null = null;
    try {
      decoder.current ??= await createDecoder(decoderId);
      result = toScanResult(
        await decoder.current.scanFileV2(file, false),
      );
    } catch {
      // No code found, unreadable image or library failure: all "not found".
    }
    if (request !== latest.current) return;
    if (result) {
      useHistoryStore.getState().add(result, "scanned");
      playSuccessFeedback(readSoundOn());
      const kind = parseContent(result.text, result.format).kind;
      setLiveMessage(
        `${dict.scanner.result.title}: ${dict.scanner.result.kinds[kind]}`,
      );
      setState({ status: "result", preview: url, result });
    } else {
      setLiveMessage(dict.scanner.errors.notFound);
      setState({ status: "not-found", preview: url });
    }
  }

  // Keep the latest `scan` for the document-level paste listener.
  const scanRef = useRef(scan);
  useEffect(() => {
    scanRef.current = scan;
  });

  useEffect(() => {
    const requests = latest;
    function onPaste(event: ClipboardEvent) {
      const file = event.clipboardData?.files[0];
      if (!file) return;
      event.preventDefault();
      unlockAudio();
      void scanRef.current(file);
    }
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("paste", onPaste);
      // Drop any decode still in flight.
      requests.current++;
      replacePreview(null);
      decoder.current?.clear();
    };
  }, []);

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so choosing the same file again fires `change`.
    event.target.value = "";
    if (file) void scan(file);
  }

  function onDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  }

  function onDragLeave(event: DragEvent<HTMLLabelElement>) {
    // Moving over a child fires `dragleave` on the label; ignore those.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setDragging(false);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;
    unlockAudio();
    void scan(file);
  }

  return (
    <div className="flex flex-col gap-4">
      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex cursor-pointer flex-col items-center gap-1 rounded-xl border bg-background px-12 py-10 text-center focus-within:border-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent has-[:focus-visible]:outline-offset-2 ${
          dragging ? "border-accent" : "border-line hover:border-muted"
        }`}
      >
        {/* The target being framed is the image the user brings. */}
        <span
          aria-hidden="true"
          className={`absolute inset-3 ${dragging ? "text-accent" : "text-line"}`}
        >
          <FinderFrame className="size-6" />
        </span>
        <ImageUp aria-hidden="true" className="mb-2 size-7 text-muted" />
        <span className="font-medium">{t.choose}</span>
        <span className="text-sm text-muted">{t.drop}</span>
        <input
          type="file"
          accept="image/*"
          onClick={unlockAudio}
          onChange={onChange}
          className="sr-only"
        />
      </label>
      <p className="hidden text-center text-sm text-muted sm:block">
        {t.paste}
      </p>

      <p role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </p>

      {state.status === "not-image" && (
        <p role="alert" className="text-sm">
          {dict.scanner.errors.notImage}
        </p>
      )}

      {state.status !== "idle" && state.status !== "not-image" && (
        <div
          aria-busy={state.status === "decoding"}
          className="flex flex-col gap-5 border-t border-line pt-5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview */}
          <img
            src={state.preview}
            alt={t.preview}
            className="max-h-32 max-w-full self-start rounded-lg border border-line bg-white object-contain"
          />
          {state.status === "decoding" && (
            <p className="text-sm text-muted">{t.decoding}</p>
          )}
          {state.status === "result" && (
            <ScanResult result={state.result} autoFocusTitle />
          )}
          {state.status === "not-found" && (
            <p role="status" className="text-sm">
              {dict.scanner.errors.notFound}
            </p>
          )}
        </div>
      )}

      <div id={decoderId} hidden />
    </div>
  );
}
