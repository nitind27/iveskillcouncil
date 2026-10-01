"use client";

import { useEffect, useState } from "react";
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
  Search,
  Building2,
  CheckCheck,
  CheckSquare,
  Square,
  Send,
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
import { StudentOfficialCertificatesModal } from "@/components/certificates/StudentOfficialCertificatesModal";
import { OfficialBatchPreview } from "@/components/certificates/OfficialBatchPreview";

interface CertItem {
  id: string;
  studentId: string;
  studentCode?: string;
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
  counts?: Record<"REQUESTED" | "APPROVED" | "ISSUED" | "REJECTED", number>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

type BulkStatus = "APPROVED" | "REJECTED" | "ISSUED";

const PRINTABLE = new Set(["APPROVED", "ISSUED"]);
const MAX_PRINT = 100;

const STATUS_CHIP: Record<string, string> = {
  ISSUED: "bg-emerald-500/10 text-emerald-800 border-emerald-200/80",
  APPROVED: "bg-blue-500/10 text-blue-800 border-blue-200/80",
  REJECTED: "bg-red-500/10 text-red-800 border-red-200/80",
  REQUESTED: "bg-amber-500/10 text-amber-800 border-amber-200/80",
};

const STATUS_HINT: Record<string, string> = {
  REQUESTED: "Waiting for institute approval",
  APPROVED: "Approved — institute will print certificate & result",
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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [printStudentId, setPrintStudentId] = useState<string | null>(null);
  const [batchPrintIds, setBatchPrintIds] = useState<string[] | null>(null);
  const [batchPrintCertIds, setBatchPrintCertIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Map<string, CertItem>>(new Map());

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", "25");
  if (status) queryParams.set("status", status);
  if (franchiseId) queryParams.set("franchiseId", franchiseId);
  if (courseId) queryParams.set("courseId", courseId);
  if (search) queryParams.set("search", search);

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
  const pagination = data?.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 1 };

  const stats = {
    requested: data?.counts?.REQUESTED ?? 0,
    approved: data?.counts?.APPROVED ?? 0,
    issued: data?.counts?.ISSUED ?? 0,
  };
  const selectedFranchise = (franchises as { id: string; name: string }[]).find((f) => f.id === franchiseId);

  const selectedList = Array.from(selected.values());
  const selectedPending = selectedList.filter((c) => c.status === "REQUESTED");
  const selectedPrintable = selectedList.filter((c) => PRINTABLE.has(c.status));
  const selectedApproved = selectedList.filter((c) => c.status === "APPROVED");
  const allOnPageSelected = items.length > 0 && items.every((c) => selected.has(c.id));

  const toggleRow = (c: CertItem) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(c.id)) next.delete(c.id);
      else next.set(c.id, c);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) items.forEach((c) => next.delete(c.id));
      else items.forEach((c) => next.set(c.id, c));
      return next;
    });
  };

  const bulkUpdate = async (
    newStatus: BulkStatus,
    target: { ids: string[] } | { franchiseId: string; courseId?: string; search?: string },
    confirmText?: string
  ) => {
    if (confirmText && !window.confirm(confirmText)) return false;
    setActionLoading("bulk");
    try {
      const res = await fetch("/api/certificates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus, ...target }),
      });
      const d = await res.json();
      if (!res.ok) {
        await showError("Error", d.error || "Failed to update");
        return false;
      }
      await showSuccess("Updated", d.message || `Requests ${newStatus.toLowerCase()}`);
      setSelected(new Map());
      mutate();
      return true;
    } catch {
      await showError("Error", "Failed to update");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const openBatchPrint = (rows: CertItem[]) => {
    const printable = rows.filter((c) => PRINTABLE.has(c.status));
    if (!printable.length) return;
    const ids = Array.from(new Set(printable.map((c) => c.studentId))).slice(0, MAX_PRINT);
    setBatchPrintCertIds(printable.filter((c) => c.status === "APPROVED").map((c) => c.id));
    setBatchPrintIds(ids);
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
      setSelected(new Map());
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
                ? "Select a franchise, approve its requests, then print Certificate + Result for approved students"
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
            Select any of your students (or a whole batch) and send a request. Once the institute admin approves it,
            the <strong>Certificate of Completion + Statement of Marks</strong> are printed by the institute and sent to
            your centre — you can track the status here.
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
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search student name or ID"
              className="h-9 w-full rounded-lg border border-border/70 bg-background pl-8 pr-3 text-sm outline-none focus:border-[#1E4A85]"
            />
          </div>
          <button
            type="button"
            onClick={() => mutate()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-sm font-medium hover:bg-muted/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {isInstituteAdmin && selectedFranchise && (
          <div className="flex flex-col gap-3 border-b border-[#C4A35A]/25 bg-[#C4A35A]/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B1F3A] text-[#C4A35A]">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{selectedFranchise.name}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.requested} pending · {stats.approved} approved (ready to print) · {stats.issued} issued
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!stats.requested || actionLoading === "bulk"}
                onClick={() =>
                  bulkUpdate(
                    "APPROVED",
                    { franchiseId, courseId, search },
                    `Approve all ${stats.requested} pending request(s) of ${selectedFranchise.name}?`
                  )
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-40"
              >
                {actionLoading === "bulk" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Approve all pending ({stats.requested})
              </button>
              {canPrint && (
                <button
                  type="button"
                  disabled={!stats.approved || actionLoading === "print-franchise"}
                  onClick={async () => {
                    setActionLoading("print-franchise");
                    try {
                      const qs = new URLSearchParams({ franchiseId, status: "APPROVED", limit: String(MAX_PRINT) });
                      if (courseId) qs.set("courseId", courseId);
                      if (search) qs.set("search", search);
                      const res = await fetch(`/api/certificates?${qs}`, { credentials: "include" });
                      const json = await res.json();
                      openBatchPrint((json?.data?.items ?? []) as CertItem[]);
                    } catch {
                      await showError("Error", "Failed to load approved requests");
                    } finally {
                      setActionLoading(null);
                    }
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] hover:brightness-110 disabled:opacity-40"
                >
                  {actionLoading === "print-franchise" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Printer className="h-3.5 w-3.5" />
                  )}
                  Print approved ({Math.min(stats.approved, MAX_PRINT)})
                </button>
              )}
            </div>
          </div>
        )}

        {isInstituteAdmin && selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#1E4A85]/15 bg-[#1E4A85]/[0.05] px-4 py-2.5 sm:px-5">
            <span className="mr-1 text-sm font-bold text-[#1E4A85]">{selected.size} selected</span>
            <button
              type="button"
              disabled={!selectedPending.length || actionLoading === "bulk"}
              onClick={() => bulkUpdate("APPROVED", { ids: selectedPending.map((c) => c.id) })}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Approve ({selectedPending.length})
            </button>
            <button
              type="button"
              disabled={!selectedPending.length || actionLoading === "bulk"}
              onClick={() =>
                bulkUpdate(
                  "REJECTED",
                  { ids: selectedPending.map((c) => c.id) },
                  `Reject ${selectedPending.length} request(s)?`
                )
              }
              className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-40"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject ({selectedPending.length})
            </button>
            {canPrint && (
              <button
                type="button"
                disabled={!selectedPrintable.length}
                onClick={() => openBatchPrint(selectedPrintable)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#C4A35A] px-2.5 py-1.5 text-xs font-bold text-[#0B132B] disabled:opacity-40"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Certificate + Result ({selectedPrintable.length})
              </button>
            )}
            <button
              type="button"
              disabled={!selectedApproved.length || actionLoading === "bulk"}
              onClick={() => bulkUpdate("ISSUED", { ids: selectedApproved.map((c) => c.id) })}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              Mark issued ({selectedApproved.length})
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Map())}
              className="ml-auto text-xs font-medium text-muted-foreground hover:underline"
            >
              Clear selection
            </button>
          </div>
        )}

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
                  {isInstituteAdmin && (
                    <th className="w-10 px-3 py-3">
                      <button
                        type="button"
                        onClick={togglePage}
                        aria-label={allOnPageSelected ? "Unselect page" : "Select page"}
                        className="flex h-5 w-5 items-center justify-center"
                      >
                        {allOnPageSelected ? (
                          <CheckSquare className="h-4 w-4 text-[#1E4A85]" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </th>
                  )}
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
                    className={cn(
                      "border-b border-[#1E4A85]/5 transition",
                      selected.has(c.id) ? "bg-[#C4A35A]/10" : "hover:bg-[#1E4A85]/[0.03]"
                    )}
                  >
                    {isInstituteAdmin && (
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => toggleRow(c)}
                          aria-label={selected.has(c.id) ? "Unselect" : "Select"}
                          className="flex h-5 w-5 items-center justify-center"
                        >
                          {selected.has(c.id) ? (
                            <CheckSquare className="h-4 w-4 text-[#1E4A85]" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <p className="font-medium">{c.studentName}</p>
                      <p className="text-xs text-muted-foreground">{c.studentCode || c.studentEmail}</p>
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
                        {canPrint && PRINTABLE.has(c.status) && (
                          <button
                            type="button"
                            onClick={() => setPrintStudentId(c.studentId)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#C4A35A]/40 bg-[#C4A35A]/10 px-2.5 py-1 text-xs font-semibold text-[#8B6914] hover:bg-[#C4A35A]/20"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Print
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
        <>
          <StudentOfficialCertificatesModal
            studentId={printStudentId}
            open={!!printStudentId}
            onClose={() => setPrintStudentId(null)}
          />
          <OfficialBatchPreview
            studentIds={batchPrintIds}
            onClose={() => setBatchPrintIds(null)}
            extraAction={
              batchPrintCertIds.length > 0 ? (
                <button
                  type="button"
                  disabled={actionLoading === "bulk"}
                  onClick={async () => {
                    const ok = await bulkUpdate(
                      "ISSUED",
                      { ids: batchPrintCertIds },
                      `Mark ${batchPrintCertIds.length} printed certificate(s) as ISSUED?`
                    );
                    if (ok) setBatchPrintCertIds([]);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Mark {batchPrintCertIds.length} as issued
                </button>
              ) : null
            }
          />
        </>
      )}
    </div>
  );
}
