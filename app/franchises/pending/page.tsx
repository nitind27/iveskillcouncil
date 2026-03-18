"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/common/Card";
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
  Filter,
  ChevronLeft,
  ChevronRight,
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

interface Plan {
  id: number;
  name: string;
  price: number;
  durationInDays: number;
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
const labelClass = "block text-sm font-medium text-foreground mb-1";

export default function ApprovalsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planIdFilter, setPlanIdFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<PendingFranchise | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [rejectItem, setRejectItem] = useState<PendingFranchise | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [actioning, setActioning] = useState<string | "bulk-approve" | "bulk-reject" | null>(null);

  const limit = 10;
  const params = new URLSearchParams({
    status: "PENDING",
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) params.set("search", search.trim());
  if (planIdFilter) params.set("planId", planIdFilter);
  const pendingKey = `/api/franchises?${params}`;

  const { data: plansData } = useSWR<Plan[]>("/api/admin/plans", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  const plans = plansData ?? [];

  const { data: pendingData, isLoading, mutate: mutatePending } = useSWR(
    pendingKey,
    fetcherWithPagination<PendingFranchise[]>,
    { revalidateOnFocus: true, dedupingInterval: 2000, keepPreviousData: true }
  );

  const list = pendingData?.data ?? [];
  const totalPages = pendingData?.pagination?.totalPages ?? 1;
  const total = pendingData?.pagination?.total ?? 0;

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
      setDetailModalOpen(false);
      setDetailItem(null);
    } catch (e) {
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
      setDetailModalOpen(false);
      setDetailItem(null);
    } catch (e) {
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

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    setBulkRejectOpen(true);
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
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pending-franchises-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDetail = (item: PendingFranchise) => {
    setDetailItem(item);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="flex items-center gap-2">
        <FileCheck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Approvals</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve or reject pending franchise applications.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card variant="default">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{total}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="default">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On this page</p>
                <p className="text-2xl font-bold text-foreground">{list.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="default">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-foreground">{selectedIds.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & actions */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && mutatePending()}
                className={inputClass + " pl-9"}
              />
            </div>
            <select
              value={planIdFilter}
              onChange={(e) => setPlanIdFilter(e.target.value)}
              className={inputClass + " w-auto min-w-[140px]"}
            >
              <option value="">All plans</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => mutatePending()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
            >
              <Filter className="w-4 h-4" />
              Apply
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              disabled={list.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            {selectedIds.size > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleBulkApprove}
                  disabled={!!actioning}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm disabled:opacity-50"
                >
                  {actioning === "bulk-approve" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Approve ({selectedIds.size})
                </button>
                <button
                  type="button"
                  onClick={handleBulkReject}
                  disabled={!!actioning}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject ({selectedIds.size})
                </button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && !pendingData ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : list.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No pending franchises</p>
              <p className="text-sm mt-1">All caught up or adjust filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={list.length > 0 && selectedIds.size === list.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-input text-primary"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">Franchise</th>
                      <th className="text-left py-3 px-4 font-semibold">Owner</th>
                      <th className="text-left py-3 px-4 font-semibold">Plan</th>
                      <th className="text-left py-3 px-4 font-semibold">Subscription</th>
                      <th className="text-left py-3 px-4 font-semibold">Created</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-border/50 hover:bg-muted/30",
                          selectedIds.has(row.id) && "bg-primary/5"
                        )}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleSelect(row.id)}
                            className="w-4 h-4 rounded border-input text-primary"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{row.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{row.owner.name}</p>
                          <p className="text-xs text-muted-foreground">{row.owner.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span>{row.plan.name}</span>
                          <p className="text-xs text-muted-foreground">
                            ₹{parseFloat(row.plan.price).toLocaleString()}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(row.subscriptionStart).toLocaleDateString()} –{" "}
                          {new Date(row.subscriptionEnd).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openDetail(row)}
                              className="p-2 rounded-lg hover:bg-muted"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(row)}
                              disabled={!!actioning}
                              className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 disabled:opacity-50"
                              title="Approve"
                            >
                              {actioning === row.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => openRejectModal(row)}
                              disabled={!!actioning}
                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({total} total)
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail modal */}
      <Modal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailItem(null);
        }}
        size="lg"
        title="Franchise details"
        description="Review before approving or rejecting."
      >
        {detailItem && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Name</label>
              <p className="text-base font-semibold">{detailItem.name}</p>
            </div>
            <div>
              <label className={labelClass}>Owner</label>
              <p className="text-base">{detailItem.owner.name}</p>
              <p className="text-sm text-muted-foreground">{detailItem.owner.email}</p>
              {detailItem.owner.phone && (
                <p className="text-sm text-muted-foreground">{detailItem.owner.phone}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Plan</label>
              <p className="text-base">{detailItem.plan.name} — ₹{parseFloat(detailItem.plan.price).toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Subscription start</label>
                <p className="text-sm">{new Date(detailItem.subscriptionStart).toLocaleDateString()}</p>
              </div>
              <div>
                <label className={labelClass}>Subscription end</label>
                <p className="text-sm">{new Date(detailItem.subscriptionEnd).toLocaleDateString()}</p>
              </div>
            </div>
            {(detailItem.address || detailItem.city) && (
              <div>
                <label className={labelClass}>Address</label>
                <p className="text-sm">
                  {[detailItem.address, detailItem.city, detailItem.state, detailItem.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => handleApprove(detailItem)}
                disabled={!!actioning}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actioning === detailItem.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailModalOpen(false);
                  openRejectModal(detailItem);
                }}
                disabled={!!actioning}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject (single) modal */}
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
            <label className={labelClass}>Reason (optional)</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className={inputClass + " min-h-[80px]"}
              placeholder="e.g. Incomplete documents, invalid address..."
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
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={!!actioning}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {actioning === rejectItem?.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
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
            <label className={labelClass}>Reason (optional, applies to all)</label>
            <textarea
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              className={inputClass + " min-h-[80px]"}
              placeholder="e.g. Batch rejection – documents pending"
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
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmBulkReject}
              disabled={!!actioning}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {actioning === "bulk-reject" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Reject {selectedIds.size}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
