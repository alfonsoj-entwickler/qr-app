"use client";

import {
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  ImageIcon,
  RotateCcw,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { useHistoryStore } from "@/lib/history/store";
import { createDecoder, listCameras, toScanResult } from "@/lib/scan/decoder";
import {
  playSuccessFeedback,
  readSoundOn,
  unlockAudio,
} from "@/lib/scan/feedback";
import { parseContent } from "@/lib/scan/parse-content";
import type { ScanResult as ScanResultData } from "@/lib/scan/types";
import { FinderFrame } from "./finder-frame";
import { primaryClass, ScanResult, secondaryClass } from "./scan-result";

type Decoder = Awaited<ReturnType<typeof createDecoder>>;

type CameraOption = { id: string; label: string };

type ErrorReason = "permission" | "no-camera" | "insecure" | "unknown";

type CameraState =
  | { status: "idle" }
  | { status: "starting" }
  | {
      status: "scanning";
      cameras: CameraOption[];
      cameraId?: string;
      torch: { supported: boolean; on: boolean };
    }
  | { status: "result"; result: ScanResultData }
  | { status: "error"; reason: ErrorReason };

const errorKeys = {
  permission: "permission",
  "no-camera": "noCamera",
  insecure: "insecure",
  unknown: "unknown",
} as const;

function isCameraUnavailable() {
  return !window.isSecureContext || !navigator.mediaDevices;
}

// html5-qrcode rejects with the DOMException from getUserMedia or with a
// string that embeds it ("Error getting userMedia, error = NotAllowedError: …"),
// so match the error name in both.
function errorReason(error: unknown): ErrorReason {
  if (isCameraUnavailable()) return "insecure";
  const message =
    error instanceof Error ? `${error.name} ${error.message}` : String(error);
  if (message.includes("NotAllowedError")) return "permission";
  if (/NotFoundError|OverconstrainedError/.test(message)) return "no-camera";
  return "unknown";
}

// Square scan box at 70% of the shorter side of the viewfinder.
function qrbox(width: number, height: number) {
  const size = Math.floor(Math.min(width, height) * 0.7);
  return { width: size, height: size };
}

export function CameraPanel({ onUseImage }: { onUseImage: () => void }) {
  const dict = useDictionary();
  const t = dict.scanner.camera;
  // html5-qrcode renders the <video> into this element; React leaves it empty.
  const viewerId = `${useId()}-viewer`;
  const [state, setState] = useState<CameraState>({ status: "idle" });
  const [liveMessage, setLiveMessage] = useState("");
  const viewerWrapperRef = useRef<HTMLDivElement>(null);
  const decoder = useRef<Decoder | null>(null);
  // Device of the last run, so "Scan another" reopens the same camera.
  const cameraId = useRef<string | undefined>(undefined);
  // Set on the first successful read of a run; later callbacks are ignored.
  const handled = useRef(false);
  // Listed once per mount: getCameras() opens a second stream to read labels.
  const cameras = useRef<CameraOption[] | null>(null);
  const mounted = useRef(false);

  async function stopCamera() {
    const current = decoder.current;
    if (!current?.isScanning) return;
    try {
      await current.stop();
    } catch {
      // Already stopping or stopped.
    }
  }

  async function loadCameras() {
    if (cameras.current) return cameras.current;
    try {
      const devices = await listCameras();
      // Labels are empty until permission is granted: fall back to "Camera N".
      cameras.current = devices.map((device, i) => ({
        id: device.id,
        label: device.label || t.cameraN.replace("{n}", String(i + 1)),
      }));
    } catch {
      cameras.current = [];
    }
    return cameras.current;
  }

  function torchFeature() {
    try {
      return decoder.current
        ?.getRunningTrackCameraCapabilities()
        .torchFeature();
    } catch {
      return undefined;
    }
  }

  async function onDecoded(decoded: Parameters<typeof toScanResult>[0]) {
    if (handled.current) return;
    const result = toScanResult(decoded);
    // A format outside the supported list: keep scanning.
    if (!result) return;
    handled.current = true;
    await stopCamera();
    if (!mounted.current) return;
    useHistoryStore.getState().add(result, "scanned");
    playSuccessFeedback(readSoundOn());
    const kind = parseContent(result.text, result.format).kind;
    setLiveMessage(
      `${dict.scanner.result.title}: ${dict.scanner.result.kinds[kind]}`,
    );
    setState({ status: "result", result });
  }

  async function start() {
    unlockAudio();
    handled.current = false;
    if (isCameraUnavailable()) {
      setState({ status: "error", reason: "insecure" });
      return;
    }
    setState({ status: "starting" });
    setLiveMessage(t.starting);
    viewerWrapperRef.current?.focus();
    try {
      decoder.current ??= await createDecoder(viewerId);
      await decoder.current.start(
        cameraId.current ?? { facingMode: "environment" },
        { fps: 10, qrbox },
        (_text, decoded) => void onDecoded(decoded),
        undefined,
      );
    } catch (error) {
      if (mounted.current)
        setState({ status: "error", reason: errorReason(error) });
      return;
    }
    // Unmounted while the camera was opening: release it now.
    if (!mounted.current) {
      await stopCamera();
      return;
    }
    cameraId.current =
      decoder.current.getRunningTrackSettings().deviceId ?? cameraId.current;
    const list = await loadCameras();
    // A read can land before `start` resolves; don't overwrite its result.
    if (handled.current || !mounted.current) return;
    setLiveMessage(t.scanning);
    setState({
      status: "scanning",
      cameras: list,
      cameraId: cameraId.current,
      torch: { supported: torchFeature()?.isSupported() ?? false, on: false },
    });
  }

  async function switchCamera(id: string) {
    await stopCamera();
    cameraId.current = id;
    await start();
  }

  async function toggleTorch(on: boolean) {
    try {
      await torchFeature()?.apply(on);
    } catch {
      return;
    }
    setState((current) =>
      current.status === "scanning"
        ? { ...current, torch: { ...current.torch, on } }
        : current,
    );
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void stopCamera();
    };
  }, []);

  const live = state.status === "starting" || state.status === "scanning";

  return (
    <div className="flex flex-col gap-3">
      <p role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </p>
      <div
        ref={viewerWrapperRef}
        tabIndex={-1}
        aria-label={t.viewerLabel}
        hidden={state.status === "result"}
        className="relative overflow-hidden rounded-xl bg-viewer text-white focus:outline-none"
      >
        {/* Must stay in the DOM: html5-qrcode looks it up by id. While
            starting it sits behind the placeholder, invisible but laid out,
            so the library can measure it for the qrbox. */}
        <div
          id={viewerId}
          hidden={!live}
          className={`qr-viewer ${
            state.status === "starting"
              ? "absolute inset-x-0 top-0 opacity-0"
              : ""
          }`}
        />

        {state.status !== "scanning" && state.status !== "result" && (
          <div className="relative flex aspect-4/3 items-center justify-center p-4">
            {/* Empty scan box, the same size as the qrbox once live. */}
            {state.status !== "error" && (
              <div className="absolute aspect-square h-[70%] text-viewer-accent">
                <FinderFrame className="size-7" />
              </div>
            )}

            {state.status === "idle" && (
              <button
                type="button"
                onClick={() => void start()}
                className="relative inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-viewer hover:bg-white/90"
              >
                <Camera aria-hidden="true" className="size-4" />
                {t.start}
              </button>
            )}

            {state.status === "starting" && (
              <p className="relative text-sm text-white/75">{t.starting}</p>
            )}

            {state.status === "error" && (
              <div className="flex max-w-xs flex-col items-center gap-4 text-center">
                <CameraOff
                  aria-hidden="true"
                  className="size-6 text-viewer-accent"
                />
                <p role="alert" className="text-sm text-pretty">
                  {dict.scanner.errors[errorKeys[state.reason]]}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => void start()}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-viewer hover:bg-white/90"
                  >
                    <RotateCcw aria-hidden="true" className="size-4" />
                    {dict.scanner.errors.retry}
                  </button>
                  <button
                    type="button"
                    onClick={onUseImage}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/30 px-5 text-sm font-medium hover:bg-white/10"
                  >
                    <ImageIcon aria-hidden="true" className="size-4" />
                    {dict.scanner.errors.useImage}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {state.status === "scanning" && (
        <p className="text-sm text-muted">{t.scanning}</p>
      )}

      {state.status === "scanning" &&
        (state.cameras.length > 1 || state.torch.supported) && (
          <div className="flex flex-wrap items-center gap-2">
            {state.cameras.length > 1 && (
              <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                <span className="text-muted">{t.switch}</span>
                <select
                  value={state.cameraId ?? ""}
                  onChange={(event) => void switchCamera(event.target.value)}
                  className="h-11 min-w-0 flex-1 rounded-full border border-line bg-background px-4 text-sm sm:max-w-64"
                >
                  {state.cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {state.torch.supported && (
              <button
                type="button"
                aria-pressed={state.torch.on}
                aria-label={t.torch}
                onClick={() => void toggleTorch(!state.torch.on)}
                className={`${secondaryClass} ml-auto aria-pressed:bg-foreground aria-pressed:text-background`}
              >
                {state.torch.on ? (
                  <FlashlightOff aria-hidden="true" className="size-4" />
                ) : (
                  <Flashlight aria-hidden="true" className="size-4" />
                )}
                {state.torch.on ? t.torchOff : t.torchOn}
              </button>
            )}
          </div>
        )}

      {state.status === "result" && (
        <div className="flex flex-col gap-5">
          <ScanResult result={state.result} autoFocusTitle />
          <button
            type="button"
            onClick={() => void start()}
            className={`${primaryClass} self-start`}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            {t.scanAgain}
          </button>
        </div>
      )}
    </div>
  );
}
