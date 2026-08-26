"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Camera,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Link2Off,
} from "lucide-react";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    FaceDetector?: new (options?: {
      maxDetectedFaces?: number;
      fastMode?: boolean;
    }) => {
      detect: (source: HTMLVideoElement | HTMLCanvasElement) => Promise<
        Array<{ boundingBox: DOMRectReadOnly }>
      >;
    };
  }
}

interface LinkMeta {
  active: boolean;
  title: string;
  description?: string | null;
  durationMinutes: number;
  questionCount: number;
  requireCamera: boolean;
  requireFaceDetect?: boolean;
  passPercent?: number;
}

export default function ExamLinkStartPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params?.token || "");

  const { data, error, isLoading } = useSWR<LinkMeta>(
    token ? `/api/exam-link/${token}` : null,
    async (url: string) => {
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Link unavailable");
      return json.data as LinkMeta;
    },
    { revalidateOnFocus: true, refreshInterval: 10000 }
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceOk, setFaceOk] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!data?.active) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 540 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraReady(true);
        setCameraError(null);
      } catch {
        setCameraError("Camera permission required. Allow camera to continue.");
        setCameraReady(false);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [data?.active]);

  useEffect(() => {
    if (!cameraReady || photoDataUrl || !data?.active) return;
    let detector: {
      detect: (s: HTMLVideoElement) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
    } | null = null;
    if (typeof window.FaceDetector === "function") {
      try {
        detector = new window.FaceDetector({ maxDetectedFaces: 2, fastMode: true });
      } catch {
        detector = null;
      }
    }
    const id = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      if (!detector) {
        setFaceOk(true);
        return;
      }
      try {
        const faces = await detector.detect(video);
        setFaceOk(faces.length === 1);
      } catch {
        setFaceOk(true);
      }
    }, 800);
    return () => window.clearInterval(id);
  }, [cameraReady, photoDataUrl, data?.active]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;
    if (!faceOk) {
      showError("Face required", "Keep your face clearly in the center of the camera");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.85));
  }, [cameraReady, faceOk]);

  const startExam = async () => {
    const en = enrollmentNumber.trim();
    if (en.length < 3) {
      await showError("Enrollment number", "Enter your enrollment / roll number");
      return;
    }
    if (!photoDataUrl) {
      await showError("Photo required", "Capture your photo first");
      return;
    }
    setStarting(true);
    try {
      const res = await fetch(`/api/exam-link/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentNumber: en, photoBase64: photoDataUrl }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Cannot start", json.error || "Failed");
        return;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      sessionStorage.setItem(`exam_access_${json.data.attemptId}`, json.data.accessKey);
      await showSuccess("Verified", "Exam starting — keep face in camera");
      router.push(`/exam-link/take/${json.data.attemptId}`);
    } finally {
      setStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <Link2Off className="h-12 w-12 text-slate-400" />
        <h1 className="mt-4 text-xl font-bold text-[#1E4A85]">Exam link unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {(error as Error)?.message || "This link is invalid or the exam is not published."}
        </p>
      </div>
    );
  }

  if (!data.active) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <Link2Off className="h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-xl font-bold text-[#1E4A85]">{data.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This exam link is deactivated. Ask the institute admin to activate it on their tablet.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-xl space-y-5 px-3 py-6 sm:px-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#C4A35A]">
            Walk-in exam
          </p>
          <h1 className="text-xl font-bold text-[#1E4A85] sm:text-2xl">{data.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.durationMinutes} min · {data.questionCount} questions · Enter enrollment &amp;
            photo to start
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <p className="flex items-start gap-2 font-medium">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Camera stays on during the exam. Looking away or switching apps may close the exam.
          </p>
        </div>

        <div className="rounded-2xl border border-[#1E4A85]/12 bg-white p-5 shadow-sm">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#1E4A85]">
            Enrollment / Roll number
          </label>
          <input
            value={enrollmentNumber}
            onChange={(e) => setEnrollmentNumber(e.target.value)}
            placeholder="e.g. ENR-2024-001"
            className="w-full rounded-xl border border-[#1E4A85]/15 px-3.5 py-2.5 text-sm outline-none focus:border-[#1E4A85]/40 focus:ring-2 focus:ring-[#1E4A85]/15"
            autoComplete="off"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-[#0B1F3A] shadow-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Camera className="h-3.5 w-3.5" />
              Face photo
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                photoDataUrl
                  ? "bg-emerald-500/20 text-emerald-300"
                  : faceOk
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
              )}
            >
              {photoDataUrl ? "Captured" : faceOk ? "Face detected" : "Center your face"}
            </span>
          </div>
          <div className="relative aspect-[4/3] bg-black">
            {!photoDataUrl ? (
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-full w-full scale-x-[-1] object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoDataUrl} alt="Captured" className="h-full w-full object-cover" />
            )}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-sm text-white">
                {cameraError}
              </div>
            )}
          </div>
          <div className="flex gap-2 p-3">
            {!photoDataUrl ? (
              <button
                type="button"
                disabled={!cameraReady}
                onClick={capturePhoto}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#C4A35A] py-2.5 text-sm font-bold text-[#0B132B] disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                Capture photo
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPhotoDataUrl(null)}
                className="flex-1 rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Retake photo
              </button>
            )}
          </div>
        </div>

        {photoDataUrl && enrollmentNumber.trim().length >= 3 && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Ready — you can start the exam
          </div>
        )}

        <button
          type="button"
          disabled={starting || !photoDataUrl || enrollmentNumber.trim().length < 3}
          onClick={startExam}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E4A85] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#163a6b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Start exam
        </button>
      </div>
    </div>
  );
}
