"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { Award, Plus, Loader2, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { CreateCertificateModal } from "@/components/certificates/CreateCertificateModal";

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

export default function CertificatesRequestsPage() {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const showFranchiseFilter = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [franchiseId, setFranchiseId] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", "12");
  if (status) queryParams.set("status", status);
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

  const { data, error, isLoading, mutate } = useSWR<CertResponse>(
    `/api/certificates?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: true, keepPreviousData: true }
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 12, total: 0, totalPages: 1 };

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
      await showSuccess("Updated", "Certificate status updated");
      mutate();
    } catch {
      await showError("Error", "Failed to update");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "ISSUED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" /> Issued
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Clock className="w-3 h-3" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="w-3 h-3" /> Requested
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Certificate Requests</h1>
          <p className="text-muted-foreground mt-1">Manage and issue certificate requests</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Create Request
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Card className="rounded-xl shadow-lg overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border mb-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[140px]"
              >
                <option value="">All statuses</option>
                <option value="REQUESTED">Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="ISSUED">Issued</option>
                <option value="REJECTED">Rejected</option>
              </select>
              {showFranchiseFilter && (
                <select
                  value={franchiseId}
                  onChange={(e) => { setFranchiseId(e.target.value); setPage(1); }}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[180px]"
                >
                  <option value="">All Franchises</option>
                  {franchises.map((f: { id: string; name: string }) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
              {(status || franchiseId) && (
                <button
                  type="button"
                  onClick={() => { setStatus(""); setFranchiseId(""); setPage(1); }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear filters
                </button>
              )}
            </div>

            {isLoading && !data ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : error ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                <p className="text-amber-600 dark:text-amber-400 font-medium mb-2">
                  {error instanceof Error ? error.message : "Failed to load"}
                </p>
                <button onClick={() => mutate()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
                  Retry
                </button>
              </motion.div>
            ) : items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 text-center"
              >
                <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="font-medium text-foreground">No certificate requests found</p>
                <p className="text-sm text-muted-foreground mt-1">Create a request or wait for students to request</p>
              </motion.div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium">Student</th>
                        <th className="text-left py-3 px-4 font-medium">Course</th>
                        {showFranchiseFilter && <th className="text-left py-3 px-4 font-medium">Franchise</th>}
                        <th className="text-left py-3 px-4 font-medium">Cert #</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {items.map((c, i) => (
                          <motion.tr
                            key={c.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.02 }}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{c.studentName}</p>
                                <p className="text-xs text-muted-foreground">{c.studentEmail}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">{c.courseName}</td>
                            {showFranchiseFilter && <td className="py-3 px-4">{c.franchiseName}</td>}
                            <td className="py-3 px-4 font-mono text-xs">{c.certificateNumber}</td>
                            <td className="py-3 px-4">{getStatusBadge(c.status)}</td>
                            <td className="py-3 px-4">
                              {c.status === "REQUESTED" && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => updateStatus(c.id, "APPROVED")}
                                    disabled={actionLoading === c.id}
                                    className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 disabled:opacity-50"
                                  >
                                    {actionLoading === c.id ? "..." : "Approve"}
                                  </button>
                                  <button
                                    onClick={() => updateStatus(c.id, "REJECTED")}
                                    disabled={actionLoading === c.id}
                                    className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              {c.status === "APPROVED" && (
                                <button
                                  onClick={() => updateStatus(c.id, "ISSUED")}
                                  disabled={actionLoading === c.id}
                                  className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 disabled:opacity-50"
                                >
                                  {actionLoading === c.id ? "..." : "Issue"}
                                </button>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
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
                        className="px-3 py-1 rounded border border-border disabled:opacity-50 text-sm hover:bg-muted"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={page >= pagination.totalPages}
                        className="px-3 py-1 rounded border border-border disabled:opacity-50 text-sm hover:bg-muted"
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
      </motion.div>

      <CreateCertificateModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} onSuccess={() => mutate()} />
    </div>
  );
}
