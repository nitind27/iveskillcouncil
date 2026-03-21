"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { GlassModal } from "@/components/common/GlassModal";
import { IndianRupee, Loader2, TrendingUp, Plus, Search, Filter } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";

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
  recentPayments: { id: string; studentName: string; amount: number; status: string; paymentMode: string; paymentDate: string }[];
  summary: { totalStudents: number; totalFee: number; paidFee: number; pendingFee: number };
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export default function FeesPage() {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const showFranchiseFilter = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [franchiseId, setFranchiseId] = useState("");
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [editFeeOpen, setEditFeeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState<{
    studentId: string;
    amount: string;
    paymentMode: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
    transactionReference: string;
  }>({ studentId: "", amount: "", paymentMode: "CASH", transactionReference: "" });
  const [editForm, setEditForm] = useState<{ studentId: string; studentName: string; totalFee: string } | null>(null);

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", "15");
  if (searchDebounced) queryParams.set("search", searchDebounced);
  if (franchiseId) queryParams.set("franchiseId", franchiseId);

  const { data: franchisesData } = useSWR(
    showFranchiseFilter ? "/api/franchises?limit=200" : null,
    fetcher
  );
  const franchises = Array.isArray(franchisesData)
    ? franchisesData
    : ((franchisesData as { data?: unknown[]; franchises?: unknown[] } | null)?.data ??
       (franchisesData as { data?: unknown[]; franchises?: unknown[] } | null)?.franchises ??
       []);

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

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSearch = () => setSearchDebounced(search);
  const handleFilterChange = () => setPage(1);

  const summary = data?.summary ?? { totalStudents: 0, totalFee: 0, paidFee: 0, pendingFee: 0 };
  const items = data?.items ?? [];
  const recent = data?.recentPayments ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 15, total: 0, totalPages: 1 };

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fees Management</h1>
          <p className="text-muted-foreground mt-1">Track fees and payments</p>
        </div>
        <button
          onClick={() => setAddPaymentOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Payment
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-xl font-bold">{summary.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-xl font-bold">₹{summary.paidFee.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Fees</p>
                <p className="text-xl font-bold">₹{summary.pendingFee.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fee</p>
                <p className="text-xl font-bold">₹{summary.totalFee.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              {showFranchiseFilter && (
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={franchiseId}
                    onChange={(e) => { setFranchiseId(e.target.value); handleFilterChange(); }}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[180px]"
                  >
                    <option value="">All Franchises</option>
                    {franchises.map((f: { id: string; name: string }) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  {(franchiseId || search) && (
                    <button
                      type="button"
                      onClick={() => { setFranchiseId(""); setSearch(""); setSearchDebounced(""); setPage(1); }}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {error ? (
            <div className="py-12 text-center">
              <p className="text-amber-600 dark:text-amber-400 font-medium mb-2">
                {error instanceof Error ? error.message : "Failed to load fees"}
              </p>
              <button onClick={() => mutate()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No students found. Add students to manage fees.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Student</th>
                      {showFranchiseFilter && <th className="text-left py-3 px-4 font-medium">Franchise</th>}
                      <th className="text-left py-3 px-4 font-medium">Course</th>
                      <th className="text-right py-3 px-4 font-medium">Total</th>
                      <th className="text-right py-3 px-4 font-medium">Paid</th>
                      <th className="text-right py-3 px-4 font-medium">Pending</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((s) => (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{s.fullName}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </td>
                        {showFranchiseFilter && (
                          <td className="py-3 px-4">{s.franchiseName}</td>
                        )}
                        <td className="py-3 px-4">{s.courseName}</td>
                        <td className="py-3 px-4 text-right">₹{s.totalFee.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 text-right text-green-600">₹{s.paidFee.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={s.pendingFee > 0 ? "font-medium text-amber-600" : "text-muted-foreground"}>
                            ₹{s.pendingFee.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => {
                                setEditForm({ studentId: s.id, studentName: s.fullName, totalFee: String(s.totalFee) });
                                setEditFeeOpen(true);
                              }}
                              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
                            >
                              Edit Fee
                            </button>
                            {s.pendingFee > 0 && (
                              <button
                                onClick={() => {
                                  setAddForm((f) => ({ ...f, studentId: s.id, amount: String(s.pendingFee) }));
                                  setAddPaymentOpen(true);
                                }}
                                className="text-xs px-2 py-1 rounded border border-primary/50 text-primary hover:bg-primary/10"
                              >
                                Record
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1 rounded border border-border disabled:opacity-50 text-sm"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                      className="px-3 py-1 rounded border border-border disabled:opacity-50 text-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4 font-medium">Student</th>
                    <th className="text-left py-2 px-4 font-medium">Date</th>
                    <th className="text-left py-2 px-4 font-medium">Mode</th>
                    <th className="text-right py-2 px-4 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((p) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-2 px-4">{p.studentName}</td>
                      <td className="py-2 px-4">{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                      <td className="py-2 px-4">{p.paymentMode}</td>
                      <td className="py-2 px-4 text-right font-medium text-green-600">₹{p.amount.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <GlassModal open={editFeeOpen} onClose={() => { setEditFeeOpen(false); setEditForm(null); }} title="Edit Total Fee" size="md" closeOnOverlayClick={!submitting}>
        {editForm && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!editForm.studentId || !editForm.totalFee || parseFloat(editForm.totalFee) < 0) return;
            setSubmitting(true);
            try {
              const res = await fetch(`/api/students/${editForm.studentId}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
                body: JSON.stringify({ totalFee: parseFloat(editForm.totalFee) }),
              });
              const json = await res.json();
              if (!res.ok) { showError("Error", json.error || "Failed to update fee"); return; }
              showSuccess("Success", "Total fee updated successfully");
              setEditFeeOpen(false); setEditForm(null); mutate();
            } catch { showError("Error", "Failed to update fee"); } finally { setSubmitting(false); }
          }} className="space-y-4">
            <p className="text-sm text-muted-foreground">Student: <strong>{editForm.studentName}</strong></p>
            <div>
              <label className="block text-sm font-medium mb-1">New Total Fee (₹) *</label>
              <input type="number" value={editForm.totalFee} onChange={(e) => setEditForm((f) => f ? { ...f, totalFee: e.target.value } : null)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" min="0" step="0.01" required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditFeeOpen(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Update Fee"}
              </button>
            </div>
          </form>
        )}
      </GlassModal>

      <GlassModal open={addPaymentOpen} onClose={() => { setAddPaymentOpen(false); setAddForm({ studentId: "", amount: "", paymentMode: "CASH", transactionReference: "" }); }} title="Add Payment" size="md" closeOnOverlayClick={!submitting}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!addForm.studentId || !addForm.amount || parseFloat(addForm.amount) <= 0) { showError("Validation", "Select student and enter amount"); return; }
          setSubmitting(true);
          try {
            const res = await fetch("/api/fees", {
              method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
              body: JSON.stringify({ studentId: addForm.studentId, amount: parseFloat(addForm.amount), paymentMode: addForm.paymentMode, transactionReference: addForm.transactionReference.trim() || undefined }),
            });
            const json = await res.json();
            if (!res.ok) { showError("Error", json.error || "Failed to record payment"); return; }
            showSuccess("Success", "Payment recorded successfully");
            setAddPaymentOpen(false); setAddForm({ studentId: "", amount: "", paymentMode: "CASH", transactionReference: "" }); mutate();
          } catch { showError("Error", "Failed to record payment"); } finally { setSubmitting(false); }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student *</label>
            <select value={addForm.studentId} onChange={(e) => { const id = e.target.value; const s = pendingForModal.find((p) => p.id === id); setAddForm((f) => ({ ...f, studentId: id, amount: s ? String(s.pendingFee) : f.amount })); }} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" required disabled={pendingForModal.length === 0}>
              <option value="">{pendingForModal.length === 0 ? "No students with pending fees" : "Select student"}</option>
              {pendingForModal.map((s) => <option key={s.id} value={s.id}>{s.fullName} – ₹{s.pendingFee.toLocaleString("en-IN")} pending</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
            <input type="number" value={addForm.amount} onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" min="0.01" step="0.01" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Mode</label>
            <select value={addForm.paymentMode} onChange={(e) => setAddForm((f) => ({ ...f, paymentMode: e.target.value as "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transaction Reference (optional)</label>
            <input type="text" value={addForm.transactionReference} onChange={(e) => setAddForm((f) => ({ ...f, transactionReference: e.target.value }))} placeholder="UPI ref, cheque no., etc." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAddPaymentOpen(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Record Payment"}
            </button>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}
