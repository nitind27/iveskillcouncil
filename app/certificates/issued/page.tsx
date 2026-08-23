"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Award,
  Loader2,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Calendar,
  GraduationCap,
  Building2,
  Printer,
  CheckSquare,
  Square,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { canPrintCertificates } from "@/lib/certificate-access";
import { cn } from "@/lib/utils";
import {
  CertificatePreviewModal,
  CertificatePreviewPanel,
} from "@/components/certificates/CertificatePreviewModal";
import { BulkCertificatePrint } from "@/components/certificates/BulkCertificatePrint";

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

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function IssuedCertificatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const roleId = Number(user?.roleId) ?? 0;
  const canPrint = canPrintCertificates(roleId);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [franchiseId, setFranchiseId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false);
  const [bulkPrintIds, setBulkPrintIds] = useState<string[] | undefined>();

  useEffect(() => {
    if (user && !canPrint) {
      router.replace("/certificates/requests");
    }
  }, [user, canPrint, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(pageSize));
  queryParams.set("status", "ISSUED");
  if (franchiseId) queryParams.set("franchiseId", franchiseId);
  if (courseId) queryParams.set("courseId", courseId);

  const { data: franchisesData } = useSWR(
    canPrint ? "/api/franchises?limit=200" : null,
    fetcher
  );
  const franchises = Array.isArray(franchisesData)
    ? franchisesData
    : ((franchisesData as { data?: unknown[] } | null)?.data ?? []);

  const { data: coursesData } = useSWR(canPrint ? "/api/courses?limit=200" : null, fetcher);
  const coursesRaw = Array.isArray(coursesData)
    ? coursesData
    : ((coursesData as { items?: unknown[] } | null)?.items ??
      (coursesData as { data?: unknown[] } | null)?.data ??
      []);
  const courses = (coursesRaw as { id: string; name: string }[]).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const { data, error, isLoading, mutate } = useSWR<CertResponse>(
    canPrint ? `/api/certificates?${queryParams.toString()}` : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  const allItems = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: pageSize, total: 0, totalPages: 1 };

  const items = useMemo(() => {
    if (!debouncedSearch) return allItems;
    return allItems.filter((c) => {
      const hay = [c.studentName, c.studentEmail, c.courseName, c.franchiseName, c.certificateNumber]
        .join(" ")
        .toLowerCase();
      return hay.includes(debouncedSearch);
    });
  }, [allItems, debouncedSearch]);

  const selected = items.find((c) => c.id === selectedId) ?? items[0] ?? null;

  useEffect(() => {
    if (items.length > 0 && !selectedId) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((c) => c.id)));
    }
  };

  const openBulkPrint = (ids?: string[]) => {
    setBulkPrintIds(ids);
    setBulkPrintOpen(true);
  };

  if (!canPrint) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
      </div>
    );
  }

  const thisMonth = allItems.filter((c) => {
    if (!c.issueDate) return false;
    const d = new Date(c.issueDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-5 pb-6">
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/certificates/requests" className="hover:text-white/90">
                Certificates
              </Link>
              <span>/</span>
              <span className="text-white/80">Issued</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Issued Certificates</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A35A]/35 bg-[#C4A35A]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F5E6C8]">
                <Award className="h-3 w-3" />
                Institute Print Only
              </span>
            </div>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">
              Preview and print hard copies to dispatch to franchises
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">Total</p>
                <p className="font-bold tabular-nums">{pagination.total}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#F5E6C8]/80">This month</p>
                <p className="font-bold tabular-nums text-[#F5E6C8]">{thisMonth}</p>
              </div>
            </div>
            <Link
              href="/certificates/print"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Center
            </Link>
            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] transition hover:brightness-110"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, course, cert no…"
                className="h-9 w-full rounded-lg border border-border/70 bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
              />
            </div>
            <select
              value={franchiseId}
              onChange={(e) => {
                setFranchiseId(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
            >
              <option value="">All franchises</option>
              {(franchises as { id: string; name: string }[]).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between border-b border-[#1E4A85]/10 px-4 py-2 sm:px-5">
            <button
              type="button"
              onClick={selectAllVisible}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4A85]"
            >
              {selectedIds.size === items.length && items.length > 0 ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Select all ({selectedIds.size})
            </button>
            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => openBulkPrint([...selectedIds])}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#1E4A85] px-2.5 py-1 text-xs font-semibold text-white"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print selected
                </button>
              )}
              <button
                type="button"
                onClick={() => openBulkPrint(undefined)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#1E4A85]/30 px-2.5 py-1 text-xs font-semibold text-[#1E4A85]"
              >
                <Printer className="h-3.5 w-3.5" />
                Print filtered batch
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {isLoading && !data ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
              </div>
            ) : error ? (
              <p className="py-12 text-center text-red-600">
                {error instanceof Error ? error.message : "Failed to load"}
              </p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Award className="mb-3 h-12 w-12 text-[#1E4A85]/30" />
                <p className="font-medium">No issued certificates yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "flex gap-2 rounded-xl border p-3 transition",
                      selectedId === c.id
                        ? "border-[#1E4A85]/30 bg-[#1E4A85]/10 shadow-sm"
                        : "border-border/60 hover:border-[#1E4A85]/20 hover:bg-[#1E4A85]/[0.04]"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSelect(c.id)}
                      className="mt-0.5 shrink-0 text-[#1E4A85]"
                    >
                      {selectedIds.has(c.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{c.studentName}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.courseName}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                          Issued
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {c.certificateNumber}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {c.franchiseName}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(c.issueDate)}
                        </span>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-[#1E4A85]/10 pt-4">
                <p className="text-xs text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setPage(1)} disabled={page <= 1} className="rounded-lg border p-1.5 disabled:opacity-40">
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border p-1.5 disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="rounded-lg border p-1.5 disabled:opacity-40">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setPage(pagination.totalPages)} disabled={page >= pagination.totalPages} className="rounded-lg border p-1.5 disabled:opacity-40">
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-[#1E4A85]">Certificate Preview</p>
              {selected && (
                <button
                  type="button"
                  onClick={() => setFullscreenId(selected.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E4A85]/20 px-2.5 py-1 text-xs font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/5"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Fullscreen
                </button>
              )}
            </div>
            <CertificatePreviewPanel
              certificateId={selected?.id ?? null}
              studentName={selected?.studentName}
              onOpenFullscreen={() => selected && setFullscreenId(selected.id)}
            />
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed bottom-4 left-4 right-4 z-40 xl:hidden">
          <button
            type="button"
            onClick={() => setFullscreenId(selected.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-3 text-sm font-bold text-white shadow-lg"
          >
            <Eye className="h-4 w-4" />
            Preview {selected.studentName}&apos;s Certificate
          </button>
        </div>
      )}

      <CertificatePreviewModal
        certificateId={fullscreenId ?? ""}
        open={!!fullscreenId}
        onClose={() => setFullscreenId(null)}
        studentName={items.find((c) => c.id === fullscreenId)?.studentName}
      />

      <BulkCertificatePrint
        open={bulkPrintOpen}
        onClose={() => {
          setBulkPrintOpen(false);
          setBulkPrintIds(undefined);
        }}
        ids={bulkPrintIds}
        franchiseId={bulkPrintIds ? undefined : franchiseId || undefined}
        courseId={bulkPrintIds ? undefined : courseId || undefined}
      />
    </div>
  );
}
