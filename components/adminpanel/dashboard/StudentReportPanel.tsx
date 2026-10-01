"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileDown,
  Loader2,
  RotateCcw,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { refreshSession } from "@/lib/session-client";
import { cn } from "@/lib/utils";
import type { StudentReport } from "@/lib/student-report";

type ReportResponse = Omit<StudentReport, "rows"> & {
  courseOptions: { id: string; name: string; students: number }[];
};

type Filters = {
  courseId: string;
  fee: "ALL" | "PENDING" | "PAID" | "UNPAID";
  status: "ALL" | "ACTIVE" | "COMPLETED" | "DROPPED";
  gender: "ALL" | "MALE" | "FEMALE" | "OTHER";
  from: string;
  to: string;
  search: string;
  sort: "admission_desc" | "admission_asc" | "name" | "pending_desc" | "course";
  list: boolean;
};

const DEFAULT_FILTERS: Filters = {
  courseId: "",
  fee: "ALL",
  status: "ALL",
  gender: "ALL",
  from: "",
  to: "",
  search: "",
  sort: "admission_desc",
  list: true,
};

const FEE_OPTIONS: { id: Filters["fee"]; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending fees" },
  { id: "PAID", label: "Fully paid" },
  { id: "UNPAID", label: "Nothing paid" },
];

