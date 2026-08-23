"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Loader2,
  Mail,
  Phone,
  Search,
  RefreshCw,
  Download,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  X,
  Trash2,
  AlertTriangle,
  User,
  Copy,
  ExternalLink,
  Inbox,
  Clock,
  IndianRupee,
  MessageSquare,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { showSuccess, showError, showDeleteConfirm } from "@/lib/toast";

interface EnquiryRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string | null;
  state: string | null;
  investmentRange: string | null;
  message: string | null;
  franchiseId: string | null;
  franchiseName: string | null;
  createdAt: string;
}

interface ApiResponse {
  enquiries: EnquiryRow[];
}

const DATE_FILTERS = ["ALL", "TODAY", "7D", "30D"] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isWithinDays(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;
}

function formatLocation(row: EnquiryRow) {
  return [row.city, row.state].filter(Boolean).join(", ");
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess("Copied", `${label} copied to clipboard.`);
  } catch {
    showError("Error", "Could not copy to clipboard.");
  }
}

export default function FranchiseInquiriesPage() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    "/api/franchise-inquiries",
    fetcher,
    { revalidateOnFocus: true }
  );

  const allEnquiries = data?.enquiries ?? [];

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");
  const [franchiseFilter, setFranchiseFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<EnquiryRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateFilter, franchiseFilter, pageSize]);

  const franchiseOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of allEnquiries) {
      if (e.franchiseId && e.franchiseName) {
        map.set(e.franchiseId, e.franchiseName);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allEnquiries]);

  const stats = useMemo(() => {
    const today = allEnquiries.filter((e) => isToday(e.createdAt)).length;
    const week = allEnquiries.filter((e) => isWithinDays(e.createdAt, 7)).length;
    const withFranchise = allEnquiries.filter((e) => e.franchiseName).length;
    return { total: allEnquiries.length, today, week, withFranchise };
  }, [allEnquiries]);

  const filtered = useMemo(() => {
    let rows = [...allEnquiries];

    if (dateFilter === "TODAY") {
      rows = rows.filter((e) => isToday(e.createdAt));
    } else if (dateFilter === "7D") {
      rows = rows.filter((e) => isWithinDays(e.createdAt, 7));
    } else if (dateFilter === "30D") {
      rows = rows.filter((e) => isWithinDays(e.createdAt, 30));
    }

    if (franchiseFilter) {
      rows = rows.filter((e) => e.franchiseId === franchiseFilter);
    }

    if (debouncedSearch) {
      rows = rows.filter((e) => {
        const hay = [
          e.fullName,
          e.email,
          e.phone,
          e.franchiseName,
          e.city,
          e.state,
          e.investmentRange,
          e.message,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(debouncedSearch);
      });
    }

    return rows;
  }, [allEnquiries, debouncedSearch, dateFilter, franchiseFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set(
      [1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages)
    );
    return Array.from(set).sort((a, b) => a - b);
  }, [page, totalPages]);

  const errorMsg =
    (error as { status?: number })?.status === 401
      ? "Unauthorized — admin access required."
      : error instanceof Error
        ? error.message
        : "Failed to load inquiries";

  const handleDelete = async (row: EnquiryRow) => {
    const result = await showDeleteConfirm(
      "Delete inquiry?",
      `Remove inquiry from ${row.fullName}? This cannot be undone.`
    );
    if (!result.isConfirmed) return;

    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/franchise-inquiries?id=${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError("Error", json.error || "Failed to delete inquiry.");
        return;
      }
      showSuccess("Deleted", "Inquiry removed.");
      if (selected?.id === row.id) setSelected(null);
      mutate();
    } catch {
      showError("Error", "Network error.");
    } finally {
      setDeletingId(null);
    }
  };

  const exportCsv = useCallback(() => {
    const headers = [
      "Date",
      "Name",
      "Email",
      "Phone",
      "Franchise",
      "City",
      "State",
      "Investment Range",
      "Message",
    ];
    const rows = filtered.map((e) => [
      e.createdAt,
      e.fullName,
      e.email,
      e.phone,
      e.franchiseName ?? "",
      e.city ?? "",
      e.state ?? "",
      e.investmentRange ?? "",
      e.message ?? "",
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `franchise-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white/80">Franchise Inquiries</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Franchise Inquiries
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E8D5A3]">
                <Building2 className="h-3 w-3" />
                Visit & Enquire
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-white/60 sm:text-sm">
              Leads from franchise cards on the user panel — investment interest & contact details
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                  Total
                </p>
                <p className="font-bold tabular-nums leading-tight">{stats.total}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-sky-200/80">
                  Today
                </p>
                <p className="font-bold tabular-nums leading-tight text-sky-100">
                  {stats.today}
                </p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#E8D5A3]/70">
                  With franchise
                </p>
                <p className="font-bold tabular-nums leading-tight text-[#F5E6C8]">
                  {stats.withFranchise}
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
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] transition hover:brightness-110 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, franchise, location…"
                className="h-9 w-full rounded-lg border border-border/70 bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border/60 bg-muted/30 p-0.5">
                {DATE_FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setDateFilter(f)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition",
                      dateFilter === f
                        ? "bg-[#1E4A85] text-white shadow-sm"
                        : "text-muted-foreground hover:text-[#1E4A85]"
                    )}
                  >
                    {f === "ALL"
                      ? "All"
                      : f === "TODAY"
                        ? "Today"
                        : f === "7D"
                          ? "7 days"
                          : "30 days"}
                  </button>
                ))}
              </div>
              {franchiseOptions.length > 0 && (
                <select
                  value={franchiseFilter}
                  onChange={(e) => setFranchiseFilter(e.target.value)}
                  className="h-9 min-w-[160px] rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
                >
                  <option value="">All franchises</option>
                  {franchiseOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-9 rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
              >
                {[10, 15, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(debouncedSearch || dateFilter !== "ALL" || franchiseFilter) && (
            <p className="text-xs text-muted-foreground">
              Showing {total} of {stats.total} inquiries
              {(debouncedSearch || franchiseFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFranchiseFilter("");
                  }}
                  className="ml-2 font-semibold text-[#1E4A85] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
            </div>
          ) : error && !data ? (
            <div className="px-6 py-16 text-center">
              <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
              <p className="font-semibold text-amber-700">{errorMsg}</p>
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
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E4A85]/10">
                <Inbox className="h-7 w-7 text-[#1E4A85]" />
              </div>
              <p className="text-lg font-bold text-foreground">No inquiries yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {debouncedSearch || dateFilter !== "ALL" || franchiseFilter
                  ? "Try adjusting your filters."
                  : 'Leads appear when users click "Visit & Enquire" on franchise cards.'}
              </p>
              <Link
                href="/userpanel"
                className="mt-4 inline-flex text-sm font-semibold text-[#1E4A85] hover:underline"
              >
                View user panel →
              </Link>
            </div>
          ) : (
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#1E4A85]/10 bg-muted/40">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Franchise
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Investment
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Message
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const location = formatLocation(row);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border/50 transition hover:bg-[#1E4A85]/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <p className="flex items-center gap-1 text-xs font-medium text-foreground">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(row.createdAt)}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(row.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {isToday(row.createdAt) && (
                          <span className="mt-1 inline-flex rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                            New
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{row.fullName}</p>
                        <a
                          href={`mailto:${row.email}`}
                          className="mt-0.5 flex items-center gap-1 text-xs text-[#1E4A85] hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {row.email}
                        </a>
                        <a
                          href={`tel:${row.phone}`}
                          className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                          {row.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {row.franchiseName ? (
                          <span className="inline-flex max-w-[160px] items-center gap-1 rounded-full border border-[#C4A35A]/30 bg-[#C4A35A]/10 px-2 py-0.5 text-[11px] font-semibold text-[#8B6914]">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{row.franchiseName}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">General inquiry</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {location ? (
                          <p className="flex items-start gap-1 text-xs text-muted-foreground">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                            {location}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.investmentRange ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <IndianRupee className="h-3 w-3" />
                            {row.investmentRange}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="max-w-[180px] px-4 py-3">
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {row.message || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelected(row)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-[#1E4A85] transition hover:bg-[#1E4A85]/10"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            disabled={deletingId === row.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && items.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#1E4A85]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers.map((p, i) => (
                <React.Fragment key={p}>
                  {i > 0 && pageNumbers[i - 1] !== p - 1 && (
                    <span className="px-1 text-muted-foreground">…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold",
                      page === p
                        ? "border-[#1E4A85] bg-[#1E4A85] text-white"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-md flex-col border-l border-[#1E4A85]/15 bg-background shadow-2xl"
            >
              <div className="border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#0F2A4A] to-[#1E4A85] px-5 py-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#E8D5A3]">
                      Franchise inquiry
                    </p>
                    <h2 className="mt-1 truncate text-lg font-bold">{selected.fullName}</h2>
                    <p className="mt-1 text-xs text-white/65">{formatDateTime(selected.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                <section className="rounded-xl border border-border/60 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                    <User className="h-3.5 w-3.5" />
                    Contact
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`mailto:${selected.email}`}
                        className="flex items-center gap-1.5 font-medium text-[#1E4A85] hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {selected.email}
                      </a>
                      <button
                        type="button"
                        onClick={() => copyText(selected.email, "Email")}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={`tel:${selected.phone}`}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {selected.phone}
                      </a>
                      <button
                        type="button"
                        onClick={() => copyText(selected.phone, "Phone")}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-border/60 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                    <Building2 className="h-3.5 w-3.5" />
                    Franchise interest
                  </h3>
                  {selected.franchiseName ? (
                    <div>
                      <p className="font-semibold">{selected.franchiseName}</p>
                      {selected.franchiseId && (
                        <Link
                          href={`/franchises?search=${encodeURIComponent(selected.franchiseName)}`}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1E4A85] hover:underline"
                        >
                          View franchise
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">General franchise inquiry</p>
                  )}
                </section>

                {(selected.city || selected.state) && (
                  <section className="rounded-xl border border-border/60 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                      <MapPin className="h-3.5 w-3.5" />
                      Location
                    </h3>
                    <p className="text-sm text-muted-foreground">{formatLocation(selected)}</p>
                  </section>
                )}

                {selected.investmentRange && (
                  <section className="rounded-xl border border-border/60 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                      <IndianRupee className="h-3.5 w-3.5" />
                      Investment range
                    </h3>
                    <p className="font-semibold text-emerald-700">{selected.investmentRange}</p>
                  </section>
                )}

                {selected.message && (
                  <section className="rounded-xl border border-border/60 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message
                    </h3>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {selected.message}
                    </p>
                  </section>
                )}
              </div>

              <div className="flex gap-2 border-t border-border/60 p-4">
                <a
                  href={`mailto:${selected.email}?subject=Re: Franchise inquiry${selected.franchiseName ? ` - ${encodeURIComponent(selected.franchiseName)}` : ""}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1E4A85] py-2.5 text-sm font-bold text-white hover:bg-[#163A6B]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Reply via email
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(selected)}
                  disabled={deletingId === selected.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === selected.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
