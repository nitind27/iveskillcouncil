"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  IndianRupee,
  Loader2,
  Plus,
  Search,
  RefreshCw,
  Building2,
  BookOpen,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Users,
} from "lucide-react";
import { GlassModal } from "@/components/common/GlassModal";
import { fetcher } from "@/lib/fetcher";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface FeeItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  courseName: string;
  franchiseName: string;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  address?: string | null;
  area?: string | null;
  pincode?: string | null;
  city?: string | null;
  state?: string | null;
}

interface FeesData {
  items: FeeItem[];
  pendingFees: FeeItem[];
  recentPayments: {
    id: string;
    studentName: string;
    amount: number;
    status: string;
    paymentMode: string;
    paymentDate: string;
  }[];
  summary: {
    totalStudents: number;
    pendingStudents?: number;
    paidStudents?: number;
    totalFee: number;
    paidFee: number;
    pendingFee: number;
  };
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

const FEE_FILTERS = ["ALL", "PENDING", "PAID"] as const;

export default function FeesPage() {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const showFranchiseFilter = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [franchiseId, setFranchiseId] = useState("");
  const [feeFilter, setFeeFilter] = useState<(typeof FEE_FILTERS)[number]>("ALL");
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [editFeeOpen, setEditFeeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState<{
    studentId: string;
    amount: string;
    paymentMode: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
    transactionReference: string;
  }>({ studentId: "", amount: "", paymentMode: "CASH", transactionReference: "" });
  const [editForm, setEditForm] = useState<{
    studentId: string;
    studentName: string;
    totalFee: string;
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounced, franchiseId, feeFilter, pageSize]);

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(pageSize));
  if (searchDebounced) queryParams.set("search", searchDebounced);
  if (franchiseId) queryParams.set("franchiseId", franchiseId);
  if (feeFilter !== "ALL") queryParams.set("feeStatus", feeFilter);

  const { data: franchisesData } = useSWR(
    showFranchiseFilter ? "/api/franchises?limit=200" : null,
    fetcher
  );
  const franchises = Array.isArray(franchisesData)
    ? franchisesData
    : ((franchisesData as { data?: unknown[] } | null)?.data ?? []);

