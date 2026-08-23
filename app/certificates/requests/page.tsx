"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Award,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Printer,
  Info,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import {
  canManageCertificateWorkflow,
  canPrintCertificates,
} from "@/lib/certificate-access";
import { cn } from "@/lib/utils";
import { CreateCertificateModal } from "@/components/certificates/CreateCertificateModal";
import { CertificatePreviewModal } from "@/components/certificates/CertificatePreviewModal";

interface CertItem {
  id: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  franchiseName: string;
  certificateNumber: string;
  status: string;
  issueDate: string | null;
  createdAt: string;
}

interface CertResponse {
  items: CertItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_CHIP: Record<string, string> = {
  ISSUED: "bg-emerald-500/10 text-emerald-800 border-emerald-200/80",
  APPROVED: "bg-blue-500/10 text-blue-800 border-blue-200/80",
  REJECTED: "bg-red-500/10 text-red-800 border-red-200/80",
  REQUESTED: "bg-amber-500/10 text-amber-800 border-amber-200/80",
};

const STATUS_HINT: Record<string, string> = {
  REQUESTED: "Waiting for institute approval",
  APPROVED: "Approved — institute will print & dispatch",
  ISSUED: "Printed by institute — hard copy on the way",
  REJECTED: "Request rejected — contact institute",
};

export default function CertificatesRequestsPage() {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const isInstituteAdmin = canManageCertificateWorkflow(roleId);
  const canPrint = canPrintCertificates(roleId);
  const showFranchiseFilter = isInstituteAdmin;

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [franchiseId, setFranchiseId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [previewCert, setPreviewCert] = useState<CertItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", "12");
  if (status) queryParams.set("status", status);
  if (franchiseId) queryParams.set("franchiseId", franchiseId);
  if (courseId) queryParams.set("courseId", courseId);

  const { data: franchisesData } = useSWR(
    showFranchiseFilter ? "/api/franchises?limit=200" : null,
    fetcher
  );
  const franchises = Array.isArray(franchisesData)
    ? franchisesData
    : ((franchisesData as { data?: unknown[] } | null)?.data ?? []);

  const coursesUrl =
    roleId === ROLES.SUB_ADMIN ? "/api/students/franchise-courses" : "/api/courses?limit=200";
  const { data: coursesData } = useSWR(coursesUrl, fetcher);
  const coursesRaw = Array.isArray(coursesData)
    ? coursesData
    : ((coursesData as { items?: unknown[] } | null)?.items ??
      (coursesData as { data?: unknown[] } | null)?.data ??
      []);
  const courses = (coursesRaw as { id: string; name: string; courseName?: string }[]).map((c) => ({
    id: c.id,
    name: c.name ?? c.courseName ?? "Course",
  }));

  const { data, error, isLoading, mutate } = useSWR<CertResponse>(
    `/api/certificates?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: true }
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 12, total: 0, totalPages: 1 };

  const stats = {
    requested: items.filter((c) => c.status === "REQUESTED").length,
    approved: items.filter((c) => c.status === "APPROVED").length,
    issued: items.filter((c) => c.status === "ISSUED").length,
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      const d = await res.json();
      if (!res.ok) {
        await showError("Error", d.error || "Failed to update");
        return;
      }
      await showSuccess("Updated", `Certificate ${newStatus.toLowerCase()}`);
      mutate();
    } catch {
      await showError("Error", "Failed to update");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white/80">Certificate Requests</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Certificate Requests</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A35A]/35 bg-[#C4A35A]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F5E6C8]">
                <Award className="h-3 w-3" />
                Workflow
              </span>
            </div>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">
              {isInstituteAdmin
                ? "Approve requests, issue certificates, and print hard copies for franchises"
                : "Request certificates for your batch — institute admin will approve and send hard copies"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-200/80">Pending</p>
                <p className="font-bold tabular-nums text-amber-100">{stats.requested}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-sky-200/80">Approved</p>
                <p className="font-bold tabular-nums text-sky-100">{stats.approved}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-200/80">Issued</p>
                <p className="font-bold tabular-nums text-emerald-100">{stats.issued}</p>
              </div>
            </div>
            {canPrint && (
              <>
                <Link
                  href="/certificates/print"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Center
                </Link>
                <Link
                  href="/certificates/issued"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Issued
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] transition hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" />
              {isInstituteAdmin ? "Create request" : "Request batch"}
            </button>
          </div>
        </div>
      </header>

      {!isInstituteAdmin && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200/80 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            You can request certificates for your students but <strong>cannot print</strong> them here.
            After institute approval, hard copies will be printed and sent to your centre.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-4 py-3 sm:flex-row sm:items-center sm:px-5">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
          >
            <option value="">All statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="ISSUED">Issued</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
          >
            <option value="">All courses / batches</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {showFranchiseFilter && (
            <select
              value={franchiseId}
              onChange={(e) => {
                setFranchiseId(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
            >
              <option value="">All franchises</option>
              {(franchises as { id: string; name: string }[]).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => mutate()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-sm font-medium hover:bg-muted/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto p-4 sm:p-5">
          {isLoading && !data ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
            </div>
          ) : error ? (
            <p className="py-12 text-center text-red-600">
              {error instanceof Error ? error.message : "Failed to load"}
            </p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Award className="mb-3 h-12 w-12 text-[#1E4A85]/30" />
              <p className="font-medium">No certificate requests</p>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="mt-3 text-sm font-semibold text-[#1E4A85] hover:underline"
              >
                Create first request →
              </button>
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-[#1E4A85]/15">
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                    Student
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                    Course / Batch
                  </th>
                  {showFranchiseFilter && (
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                      Franchise
                    </th>
                  )}
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                    Cert #
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                    Status
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[#1E4A85]/5 transition hover:bg-[#1E4A85]/[0.03]"
                  >
                    <td className="px-3 py-3">
                      <p className="font-medium">{c.studentName}</p>
                      <p className="text-xs text-muted-foreground">{c.studentEmail}</p>
                    </td>
                    <td className="px-3 py-3">{c.courseName}</td>
                    {showFranchiseFilter && (
                      <td className="px-3 py-3 text-muted-foreground">{c.franchiseName}</td>
                    )}
                    <td className="px-3 py-3 font-mono text-xs">{c.certificateNumber}</td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                          STATUS_CHIP[c.status] ?? STATUS_CHIP.REQUESTED
                        )}
                      >
                        {c.status === "ISSUED" && <CheckCircle2 className="h-3 w-3" />}
                        {c.status === "APPROVED" && <Clock className="h-3 w-3" />}
                        {c.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                        {c.status === "REQUESTED" && <Clock className="h-3 w-3" />}
                        {c.status}
                      </span>
                      {!isInstituteAdmin && (
                        <p className="mt-1 text-[10px] text-muted-foreground">{STATUS_HINT[c.status]}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {canPrint && (c.status === "ISSUED" || c.status === "APPROVED") && (
                          <button
                            type="button"
                            onClick={() => setPreviewCert(c)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#1E4A85]/10 px-2.5 py-1 text-xs font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/20"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                          </button>
                        )}
                        {isInstituteAdmin && c.status === "REQUESTED" && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateStatus(c.id, "APPROVED")}
                              disabled={actionLoading === c.id}
                              className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(c.id, "REJECTED")}
                              disabled={actionLoading === c.id}
                              className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {isInstituteAdmin && c.status === "APPROVED" && (
                          <button
                            type="button"
                            onClick={() => updateStatus(c.id, "ISSUED")}
                            disabled={actionLoading === c.id}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Issue
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-[#1E4A85]/10 pt-4">
              <p className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border p-1.5 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="rounded-lg border p-1.5 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateCertificateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => mutate()}
      />
      {canPrint && (
        <CertificatePreviewModal
          certificateId={previewCert?.id ?? ""}
          open={!!previewCert}
          onClose={() => setPreviewCert(null)}
          studentName={previewCert?.studentName}
        />
      )}
    </div>
  );
}
