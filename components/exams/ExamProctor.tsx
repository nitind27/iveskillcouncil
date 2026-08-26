"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViolationType =
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "TAB_HIDDEN"
  | "CAMERA_LOST"
  | "LOOKING_AWAY"
  | "WINDOW_BLUR"
  | "WINDOW_RESIZE"
  | "FULLSCREEN_EXIT";

interface ExamProctorProps {
  enabled: boolean;
  faceDetect: boolean;
  /** Fatal cheat — closes exam */
  onViolation: (type: ViolationType, detail?: string) => void;
  /** Looking left/right — warning 1..5, then 6th closes via onViolation */
  onLookAwayWarning?: (warningNumber: number, maxWarnings: number) => void;
  /** Resume mid-exam: start warning counter from DB faceViolations */
  initialLookAwayCount?: number;
  className?: string;
  enforceFullscreen?: boolean;
}

/** Show this many warnings before closing on look-away */
export const LOOK_AWAY_MAX_WARNINGS = 5;
/** Close on this look-away count (5 warnings + 1 close = 6) */
export const LOOK_AWAY_CLOSE_AT = 6;

type FaceLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number
  ) => { faceLandmarks?: Array<Array<{ x: number; y: number; z: number }>> };
  close?: () => void;
};

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

/** Nose tip & cheeks — MediaPipe Face Landmarker indices */
const NOSE = 1;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

function estimateHeadYaw(landmarks: Array<{ x: number; y: number }>): number {
  const nose = landmarks[NOSE];
  const left = landmarks[LEFT_CHEEK];
  const right = landmarks[RIGHT_CHEEK];
  if (!nose || !left || !right) return 0;
  const midX = (left.x + right.x) / 2;
  const faceW = Math.max(0.001, Math.abs(right.x - left.x));
  // Positive = looking right (from user view mirrored), abs = turn amount
  return (nose.x - midX) / faceW;
}

function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
  );
}

async function requestFs(el: HTMLElement) {
  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  if (el.requestFullscreen) await el.requestFullscreen().catch(() => undefined);
  else if (anyEl.webkitRequestFullscreen) await anyEl.webkitRequestFullscreen();
}

