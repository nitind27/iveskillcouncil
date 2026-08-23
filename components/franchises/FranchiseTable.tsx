"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Table, type TableColumn } from "@/components/common/Table";
import { Modal, ModalBody } from "@/components/common/Modal";
import {
  Trash2,
  Eye,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Mail,
  Loader2,
  Copy,
  MapPin,
  Users,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import FranchiseCourseManager from "./FranchiseCourseManager";
import { cn } from "@/lib/utils";
import { showDeleteConfirm, showSuccess, showError } from "@/lib/toast";
import { fetcherWithPagination } from "@/lib/fetcher";

interface FranchiseDoc {
  key?: string;
  url: string;
  name?: string;
  type?: string;
  label?: string;
}

interface Franchise {
  id: string;
  name: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  plan: {
    name: string;
    price: string;
  };
  subscriptionStart: string;
  subscriptionEnd: string;
  status: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string | null;
  email?: string | null;
  businessType?: string | null;
  legalName?: string | null;
  alternatePhone?: string | null;
  panNumber?: string | null;
  aadhaarNumber?: string | null;
  gstNumber?: string | null;
  msmeNumber?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  documents?: FranchiseDoc[] | null;
  stats: {
    students: number;
    staff: number;
  };
  createdAt: string;
  updatedAt: string;
}

const STATUS_FILTERS = ["ALL", "ACTIVE", "PENDING", "EXPIRED", "REJECTED"] as const;

const PLAN_BADGE: Record<string, string> = {
  SILVER: "bg-slate-600 text-white",
  GOLD: "bg-[#C4A35A] text-[#0B132B]",
  DIAMOND: "bg-[#1E4A85] text-white",
};

type FranchiseTableProps = {
  onStatsChange?: (stats: { total: number; active: number; pending: number }) => void;
};

export default function FranchiseTable({ onStatsChange }: FranchiseTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [courseManagerOpen, setCourseManagerOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCredentials, setResendCredentials] = useState<{
    email: string;
    password: string;
    loginUrl: string;
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, pageSize]);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    return `/api/franchises?${params.toString()}`;
  }, [page, pageSize, debouncedSearch, statusFilter]);

  const { data, isLoading, mutate } = useSWR(
    query,
    fetcherWithPagination<Franchise[]>,
    { revalidateOnFocus: true, dedupingInterval: 2000, keepPreviousData: true }
  );

  const franchises = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const total = data?.pagination?.total ?? franchises.length;

  useEffect(() => {
    if (!onStatsChange) return;
    let cancelled = false;
    (async () => {
      try {
        const [allRes, activeRes, pendingRes] = await Promise.all([
          fetch("/api/franchises?page=1&limit=1", { credentials: "include" }),
          fetch("/api/franchises?page=1&limit=1&status=ACTIVE", { credentials: "include" }),
          fetch("/api/franchises?page=1&limit=1&status=PENDING", { credentials: "include" }),
        ]);
        const [allJ, activeJ, pendingJ] = await Promise.all([
          allRes.json(),
          activeRes.json(),
          pendingRes.json(),
        ]);
        if (cancelled) return;
        onStatsChange({
          total: allJ?.pagination?.total ?? 0,
          active: activeJ?.pagination?.total ?? 0,
          pending: pendingJ?.pagination?.total ?? 0,
        });
      } catch {
        if (!cancelled) {
          onStatsChange({
            total,
            active: franchises.filter((f) => f.status === "ACTIVE").length,
            pending: franchises.filter((f) => f.status === "PENDING").length,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onStatsChange, franchises, total, data]);

  const refreshList = () => mutate();

  const handleView = async (franchise: Franchise) => {
    setSelectedFranchise(franchise);
    setViewModalOpen(true);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/franchises/${franchise.id}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data?.data) {
        setSelectedFranchise({
          ...franchise,
          ...data.data,
          owner: data.data.owner
            ? {
                id: String(data.data.owner.id),
                name: data.data.owner.name,
                email: data.data.owner.email,
                phone: data.data.owner.phone,
              }
            : franchise.owner,
          plan: data.data.plan
            ? {
                name: data.data.plan.name,
                price: String(data.data.plan.price),
              }
            : franchise.plan,
          stats: data.data.stats || franchise.stats,
        });
      }
    } catch {
      // keep list row data
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = async (franchise: Franchise) => {
    const result = await showDeleteConfirm(
      "Delete Franchise?",
      `Are you sure you want to delete "${franchise.name}"? This action cannot be undone.`
    );
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/franchises/${franchise.id}`, { method: "DELETE" });
      if (res.ok) {
        await showSuccess("Deleted!", "The franchise has been deleted successfully.");
        refreshList();
      } else {
        const errorData = await res.json();
        await showError(
          "Error!",
          errorData.error || errorData.message || "Failed to delete franchise."
        );
      }
    } catch {
      await showError("Error!", "An unexpected error occurred. Please try again.");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
      case "PENDING":
        return <Clock className="h-3.5 w-3.5 text-amber-600" />;
      case "EXPIRED":
      case "REJECTED":
        return <XCircle className="h-3.5 w-3.5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
      case "PENDING":
        return "bg-amber-500/15 text-amber-800 dark:text-amber-400";
      case "EXPIRED":
        return "bg-red-500/15 text-red-700 dark:text-red-400";
      case "REJECTED":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const columns: TableColumn<Franchise>[] = [
    {
      key: "name",
      header: "Franchise",
      sortable: true,
      render: (_value, row) => (
        <div className="flex items-start gap-2.5 min-w-[160px]">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1E4A85]/10 text-[#1E4A85]">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-foreground">{row.name}</p>
            {(row.city || row.state) && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {[row.city, row.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (_value, row) => (
        <div>
          <p className="font-medium text-foreground">{row.owner.name}</p>
          <p className="text-[11px] text-muted-foreground">{row.owner.email}</p>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (_value, row) => (
        <div>
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              PLAN_BADGE[row.plan.name] || "bg-[#1E4A85] text-white"
            )}
          >
            {row.plan.name}
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">
            ₹{parseFloat(row.plan.price).toLocaleString("en-IN")}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold",
            getStatusColor(value as string)
          )}
        >
          {getStatusIcon(value as string)}
          {value as string}
        </span>
      ),
    },
    {
      key: "stats",
      header: "People",
      render: (_value, row) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 text-[#1E4A85]" />
          <span>
            <span className="font-semibold text-foreground">{row.stats.students}</span> stu
          </span>
          <span className="text-border">·</span>
          <span>
            <span className="font-semibold text-foreground">{row.stats.staff}</span> staff
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (_value, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleView(row)}
            className="rounded-lg border border-border/70 p-1.5 text-muted-foreground transition hover:border-[#1E4A85]/40 hover:bg-[#1E4A85]/5 hover:text-[#1E4A85]"
            title="View details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedFranchise(row);
              setCourseManagerOpen(true);
            }}
            className="rounded-lg border border-border/70 p-1.5 text-muted-foreground transition hover:border-[#C4A35A]/50 hover:bg-[#C4A35A]/10 hover:text-[#8B6914]"
            title="Manage courses"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="rounded-lg border border-border/70 p-1.5 text-muted-foreground transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, city, owner…"
              className="h-9 w-full rounded-lg border border-border/70 bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => refreshList()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-muted-foreground transition hover:border-[#1E4A85]/30 hover:text-[#1E4A85]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-2 sm:p-3">
          <Table
            data={franchises}
            columns={columns}
            loading={isLoading}
            searchable={false}
            pagination={false}
            zebraStriping
            stickyHeader
            emptyMessage={
              debouncedSearch || statusFilter !== "ALL"
                ? "No franchises match your filters"
                : "No franchises yet"
            }
          />

          {total > 0 && (
            <div className="mt-3 flex flex-col gap-3 border-t border-[#1E4A85]/10 bg-[#1E4A85]/[0.02] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {Math.min((page - 1) * pageSize + 1, total)}
                  </span>
                  –
                  <span className="font-semibold text-foreground">
                    {Math.min(page * pageSize, total)}
                  </span>{" "}
                  of <span className="font-semibold text-foreground">{total}</span>
                </span>
                <label className="inline-flex items-center gap-1.5">
                  <span>Rows</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-8 rounded-lg border border-border/70 bg-background px-2 text-xs font-semibold outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
                  >
                    {[5, 10, 25, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage(1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition hover:border-[#1E4A85]/40 hover:text-[#1E4A85] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 px-3 text-xs font-semibold text-foreground transition hover:border-[#1E4A85]/40 hover:bg-[#1E4A85]/5 hover:text-[#1E4A85] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="mx-1 flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.max(totalPages, 1)) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        disabled={isLoading}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-bold transition",
                          page === pageNum
                            ? "border-[#1E4A85] bg-[#1E4A85] text-white shadow-sm"
                            : "border-border/70 text-muted-foreground hover:border-[#1E4A85]/40 hover:text-[#1E4A85]"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 px-3 text-xs font-semibold text-foreground transition hover:border-[#1E4A85]/40 hover:bg-[#1E4A85]/5 hover:text-[#1E4A85] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage(totalPages)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition hover:border-[#1E4A85]/40 hover:text-[#1E4A85] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedFranchise(null);
        }}
        size="lg"
        title="Franchise Details"
      >
        {selectedFranchise && (
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-[#1E4A85]/12 bg-[#1E4A85]/[0.04] p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1E4A85] text-white">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-bold text-foreground">{selectedFranchise.name}</p>
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      getStatusColor(selectedFranchise.status)
                    )}
                  >
                    {getStatusIcon(selectedFranchise.status)}
                    {selectedFranchise.status}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Owner
                  </label>
                  <p className="mt-1 font-medium">{selectedFranchise.owner.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedFranchise.owner.email}</p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Plan
                  </label>
                  <p className="mt-1">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        PLAN_BADGE[selectedFranchise.plan.name] || "bg-[#1E4A85] text-white"
                      )}
                    >
                      {selectedFranchise.plan.name}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ₹{parseFloat(selectedFranchise.plan.price).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Subscription
                  </label>
                  <p className="mt-1 text-sm">
                    {selectedFranchise.subscriptionStart
                      ? new Date(selectedFranchise.subscriptionStart).toLocaleDateString("en-IN")
                      : "—"}{" "}
                    →{" "}
                    {selectedFranchise.subscriptionEnd
                      ? new Date(selectedFranchise.subscriptionEnd).toLocaleDateString("en-IN")
                      : "—"}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    People
                  </label>
                  <p className="mt-1 text-sm">
                    {selectedFranchise.stats.students} students · {selectedFranchise.stats.staff}{" "}
                    staff
                  </p>
                </div>
              </div>

              {selectedFranchise.address && (
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Address
                  </label>
                  <p className="mt-1 text-sm">{selectedFranchise.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {[selectedFranchise.city, selectedFranchise.state, selectedFranchise.pincode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}

              {viewLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading KYC details…
                </div>
              )}

              {(selectedFranchise.panNumber ||
                selectedFranchise.aadhaarNumber ||
                selectedFranchise.gstNumber ||
                selectedFranchise.msmeNumber ||
                selectedFranchise.businessType) && (
                <div className="rounded-xl border border-[#1E4A85]/12 bg-[#1E4A85]/[0.03] p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#1E4A85]">
                    Business & KYC
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Business type", selectedFranchise.businessType],
                      ["Legal name", selectedFranchise.legalName],
                      ["Centre phone", selectedFranchise.phone],
                      ["Centre email", selectedFranchise.email],
                      ["PAN", selectedFranchise.panNumber],
                      ["Aadhaar", selectedFranchise.aadhaarNumber],
                      ["GSTIN", selectedFranchise.gstNumber],
                      ["MSME / Udyam", selectedFranchise.msmeNumber],
                    ]
                      .filter(([, v]) => v)
                      .map(([label, value]) => (
                        <div key={String(label)}>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {label}
                          </p>
                          <p className="mt-0.5 font-mono text-sm font-medium">{value}</p>
                        </div>
                      ))}
                  </div>
                  {(selectedFranchise.bankName || selectedFranchise.bankAccountNumber) && (
                    <div className="mt-3 border-t border-[#1E4A85]/10 pt-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Bank
                      </p>
                      <p className="text-sm font-medium">
                        {[
                          selectedFranchise.bankName,
                          selectedFranchise.bankAccountName,
                          selectedFranchise.bankAccountNumber,
                          selectedFranchise.bankIfsc,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(selectedFranchise.documents) &&
                selectedFranchise.documents.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#1E4A85]">
                      Documents ({selectedFranchise.documents.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFranchise.documents.map((doc, i) => (
                        <a
                          key={`${doc.key || doc.url}-${i}`}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E4A85]/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/5"
                        >
                          {doc.label || doc.name || doc.key || "Document"}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setViewModalOpen(false);
                    setCourseManagerOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A6B]"
                >
                  <BookOpen className="h-4 w-4" />
                  Manage Courses
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedFranchise) return;
                    setResendLoading(true);
                    try {
                      const res = await fetch(
                        `/api/franchises/${selectedFranchise.id}/resend-credentials`,
                        { method: "POST", credentials: "include" }
                      );
                      const data = await res.json();
                      if (res.ok && data?.data?.credentials) {
                        setResendCredentials(data.data.credentials);
                        if (data.data.emailSent) {
                          showSuccess("Sent", "New credentials sent to owner email.");
                        } else {
                          showSuccess(
                            "Generated",
                            "New password generated. Copy and share manually."
                          );
                        }
                      } else {
                        showError("Error", data?.error || "Failed to resend credentials.");
                      }
                    } catch {
                      showError("Error", "Network error.");
                    } finally {
                      setResendLoading(false);
                    }
                  }}
                  disabled={resendLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
                >
                  {resendLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Resend Credentials
                </button>
              </div>
            </div>
          </ModalBody>
        )}
      </Modal>

      <FranchiseCourseManager
        open={courseManagerOpen}
        onClose={() => setCourseManagerOpen(false)}
        franchiseId={selectedFranchise?.id ?? ""}
        franchiseName={selectedFranchise?.name ?? ""}
        onUpdated={refreshList}
      />

      <Modal
        open={!!resendCredentials}
        onClose={() => setResendCredentials(null)}
        size="md"
        title="Login Credentials"
      >
        {resendCredentials && (
          <ModalBody>
            <p className="mb-4 text-sm text-muted-foreground">
              Share these with the franchise owner. New password has been set.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <p className="mt-1 font-mono text-sm">{resendCredentials.email}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <div className="mt-1 flex gap-2">
                  <p className="flex-1 rounded-lg bg-muted/50 px-3 py-2 font-mono text-sm">
                    {resendCredentials.password}
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(resendCredentials.password);
                        showSuccess("Copied", "Password copied to clipboard");
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="rounded-lg border px-3 py-2 hover:bg-muted"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Login URL</label>
                <p className="mt-1 break-all text-sm">{resendCredentials.loginUrl}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setResendCredentials(null)}
                className="rounded-lg bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A6B]"
              >
                Done
              </button>
            </div>
          </ModalBody>
        )}
      </Modal>
    </>
  );
}
