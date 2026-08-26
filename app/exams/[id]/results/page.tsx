"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import { Breadcrumb } from "@/components/common";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface ResultsPayload {
  exam: { id: string; title: string; passPercent: number; durationMinutes: number };
  attempts: Array<{
    id: string;
    status: string;
    studentName: string;
    studentEmail: string;
    enrollmentNumber: string | null;
    photoUrl: string | null;
    courseName: string;
    franchiseName: string;
    startedAt: string;
    submittedAt: string | null;
    score: number | null;
    maxScore: number | null;
    percent: number | null;
    passed: boolean | null;
    faceViolations: number;
    proctorEventCount: number;
    restartApproved: boolean;
    remainingSecondsAtStop: number | null;
  }>;
}

export default function ExamResultsPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const { user } = useAuth();
  const canApprove =
    Number(user?.roleId) === ROLES.SUPER_ADMIN || Number(user?.roleId) === ROLES.ADMIN;

  const { data, isLoading, mutate } = useSWR<ResultsPayload>(
    id ? `/api/exams/${id}/results` : null,
    fetcher,
    { refreshInterval: 10000 }
  );
  const [approving, setApproving] = useState<string | null>(null);
  const [retaking, setRetaking] = useState<string | null>(null);

  const approveRestart = async (attemptId: string) => {
    setApproving(attemptId);
    try {
      const res = await fetch(`/api/exams/attempts/${attemptId}/approve-restart`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Error", json.error || "Failed to approve");
        return;
      }
      await showSuccess(
        "Approved",
        "Student can now continue from My Exams → Continue exam (saved answers)."
      );
      mutate();
    } finally {
      setApproving(null);
    }
  };

  const allowRetake = async (attemptId: string) => {
    setRetaking(attemptId);
    try {
      const res = await fetch(`/api/exams/attempts/${attemptId}/allow-retake`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Error", json.error || "Failed");
        return;
      }
      await showSuccess(
        "Retake allowed",
        "Student can start this exam again from My Exams → Start exam."
      );
      mutate();
    } finally {
      setRetaking(null);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Breadcrumb />
      <div className="flex items-center gap-3">
        <Link
          href={`/exams/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E4A85]/15 bg-white text-[#1E4A85]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#1E4A85] sm:text-2xl">
            Results — {data.exam.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            Pass mark {data.exam.passPercent}% · {data.attempts.length} attempt(s)
            {canApprove
              ? " · Use Approve restart so the student can continue a terminated exam"
              : ""}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#1E4A85]/12 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-[#1E4A85] text-left text-[11px] font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Enrollment</th>
              <th className="px-4 py-3">Franchise / Course</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Proctor</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.attempts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  No attempts yet
                </td>
              </tr>
            ) : (
              data.attempts.map((a) => (
                <tr key={a.id} className="hover:bg-[#1E4A85]/[0.03]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {a.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.photoUrl}
                          alt=""
                          className="h-9 w-9 rounded-lg object-cover ring-1 ring-[#1E4A85]/15"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E4A85]/10 text-xs font-bold text-[#1E4A85]">
                          {a.studentName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{a.studentName}</p>
                        <p className="text-xs text-muted-foreground">{a.studentEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#1E4A85]">
                    {a.enrollmentNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p>{a.franchiseName}</p>
                    <p className="text-muted-foreground">{a.courseName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold",
                        a.status === "TERMINATED" && "bg-red-100 text-red-700",
                        a.status === "IN_PROGRESS" && "bg-amber-100 text-amber-800",
                        (a.status === "SUBMITTED" || a.status === "AUTO_SUBMITTED") &&
                          "bg-emerald-100 text-emerald-800"
                      )}
                    >
                      {a.status.replace("_", " ")}
                    </span>
                    {a.restartApproved && a.status === "TERMINATED" && (
                      <p className="mt-1 text-[10px] font-semibold text-emerald-700">
                        Restart approved
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.percent != null ? (
                      <div className="flex items-center gap-1.5">
                        {a.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-semibold">
                          {a.score}/{a.maxScore} ({a.percent}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                      {a.faceViolations} / {a.proctorEventCount} events
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      {canApprove && a.status === "TERMINATED" && !a.restartApproved ? (
                        <button
                          type="button"
                          disabled={approving === a.id}
                          onClick={() => approveRestart(a.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4A85] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#163a6b] disabled:opacity-50"
                        >
                          {approving === a.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          Approve restart
                        </button>
                      ) : null}
                      {a.restartApproved && a.status === "TERMINATED" ? (
                        <span className="text-[11px] font-semibold text-emerald-700">
                          Student can continue
                        </span>
                      ) : null}
                      {canApprove && a.status !== "IN_PROGRESS" ? (
                        <button
                          type="button"
                          disabled={retaking === a.id}
                          onClick={() => allowRetake(a.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#C4A35A]/50 bg-[#C4A35A]/10 px-2.5 py-1.5 text-[11px] font-bold text-[#8a6f2e] hover:bg-[#C4A35A]/20 disabled:opacity-50"
                        >
                          {retaking === a.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          Allow retake
                        </button>
                      ) : null}
                      {!canApprove && a.status === "IN_PROGRESS" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : null}
                      {!canApprove &&
                      a.status !== "IN_PROGRESS" &&
                      !(a.restartApproved && a.status === "TERMINATED") ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
