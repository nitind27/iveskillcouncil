"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { Modal } from "@/components/common/Modal";
import {
  FileCheck,
  Loader2,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Mail,
  Phone,
  MapPin,
  IndianRupee,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  ImageIcon,
  X,
  Package,
  User,
  CreditCard,
} from "lucide-react";
import { showSuccess, showError, showDeleteConfirm } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { fetcher, fetcherWithPagination } from "@/lib/fetcher";

interface PendingFranchise {
  id: string;
  name: string;
  owner: { id: string; name: string; email: string; phone?: string };
  plan: { id?: number; name: string; price: string };
  subscriptionStart: string;
  subscriptionEnd: string;
  status: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  rejectionReason?: string;
  stats?: { students: number; staff: number };
  createdAt: string;
  updatedAt: string;
}

interface FranchiseDetail extends PendingFranchise {
  businessType?: string;
  legalName?: string;
  alternatePhone?: string;
  phone?: string;
  email?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  gstNumber?: string;
  msmeNumber?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  documents?: unknown;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  durationInDays: number;
}

interface Doc {
  key: string;
  url: string;
  name: string;
  type: string;
  label: string;
}

const DOC_LABELS: Record<string, string> = {
  pan: "PAN Card",
  aadhar: "Aadhaar Card",
  photo: "Photo",
  signature: "Signature",
  address_proof: "Address Proof",
  bank: "Bank Proof",
  gst: "GST Certificate",
  entity_reg: "Entity Registration",
  logo: "Logo",
  centre_photo: "Centre Photo",
};

function normalizeDocuments(raw: unknown): Doc[] {
  let value: unknown = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!value) return [];

  const list: unknown[] = Array.isArray(value)
    ? value
    : typeof value === "object"
      ? Object.values(value as Record<string, unknown>)
      : [];

  return list
    .map((item, index): Doc | null => {
      if (!item || typeof item !== "object") return null;
      const d = item as Record<string, unknown>;
      const url = String(d.url || d.path || d.fileUrl || "").trim();
      if (!url) return null;
      const key = String(d.key || d.docType || d.type || `doc_${index}`);
      return {
        key,
        url,
        name: String(d.name || d.fileName || key),
        type: String(d.type || d.mimeType || ""),
        label: String(d.label || DOC_LABELS[key] || key),
      };
    })
    .filter((d): d is Doc => !!d);
}

