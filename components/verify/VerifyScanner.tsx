"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

type Controls = { stop: () => void };

/**
 * Camera scanner for the QR code and the Code 128 barcodes printed on IVESDC documents.
 * Calls onResult once with the raw decoded text.
 */
export default function VerifyScanner({ onResult, onClose }: { onResult: (text: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);
  const [status, setStatus] = useState<"starting" | "scanning" | "error">("starting");
  const [error, setError] = useState("");

  useEffect(() => {
    let controls: Controls | null = null;
    let cancelled = false;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setError("Camera is not available in this browser. Open this page over HTTPS or type the number below.");
        return;
      }
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
        if (cancelled || !videoRef.current) return;
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
          videoRef.current,
          (result) => {
            if (!result || doneRef.current) return;
            doneRef.current = true;
            controls?.stop();
            if (navigator.vibrate) navigator.vibrate(80);
            onResult(result.getText());
          }
        );
        if (cancelled) controls.stop();
        else setStatus("scanning");
      } catch (e) {
        setStatus("error");
        const name = e instanceof Error ? e.name : "";
        setError(
          name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access in your browser settings and try again."
            : name === "NotFoundError"
              ? "No camera was found on this device."
              : "Could not start the camera. Type the enrollment or document number below instead."
        );
      }
    })();

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div>
          <p className="text-sm font-bold">Scan QR code or barcode</p>
          <p className="text-[11px] text-white/60">Point the camera at the QR or barcode on the certificate / result</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 hover:bg-white/20"
          aria-label="Close scanner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {status !== "error" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[min(70vw,320px)] w-[min(86vw,420px)] rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
              {["left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl", "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-2xl", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl"].map((c) => (
                <span key={c} className={`absolute h-10 w-10 border-[#E8C46A] ${c}`} />
              ))}
              <span className="verify-scanline absolute inset-x-4 h-0.5 bg-[#E8C46A] shadow-[0_0_12px_#E8C46A]" />
            </div>
          </div>
        )}
        {status === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Starting camera…</p>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white">
            <Camera className="h-10 w-10 text-white/60" />
            <p className="max-w-sm text-sm">{error}</p>
            <button type="button" onClick={onClose} className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black">
              Close
            </button>
          </div>
        )}
      </div>
      <style jsx>{`
        .verify-scanline {
          animation: verify-scan 2.2s ease-in-out infinite;
        }
        @keyframes verify-scan {
          0%,
          100% {
            top: 12%;
          }
          50% {
            top: 86%;
          }
        }
      `}</style>
    </div>
  );
}
