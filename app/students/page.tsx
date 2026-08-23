"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  GraduationCap,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  BookOpen,
  MapPin,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  IndianRupee,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { AddStudentModal } from "@/components/students/AddStudentModal";
import { cn } from "@/lib/utils";

interface StudentItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  franchiseId?: string;
  franchiseName: string;
  courseId?: string;
  courseName: string;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  admissionDate: string;
  status: string;
  address?: string | null;
  area?: string | null;
  pincode?: string | null;
  city?: string | null;
  state?: string | null;
}

interface StudentsResponse {
  items: StudentItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  counts?: {
    total: number;
    ACTIVE: number;
    COMPLETED: number;
    DROPPED: number;
  };
}

const STATUS_FILTERS = ["ALL", "ACTIVE", "COMPLETED", "DROPPED"] as const;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { chip: string; icon: typeof CheckCircle2; label: string }> = {
    ACTIVE: {
      chip: "bg-emerald-500/15 text-emerald-800 border-emerald-200/80",
      icon: CheckCircle2,
      label: "Active",
    },
    COMPLETED: {
      chip: "bg-[#1E4A85]/10 text-[#1E4A85] border-[#1E4A85]/20",
      icon: CheckCircle2,
      label: "Completed",
    },
    DROPPED: {
      chip: "bg-red-500/15 text-red-700 border-red-200/80",
      icon: XCircle,
      label: "Dropped",
    },
  };
  const cfg = map[status] || {
    chip: "bg-slate-100 text-slate-600 border-slate-200",
    icon: Clock,
    label: status,
  };
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        cfg.chip
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function formatAddress(s: StudentItem) {
  return [s.address, s.area, s.city, s.state, s.pincode].filter(Boolean).join(", ");
}

