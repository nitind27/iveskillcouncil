"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  ClipboardList,
  Loader2,
  Clock,
  Camera,
  Play,
  CheckCircle2,
  Hourglass,
  RotateCcw,
} from "lucide-react";
import { Breadcrumb } from "@/components/common";
import { fetcher } from "@/lib/fetcher";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface AvailableExam {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  passPercent: number;
  batchLabel: string | null;
  questionCount: number;
  requireCamera: boolean;
  requireFaceDetect: boolean;
  courseName: string;
  attempt: {
    id: string;
    status: string;
    endsAt: string;
    percent: number | null;
    passed: boolean | null;
    score: number | null;
    maxScore: number | null;
    restartApproved?: boolean;
  } | null;
}

export default function MyExamsPage() {
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR<AvailableExam[]>(
    "/api/exams/available",
    fetcher,
    { refreshInterval: 15000 }
  );
  const [resuming, setResuming] = useState<string | null>(null);

  const startExam = (examId: string, attemptId?: string) => {
    if (attemptId) {
      router.push(`/my-exams/take/${attemptId}`);
      return;
    }
    router.push(`/my-exams/start/${examId}`);
  };

  const resumeExam = async (attemptId: string) => {
    setResuming(attemptId);
    try {
      const res = await fetch(`/api/exams/attempts/${attemptId}/resume`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Cannot continue", json.error || "Admin approval required");
        mutate();
        return;
      }
      await showSuccess("Resumed", "Continue from where you left off");
      router.push(`/my-exams/take/${attemptId}`);
    } finally {
      setResuming(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumb />
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1E4A85] sm:text-3xl">
          My Exams
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assigned exams for your course. Camera + face monitoring may be required.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
        </div>
      ) : !data?.length ? (
        <div className="rounded-2xl border border-dashed border-[#1E4A85]/25 bg-white px-6 py-16 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-[#1E4A85]/40" />
          <p className="mt-3 font-semibold">No exams assigned</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((exam) => {
            const att = exam.attempt;
            const inProgress = att?.status === "IN_PROGRESS";
            const terminated = att?.status === "TERMINATED";
            const canResume = terminated && att?.restartApproved;
            const waitingApproval = terminated && !att?.restartApproved;
            const completed =
              att &&
              att.status !== "IN_PROGRESS" &&
              att.status !== "TERMINATED";

            return (
              <div
                key={exam.id}
                className="rounded-2xl border border-[#1E4A85]/12 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[#0B1F3A]">{exam.title}</h2>
                    {exam.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {exam.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#1E4A85]/8 px-2.5 py-1 font-medium text-[#1E4A85]">
                        <Clock className="h-3.5 w-3.5" />
                        {exam.durationMinutes} min
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                        {exam.questionCount} questions
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                        {exam.courseName}
                      </span>
                      {exam.requireCamera && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#C4A35A]/15 px-2.5 py-1 font-medium text-[#8a6f2e]">
                          <Camera className="h-3.5 w-3.5" />
                          Proctored
                        </span>
                      )}
                    </div>

                    {waitingApproval && (
                      <p className="mt-3 rounded-lg bg-amber-50 px-2.5 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-200">
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <Hourglass className="h-4 w-4 shrink-0" />
                          Exam closed (proctoring)
                        </span>
                        <span className="mt-1 block text-[13px] font-normal leading-snug">
                          You can take this exam again after institute admin approves restart.
                          Then tap <strong>Continue exam</strong> here — your saved answers will
                          resume.
                        </span>
                      </p>
                    )}

                    {canResume && (
                      <p className="mt-3 rounded-lg bg-emerald-50 px-2.5 py-2 text-sm font-medium text-emerald-900 ring-1 ring-emerald-200">
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <RotateCcw className="h-4 w-4 shrink-0" />
                          Restart approved — you can continue
                        </span>
                        <span className="mt-1 block text-[13px] font-normal leading-snug">
                          Tap <strong>Continue exam</strong> below. Your previous answers are
                          saved; you will resume where you left off.
                        </span>
                      </p>
                    )}

                    {completed && att && (
                      <div className="mt-3 space-y-1.5">
                        <p
                          className={cn(
                            "inline-flex items-center gap-1.5 text-sm font-semibold",
                            att.passed ? "text-emerald-700" : "text-red-600"
                          )}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {att.passed ? "Passed" : "Not passed"} — {att.score}/{att.maxScore} (
                          {att.percent}%)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          To take again, ask institute admin to click{" "}
                          <strong>Allow retake</strong> on Results — then Start exam will appear
                          here.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    {canResume ? (
                      <button
                        type="button"
                        disabled={resuming === att!.id}
                        onClick={() => resumeExam(att!.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {resuming === att!.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        Continue exam
                      </button>
                    ) : waitingApproval ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex flex-col items-center gap-0.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 opacity-90"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Hourglass className="h-4 w-4" />
                          Can retake later
                        </span>
                        <span className="text-[10px] font-medium text-amber-700">
                          Waiting for admin approval
                        </span>
                      </button>
                    ) : completed ? (
                      <Link
                        href={`/my-exams/take/${att!.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#1E4A85]/20 px-4 py-2.5 text-sm font-semibold text-[#1E4A85]"
                      >
                        View result
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          startExam(exam.id, inProgress ? att!.id : undefined)
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#163a6b]"
                      >
                        <Play className="h-4 w-4" />
                        {inProgress ? "Continue" : "Start exam"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
