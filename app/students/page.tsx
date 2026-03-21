"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { GraduationCap, Plus, Search, Loader2, Filter } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { AddStudentModal } from "@/components/students/AddStudentModal";

interface StudentItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  franchiseName: string;
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
}

export default function StudentsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const roleId = Number(user?.roleId) ?? 0;
  const showFilters = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [franchiseId, setFranchiseId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("");

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", "15");
  if (searchDebounced) queryParams.set("search", searchDebounced);
  if (franchiseId) queryParams.set("franchiseId", franchiseId);
  if (courseId) queryParams.set("courseId", courseId);
  if (status) queryParams.set("status", status);

  const { data: franchisesData } = useSWR(
    showFilters ? "/api/franchises?limit=100" : null,
    fetcher
  );
  const { data: coursesData } = useSWR(
    showFilters ? "/api/courses" : null,
    fetcher
  );

  const franchises = Array.isArray(franchisesData)
    ? franchisesData
    : ((franchisesData as { data?: unknown[]; franchises?: unknown[] } | null)?.data ??
       (franchisesData as { data?: unknown[]; franchises?: unknown[] } | null)?.franchises ??
       []);
  const courses = Array.isArray(coursesData)
    ? coursesData
    : ((coursesData as { data?: unknown[] } | null)?.data ?? []);

  const { data, error, isLoading, mutate } = useSWR<StudentsResponse>(
    `/api/students?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: true, keepPreviousData: true }
  );

  const openAddModal = () => setAddModalOpen(true);
  const closeAddModal = () => setAddModalOpen(false);

  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams?.get("add") === "1") {
      setAddModalOpen(true);
      window.history.replaceState({}, "", "/students");
    }
  }, [searchParams]);

  const handleSearch = () => setSearchDebounced(search);
  const handleFilterChange = () => setPage(1);

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground mt-1">Manage students across franchises</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
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
                  value={courseId}
                  onChange={(e) => { setCourseId(e.target.value); handleFilterChange(); }}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[160px]"
                >
                  <option value="">All Courses</option>
                  {courses.map((c: { id: string; name: string }) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); handleFilterChange(); }}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[120px]"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DROPPED">Dropped</option>
                </select>
                {(franchiseId || courseId || status) && (
                  <button
                    type="button"
                    onClick={() => { setFranchiseId(""); setCourseId(""); setStatus(""); setPage(1); }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          {isLoading && !data ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-amber-600 dark:text-amber-400 font-medium mb-2">
                {error instanceof Error ? error.message : "Failed to load students"}
              </p>
              <button
                onClick={() => mutate()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No students found. Add your first student to get started.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Student</th>
                      <th className="text-left py-3 px-4 font-medium">Address</th>
                      <th className="text-left py-3 px-4 font-medium">Franchise</th>
                      <th className="text-left py-3 px-4 font-medium">Course</th>
                      <th className="text-right py-3 px-4 font-medium">Fees</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((s) => {
                      const addr = [s.address, s.area, s.city, s.state, s.pincode].filter(Boolean).join(", ");
                      return (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{s.fullName}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                            {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          {addr ? <span className="text-sm truncate block" title={addr}>{addr}</span> : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-4">{s.franchiseName}</td>
                        <td className="py-3 px-4">{s.courseName}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={s.pendingFee > 0 ? "text-amber-600" : "text-green-600"}>
                            ₹{s.paidFee.toLocaleString("en-IN")} / ₹{s.totalFee.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              s.status === "ACTIVE"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : s.status === "COMPLETED"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1 rounded border border-border disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                      className="px-3 py-1 rounded border border-border disabled:opacity-50"
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

      <AddStudentModal
        open={addModalOpen}
        onClose={closeAddModal}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
