"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  Award,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Truck,
  Shield,
  FileText,
  Calendar,
  BookOpen,
  Hash,
} from "lucide-react";
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

const STATUS_CONFIG: Record<
  string,
  {
    icon: typeof Clock;
    color: string;
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    label: string;
    description: string;
    step: number;
  }
> = {
  REQUESTED: {
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-300",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    label: "Under Review",
    description: "Your certificate request has been submitted and is awaiting review by the institute.",
    step: 1,
  },
  APPROVED: {
    icon: CheckCircle2,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-300",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    label: "Approved",
    description: "Your certificate has been approved and is currently being prepared for dispatch.",
    step: 2,
  },
  ISSUED: {
    icon: Truck,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    label: "Issued & Dispatched",
    description: "Your official certificate has been issued and dispatched to your training centre.",
    step: 3,
  },
  REJECTED: {
    icon: AlertCircle,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-300",
    badgeBg: "bg-red-100",
    badgeText: "text-red-800",
    label: "Request Rejected",
    description: "Your certificate request has been rejected. Please contact your training centre.",
    step: 0,
  },
};

const STEPS = [
  { key: "REQUESTED", label: "Requested", icon: FileText },
  { key: "APPROVED", label: "Approved", icon: CheckCircle2 },
  { key: "ISSUED", label: "Dispatched", icon: Truck },
];

