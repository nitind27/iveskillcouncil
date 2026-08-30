"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Search,
  RefreshCw,
  Loader2,
  Eye,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  IndianRupee,
  Split,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Breadcrumb } from "@/components/common";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";

interface SplitLine {
  slot: number;
  label: string;
  vendorId: string;
  percentage: number;
  amount: number;
}

interface OrderItem {
  id: string;
  orderId: string;
  cfOrderId: string | null;
  cfPaymentId: string | null;
  fullName: string;
  email: string;
  phone: string;
  planName: string;
  amount: number;
  status: string;
  paymentMode: string | null;
  city: string | null;
  state: string | null;
  splitApplied: boolean;
  splitStatus: string | null;
  splitLabel: string;
  splitBreakdown: SplitLine[] | null;
  createdAt: string;
}

interface OrderDetail extends OrderItem {
  address?: string | null;
  message?: string | null;
  planDurationDays?: number | null;
  linkedApplication?: {
    id: string;
    instituteName: string;
    status: string;
    createdAt: string;
  } | null;
}

interface Summary {
  totalOrders: number;
  pending: number;
  paid: number;
  failed: number;
  paidAmount: number;
  splitConfigured: number;
  splitApplied: number;
  splitFailed: number;
}

const STATUS_FILTERS = ["ALL", "PENDING", "PAID", "FAILED", "EXPIRED"] as const;
const SPLIT_FILTERS = [
  { id: "all", label: "All splits" },
  { id: "configured", label: "Split configured" },
  { id: "applied", label: "Split settled" },
  { id: "failed", label: "Split failed" },
  { id: "none", label: "No split" },
] as const;

function fmtInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
    PENDING: "bg-amber-100 text-amber-800 border-amber-200",
    FAILED: "bg-red-100 text-red-800 border-red-200",
    EXPIRED: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const icons: Record<string, typeof CheckCircle2> = {
    PAID: CheckCircle2,
    PENDING: Clock,
    FAILED: XCircle,
    EXPIRED: AlertTriangle,
  };
  const Icon = icons[status] || Clock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        styles[status] || styles.PENDING
      )}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

function SplitBadge({ label, splitApplied, splitStatus }: { label: string; splitApplied: boolean; splitStatus: string | null }) {
  const failed = splitStatus?.startsWith("SPLIT_FAILED");
  const settled = splitApplied;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        failed
          ? "border-red-200 bg-red-50 text-red-700"
          : settled
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-[#1E4A85]/20 bg-[#1E4A85]/5 text-[#1E4A85]"
      )}
    >
      <Split className="h-3 w-3" />
      {label}
    </span>
  );
}