const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-border/70 bg-background py-1.5 pl-3 pr-8 text-xs font-medium text-foreground outline-none transition-colors hover:border-[#1E4A85]/40 focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15";
const inputClass =
  "h-9 w-full rounded-lg border border-border/70 bg-background px-2.5 text-xs font-medium text-foreground outline-none transition-colors hover:border-[#1E4A85]/40 focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15";

function buildQuery(filters: Filters, search: string, franchiseId: string | undefined, format: "json" | "pdf") {
  const p = new URLSearchParams({ format });
  if (franchiseId) p.set("franchiseId", franchiseId);
  if (filters.courseId) p.set("courseId", filters.courseId);
  if (filters.fee !== "ALL") p.set("fee", filters.fee);
  if (filters.status !== "ALL") p.set("status", filters.status);
  if (filters.gender !== "ALL") p.set("gender", filters.gender);
  if (filters.from) p.set("from", filters.from);
  if (filters.to) p.set("to", filters.to);
  if (search) p.set("search", search);
  if (filters.sort !== "admission_desc") p.set("sort", filters.sort);
  if (format === "pdf" && !filters.list) p.set("list", "0");
  return `/api/dashboard/students-report?${p.toString()}`;
}

export default function StudentReportPanel({ franchiseId }: { franchiseId?: string }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(filters.search.trim()), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    setFilters((f) => ({ ...f, courseId: "" }));
  }, [franchiseId]);

  const url = buildQuery(filters, search, franchiseId, "json");
  const { data, error, isLoading, isValidating } = useSWR<ReportResponse>(url, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }));
  const activeCount = useMemo(
    () =>
      (Object.keys(DEFAULT_FILTERS) as (keyof Filters)[]).filter(
        (k) => k !== "list" && k !== "sort" && filters[k] !== DEFAULT_FILTERS[k]
      ).length,
    [filters]
  );

  const download = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const pdfUrl = buildQuery(filters, filters.search.trim(), franchiseId, "pdf");
      let res = await fetch(pdfUrl, { credentials: "include" });
      if (res.status === 401 && (await refreshSession())) res = await fetch(pdfUrl, { credentials: "include" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const name = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || "IVESDC-Student-Report.pdf";
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      setDownloadError("PDF download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const s = data?.summary;
  const noResults = s && s.students === 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-card shadow-sm">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0B132B] via-[#163A6B] to-[#1E4A85] px-4 py-3.5 text-white">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#C4A35A]/20 blur-2xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <Users className="h-[18px] w-[18px] text-[#E8C46A]" />
            </span>
            <div>
              <h2 className="text-sm font-bold sm:text-base">Student Report</h2>
              <p className="text-[11px] text-white/65">
                Filter students, check totals and download the PDF
                {activeCount > 0 ? ` · ${activeCount} filter${activeCount > 1 ? "s" : ""} applied` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isValidating && data && <Loader2 className="h-4 w-4 animate-spin text-white/60" />}
            <button
              type="button"
              onClick={download}
              disabled={downloading || !data || !!noResults}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#C4A35A] px-4 text-xs font-bold text-[#0B132B] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#D4B46A] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {downloading ? "Preparing PDF..." : "Download PDF"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-b border-border/60 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-[#1E4A85]">Fee status</span>
          {FEE_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => set("fee", o.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                filters.fee === o.id
                  ? o.id === "PENDING"
                    ? "border-rose-600 bg-rose-600 text-white shadow-sm"
                    : "border-[#1E4A85] bg-[#1E4A85] text-white shadow-sm"
                  : "border-border/70 bg-background text-muted-foreground hover:border-[#1E4A85]/30 hover:text-[#1E4A85]"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Course">
            <Select value={filters.courseId} onChange={(v) => set("courseId", v)}>
              <option value="">All courses</option>
              {(data?.courseOptions ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.students})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Student status">
            <Select value={filters.status} onChange={(v) => set("status", v as Filters["status"])}>
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="DROPPED">Dropped</option>
            </Select>
          </Field>
          <Field label="Gender">
            <Select value={filters.gender} onChange={(v) => set("gender", v as Filters["gender"])}>
              <option value="ALL">All</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
          <Field label="Sort PDF list by">
            <Select value={filters.sort} onChange={(v) => set("sort", v as Filters["sort"])}>
              <option value="admission_desc">Newest admission first</option>
              <option value="admission_asc">Oldest admission first</option>
              <option value="name">Name (A–Z)</option>
              <option value="pending_desc">Highest pending first</option>
              <option value="course">Course</option>
            </Select>
          </Field>
          <Field label="Admission from">
            <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set("from", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Admission to">
            <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set("to", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Search" className="sm:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={filters.search}
                onChange={(e) => set("search", e.target.value)}
                placeholder="Name, student ID, mobile or email"
                className={cn(inputClass, "pl-8")}
              />
            </div>
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={filters.list}
              onChange={(e) => set("list", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-[#1E4A85]"
            />
            Include full student list in PDF
          </label>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            disabled={activeCount === 0 && filters.sort === DEFAULT_FILTERS.sort}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-[#1E4A85]/30 hover:bg-[#1E4A85]/5 hover:text-[#1E4A85] disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset filters
          </button>
        </div>
        {downloadError && (
          <p className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            <AlertCircle className="h-3.5 w-3.5" />
            {downloadError}
          </p>
        )}
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#1E4A85]" />
          Loading students...
        </div>
      ) : error && !data ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Could not load the student report.</p>
      ) : s ? (
        <div className={cn("space-y-3 p-3 transition-opacity sm:p-4", isValidating && "opacity-70")}>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
            <Tile
              icon={Users}
              tone="navy"
              label="Total Students"
              value={s.students.toLocaleString("en-IN")}
              sub={`${s.active} active · ${s.completed} completed · ${s.dropped} dropped`}
            />
            <Tile
              icon={AlertCircle}
              tone="rose"
              label="Pending Fee Students"
              value={s.pendingStudents.toLocaleString("en-IN")}
              sub={`${s.fullyPaid} fully paid`}
            />
            <Tile icon={Wallet} tone="navy" label="Total Fees" value={inr(s.totalFee)} sub="Sum of student fees" />
            <Tile icon={CheckCircle2} tone="emerald" label="Collected" value={inr(s.paidFee)} sub={`${s.collectionPercent}% collected`} />
            <Tile icon={Wallet} tone="rose" label="Pending Amount" value={inr(s.pendingFee)} sub="Still to collect" className="col-span-2 lg:col-span-1" />
          </div>

          {noResults ? (
            <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No students match these filters.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/70">
              <div className="flex items-center justify-between bg-muted/40 px-3 py-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[#1E4A85]">Course-wise</h3>
                <span className="text-[11px] text-muted-foreground">{data.courses.length} course{data.courses.length === 1 ? "" : "s"}</span>
              </div>
              <div className="max-h-72 overflow-auto">
                <table className="w-full min-w-[560px] text-xs">
                  <thead className="sticky top-0 bg-card text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b border-border/70">
                      <th className="px-3 py-2 text-left font-semibold">Course</th>
                      <th className="px-3 py-2 text-right font-semibold">Students</th>
                      <th className="px-3 py-2 text-right font-semibold">Total Fees</th>
                      <th className="px-3 py-2 text-right font-semibold">Collected</th>
                      <th className="px-3 py-2 text-right font-semibold">Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.courses.map((c) => (
                      <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-[#1E4A85]/[0.03]">
                        <td className="px-3 py-2 font-medium text-foreground">{c.name}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {c.students}
                          {c.pendingStudents > 0 && (
                            <span className="ml-1.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                              {c.pendingStudents} pending
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{inr(c.totalFee)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{inr(c.paidFee)}</td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right font-semibold tabular-nums",
                            c.pendingFee > 0 ? "text-rose-700" : c.totalFee > 0 ? "text-emerald-700" : "text-muted-foreground"
                          )}
                        >
                          {c.pendingFee > 0 ? inr(c.pendingFee) : c.totalFee > 0 ? "Paid" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-50 font-bold">
                      <td className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right tabular-nums">{s.students}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{inr(s.totalFee)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{inr(s.paidFee)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-rose-700">{inr(s.pendingFee)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
          {data.truncated && (
            <p className="text-[11px] text-amber-700">Very large result — the PDF lists the first 20,000 students. Narrow the filters to see the rest.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-1 text-[11px] font-semibold text-muted-foreground", className)}>
      {label}
      {children}
    </label>
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

const TONES = {
  navy: "from-[#1E4A85]/10 text-[#1E4A85] ring-[#1E4A85]/15",
  rose: "from-rose-500/10 text-rose-700 ring-rose-500/15",
  emerald: "from-emerald-500/10 text-emerald-700 ring-emerald-500/15",
};

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  tone: keyof typeof TONES;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-gradient-to-br to-transparent p-3 ring-1", TONES[tone], className)}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide opacity-80">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 truncate text-lg font-extrabold tabular-nums text-foreground">{value}</p>
      <p className="truncate text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
