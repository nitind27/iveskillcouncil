"use client";

import Link from "next/link";
import useSWR from "swr";
import { Award, Loader2, Clock, AlertCircle, CheckCircle2, Truck } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

type CertStatus = {
  id: string;
  certificateNumber: string;
  status: string;
  issueDate: string | null;
  courseName: string | null;
  message: string | null;
};

type CertResponse = {
  certificate: CertStatus | null;
};

const STATUS_UI: Record<
  string,
  { icon: typeof Clock; color: string; bg: string; label: string }
> = {
  REQUESTED: {
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-500/10 border-amber-200",
    label: "Request submitted",
  },
  APPROVED: {
    icon: CheckCircle2,
    color: "text-blue-700",
    bg: "bg-blue-500/10 border-blue-200",
    label: "Approved by institute",
  },
  ISSUED: {
    icon: Truck,
    color: "text-emerald-700",
    bg: "bg-emerald-500/10 border-emerald-200",
    label: "Issued — hard copy on the way",
  },
  REJECTED: {
    icon: AlertCircle,
    color: "text-red-700",
    bg: "bg-red-500/10 border-red-200",
    label: "Request rejected",
  },
};

export default function CertificatePage() {
  const { data, error, isLoading } = useSWR<CertResponse>(
    "/api/students/certificate",
    fetcher,
    { revalidateOnFocus: true }
  );

  const cert = data?.certificate ?? null;
  const ui = cert ? STATUS_UI[cert.status] ?? STATUS_UI.REQUESTED : null;
  const StatusIcon = ui?.icon ?? Clock;

  if (isLoading && !data) {
    return (
      <div className="space-y-5 pb-6">
        <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] px-5 py-8 text-white shadow-md sm:px-6">
          <div className="h-6 w-48 animate-pulse rounded bg-white/20" />
        </header>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white/80">My Certificate</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Course Certificate</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A35A]/35 bg-[#C4A35A]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F5E6C8]">
                <Award className="h-3 w-3" />
                IVESDC
              </span>
            </div>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">
              Track your certificate status — hard copy is printed and sent by the institute
            </p>
          </div>
          {cert && (
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                Certificate No.
              </p>
              <p className="font-bold tabular-nums">{cert.certificateNumber}</p>
            </div>
          )}
        </div>
      </header>

      {error ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-16 text-red-700">
          <AlertCircle className="h-10 w-10" />
          <p className="font-medium">Failed to load certificate status</p>
        </div>
      ) : !cert ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#1E4A85]/12 bg-card py-16 text-center shadow-sm">
          <Award className="h-16 w-16 text-[#1E4A85]/30" />
          <p className="text-lg font-semibold text-foreground">No certificate yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your training centre will request your IVESDC certificate after course completion.
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
          <div className={cn("border-b px-6 py-8 text-center", ui?.bg)}>
            <div
              className={cn(
                "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border bg-white/80",
                ui?.color
              )}
            >
              <StatusIcon className="h-8 w-8" />
            </div>
            <p className={cn("text-lg font-bold", ui?.color)}>{ui?.label}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {cert.message ??
                "Your certificate is being processed by the institute."}
            </p>
          </div>
          <div className="space-y-3 px-6 py-5 text-sm">
            {cert.courseName && (
              <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium text-right">{cert.courseName}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold uppercase">{cert.status}</span>
            </div>
            {cert.issueDate && (
              <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Issue date</span>
                <span className="font-medium">
                  {new Date(cert.issueDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <p className="pt-2 text-xs text-muted-foreground">
              Digital download is not available. Your official hard copy certificate will be delivered
              to your training centre by IVESDC institute admin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