  const { data, error, isLoading, mutate } = useSWR<FeesData>(
    `/api/fees?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: true, keepPreviousData: true }
  );

  const pendingQuery = new URLSearchParams();
  pendingQuery.set("pendingOnly", "1");
  pendingQuery.set("limit", "200");
  if (franchiseId) pendingQuery.set("franchiseId", franchiseId);
  const { data: pendingData } = useSWR<FeesData>(
    addPaymentOpen ? `/api/fees?${pendingQuery.toString()}` : null,
    fetcher
  );
  const pendingForModal = pendingData?.pendingFees ?? [];

  const summary = data?.summary ?? {
    totalStudents: 0,
    pendingStudents: 0,
    paidStudents: 0,
    totalFee: 0,
    paidFee: 0,
    pendingFee: 0,
  };
  const items = data?.items ?? [];
  const recent = data?.recentPayments ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  };

  const pageNumbers = useMemo(() => {
    const totalPages = pagination.totalPages || 0;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set(
      [1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages)
    );
    return Array.from(set).sort((a, b) => a - b);
  }, [page, pagination.totalPages]);

  const collectionPct =
    summary.totalFee > 0 ? Math.min(100, (summary.paidFee / summary.totalFee) * 100) : 0;

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
              <span className="text-white/80">Fees</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Fees Management</h1>
              <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E8D5A3] sm:inline-flex">
                <Wallet className="h-3 w-3" />
                Collections
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-white/60 sm:text-sm">
              Track dues, record payments & fee totals
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                  Students
                </p>
                <p className="font-bold tabular-nums leading-tight">{summary.totalStudents}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-200/80">
                  Collected
                </p>
                <p className="font-bold tabular-nums leading-tight text-emerald-100">
                  ₹{(summary.paidFee / 1000).toFixed(summary.paidFee >= 1000 ? 1 : 0)}
                  {summary.paidFee >= 1000 ? "k" : ""}
                </p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#E8D5A3]/70">
                  Pending
                </p>
                <p className="font-bold tabular-nums leading-tight text-[#F5E6C8]">
                  ₹{(summary.pendingFee / 1000).toFixed(summary.pendingFee >= 1000 ? 1 : 0)}
                  {summary.pendingFee >= 1000 ? "k" : ""}
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
              onClick={() => setAddPaymentOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] transition hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Payment
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-3 sm:px-6">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="text-white/60">Collection progress</span>
            <span className="font-semibold text-[#E8D5A3]">{collectionPct.toFixed(0)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C4A35A] to-emerald-400 transition-all"
              style={{ width: `${collectionPct}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-white/55">
            <span>
              Total fee{" "}
              <strong className="text-white">₹{summary.totalFee.toLocaleString("en-IN")}</strong>
            </span>
            <span>
              Paid{" "}
              <strong className="text-emerald-200">
                ₹{summary.paidFee.toLocaleString("en-IN")}
              </strong>
            </span>
            <span>
              Due{" "}
              <strong className="text-[#F5E6C8]">
                ₹{summary.pendingFee.toLocaleString("en-IN")}
              </strong>
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "All students",
            value: summary.totalStudents,
            icon: Users,
            tone: "bg-[#1E4A85]/10 text-[#1E4A85]",
          },
          {
            label: "With pending dues",
            value: summary.pendingStudents ?? "—",
            icon: AlertCircle,
            tone: "bg-amber-500/10 text-amber-700",
          },
          {
            label: "Fully paid",
            value: summary.paidStudents ?? "—",
            icon: CheckCircle2,
            tone: "bg-emerald-500/10 text-emerald-700",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-3 rounded-2xl border border-[#1E4A85]/10 bg-card px-4 py-3 shadow-sm"
          >
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.tone)}>
              <c.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {c.label}
              </p>
              <p className="text-xl font-bold tabular-nums text-foreground">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

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
              {FEE_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFeeFilter(s)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition",
                    feeFilter === s
                      ? "bg-[#1E4A85] text-white shadow-sm"
                      : "text-muted-foreground hover:text-[#1E4A85]"
                  )}
                >
                  {s === "ALL" ? "All" : s === "PENDING" ? "Pending" : "Paid"}
                  {s === "PENDING" && summary.pendingStudents != null && (
                    <span className="ml-1 opacity-70">{summary.pendingStudents}</span>
                  )}
                  {s === "PAID" && summary.paidStudents != null && (
                    <span className="ml-1 opacity-70">{summary.paidStudents}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {showFranchiseFilter && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={franchiseId}
                onChange={(e) => setFranchiseId(e.target.value)}
                className="h-9 min-w-[180px] rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
              >
                <option value="">All franchises</option>
                {franchises.map((f: { id: string; name: string }) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {(franchiseId || searchDebounced || feeFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setFranchiseId("");
                    setSearch("");
                    setSearchDebounced("");
                    setFeeFilter("ALL");
                  }}
                  className="text-xs font-semibold text-[#1E4A85] hover:underline"
                >
                  Clear filters
                </button>
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
                {error instanceof Error ? error.message : "Failed to load fees"}
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
                <IndianRupee className="h-6 w-6" />
              </div>
              <p className="font-semibold text-foreground">No fee records found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add students or change filters to see fee data
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[880px] text-sm">
              <thead className="sticky top-0 z-[1] border-b border-[#1E4A85]/10 bg-[#1E4A85]/[0.04]">
                <tr>
                  {[
                    "Student",
                    ...(showFranchiseFilter ? ["Franchise"] : []),
                    "Course",
                    "Total",
                    "Paid",
                    "Pending",
                    "",
                  ].map((h) => (
                    <th
                      key={h || "actions"}
                      className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E4A85]/70"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((s, i) => {
                  const pct =
                    s.totalFee > 0 ? Math.min(100, (s.paidFee / s.totalFee) * 100) : 0;
                  return (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.2) }}
                      className="border-b border-border/50 transition-colors hover:bg-[#1E4A85]/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{s.fullName}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {s.email}
                        </p>
                        {s.phone && (
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {s.phone}
                          </p>
                        )}
                      </td>
                      {showFranchiseFilter && (
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <Building2 className="h-3.5 w-3.5 text-[#1E4A85]" />
                            {s.franchiseName}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <BookOpen className="h-3.5 w-3.5 text-[#C4A35A]" />
                          {s.courseName}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        ₹{s.totalFee.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold tabular-nums text-emerald-700">
                          ₹{s.paidFee.toLocaleString("en-IN")}
                        </p>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              s.pendingFee > 0 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.pendingFee > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                            ₹{s.pendingFee.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Clear
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditForm({
                                studentId: s.id,
                                studentName: s.fullName,
                                totalFee: String(s.totalFee),
                              });
                              setEditFeeOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:border-[#1E4A85]/40 hover:text-[#1E4A85]"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          {s.pendingFee > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setAddForm((f) => ({
                                  ...f,
                                  studentId: s.id,
                                  amount: String(s.pendingFee),
                                }));
                                setAddPaymentOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#1E4A85] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#163A6B]"
                            >
                              <Wallet className="h-3 w-3" />
                              Record
                            </button>
                          )}
                        </div>
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
                of <span className="font-semibold text-foreground">{pagination.total}</span>
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

      {recent.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
          <div className="border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-4 py-3 sm:px-5">
            <h2 className="text-sm font-bold text-[#1E4A85]">Recent payments</h2>
            <p className="text-xs text-muted-foreground">Latest successful fee collections</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5 text-left">Student</th>
                  <th className="px-4 py-2.5 text-left">Date</th>
                  <th className="px-4 py-2.5 text-left">Mode</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} className="border-b border-border/40 hover:bg-[#1E4A85]/[0.03]">
                    <td className="px-4 py-2.5 font-medium">{p.studentName}</td>
                    <td className="px-4 py-2.5 text-xs tabular-nums text-muted-foreground">
                      {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums text-emerald-700">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <GlassModal
        open={editFeeOpen}
        onClose={() => {
          setEditFeeOpen(false);
          setEditForm(null);
        }}
        title="Edit Total Fee"
        size="md"
        closeOnOverlayClick={!submitting}
      >
        {editForm && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editForm.studentId || !editForm.totalFee || parseFloat(editForm.totalFee) < 0)
                return;
              setSubmitting(true);
              try {
                const res = await fetch(`/api/students/${editForm.studentId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ totalFee: parseFloat(editForm.totalFee) }),
                });
                const json = await res.json();
                if (!res.ok) {
                  showError("Error", json.error || "Failed to update fee");
                  return;
                }
                showSuccess("Success", "Total fee updated successfully");
                setEditFeeOpen(false);
                setEditForm(null);
                mutate();
              } catch {
                showError("Error", "Failed to update fee");
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Student: <strong className="text-foreground">{editForm.studentName}</strong>
            </p>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#1E4A85]/80">
                New Total Fee (₹) *
              </label>
              <input
                type="number"
                value={editForm.totalFee}
                onChange={(e) =>
                  setEditForm((f) => (f ? { ...f, totalFee: e.target.value } : null))
                }
                className="w-full rounded-xl border border-[#1E4A85]/15 px-3.5 py-2.5 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditFeeOpen(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A6B] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Update Fee
              </button>
            </div>
          </form>
        )}
      </GlassModal>

      <GlassModal
        open={addPaymentOpen}
        onClose={() => {
          setAddPaymentOpen(false);
          setAddForm({
            studentId: "",
            amount: "",
            paymentMode: "CASH",
            transactionReference: "",
          });
        }}
        title="Add Payment"
        size="md"
        closeOnOverlayClick={!submitting}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!addForm.studentId || !addForm.amount || parseFloat(addForm.amount) <= 0) {
              showError("Validation", "Select student and enter amount");
              return;
            }
            setSubmitting(true);
            try {
              const res = await fetch("/api/fees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  studentId: addForm.studentId,
                  amount: parseFloat(addForm.amount),
                  paymentMode: addForm.paymentMode,
                  transactionReference: addForm.transactionReference.trim() || undefined,
                }),
              });
              const json = await res.json();
              if (!res.ok) {
                showError("Error", json.error || "Failed to record payment");
                return;
              }
              showSuccess("Success", "Payment recorded successfully");
              setAddPaymentOpen(false);
              setAddForm({
                studentId: "",
                amount: "",
                paymentMode: "CASH",
                transactionReference: "",
              });
              mutate();
            } catch {
              showError("Error", "Failed to record payment");
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#1E4A85]/80">
              Student *
            </label>
            <select
              value={addForm.studentId}
              onChange={(e) => {
                const id = e.target.value;
                const s = pendingForModal.find((p) => p.id === id);
                setAddForm((f) => ({
                  ...f,
                  studentId: id,
                  amount: s ? String(s.pendingFee) : f.amount,
                }));
              }}
              className="w-full rounded-xl border border-[#1E4A85]/15 px-3.5 py-2.5 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
              required
              disabled={pendingForModal.length === 0}
            >
              <option value="">
                {pendingForModal.length === 0
                  ? "No students with pending fees"
                  : "Select student"}
              </option>
              {pendingForModal.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} – ₹{s.pendingFee.toLocaleString("en-IN")} pending
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#1E4A85]/80">
              Amount (₹) *
            </label>
            <input
              type="number"
              value={addForm.amount}
              onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full rounded-xl border border-[#1E4A85]/15 px-3.5 py-2.5 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
              min="0.01"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#1E4A85]/80">
              Payment Mode
            </label>
            <select
              value={addForm.paymentMode}
              onChange={(e) =>
                setAddForm((f) => ({
                  ...f,
                  paymentMode: e.target.value as "CASH" | "UPI" | "CARD" | "BANK_TRANSFER",
                }))
              }
              className="w-full rounded-xl border border-[#1E4A85]/15 px-3.5 py-2.5 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#1E4A85]/80">
              Transaction Reference
            </label>
            <input
              type="text"
              value={addForm.transactionReference}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, transactionReference: e.target.value }))
              }
              placeholder="UPI ref, cheque no., etc."
              className="w-full rounded-xl border border-[#1E4A85]/15 px-3.5 py-2.5 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddPaymentOpen(false)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#C4A35A] px-4 py-2 text-sm font-bold text-[#0B132B] hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Record Payment
            </button>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
