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
  Search,
  Square,
  Users,
  X,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { canPrintCertificates } from "@/lib/certificate-access";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { CertificateDemoData } from "@/components/certificates/demo/types";
import {
  OFFICIAL_DOC_LABEL,
  OfficialDocumentSheet,
  useOfficialBatchPrint,
  type OfficialDocKind,
  type OfficialPrintPage,
} from "@/components/certificates/OfficialDocumentPrint";

type DocChoice = "both" | OfficialDocKind;

type StudentRow = {
  id: string;
  studentCode: string;
  fullName: string;
  franchiseName: string;
  courseName: string | null;
  status: string;
};

type StudentsResponse = {
  items: StudentRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

type OfficialDocs = {
  studentId: string;
  studentName: string;
  studentCode: string;
  franchiseName: string;
  courseName: string | null;
  vocational: CertificateDemoData;
  marksheet: CertificateDemoData;
};

const MAX_BATCH = 100;
const PAGE_SIZE = 50;

const DOC_CHOICES: { id: DocChoice; label: string; hint: string; icon: typeof Award }[] = [
  { id: "both", label: "Both", hint: "Certificate + Marksheet", icon: Files },
  { id: "vocational", label: "Certificate", hint: "Certificate of Completion", icon: Award },
  { id: "marksheet", label: "Marksheet", hint: "Statement of Marks (Result) - 3", icon: FileText },
];

function pagesFor(docs: OfficialDocs[], choice: DocChoice): OfficialPrintPage[] {
  const out: OfficialPrintPage[] = [];
  for (const d of docs) {
    if (choice !== "marksheet") out.push({ key: `${d.studentId}-vocational`, kind: "vocational", data: d.vocational });
    if (choice !== "vocational") out.push({ key: `${d.studentId}-marksheet`, kind: "marksheet", data: d.marksheet });
  }
  return out;
}

function SheetThumb({ kind, data, scale, id }: { kind: OfficialDocKind; data: CertificateDemoData; scale: number; id: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="overflow-hidden rounded-md bg-white shadow-xl ring-1 ring-black/10"
        style={{ width: 1054 * scale, height: 1492 * scale }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 1054 }}>
          <OfficialDocumentSheet kind={kind} data={data} printId={id} />
        </div>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{OFFICIAL_DOC_LABEL[kind]}</p>
    </div>
  );
}