export default function CertificatePage() {
  const { data, error, isLoading } = useSWR<CertResponse>(
    "/api/students/certificate",
    fetcher,
    { revalidateOnFocus: true }
  );

  const cert = data?.certificate ?? null;
  const ui = cert ? STATUS_CONFIG[cert.status] ?? STATUS_CONFIG.REQUESTED : null;
  const StatusIcon = ui?.icon ?? Clock;
  const currentStep = ui?.step ?? 0;
  const isRejected = cert?.status === "REJECTED";

  if (isLoading && !data) {
    return (
      <div className="space-y-5 pb-6">
        {/* Header skeleton */}
        <header className="overflow-hidden rounded-xl border border-[#1E3A5F]/20 bg-gradient-to-r from-[#0A1F3D] via-[#1E3A5F] to-[#0D2E52] px-5 py-6 text-white shadow-lg">
          <div className="h-5 w-40 animate-pulse rounded bg-white/20" />
          <div className="mt-2 h-7 w-64 animate-pulse rounded bg-white/20" />
        </header>
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#1E3A5F]" />
            <p className="text-sm text-muted-foreground">Fetching certificate status…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* ── Official Header ── */}
      <header className="overflow-hidden rounded-xl border border-[#1E3A5F]/20 bg-gradient-to-r from-[#0A1F3D] via-[#1E3A5F] to-[#0D2E52] shadow-lg">
        {/* Top gold strip */}
        <div className="h-1 w-full bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B]" />
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/50">
              <Link href="/dashboard" className="hover:text-white/80 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white/70">My Certificate</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Course Certificate
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#FFD700]">
                <Award className="h-3 w-3" />
                IVESDC
              </span>
            </div>
            <p className="mt-1.5 text-xs text-white/55 sm:text-sm">
              Official certificate tracking — issued by IVESDC Institute
            </p>
          </div>

          {/* Emblem / Shield */}
          <div className="flex-shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#FFD700]/50 bg-[#FFD700]/10 shadow-inner">
              <Shield className="h-8 w-8 text-[#FFD700]" />
            </div>
          </div>
        </div>
        {/* Bottom gold strip */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent" />
      </header>

      {/* ── Error State ── */}
      {error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 py-16 text-red-700">
          <AlertCircle className="h-10 w-10" />
          <p className="font-semibold">Failed to load certificate status</p>
          <p className="text-sm text-red-600">Please try refreshing the page.</p>
        </div>
      ) : !cert ? (
        /* ── No Certificate State ── */
        <div className="overflow-hidden rounded-xl border border-[#1E3A5F]/12 bg-card shadow-sm">
          {/* Top decorative bar */}
          <div className="h-1 bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B]" />
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[#1E3A5F]/25 bg-[#1E3A5F]/5">
              <Award className="h-10 w-10 text-[#1E3A5F]/35" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">No Certificate Found</p>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
                Your training centre will initiate the certificate request upon successful course
                completion. Please contact your centre for more information.
              </p>
            </div>
            <div className="mt-2 rounded-lg border border-[#1E3A5F]/10 bg-[#1E3A5F]/5 px-5 py-3 text-xs text-muted-foreground">
              <span className="font-semibold text-[#1E3A5F]">Note:</span> Hard copy certificates are
              printed and dispatched directly by IVESDC to your training centre.
            </div>
          </div>
        </div>
      ) : (
        /* ── Certificate Card ── */
        <div className="mx-auto max-w-2xl">
          {/* Main Certificate Document */}
          <div className="overflow-hidden rounded-xl border border-[#1E3A5F]/20 bg-card shadow-md">
            {/* Gold top bar */}
            <div className="h-1.5 bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B]" />

            {/* Document Header */}
            <div className="relative border-b border-[#1E3A5F]/10 bg-gradient-to-b from-[#0A1F3D]/5 to-transparent px-6 py-6 text-center">
              {/* Corner decorations */}
              <div className="absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-[#FFD700]/40 rounded-tl-sm" />
              <div className="absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-[#FFD700]/40 rounded-tr-sm" />

              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#1E3A5F]/20 bg-[#1E3A5F]/8">
                <Award className="h-7 w-7 text-[#1E3A5F]" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1E3A5F]/60">
                Indian Vocational Education &amp; Skill Development Council
              </p>
              <h2 className="mt-1 text-lg font-extrabold uppercase tracking-widest text-[#1E3A5F]">
                IVESDC
              </h2>
              <div className="mx-auto mt-2 h-px w-32 bg-gradient-to-r from-transparent via-[#B8860B] to-transparent" />
              <p className="mt-2 text-sm font-semibold text-foreground/70">
                Certificate of Course Completion
              </p>
            </div>

            {/* Status Banner */}
            <div
              className={cn(
                "flex items-center justify-between gap-4 px-6 py-4 border-b",
                ui?.bg,
                ui?.border
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white/60",
                    ui?.border,
                    ui?.color
                  )}
                >
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                    Current Status
                  </p>
                  <p className={cn("font-bold text-sm", ui?.color)}>{ui?.label}</p>
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider",
                  ui?.badgeBg,
                  ui?.badgeText,
                  ui?.border
                )}
              >
                {cert.status}
              </span>
            </div>

            {/* Progress Tracker — hidden if rejected */}
            {!isRejected && (
              <div className="border-b border-[#1E3A5F]/8 bg-[#1E3A5F]/2 px-6 py-5">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Certificate Journey
                </p>
                <div className="flex items-center justify-between">
                  {STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const done = currentStep > idx;
                    const active = currentStep === idx + 1;
                    return (
                      <div key={step.key} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <div
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                              done
                                ? "border-[#1E3A5F] bg-[#1E3A5F] text-white"
                                : active
                                ? "border-[#1E3A5F] bg-white text-[#1E3A5F] shadow-md ring-4 ring-[#1E3A5F]/15"
                                : "border-border bg-background text-muted-foreground"
                            )}
                          >
                            {done ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <StepIcon className="h-4 w-4" />
                            )}
                          </div>
                          <p
                            className={cn(
                              "text-[10px] font-semibold text-center",
                              done || active ? "text-[#1E3A5F]" : "text-muted-foreground"
                            )}
                          >
                            {step.label}
                          </p>
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div
                            className={cn(
                              "mx-2 mb-4 h-0.5 flex-1",
                              done ? "bg-[#1E3A5F]" : "bg-border"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Certificate Details */}
            <div className="px-6 py-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Certificate Details
              </p>
              <div className="space-y-0 divide-y divide-border/60 rounded-lg border border-border/60 overflow-hidden">
                {/* Certificate Number */}
                <div className="flex items-center gap-3 bg-[#1E3A5F]/3 px-4 py-3">
                  <Hash className="h-4 w-4 flex-shrink-0 text-[#1E3A5F]/60" />
                  <span className="w-28 flex-shrink-0 text-xs font-semibold text-muted-foreground">
                    Certificate No.
                  </span>
                  <span className="font-bold tabular-nums text-sm text-foreground tracking-wider">
                    {cert.certificateNumber}
                  </span>
                </div>

                {/* Course Name */}
                {cert.courseName && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <BookOpen className="h-4 w-4 flex-shrink-0 text-[#1E3A5F]/60" />
                    <span className="w-28 flex-shrink-0 text-xs font-semibold text-muted-foreground">
                      Course
                    </span>
                    <span className="text-sm font-medium text-foreground">{cert.courseName}</span>
                  </div>
                )}

                {/* Issue Date */}
                {cert.issueDate && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Calendar className="h-4 w-4 flex-shrink-0 text-[#1E3A5F]/60" />
                    <span className="w-28 flex-shrink-0 text-xs font-semibold text-muted-foreground">
                      Issue Date
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {new Date(cert.issueDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Message */}
            {(cert.message || ui?.description) && (
              <div className="border-t border-[#1E3A5F]/8 px-6 pb-5">
                <div
                  className={cn(
                    "flex gap-3 rounded-lg border px-4 py-3 text-sm",
                    ui?.bg,
                    ui?.border
                  )}
                >
                  <StatusIcon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", ui?.color)} />
                  <p className="text-foreground/75 leading-relaxed text-xs">
                    {cert.message ?? ui?.description}
                  </p>
                </div>
              </div>
            )}

            {/* Footer Notice */}
            <div className="border-t border-[#1E3A5F]/8 bg-[#1E3A5F]/3 px-6 py-4">
              <div className="flex items-start gap-2.5">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1E3A5F]/50" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-[#1E3A5F]/80">Official Document: </span>
                  Digital downloads are not available. Your original hard copy certificate is printed
                  on security paper and dispatched directly to your registered training centre by
                  IVESDC Institute Administration.
                </p>
              </div>
            </div>

            {/* Gold bottom bar */}
            <div className="h-1.5 bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B]" />
          </div>
        </div>
      )}
    </div>
  );
}
