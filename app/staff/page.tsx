"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { Users, Plus, Search, Loader2, Filter } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { AddStaffModal } from "@/components/staff/AddStaffModal";

interface StaffItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  franchiseName: string;
  salary: number;
  joiningDate: string;
  status: string;
}

interface StaffResponse {
  items: StaffItem[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

export default function StaffPage() {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const showFilters = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [franchiseId, setFranchiseId] = useState("");
  const [status, setStatus] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", "15");
  if (searchDebounced) queryParams.set("search", searchDebounced);
  if (franchiseId) queryParams.set("franchiseId", franchiseId);
  if (status) queryParams.set("status", status);

  const { data: franchisesData } = useSWR(
    showFilters ? "/api/franchises?limit=200" : null,
    fetcher
  );
  const franchises = Array.isArray(franchisesData)
    ? franchisesData
    : ((franchisesData as { data?: unknown[]; franchises?: unknown[] } | null)?.data ??
       (franchisesData as { data?: unknown[]; franchises?: unknown[] } | null)?.franchises ??
       []);

  const { data, error, isLoading, mutate } = useSWR<StaffResponse>(
    `/api/staff?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: true, keepPreviousData: true }
  );

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleFilterChange = () => setPage(1);

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 15, total: 0, totalPages: 1 };

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
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground mt-1">View and manage staff in your franchise</p>
        </div>
        {(roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN || roleId === ROLES.SUB_ADMIN) && (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Card className="rounded-xl shadow-lg overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && setSearchDebounced(search)}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchDebounced(search)}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
                {showFilters && (
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select
                      value={franchiseId}
                      onChange={(e) => { setFranchiseId(e.target.value); handleFilterChange(); }}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[160px]"
                    >
                      <option value="">All Franchises</option>
                      {franchises.map((f: { id: string; name: string }) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <select
                      value={status}
                      onChange={(e) => { setStatus(e.target.value); handleFilterChange(); }}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[120px]"
                    >
                      <option value="">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="RESIGNED">Resigned</option>
                    </select>
                    {(franchiseId || status || search) && (
                      <button
                        type="button"
                        onClick={() => { setFranchiseId(""); setStatus(""); setSearch(""); setSearchDebounced(""); setPage(1); }}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isLoading && !data ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <p className="text-amber-600 dark:text-amber-400 font-medium mb-2">
                  {error instanceof Error ? error.message : "Failed to load staff"}
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
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="font-medium text-foreground">No staff members found</p>
                <p className="text-sm text-muted-foreground mt-1">Add your first staff member to get started</p>
              </motion.div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium">Staff</th>
                        {showFilters && <th className="text-left py-3 px-4 font-medium">Franchise</th>}
                        <th className="text-right py-3 px-4 font-medium">Salary</th>
                        <th className="text-left py-3 px-4 font-medium">Joining Date</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {items.map((s, i) => (
                          <motion.tr
                            key={s.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: i * 0.02 }}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{s.fullName}</p>
                                <p className="text-xs text-muted-foreground">{s.email}</p>
                                {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                              </div>
                            </td>
                            {showFilters && <td className="py-3 px-4">{s.franchiseName}</td>}
                            <td className="py-3 px-4 text-right font-medium">₹{s.salary.toLocaleString("en-IN")}</td>
                            <td className="py-3 px-4">{s.joiningDate}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  s.status === "ACTIVE"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                                }`}
                              >
                                {s.status}
                              </span>
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

      <AddStaffModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={() => mutate()} />
    </div>
  );
}