export default function OfficialPrintCenterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const roleId = Number(user?.roleId) || 0;
  const canPrint = canPrintCertificates(roleId);

  const [franchiseId, setFranchiseId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Map<string, StudentRow>>(new Map());
  const [choice, setChoice] = useState<DocChoice>("both");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [docs, setDocs] = useState<OfficialDocs[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const batch = useOfficialBatchPrint();

  useEffect(() => {
    if (user && !canPrint) router.replace("/certificates/requests");
  }, [user, canPrint, router]);

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
      : ((franchisesData as { data?: unknown[]; items?: unknown[] } | null)?.items ??
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

  const query = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (franchiseId) p.set("franchiseId", franchiseId);
    if (courseId) p.set("courseId", courseId);
    if (status) p.set("status", status);
    if (search) p.set("search", search);
    return p.toString();
  }, [page, franchiseId, courseId, status, search]);

  const { data: studentsData, isLoading: studentsLoading } = useSWR<StudentsResponse>(
    canPrint ? `/api/students?${query}` : null,
    fetcher,
    { keepPreviousData: true }
  );
  const rows = studentsData?.items ?? [];
  const pagination = studentsData?.pagination;

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggle = (row: StudentRow) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(row.id)) next.delete(row.id);
      else if (next.size < MAX_BATCH) next.set(row.id, row);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) {
        rows.forEach((r) => next.delete(r.id));
      } else {
        for (const r of rows) {
          if (next.size >= MAX_BATCH) break;
          next.set(r.id, r);
        }
      }
      return next;
    });
  };

  const openPreview = async (ids: string[]) => {
    if (!ids.length) return;
    setPreviewOpen(true);
    setDocsLoading(true);
    setDocs([]);
    try {
      const res = await fetch("/api/students/certificates/bulk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: ids }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load documents");
      const items = (json.data?.items ?? []) as OfficialDocs[];
      setDocs(items);
      setActiveId(items[0]?.studentId ?? null);
    } catch (e) {
      setPreviewOpen(false);
      await showError("Error", e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setDocsLoading(false);
    }
  };

  const active = docs.find((d) => d.studentId === activeId) ?? docs[0];
  const totalPages = pagesFor(docs, choice).length;

  if (!canPrint) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0B1F3A] via-[#163A5C] to-[#0B1F3A] text-white shadow-md shadow-[#1E4A85]/15">
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
              <span className="text-white/80">Official Print</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Official Certificate &amp; Marksheet Print</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A35A]/35 bg-[#C4A35A]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F5E6C8]">
                <Printer className="h-3 w-3" />
                A4 · PDF
              </span>
            </div>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">
              Certificate of Completion + Statement of Marks (Result) - 3 with each student&apos;s live data. Print one
              student or a whole batch — choose &quot;Save as PDF&quot; in the print dialog for a PDF.
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
              href="/certificates/print"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <Award className="h-3.5 w-3.5" />
              Issued batch print
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Student picker */}
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
                className="h-9 w-full rounded-lg border border-border/70 bg-background px-2.5 text-sm outline-none focus:border-[#1E4A85]"
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
                className="h-9 w-full rounded-lg border border-border/70 bg-background px-2.5 text-sm outline-none focus:border-[#1E4A85]"
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
                <Users className="h-3.5 w-3.5 text-[#1E4A85]" />
                Status
              </span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-border/70 bg-background px-2.5 text-sm outline-none focus:border-[#1E4A85]"
              >
                <option value="">All</option>
                <option value="COMPLETED">Completed</option>
                <option value="ACTIVE">Active</option>
                <option value="DROPPED">Dropped</option>
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
                placeholder="Name or student ID"
                className="h-9 w-full rounded-lg border border-border/70 bg-background px-2.5 text-sm outline-none focus:border-[#1E4A85]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
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
              {pagination ? `${pagination.total} student(s)` : ""}
              {studentsLoading ? " · loading…" : ""}
            </p>
          </div>

          <div className="max-h-[560px] overflow-auto">
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
                        <p className="font-semibold text-foreground">{r.fullName}</p>
                        <p className="text-[11px] text-muted-foreground">{r.studentCode}</p>
                      </td>
                      <td className="hidden px-2 py-2 text-xs md:table-cell">{r.franchiseName}</td>
                      <td className="hidden px-2 py-2 text-xs sm:table-cell">{r.courseName || "—"}</td>
                      <td className="px-2 py-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            r.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-700"
                              : r.status === "ACTIVE"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => openPreview([r.id])}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#C4A35A]/40 bg-[#C4A35A]/10 px-2.5 py-1 text-xs font-semibold text-[#8B6914] hover:bg-[#C4A35A]/20"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Single
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && !studentsLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No students found for these filters.
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

        {/* Print panel */}
        <aside className="h-fit space-y-4 rounded-2xl border border-[#1E4A85]/12 bg-card p-4 shadow-sm lg:sticky lg:top-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1E4A85]/70">Documents</p>
            <div className="mt-2 grid gap-2">
              {DOC_CHOICES.map((c) => {
                const Icon = c.icon;
                const on = choice === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChoice(c.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                      on ? "border-[#C4A35A] bg-[#C4A35A]/10 ring-1 ring-[#C4A35A]/40" : "border-border hover:bg-muted/40"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", on ? "text-[#8B6914]" : "text-muted-foreground")} />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-foreground">{c.label}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{c.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[#1E4A85]/15 bg-[#1E4A85]/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1E4A85]/70">Selected</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E4A85]">
              {selected.size}
              <span className="ml-1 text-sm font-medium text-muted-foreground">/ {MAX_BATCH} student(s)</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {selected.size * (choice === "both" ? 2 : 1)} A4 page(s)
            </p>
            {selected.size > 0 && (
              <div className="mt-2 flex max-h-28 flex-wrap gap-1 overflow-auto">
                {Array.from(selected.values()).map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#1E4A85] ring-1 ring-[#1E4A85]/15"
                  >
                    {s.fullName}
                    <button type="button" onClick={() => toggle(s)} aria-label={`Remove ${s.fullName}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => openPreview(Array.from(selected.keys()))}
              disabled={!selected.size}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#163A5C] disabled:opacity-40"
            >
              <Printer className="h-4 w-4" />
              Preview &amp; print selected
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Map())}
              disabled={!selected.size}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted/50 disabled:opacity-40"
            >
              Clear selection
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Tip: in the print dialog pick <b>Save as PDF</b> for one combined PDF, set paper to <b>A4</b>, margins{" "}
            <b>None</b>, and enable <b>Background graphics</b>.
          </p>
        </aside>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-[10200] flex flex-col bg-slate-950/90 backdrop-blur-md">
          <div className="no-print flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0B1F3A] px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#C4A35A]">Print preview</p>
              <h2 className="truncate text-base font-bold">
                {docsLoading ? "Loading documents…" : `${docs.length} student(s) · ${totalPages} A4 page(s)`}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-white/15 bg-white/5 p-0.5">
                {DOC_CHOICES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChoice(c.id)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-bold transition",
                      choice === c.id ? "bg-white text-[#0B1F3A]" : "text-white/70 hover:text-white"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {active && docs.length > 1 && (
                <button
                  type="button"
                  onClick={() => batch.print(pagesFor([active], choice))}
                  disabled={batch.preparing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#C4A35A]/50 bg-white/5 px-3 py-2 text-xs font-bold text-[#F5E6C8] hover:bg-white/10 disabled:opacity-50"
                >
                  <Printer className="h-3.5 w-3.5" />
                  This student
                </button>
              )}
              <button
                type="button"
                onClick={() => batch.print(pagesFor(docs, choice))}
                disabled={!docs.length || docsLoading || batch.preparing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 py-2 text-xs font-bold text-[#0B1F3A] hover:bg-[#d4b56c] disabled:opacity-50"
              >
                {batch.preparing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                {batch.preparing ? "Preparing…" : `Print all / PDF (${totalPages})`}
              </button>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {docsLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-[#C4A35A]" />
            </div>
          ) : (
            <div className="no-print flex min-h-0 flex-1">
              {docs.length > 1 && (
                <ul className="w-64 shrink-0 overflow-auto border-r border-white/10 bg-[#0B1F3A]/60 p-2">
                  {docs.map((d, i) => (
                    <li key={d.studentId}>
                      <button
                        type="button"
                        onClick={() => setActiveId(d.studentId)}
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-left transition",
                          active?.studentId === d.studentId ? "bg-white text-[#0B1F3A]" : "text-white/80 hover:bg-white/10"
                        )}
                      >
                        <span className="block truncate text-xs font-bold">
                          {i + 1}. {d.studentName}
                        </span>
                        <span className="block truncate text-[10px] opacity-70">
                          {d.studentCode} · {d.courseName || "—"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="min-w-0 flex-1 overflow-auto p-6">
                {active ? (
                  <div className="flex flex-wrap items-start justify-center gap-6">
                    {choice !== "marksheet" && (
                      <SheetThumb kind="vocational" data={active.vocational} scale={0.42} id="opreview-vocational" />
                    )}
                    {choice !== "vocational" && (
                      <SheetThumb kind="marksheet" data={active.marksheet} scale={0.42} id="opreview-marksheet3" />
                    )}
                  </div>
                ) : (
                  <p className="text-center text-sm text-white/70">No documents.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {batch.node}
    </div>
  );
}