export default function StudentsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const roleId = Number(user?.roleId) ?? 0;
  const showFilters = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [franchiseId, setFranchiseId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selected, setSelected] = useState<StudentItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, franchiseId, courseId, statusFilter, pageSize]);

  useEffect(() => {
    if (searchParams?.get("add") === "1") {
      setAddModalOpen(true);
      window.history.replaceState({}, "", "/students");
    }
  }, [searchParams]);

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(pageSize));
  if (debouncedSearch) queryParams.set("search", debouncedSearch);
  if (franchiseId) queryParams.set("franchiseId", franchiseId);
  if (courseId) queryParams.set("courseId", courseId);
  if (statusFilter !== "ALL") queryParams.set("status", statusFilter);

  const { data: franchisesData } = useSWR(
    showFilters ? "/api/franchises?limit=100" : null,
    fetcher
  );
  const { data: coursesData } = useSWR(showFilters ? "/api/courses" : null, fetcher);

  const franchises = Array.isArray(franchisesData)
    ? franchisesData
    : ((franchisesData as { data?: unknown[] } | null)?.data ?? []);
  const courses = Array.isArray(coursesData)
    ? coursesData
    : ((coursesData as { data?: unknown[] } | null)?.data ?? []);

  const { data, error, isLoading, mutate } = useSWR<StudentsResponse>(
    `/api/students?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: true, keepPreviousData: true }
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  };
  const counts = data?.counts ?? {
    total: pagination.total,
    ACTIVE: 0,
    COMPLETED: 0,
    DROPPED: 0,
  };

  const pageNumbers = useMemo(() => {
    const totalPages = pagination.totalPages || 0;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set(
      [1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages)
    );
    return Array.from(set).sort((a, b) => a - b);
  }, [page, pagination.totalPages]);

  const pendingFeesCount = items.filter((s) => s.pendingFee > 0).length;

  return (
    <div className="space-y-5 pb-8">
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white/80">Students</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Students</h1>
              <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E8D5A3] sm:inline-flex">
                <GraduationCap className="h-3 w-3" />
                Enrollments
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-white/60 sm:text-sm">
              Students, courses, fees & franchise assignments
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                  Total
                </p>
                <p className="font-bold tabular-nums leading-tight">{counts.total}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-200/80">
                  Active
                </p>
                <p className="font-bold tabular-nums leading-tight text-emerald-100">
                  {counts.ACTIVE}
                </p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-sky-200/80">
                  Done
                </p>
                <p className="font-bold tabular-nums leading-tight text-sky-100">
                  {counts.COMPLETED}
                </p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-red-200/70">
                  Dropped
                </p>
                <p className="font-bold tabular-nums leading-tight text-red-100">
                  {counts.DROPPED}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] transition hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Student
            </button>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone…"
                className="h-9 w-full rounded-lg border border-border/70 bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
              />
            </div>
            <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border/60 bg-muted/30 p-0.5">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition",
                    statusFilter === s
                      ? "bg-[#1E4A85] text-white shadow-sm"
                      : "text-muted-foreground hover:text-[#1E4A85]"
                  )}
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                  {s !== "ALL" && (
                    <span className="ml-1 opacity-70">
                      {counts[s as keyof typeof counts] ?? 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={franchiseId}
                onChange={(e) => setFranchiseId(e.target.value)}
                className="h-9 min-w-[160px] rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
              >
                <option value="">All franchises</option>
                {franchises.map((f: { id: string; name: string }) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="h-9 min-w-[160px] rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
              >
                <option value="">All courses</option>
                {courses.map((c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {(franchiseId || courseId) && (
                <button
                  type="button"
                  onClick={() => {
                    setFranchiseId("");
                    setCourseId("");
                  }}
                  className="text-xs font-semibold text-[#1E4A85] hover:underline"
                >
                  Clear filters
                </button>
              )}
              {pendingFeesCount > 0 && (
                <span className="ml-auto rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                  {pendingFeesCount} with pending fees (this page)
                </span>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold text-amber-700">
                {error instanceof Error ? error.message : "Failed to load students"}
              </p>
              <button
                type="button"
                onClick={() => mutate()}
                className="mt-3 rounded-lg bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E4A85]/10 text-[#1E4A85]">
                <GraduationCap className="h-6 w-6" />
              </div>
              <p className="font-semibold text-foreground">No students found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {debouncedSearch || statusFilter !== "ALL" || franchiseId || courseId
                  ? "Try changing search or filters"
                  : "Add your first student to get started"}
              </p>
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#C4A35A] px-4 py-2 text-xs font-bold text-[#0B132B]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Student
              </button>
            </div>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead className="sticky top-0 z-[1] border-b border-[#1E4A85]/10 bg-[#1E4A85]/[0.04]">
                <tr>
                  {["Student", "Franchise", "Course", "Fees", "Admitted", "Status", ""].map(
                    (h) => (
                      <th
                        key={h || "actions"}
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E4A85]/70"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((s, i) => {
                  const addr = formatAddress(s);
                  return (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.2) }}
                      className="border-b border-border/50 transition-colors hover:bg-[#1E4A85]/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1E4A85]/10 text-[#1E4A85]">
                            <GraduationCap className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">{s.fullName}</p>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                              <Mail className="h-3 w-3 shrink-0" />
                              {s.email}
                            </p>
                            {s.phone && (
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {s.phone}
                              </p>
                            )}
                            {addr && (
                              <p
                                className="mt-1 flex max-w-[220px] items-center gap-1 truncate text-[10px] text-muted-foreground"
                                title={addr}
                              >
                                <MapPin className="h-3 w-3 shrink-0 text-[#1E4A85]" />
                                {addr}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <Building2 className="h-3.5 w-3.5 text-[#1E4A85]" />
                          {s.franchiseName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <BookOpen className="h-3.5 w-3.5 text-[#C4A35A]" />
                          {s.courseName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-right sm:text-left">
                          <p
                            className={cn(
                              "font-semibold tabular-nums",
                              s.pendingFee > 0 ? "text-amber-700" : "text-emerald-700"
                            )}
                          >
                            ₹{s.paidFee.toLocaleString("en-IN")}
                            <span className="font-normal text-muted-foreground">
                              {" "}
                              / ₹{s.totalFee.toLocaleString("en-IN")}
                            </span>
                          </p>
                          {s.pendingFee > 0 ? (
                            <p className="text-[10px] font-semibold text-amber-600">
                              Pending ₹{s.pendingFee.toLocaleString("en-IN")}
                            </p>
                          ) : (
                            <p className="text-[10px] font-semibold text-emerald-600">
                              Fully paid
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">
                        {s.admissionDate
                          ? new Date(s.admissionDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(s)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-[#1E4A85]/40 hover:bg-[#1E4A85]/5 hover:text-[#1E4A85]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#1E4A85]/10 bg-[#1E4A85]/[0.02] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {Math.min((page - 1) * pageSize + 1, pagination.total)}
                </span>
                –
                <span className="font-semibold text-foreground">
                  {Math.min(page * pageSize, pagination.total)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">{pagination.total}</span>
              </span>
              <label className="inline-flex items-center gap-1.5">
                <span>Rows</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 rounded-md border border-border/70 bg-background px-2 text-xs font-semibold outline-none focus:border-[#1E4A85]"
                >
                  {[5, 10, 15, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 disabled:opacity-40"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border/70 px-2.5 text-xs font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              {pageNumbers.map((n, idx) => {
                const prev = pageNumbers[idx - 1];
                const showGap = prev != null && n - prev > 1;
                return (
                  <span key={n} className="inline-flex items-center">
                    {showGap && <span className="px-1 text-muted-foreground">…</span>}
                    <button
                      type="button"
                      onClick={() => setPage(n)}
                      className={cn(
                        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold",
                        n === page
                          ? "bg-[#1E4A85] text-white"
                          : "border border-border/70 hover:border-[#1E4A85]/40"
                      )}
                    >
                      {n}
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border/70 px-2.5 text-xs font-semibold disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(pagination.totalPages)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 disabled:opacity-40"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed bottom-0 right-0 top-0 z-[51] flex w-full max-w-lg flex-col overflow-hidden border-l border-[#1E4A85]/15 bg-background shadow-2xl"
            >
              <div className="border-b border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] px-5 py-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#E8D5A3]/80">
                      Student details
                    </p>
                    <h2 className="truncate text-lg font-bold">{selected.fullName}</h2>
                    <p className="mt-0.5 truncate text-sm text-white/70">{selected.email}</p>
                    <div className="mt-2">
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-xl bg-white/10 p-2 transition hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    ["Phone", selected.phone || "—"],
                    ["Admission", selected.admissionDate || "—"],
                    ["Franchise", selected.franchiseName],
                    ["Course", selected.courseName],
                    ["Total fee", `₹${selected.totalFee.toLocaleString("en-IN")}`],
                    ["Paid", `₹${selected.paidFee.toLocaleString("en-IN")}`],
                    ["Pending", `₹${selected.pendingFee.toLocaleString("en-IN")}`],
                    ["Status", selected.status],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded-xl border border-[#1E4A85]/10 bg-[#1E4A85]/[0.03] p-3"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {k}
                      </p>
                      <p className="mt-0.5 break-words text-sm font-semibold">{v}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-[#1E4A85]/10 bg-[#1E4A85]/[0.03] p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    Address
                  </p>
                  <p className="text-sm font-medium">
                    {formatAddress(selected) || "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-[#C4A35A]/25 bg-[#C4A35A]/10 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8B6914]">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Fee summary
                  </p>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-2xl font-bold tabular-nums text-[#0B132B]">
                        ₹{selected.paidFee.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of ₹{selected.totalFee.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-bold",
                          selected.pendingFee > 0 ? "text-amber-700" : "text-emerald-700"
                        )}
                      >
                        {selected.pendingFee > 0
                          ? `₹${selected.pendingFee.toLocaleString("en-IN")} due`
                          : "Fully paid"}
                      </p>
                      <p className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Joined {selected.admissionDate || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        selected.pendingFee > 0 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{
                        width: `${
                          selected.totalFee > 0
                            ? Math.min(100, (selected.paidFee / selected.totalFee) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#1E4A85]/10 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="w-full rounded-xl bg-[#1E4A85] py-2.5 text-sm font-semibold text-white hover:bg-[#163A6B]"
                >
                  Close
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AddStudentModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