function isImageDoc(doc: Doc) {
  return (
    doc.type?.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif)$/i.test(doc.url) ||
    /\.(jpe?g|png|webp|gif)$/i.test(doc.name)
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysWaiting(createdAt: string) {
  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export default function ApprovalsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [planIdFilter, setPlanIdFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<FranchiseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectItem, setRejectItem] = useState<PendingFranchise | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [actioning, setActioning] = useState<string | "bulk-approve" | "bulk-reject" | null>(null);
  const [docPreview, setDocPreview] = useState<Doc | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, planIdFilter, pageSize]);

  const params = new URLSearchParams({
    status: "PENDING",
    page: String(page),
    limit: String(pageSize),
  });
  if (debouncedSearch) params.set("search", debouncedSearch);
  if (planIdFilter) params.set("planId", planIdFilter);
  const pendingKey = `/api/franchises?${params}`;

  const { data: plansData } = useSWR<Plan[]>("/api/admin/plans", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  const plans = plansData ?? [];

  const { data: pendingData, isLoading, error, mutate: mutatePending } = useSWR(
    pendingKey,
    fetcherWithPagination<PendingFranchise[]>,
    { revalidateOnFocus: true, dedupingInterval: 2000, keepPreviousData: true }
  );

  const list = pendingData?.data ?? [];
  const pagination = pendingData?.pagination ?? {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  };
  const total = pagination.total;
  const totalPages = pagination.totalPages || 1;

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set(
      [1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages)
    );
    return Array.from(set).sort((a, b) => a - b);
  }, [page, totalPages]);

  const docs = useMemo(
    () => (selected ? normalizeDocuments(selected.documents) : []),
    [selected]
  );

  const handleApprove = async (item: PendingFranchise) => {
    const result = await showDeleteConfirm(
      "Approve franchise?",
      `Approve "${item.name}"? The owner will be able to access the dashboard.`
    );
    if (!result.isConfirmed) return;
    setActioning(item.id);
    try {
      const res = await fetch(`/api/franchises/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (!res.ok) {
        const d = await res.json();
        await showError("Error", d.error || "Failed to approve.");
        return;
      }
      await showSuccess("Approved", `${item.name} has been approved.`);
      mutatePending();
      setSelected(null);
    } catch {
      await showError("Error", "Request failed.");
    } finally {
      setActioning(null);
    }
  };

  const openRejectModal = (item: PendingFranchise) => {
    setRejectItem(item);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectItem) return;
    setActioning(rejectItem.id);
    try {
      const res = await fetch(`/api/franchises/${rejectItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: "REJECTED",
          rejectionReason: rejectReason.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        await showError("Error", d.error || "Failed to reject.");
        return;
      }
      await showSuccess("Rejected", "Franchise application rejected.");
      setRejectModalOpen(false);
      setRejectItem(null);
      setRejectReason("");
      mutatePending();
      setSelected(null);
    } catch {
      await showError("Error", "Request failed.");
    } finally {
      setActioning(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    const result = await showDeleteConfirm(
      "Approve selected?",
      `Approve ${selectedIds.size} franchise(s)?`
    );
    if (!result.isConfirmed) return;
    setActioning("bulk-approve");
    let done = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/franchises/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "ACTIVE" }),
        });
        if (res.ok) done++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setActioning(null);
    setSelectedIds(new Set());
    if (failed > 0) await showError("Partial", `${done} approved, ${failed} failed.`);
    else await showSuccess("Done", `${done} franchise(s) approved.`);
    mutatePending();
  };

  const confirmBulkReject = async () => {
    setActioning("bulk-reject");
    let done = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/franchises/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            status: "REJECTED",
            rejectionReason: bulkRejectReason.trim() || undefined,
          }),
        });
        if (res.ok) done++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setActioning(null);
    setBulkRejectOpen(false);
    setBulkRejectReason("");
    setSelectedIds(new Set());
    if (failed > 0) await showError("Partial", `${done} rejected, ${failed} failed.`);
    else await showSuccess("Done", `${done} franchise(s) rejected.`);
    mutatePending();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === list.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(list.map((x) => x.id)));
  };

  const exportCsv = () => {
    const headers = [
      "Name",
      "Owner",
      "Email",
      "Plan",
      "Subscription Start",
      "Subscription End",
      "Address",
      "City",
      "State",
      "Pincode",
      "Created At",
    ];
    const rows = list.map((f) => [
      f.name,
      f.owner.name,
      f.owner.email,
      f.plan.name,
      f.subscriptionStart,
      f.subscriptionEnd,
      f.address ?? "",
      f.city ?? "",
      f.state ?? "",
      f.pincode ?? "",
      f.createdAt,
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pending-franchises-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDetail = useCallback(async (item: PendingFranchise) => {
    setSelected({ ...item });
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/franchises/${item.id}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data?.data) {
        setSelected(data.data as FranchiseDetail);
      }
    } catch {
      /* keep list snapshot */
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const inputClass =
    "w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15";

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
              <Link href="/franchises" className="hover:text-white/90">
                Franchises
              </Link>
              <span>/</span>
              <span className="text-white/80">Approvals</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Pending Approvals
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-100">
                <FileCheck className="h-3 w-3" />
                Review queue
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-white/60 sm:text-sm">
              Approve or reject franchise onboarding — verify owner, plan & KYC before activation
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-200/80">
                  Pending
                </p>
                <p className="font-bold tabular-nums leading-tight text-amber-50">{total}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                  This page
                </p>
                <p className="font-bold tabular-nums leading-tight">{list.length}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#E8D5A3]/70">
                  Selected
                </p>
                <p className="font-bold tabular-nums leading-tight text-[#F5E6C8]">
                  {selectedIds.size}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => mutatePending()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={list.length === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] transition hover:brightness-110 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E4A85]/20 bg-[#1E4A85]/[0.06] px-4 py-3"
          >
            <p className="text-sm font-semibold text-[#1E4A85]">
              {selectedIds.size} franchise{selectedIds.size === 1 ? "" : "s"} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleBulkApprove}
                disabled={!!actioning}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {actioning === "bulk-approve" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Approve all
              </button>
              <button
                type="button"
                onClick={() => setBulkRejectOpen(true)}
                disabled={!!actioning}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search franchise, owner, email…"
                className="h-9 w-full rounded-lg border border-border/70 bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={planIdFilter}
                onChange={(e) => setPlanIdFilter(e.target.value)}
                className="h-9 min-w-[140px] rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
              >
                <option value="">All plans</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
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
        </div>

        <div className="overflow-x-auto">
          {isLoading && !pendingData ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
              <p className="font-semibold text-amber-700">Failed to load pending franchises</p>
              <button
                type="button"
                onClick={() => mutatePending()}
                className="mt-3 rounded-lg bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : list.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                <ShieldCheck className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-foreground">All caught up!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No pending franchise approvals{debouncedSearch || planIdFilter ? " for these filters" : ""}.
              </p>
              <Link
                href="/franchises"
                className="mt-4 inline-flex text-sm font-semibold text-[#1E4A85] hover:underline"
              >
                View all franchises →
              </Link>
            </div>
          ) : (
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#1E4A85]/10 bg-muted/40">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={list.length > 0 && selectedIds.size === list.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-input text-[#1E4A85]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Franchise
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Subscription
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Waiting
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border/50 transition hover:bg-[#1E4A85]/[0.03]",
                      selectedIds.has(row.id) && "bg-[#1E4A85]/[0.06]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="h-4 w-4 rounded border-input text-[#1E4A85]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E4A85]/10 text-[#1E4A85]">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{row.name}</p>
                          {(row.city || row.state) && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {[row.city, row.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.owner.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {row.owner.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#C4A35A]/30 bg-[#C4A35A]/10 px-2 py-0.5 text-[11px] font-semibold text-[#8B6914]">
                        <Package className="h-3 w-3" />
                        {row.plan.name}
                      </span>
                      <p className="mt-1 flex items-center gap-0.5 text-xs text-muted-foreground">
                        <IndianRupee className="h-3 w-3" />
                        {parseFloat(row.plan.price).toLocaleString("en-IN")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        {formatDate(row.subscriptionStart)} – {formatDate(row.subscriptionEnd)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        <Clock className="h-3 w-3" />
                        {daysWaiting(row.createdAt)}
                      </span>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Applied {formatDate(row.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openDetail(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-[#1E4A85] transition hover:bg-[#1E4A85]/10"
                          title="Review"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(row)}
                          disabled={!!actioning}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                          title="Approve"
                        >
                          {actioning === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openRejectModal(row)}
                          disabled={!!actioning}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && list.length > 0 && (
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

      {/* Review drawer */}
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
              className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-lg flex-col border-l border-[#1E4A85]/15 bg-background shadow-2xl"
            >
              <div className="border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#0F2A4A] to-[#1E4A85] px-5 py-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#E8D5A3]">
                      Review franchise
                    </p>
                    <h2 className="mt-1 truncate text-lg font-bold">{selected.name}</h2>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                      <Clock className="h-3 w-3" />
                      Pending · {daysWaiting(selected.createdAt)}
                    </span>
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

              <div className="flex-1 overflow-y-auto p-5">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <section className="rounded-xl border border-border/60 p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                        <User className="h-3.5 w-3.5" />
                        Owner
                      </h3>
                      <p className="font-semibold">{selected.owner.name}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {selected.owner.email}
                      </p>
                      {selected.owner.phone && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {selected.owner.phone}
                        </p>
                      )}
                    </section>

                    <section className="rounded-xl border border-border/60 p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                        <Package className="h-3.5 w-3.5" />
                        Plan & subscription
                      </h3>
                      <p className="font-semibold">
                        {selected.plan.name} — ₹
                        {parseFloat(selected.plan.price).toLocaleString("en-IN")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(selected.subscriptionStart)} → {formatDate(selected.subscriptionEnd)}
                      </p>
                    </section>

                    {(selected.address || selected.city) && (
                      <section className="rounded-xl border border-border/60 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                          <MapPin className="h-3.5 w-3.5" />
                          Location
                        </h3>
                        <p className="text-sm">
                          {[selected.address, selected.city, selected.state, selected.pincode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </section>
                    )}

                    {(selected.panNumber ||
                      selected.aadhaarNumber ||
                      selected.gstNumber ||
                      selected.bankName) && (
                      <section className="rounded-xl border border-border/60 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          KYC & bank
                        </h3>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          {selected.panNumber && (
                            <>
                              <dt className="text-muted-foreground">PAN</dt>
                              <dd className="font-medium">{selected.panNumber}</dd>
                            </>
                          )}
                          {selected.aadhaarNumber && (
                            <>
                              <dt className="text-muted-foreground">Aadhaar</dt>
                              <dd className="font-medium">
                                ****{String(selected.aadhaarNumber).slice(-4)}
                              </dd>
                            </>
                          )}
                          {selected.gstNumber && (
                            <>
                              <dt className="text-muted-foreground">GST</dt>
                              <dd className="font-medium">{selected.gstNumber}</dd>
                            </>
                          )}
                          {selected.bankName && (
                            <>
                              <dt className="text-muted-foreground">Bank</dt>
                              <dd className="font-medium">{selected.bankName}</dd>
                            </>
                          )}
                          {selected.bankIfsc && (
                            <>
                              <dt className="text-muted-foreground">IFSC</dt>
                              <dd className="font-medium">{selected.bankIfsc}</dd>
                            </>
                          )}
                        </dl>
                      </section>
                    )}

                    {docs.length > 0 && (
                      <section className="rounded-xl border border-border/60 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                          <FileCheck className="h-3.5 w-3.5" />
                          Documents ({docs.length})
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {docs.map((doc) => (
                            <button
                              key={doc.key + doc.url}
                              type="button"
                              onClick={() => setDocPreview(doc)}
                              className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5 text-left text-xs transition hover:border-[#1E4A85]/30 hover:bg-[#1E4A85]/5"
                            >
                              {isImageDoc(doc) ? (
                                <ImageIcon className="h-4 w-4 shrink-0 text-[#1E4A85]" />
                              ) : (
                                <FileCheck className="h-4 w-4 shrink-0 text-[#1E4A85]" />
                              )}
                              <span className="min-w-0 flex-1 truncate font-medium">
                                {doc.label}
                              </span>
                              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-border/60 p-4">
                <button
                  type="button"
                  onClick={() => handleApprove(selected)}
                  disabled={!!actioning || detailLoading}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actioning === selected.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    openRejectModal(selected);
                  }}
                  disabled={!!actioning}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Doc preview */}
      <AnimatePresence>
        {docPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setDocPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-background shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="font-semibold">{docPreview.label}</p>
                <button
                  type="button"
                  onClick={() => setDocPreview(null)}
                  className="rounded-lg p-1.5 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto p-4">
                {isImageDoc(docPreview) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={docPreview.url}
                    alt={docPreview.label}
                    className="mx-auto max-h-[70vh] rounded-lg object-contain"
                  />
                ) : (
                  <a
                    href={docPreview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#1E4A85] hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open document
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject modal */}
      <Modal
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectItem(null);
          setRejectReason("");
        }}
        size="md"
        title="Reject application"
        description={rejectItem ? `Reject "${rejectItem.name}"? Optionally add a reason.` : ""}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Reason (optional)</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className={inputClass + " min-h-[80px]"}
              placeholder="e.g. Incomplete documents, invalid address…"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectItem(null);
                setRejectReason("");
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={!!actioning}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {actioning === rejectItem?.id && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk reject modal */}
      <Modal
        open={bulkRejectOpen}
        onClose={() => {
          setBulkRejectOpen(false);
          setBulkRejectReason("");
        }}
        size="md"
        title="Reject selected"
        description={`Reject ${selectedIds.size} franchise(s). Optionally add a reason for all.`}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Reason (optional)</label>
            <textarea
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              className={inputClass + " min-h-[80px]"}
              placeholder="e.g. Batch rejection — documents pending"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setBulkRejectOpen(false);
                setBulkRejectReason("");
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmBulkReject}
              disabled={!!actioning}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {actioning === "bulk-reject" && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject {selectedIds.size}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