export function ExamProctor({
  enabled,
  faceDetect,
  onViolation,
  onLookAwayWarning,
  initialLookAwayCount = 0,
  className,
  enforceFullscreen = true,
}: ExamProctorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const rafRef = useRef<number>(0);
  const noFaceSince = useRef<number | null>(null);
  const lookingAwaySince = useRef<number | null>(null);
  const lookAwayEpisodeLocked = useRef(false);
  const lookAwayCount = useRef(Math.min(initialLookAwayCount, LOOK_AWAY_MAX_WARNINGS));
  const emittedFatal = useRef(false);
  const startSize = useRef({ w: 0, h: 0 });
  const armedAt = useRef(0);
  const lastVideoTime = useRef(-1);

  const [cameraOk, setCameraOk] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lookAwayWarnings, setLookAwayWarnings] = useState(
    Math.min(initialLookAwayCount, LOOK_AWAY_MAX_WARNINGS)
  );
  const [faceStatus, setFaceStatus] = useState<
    "ok" | "missing" | "multi" | "away" | "loading" | "unknown"
  >("loading");
  const [yawLabel, setYawLabel] = useState("—");

  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;
  const onLookAwayWarningRef = useRef(onLookAwayWarning);
  onLookAwayWarningRef.current = onLookAwayWarning;

  const emitFatal = useCallback((type: ViolationType, detail?: string) => {
    if (Date.now() - armedAt.current < 2500) return;
    if (emittedFatal.current) return;
    emittedFatal.current = true;
    onViolationRef.current(type, detail);
  }, []);

  const emitLookAwayEvent = useCallback(() => {
    if (Date.now() - armedAt.current < 2500) return;
    if (emittedFatal.current) return;
    lookAwayCount.current += 1;
    const n = lookAwayCount.current;
    setLookAwayWarnings(n);
    if (n < LOOK_AWAY_CLOSE_AT) {
      onLookAwayWarningRef.current?.(n, LOOK_AWAY_MAX_WARNINGS);
    } else {
      emitFatal("LOOKING_AWAY", `Looked away ${n} times — exam closed`);
    }
  }, [emitFatal]);

  // Load MediaPipe Face Landmarker
  useEffect(() => {
    if (!enabled || !faceDetect) return;
    let cancelled = false;

    (async () => {
      try {
        setFaceStatus("loading");
        const vision = await import("@mediapipe/tasks-vision");
        const { FaceLandmarker, FilesetResolver } = vision;
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        if (cancelled) return;
        const landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 2,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker as FaceLandmarkerInstance;
        setModelReady(true);
        setModelError(null);
      } catch (e) {
        console.error("Face landmarker load failed", e);
        // Retry with CPU
        try {
          const vision = await import("@mediapipe/tasks-vision");
          const { FaceLandmarker, FilesetResolver } = vision;
          const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
          const landmarker = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: 2,
          });
          if (cancelled) {
            landmarker.close();
            return;
          }
          landmarkerRef.current = landmarker as FaceLandmarkerInstance;
          setModelReady(true);
          setModelError(null);
        } catch (e2) {
          console.error("Face landmarker CPU failed", e2);
          setModelError("Face model failed to load");
          setModelReady(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        landmarkerRef.current?.close?.();
      } catch {
        /* ignore */
      }
      landmarkerRef.current = null;
    };
  }, [enabled, faceDetect]);

  // Camera stream
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    armedAt.current = Date.now();
    emittedFatal.current = false;
    lookAwayCount.current = Math.min(initialLookAwayCount, LOOK_AWAY_MAX_WARNINGS);
    lookAwayEpisodeLocked.current = false;
    setLookAwayWarnings(Math.min(initialLookAwayCount, LOOK_AWAY_MAX_WARNINGS));
    startSize.current = { w: window.innerWidth, h: window.innerHeight };
    noFaceSince.current = null;
    lookingAwaySince.current = null;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        setCameraOk(true);
        setCameraError(null);
      } catch {
        setCameraError("Allow camera permission to continue the exam");
        setCameraOk(false);
        emitFatal("CAMERA_LOST", "Camera permission denied");
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [enabled, emitFatal]);

  // Fullscreen
  useEffect(() => {
    if (!enabled || !enforceFullscreen) return;
    requestFs(document.documentElement);
    const onFsChange = () => {
      if (!isFullscreen()) {
        emitFatal("FULLSCREEN_EXIT", "Left fullscreen");
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange as EventListener);
      if (isFullscreen()) document.exitFullscreen?.().catch(() => undefined);
    };
  }, [enabled, enforceFullscreen, emitFatal]);

  // Tab / window (already working — keep)
  useEffect(() => {
    if (!enabled) return;
    const onVis = () => {
      if (document.hidden) emitFatal("TAB_HIDDEN", "Opened another tab");
    };
    const onBlur = () => emitFatal("WINDOW_BLUR", "Switched window");
    const onResize = () => {
      const { w, h } = startSize.current;
      if (!w || !h) return;
      if (window.innerWidth < w * 0.75 || window.innerHeight < h * 0.75) {
        emitFatal("WINDOW_RESIZE", "Window resized / minimized");
      }
      if (window.innerWidth < 900 || window.innerHeight < 500) {
        emitFatal("WINDOW_RESIZE", "Window too small");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("resize", onResize);
    };
  }, [enabled, emitFatal]);

  // Face detect loop (MediaPipe)
  useEffect(() => {
    if (!enabled || !faceDetect || !cameraOk || !modelReady) return;

    const loop = () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const track = streamRef.current?.getVideoTracks()?.[0];
      if (!track || track.readyState === "ended") {
        emitFatal("CAMERA_LOST", "Camera disconnected");
        return;
      }

      // Only run when a new frame is available
      if (video.currentTime !== lastVideoTime.current) {
        lastVideoTime.current = video.currentTime;
        try {
          const result = landmarker.detectForVideo(video, performance.now());
          const faces = result.faceLandmarks ?? [];

          if (faces.length === 0) {
            setFaceStatus("missing");
            setYawLabel("no face");
            lookingAwaySince.current = null;
            if (!noFaceSince.current) noFaceSince.current = Date.now();
            else if (Date.now() - noFaceSince.current >= 2000) {
              emitFatal("NO_FACE", "Face not visible in camera for 2s");
              return;
            }
          } else if (faces.length > 1) {
            setFaceStatus("multi");
            setYawLabel("multi");
            noFaceSince.current = null;
            lookingAwaySince.current = null;
            emitFatal("MULTIPLE_FACES", "More than one face in camera");
            return;
          } else {
            noFaceSince.current = null;
            const yaw = estimateHeadYaw(faces[0]);
            const absYaw = Math.abs(yaw);
            setYawLabel(`${(yaw * 100).toFixed(0)}% turn`);

            // Clear left/right look
            if (absYaw > 0.12) {
              setFaceStatus("away");
              if (lookAwayEpisodeLocked.current) {
                // already counted this look-away episode — wait until centered again
              } else if (!lookingAwaySince.current) {
                lookingAwaySince.current = Date.now();
              } else if (Date.now() - lookingAwaySince.current >= 1200) {
                lookAwayEpisodeLocked.current = true;
                lookingAwaySince.current = null;
                emitLookAwayEvent();
                if (emittedFatal.current) return;
              }
            } else {
              setFaceStatus("ok");
              lookingAwaySince.current = null;
              lookAwayEpisodeLocked.current = false;
            }
          }
        } catch (err) {
          console.warn("detectForVideo error", err);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, faceDetect, cameraOk, modelReady, emitFatal, emitLookAwayEvent]);

  if (!enabled) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[#1E4A85]/15 bg-[#0B1F3A] shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
          {cameraOk ? (
            <Camera className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <CameraOff className="h-3.5 w-3.5 text-red-400" />
          )}
          Face camera
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            faceStatus === "ok" && "bg-emerald-500/20 text-emerald-300",
            (faceStatus === "missing" || faceStatus === "multi") &&
              "bg-red-500/20 text-red-300",
            faceStatus === "away" && "bg-amber-500/20 text-amber-300",
            (faceStatus === "loading" || faceStatus === "unknown") &&
              "bg-white/10 text-white/70"
          )}
        >
          {faceStatus === "loading"
            ? "Loading AI…"
            : faceStatus === "ok"
              ? "Face OK"
              : faceStatus === "missing"
                ? "No face!"
                : faceStatus === "multi"
                  ? "2+ faces!"
                  : faceStatus === "away"
                    ? "Looking away!"
                    : "…"}
        </span>
      </div>

      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-full w-full object-cover scale-x-[-1]"
        />
        {!modelReady && !modelError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
            <p className="text-[11px] text-white/80">Loading face detector…</p>
          </div>
        )}
        {(cameraError || modelError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <p className="text-xs text-white/90">{cameraError || modelError}</p>
          </div>
        )}
        {faceStatus === "ok" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-emerald-600/80 py-1 text-center text-[10px] font-bold text-white">
            Face locked · {yawLabel}
          </div>
        )}
        {faceStatus === "away" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-amber-500/90 py-1 text-center text-[10px] font-bold text-black">
            Looking away! Warning {Math.min(lookAwayWarnings, LOOK_AWAY_MAX_WARNINGS)}/
            {LOOK_AWAY_MAX_WARNINGS}
            {lookAwayWarnings >= LOOK_AWAY_MAX_WARNINGS ? " — next = close" : ""} · {yawLabel}
          </div>
        )}
        {faceStatus === "missing" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-red-600/90 py-1 text-center text-[10px] font-bold text-white">
            Face not detected — exam will close
          </div>
        )}
      </div>

      <p className="px-2 py-1.5 text-[10px] leading-snug text-white/55">
        Look left/right: 5 warnings, 6th time exam closes. Warnings: {lookAwayWarnings}/
        {LOOK_AWAY_MAX_WARNINGS}.
      </p>
    </div>
  );
}