export default function FranchiseOrdersPage() {
  const { user } = useAuth();
  const isAdmin =
    Number(user?.roleId) === ROLES.SUPER_ADMIN || Number(user?.roleId) === ROLES.ADMIN;

  const [items, setItems] = useState<OrderItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [splitFilter, setSplitFilter] = useState<(typeof SPLIT_FILTERS)[number]["id"]>("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (statusFilter !== "ALL") qs.set("status", statusFilter);
      if (splitFilter !== "all") qs.set("split", splitFilter);
      if (searchDebounced) qs.set("q", searchDebounced);

      const res = await fetch(`/api/admin/franchise-orders?${qs}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load orders");

      setItems(json.data?.items || []);
      setSummary(json.data?.summary || null);
      setPagination(json.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (e) {
      await showError("Load failed", e instanceof Error ? e.message : "Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, splitFilter, searchDebounced]);

  useEffect(() => {
    if (isAdmin) loadOrders();
  }, [isAdmin, loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, splitFilter, searchDebounced]);

  const openDetail = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/franchise-orders/${encodeURIComponent(orderId)}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load detail");
      setDetail(json.data as OrderDetail);
    } catch (e) {
      await showError("Error", e instanceof Error ? e.message : "Could not open order");
    } finally {
      setDetailLoading(false);
    }
  };

  const verifyOrder = async (orderId: string) => {
    setActionLoading(`verify-${orderId}`);
    try {
      const res = await fetch(`/api/admin/franchise-orders/${encodeURIComponent(orderId)}/verify`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Verify failed");
      await showSuccess("Synced", json.message || "Payment status updated");
      if (detail?.orderId === orderId) setDetail(json.data as OrderDetail);
      await loadOrders();
    } catch (e) {
      await showError("Verify failed", e instanceof Error ? e.message : "Could not verify");
    } finally {
      setActionLoading(null);
    }
  };

  const retrySplit = async (orderId: string) => {
    setActionLoading(`split-${orderId}`);
    try {
      const res = await fetch(
        `/api/admin/franchise-orders/${encodeURIComponent(orderId)}/retry-split`,
        { method: "POST", credentials: "include" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Split retry failed");
      await showSuccess("Split applied", json.message || "Easy Split settled");
      if (detail?.orderId === orderId) setDetail(json.data as OrderDetail);
      await loadOrders();
    } catch (e) {
      await showError("Split failed", e instanceof Error ? e.message : "Could not retry split");
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = useMemo(
    () =>
      summary
        ? [
            { label: "Total orders", value: summary.totalOrders, icon: ShoppingCart, color: "text-[#1E4A85]" },
            { label: "Paid", value: summary.paid, sub: fmtInr(summary.paidAmount), icon: CheckCircle2, color: "text-emerald-600" },
            { label: "Pending", value: summary.pending, icon: Clock, color: "text-amber-600" },
            { label: "Split settled", value: summary.splitApplied, icon: Split, color: "text-[#C4A35A]" },
            { label: "Split failed", value: summary.splitFailed, icon: AlertTriangle, color: "text-red-600" },
          ]
        : [],
    [summary]
  );

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">Admin access required.</div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumb
        items={[
          { label: "Franchise Network", href: "/franchises" },
          { label: "Payment Orders" },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1E4A85]">Franchise Payment Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cashfree franchise plan payments with Easy Split settlement tracking.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/subscription/easy-split"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1E4A85]/25 px-3 py-2 text-sm font-medium text-[#1E4A85] hover:bg-[#1E4A85]/5"
          >
            <Split className="h-4 w-4" />
            Easy Split config
          </Link>
          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E4A85] px-3 py-2 text-sm font-semibold text-white"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
              <c.icon className={cn("h-4 w-4", c.color)} />
            </div>
            <p className={cn("mt-1 text-2xl font-bold", c.color)}>{c.value}</p>
            {"sub" in c && c.sub && (
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search order ID, name, email, phone…"
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number])}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All statuses" : s}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={splitFilter}
          onChange={(e) => setSplitFilter(e.target.value as (typeof SPLIT_FILTERS)[number]["id"])}
        >
          {SPLIT_FILTERS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading orders…
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            No franchise payment orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Easy Split</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-[#1E4A85]">{o.orderId}</p>
                      {o.cfPaymentId && (
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                          CF: {o.cfPaymentId.slice(0, 16)}…
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.fullName}</p>
                      <p className="text-xs text-muted-foreground">{o.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{o.planName}</td>
                    <td className="px-4 py-3 font-semibold">{fmtInr(o.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                      {o.paymentMode && (
                        <p className="mt-1 text-[10px] text-muted-foreground">{o.paymentMode}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SplitBadge
                        label={o.splitLabel}
                        splitApplied={o.splitApplied}
                        splitStatus={o.splitStatus}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="View details"
                          onClick={() => openDetail(o.orderId)}
                          className="rounded-lg p-2 text-[#1E4A85] hover:bg-[#1E4A85]/10"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Sync from Cashfree"
                          disabled={actionLoading === `verify-${o.orderId}`}
                          onClick={() => verifyOrder(o.orderId)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
                        >
                          {actionLoading === `verify-${o.orderId}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </button>
                        {o.status === "PAID" &&
                          o.splitBreakdown &&
                          (!o.splitApplied || o.splitStatus?.startsWith("SPLIT_FAILED")) && (
                            <button
                              type="button"
                              title="Retry Easy Split"
                              disabled={actionLoading === `split-${o.orderId}`}
                              onClick={() => retrySplit(o.orderId)}
                              className="rounded-lg p-2 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                            >
                              {actionLoading === `split-${o.orderId}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.total} orders
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="rounded-lg p-2 disabled:opacity-40"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg p-2 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg p-2 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(pagination.totalPages)}
                className="rounded-lg p-2 disabled:opacity-40"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {(detail || detailLoading) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/40"
              onClick={() => !detailLoading && setDetail(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 right-0 z-[9999] w-full max-w-lg overflow-y-auto border-l border-border bg-card shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
                <h2 className="font-bold text-[#1E4A85]">Order details</h2>
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="rounded-lg p-2 hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {detailLoading && !detail ? (
                <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading…
                </div>
              ) : detail ? (
                <div className="space-y-5 p-5">
                  <div className="rounded-xl border border-[#1E4A85]/15 bg-[#1E4A85]/5 p-4">
                    <p className="font-mono text-sm font-bold text-[#1E4A85]">{detail.orderId}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status={detail.status} />
                      <SplitBadge
                        label={detail.splitLabel}
                        splitApplied={detail.splitApplied}
                        splitStatus={detail.splitStatus}
                      />
                    </div>
                    <p className="mt-3 text-2xl font-bold">{fmtInr(detail.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {detail.planName}
                      {detail.planDurationDays ? ` · ${detail.planDurationDays} days` : ""}
                    </p>
                  </div>

                  <section>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Customer
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold">{detail.fullName}</p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> {detail.email}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> {detail.phone}
                      </p>
                      {(detail.city || detail.state) && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {[detail.city, detail.state].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </section>

                  {detail.splitBreakdown && detail.splitBreakdown.length > 0 && (
                    <section>
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        <IndianRupee className="h-3.5 w-3.5" />
                        Easy Split breakdown
                      </h3>
                      <div className="space-y-2">
                        {detail.splitBreakdown.map((line) => (
                          <div
                            key={line.slot}
                            className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                Account {line.slot}: {line.label}
                              </p>
                              <p className="font-mono text-[10px] text-muted-foreground">
                                {line.vendorId} · {line.percentage}%
                              </p>
                            </div>
                            <p className="font-bold text-emerald-700">{fmtInr(line.amount)}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {detail.linkedApplication && (
                    <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                      <h3 className="text-xs font-bold uppercase text-emerald-800">
                        Linked application
                      </h3>
                      <p className="mt-1 font-medium">{detail.linkedApplication.instituteName}</p>
                      <p className="text-xs text-emerald-700">
                        Status: {detail.linkedApplication.status}
                      </p>
                      <Link
                        href="/dashboard/franchise-applications"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1E4A85]"
                      >
                        View applications <ExternalLink className="h-3 w-3" />
                      </Link>
                    </section>
                  )}

                  <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                    <button
                      type="button"
                      disabled={actionLoading === `verify-${detail.orderId}`}
                      onClick={() => verifyOrder(detail.orderId)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {actionLoading === `verify-${detail.orderId}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Sync from Cashfree
                    </button>
                    {detail.status === "PAID" &&
                      detail.splitBreakdown &&
                      (!detail.splitApplied || detail.splitStatus?.startsWith("SPLIT_FAILED")) && (
                        <button
                          type="button"
                          disabled={actionLoading === `split-${detail.orderId}`}
                          onClick={() => retrySplit(detail.orderId)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 disabled:opacity-60"
                        >
                          {actionLoading === `split-${detail.orderId}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          Retry Easy Split
                        </button>
                      )}
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    Created {fmtDate(detail.createdAt)}
                    {detail.cfOrderId && ` · CF Order ${detail.cfOrderId}`}
                  </p>
                </div>
              ) : null}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
