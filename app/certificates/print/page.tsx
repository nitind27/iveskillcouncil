"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Award, Loader2, Printer, RefreshCw, Building2, BookOpen } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { canPrintCertificates } from "@/lib/certificate-access";
import { BulkCertificatePrint } from "@/components/certificates/BulkCertificatePrint";

export default function CertificatePrintCenterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const roleId = Number(user?.roleId) ?? 0;
  const canPrint = canPrintCertificates(roleId);

  const [franchiseId, setFranchiseId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false);
  const [issuedCount, setIssuedCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  useEffect(() => {
    if (user && !canPrint) {
      router.replace("/certificates/requests");
    }
  }, [user, canPrint, router]);

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

  const loadCount = async () => {
    setCountLoading(true);
    try {
      const params = new URLSearchParams({ status: "ISSUED", limit: "1" });
      if (franchiseId) params.set("franchiseId", franchiseId);
      if (courseId) params.set("courseId", courseId);
      const res = await fetch(`/api/certificates?${params.toString()}`, { credentials: "include" });
      const json = await res.json();
      setIssuedCount(json.data?.pagination?.total ?? json.pagination?.total ?? 0);
    } catch {
      setIssuedCount(0);
    } finally {
      setCountLoading(false);
    }
  };

  useEffect(() => {
    if (canPrint) loadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [franchiseId, courseId, canPrint]);

  if (!canPrint) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
      </div>
    );
  }

  const selectedFranchise = (franchises as { id: string; name: string }[]).find(
    (f) => f.id === franchiseId
  );
  const selectedCourse = courses.find((c) => c.id === courseId);

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
              <span className="text-white/80">Print Center</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Certificate Print Center</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A35A]/35 bg-[#C4A35A]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F5E6C8]">
                <Printer className="h-3 w-3" />
                Admin Only
              </span>
            </div>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">
              Filter by franchise and course batch, then print all issued certificates at once for
              dispatch
            </p>
          </div>
          <Link
            href="/certificates/issued"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <Award className="h-3.5 w-3.5" />
            Issued list
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
        <div className="border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-5 py-4">
          <h2 className="text-sm font-bold text-[#1E4A85]">Select franchise &amp; batch</h2>
          <p className="text-xs text-muted-foreground">
            Only institute admin can print. Franchises receive hard copies after printing.
          </p>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-[#1E4A85]" />
              Franchise
            </span>
            <select
              value={franchiseId}
              onChange={(e) => setFranchiseId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
            >
              <option value="">All franchises</option>
              {(franchises as { id: string; name: string }[]).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-[#1E4A85]" />
              Course / Batch
            </span>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-[#1E4A85]/15 bg-[#1E4A85]/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1E4A85]/70">
              Ready to print
            </p>
            {countLoading ? (
              <Loader2 className="mt-2 h-5 w-5 animate-spin text-[#1E4A85]" />
            ) : (
              <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E4A85]">
                {issuedCount ?? 0}{" "}
                <span className="text-sm font-medium text-muted-foreground">issued certificate(s)</span>
              </p>
            )}
            {(selectedFranchise || selectedCourse) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedFranchise?.name}
                {selectedFranchise && selectedCourse ? " · " : ""}
                {selectedCourse?.name}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBulkPrintOpen(true)}
              disabled={!issuedCount || countLoading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#163A6B] disabled:opacity-40 sm:flex-none"
            >
              <Printer className="h-4 w-4" />
              Print batch ({issuedCount ?? 0})
            </button>
            <button
              type="button"
              onClick={loadCount}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-muted/50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <BulkCertificatePrint
        open={bulkPrintOpen}
        onClose={() => setBulkPrintOpen(false)}
        franchiseId={franchiseId || undefined}
        courseId={courseId || undefined}
      />
    </div>
  );
}
