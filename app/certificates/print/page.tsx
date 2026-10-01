"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Award,
  BookOpen,
  Building2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Files,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Square,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { canPrintCertificates } from "@/lib/certificate-access";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { OfficialBatchPreview, type DocChoice } from "@/components/certificates/OfficialBatchPreview";

type CertRow = {
  id: string;
  studentId: string;
  studentCode?: string;
  studentName: string;
  courseName: string;
  franchiseName: string;
  certificateNumber: string;
  status: string;
  issueDate: string | null;
};

type CertResponse = {
  items: CertRow[];
  counts?: Record<"REQUESTED" | "APPROVED" | "ISSUED" | "REJECTED", number>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const PAGE_SIZE = 25;
const MAX_PRINT = 100;

const STATUS_OPTIONS = [
  { id: "APPROVED,ISSUED", label: "Approved + Issued" },
  { id: "ISSUED", label: "Issued only" },
  { id: "APPROVED", label: "Approved only" },
];

const PRINT_ACTIONS: { choice: DocChoice; label: string; icon: typeof Award; className: string }[] = [
  {
    choice: "vocational",
    label: "Print Certificates",
    icon: Award,
    className: "bg-[#0B1F3A] text-white hover:bg-[#163A5C]",
  },
  {
    choice: "marksheet",
    label: "Print Results",
    icon: FileText,
    className: "bg-[#1E4A85] text-white hover:bg-[#163A6B]",
  },
  {
    choice: "both",
    label: "Print Both",
    icon: Files,
    className: "bg-[#C4A35A] text-[#0B1F3A] hover:bg-[#d4b56c]",
  },
];

export default function CertificatePrintCenterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const roleId = Number(user?.roleId) || 0;
  const canPrint = canPrintCertificates(roleId);

  const [franchiseId, setFranchiseId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState(STATUS_OPTIONS[0].id);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Map<string, CertRow>>(new Map());
  const [previewIds, setPreviewIds] = useState<string[] | null>(null);
  const [choice, setChoice] = useState<DocChoice>("both");
  const [loadingAll, setLoadingAll] = useState<DocChoice | null>(null);

  useEffect(() => {
    if (user && !canPrint) router.replace("/certificates/requests");
  }, [user, canPrint, router]);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("status");
    if (initial && STATUS_OPTIONS.some((s) => s.id === initial)) setStatus(initial);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: franchisesData } = useSWR(canPrint ? "/api/franchises?limit=200" : null, fetcher);
  const franchises = (
    Array.isArray(franchisesData)
      ? franchisesData
      : ((franchisesData as { items?: unknown[] } | null)?.items ??
        (franchisesData as { data?: unknown[] } | null)?.data ??
        [])
  ) as { id: string; name: string }[];

  const { data: coursesData } = useSWR(canPrint ? "/api/courses?limit=200" : null, fetcher);
  const courses = (
    Array.isArray(coursesData)
      ? coursesData
      : ((coursesData as { items?: unknown[] } | null)?.items ??
        (coursesData as { data?: unknown[] } | null)?.data ??
        [])
  ) as { id: string; name: string }[];

  const filterParams = useMemo(() => {
    const p = new URLSearchParams({ status });
    if (franchiseId) p.set("franchiseId", franchiseId);
    if (courseId) p.set("courseId", courseId);
    if (search) p.set("search", search);
    return p;
  }, [status, franchiseId, courseId, search]);

  const listUrl = useMemo(() => {
    const p = new URLSearchParams(filterParams);
    p.set("page", String(page));
    p.set("limit", String(PAGE_SIZE));
    return `/api/certificates?${p}`;
  }, [filterParams, page]);

  const { data, isLoading, mutate } = useSWR<CertResponse>(canPrint ? listUrl : null, fetcher, {
    keepPreviousData: true,
  });
  const rows = data?.items ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  useEffect(() => {
    setSelected(new Map());
  }, [filterParams]);

  const toggle = (row: CertRow) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(row.id)) next.delete(row.id);
      else if (next.size < MAX_PRINT) next.set(row.id, row);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) rows.forEach((r) => next.delete(r.id));
      else
        for (const r of rows) {
          if (next.size >= MAX_PRINT) break;
          next.set(r.id, r);
        }
      return next;
    });
  };

  const openPrint = (studentIds: string[], docChoice: DocChoice) => {
    const ids = Array.from(new Set(studentIds)).slice(0, MAX_PRINT);
    if (!ids.length) return;
    setChoice(docChoice);
    setPreviewIds(ids);
  };

  const printSelectedOrAll = async (docChoice: DocChoice) => {
    if (selected.size) {
      openPrint(
        Array.from(selected.values()).map((r) => r.studentId),
        docChoice
      );
      return;
    }
    setLoadingAll(docChoice);
    try {
      const p = new URLSearchParams(filterParams);
      p.set("limit", String(MAX_PRINT));
      const res = await fetch(`/api/certificates?${p}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load certificates");
      const items = (json.data?.items ?? []) as CertRow[];
      openPrint(
        items.map((r) => r.studentId),
        docChoice
      );
    } catch (e) {
      await showError("Error", e instanceof Error ? e.message : "Failed to load certificates");
    } finally {
      setLoadingAll(null);
    }
  };

  if (!canPrint) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
      </div>
    );
  }

  const targetCount = selected.size || Math.min(total, MAX_PRINT);
  const selectClass =
    "h-9 w-full rounded-lg border border-border/70 bg-background px-2.5 text-sm outline-none focus:border-[#1E4A85]";

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
              Approved / issued requests — print the Certificate of Completion and the Statement of Marks (Result) -
              3 separately or together. Choose &quot;Save as PDF&quot; in the print dialog to download.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/certificates/templates"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#C4A35A]/40 bg-[#C4A35A]/15 px-3 text-xs font-semibold text-[#F5E6C8] transition hover:bg-[#C4A35A]/25"
            >
              <Eye className="h-3.5 w-3.5" />
              Edit templates
            </Link>
            <Link
              href="/certificates/requests"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <Award className="h-3.5 w-3.5" />
              Requests
            </Link>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
        <div className="grid gap-3 border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent p-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Building2 className="h-3.5 w-3.5 text-[#1E4A85]" />
              Franchise
            </span>
            <select
              value={franchiseId}
              onChange={(e) => {
                setFranchiseId(e.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All franchises</option>
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <BookOpen className="h-3.5 w-3.5 text-[#1E4A85]" />
              Course / Batch
            </span>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Award className="h-3.5 w-3.5 text-[#1E4A85]" />
              Request status
            </span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Search className="h-3.5 w-3.5 text-[#1E4A85]" />
              Search
            </span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Student name or ID"
              className={selectClass}
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={togglePage}
              disabled={!rows.length}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted/50 disabled:opacity-40"
            >
              {allOnPageSelected ? <CheckSquare className="h-3.5 w-3.5 text-[#1E4A85]" /> : <Square className="h-3.5 w-3.5" />}
              {allOnPageSelected ? "Unselect this page" : "Select this page"}
            </button>
            <p className="text-xs text-muted-foreground">
              {selected.size ? (
                <>
                  <b className="text-[#1E4A85]">{selected.size}</b> selected ·{" "}
                  <button type="button" onClick={() => setSelected(new Map())} className="underline">
                    clear
                  </button>
                </>
              ) : (
                <>
                  {total} ready{total > MAX_PRINT ? ` · first ${MAX_PRINT} print at once` : ""}
                </>
              )}
              {isLoading ? " · loading…" : ""}
            </p>
            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRINT_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.choice}
                  type="button"
                  onClick={() => printSelectedOrAll(a.choice)}
                  disabled={!targetCount || loadingAll !== null}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-40",
                    a.className
                  )}
                >
                  {loadingAll === a.choice ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                  {a.label} ({targetCount})
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-h-[620px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-[1] bg-muted/80 text-left text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur">
              <tr>
                <th className="w-10 px-4 py-2" />
                <th className="px-2 py-2">Student</th>
                <th className="hidden px-2 py-2 md:table-cell">Franchise</th>
                <th className="hidden px-2 py-2 sm:table-cell">Course</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-4 py-2 text-right">Print</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isOn = selected.has(r.id);
                return (
                  <tr
                    key={r.id}
                    className={cn("border-t border-border/50 transition", isOn ? "bg-[#C4A35A]/10" : "hover:bg-muted/40")}
                  >
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => toggle(r)}
                        aria-label={isOn ? "Unselect" : "Select"}
                        className="flex h-5 w-5 items-center justify-center"
                      >
                        {isOn ? <CheckSquare className="h-4 w-4 text-[#1E4A85]" /> : <Square className="h-4 w-4 text-slate-400" />}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <p className="font-semibold text-foreground">{r.studentName}</p>
                      <p className="text-[11px] text-muted-foreground">{r.studentCode || "—"}</p>
                    </td>
                    <td className="hidden px-2 py-2 text-xs md:table-cell">{r.franchiseName}</td>
                    <td className="hidden px-2 py-2 text-xs sm:table-cell">{r.courseName || "—"}</td>
                    <td className="px-2 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          r.status === "ISSUED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openPrint([r.studentId], "vocational")}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#0B1F3A]/20 bg-[#0B1F3A]/5 px-2.5 py-1 text-xs font-semibold text-[#0B1F3A] hover:bg-[#0B1F3A]/10"
                        >
                          <Award className="h-3.5 w-3.5" />
                          Certificate
                        </button>
                        <button
                          type="button"
                          onClick={() => openPrint([r.studentId], "marksheet")}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#1E4A85]/25 bg-[#1E4A85]/5 px-2.5 py-1 text-xs font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/10"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Result
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-sm text-muted-foreground">
                    No approved or issued certificate requests for these filters.{" "}
                    <Link href="/certificates/requests" className="font-semibold text-[#1E4A85] hover:underline">
                      Go to requests →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-border/60 px-4 py-2.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border p-1.5 hover:bg-muted/50 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs tabular-nums text-muted-foreground">
              Page {page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="rounded-lg border border-border p-1.5 hover:bg-muted/50 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Tip: in the print dialog pick <b>Save as PDF</b> to download, paper <b>A4</b>, margins <b>None</b>, and enable{" "}
        <b>Background graphics</b>.
      </p>

      <OfficialBatchPreview
        studentIds={previewIds}
        onClose={() => setPreviewIds(null)}
        choice={choice}
        onChoiceChange={setChoice}
      />
    </div>
  );
}
