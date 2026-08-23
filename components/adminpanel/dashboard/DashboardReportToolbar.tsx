"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ReportFiltersState = {
  range: "7d" | "30d" | "90d" | "365d" | "all" | "custom";
  from: string;
  to: string;
  status: string;
};

const RANGE_OPTIONS = [
  { id: "7d" as const, label: "7 Days" },
  { id: "30d" as const, label: "30 Days" },
  { id: "90d" as const, label: "90 Days" },
  { id: "365d" as const, label: "12 Months" },
  { id: "all" as const, label: "All Time" },
  { id: "custom" as const, label: "Custom" },
];

const STATUS_OPTIONS = [
  { id: "ALL", label: "All Status" },
  { id: "SUCCESS", label: "Success" },
  { id: "PENDING", label: "Pending" },
  { id: "FAILED", label: "Failed" },
];

type Props = {
  tab: "overview" | "analytics" | "activity";
  filters: ReportFiltersState;
  onChange: (next: ReportFiltersState) => void;
  franchiseId?: string;
  className?: string;
};

export default function DashboardReportToolbar({
  tab,
  filters,
  onChange,
  franchiseId = "",
  className,
}: Props) {
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  const buildQuery = (format: "excel" | "pdf" | "json") => {
    const params = new URLSearchParams();
    params.set("format", format);
    params.set("tab", tab);
    params.set("range", filters.range);
    params.set("status", filters.status);
    if (filters.range === "custom") {
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
    }
    if (franchiseId) params.set("franchiseId", franchiseId);
    return `/api/dashboard/report?${params.toString()}`;
  };

  const download = async (format: "excel" | "pdf") => {
    setExporting(format);
    try {
      const res = await fetch(buildQuery(format), { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename =
        match?.[1] || `dashboard-${tab}.${format === "excel" ? "xls" : "pdf"}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const reset = () => {
    onChange({ range: "all", from: "", to: "", status: "ALL" });
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[#1E4A85]/15 bg-card shadow-sm",
        className
      )}
    >
      {/* Top row */}
      <div className="flex flex-col gap-3 border-b border-border/60 px-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-4">
        {/* Period */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#1E4A85]">
            <CalendarDays className="h-3.5 w-3.5" />
            Period
          </div>
          <div className="inline-flex w-full flex-wrap rounded-lg border border-border/70 bg-muted/40 p-0.5 sm:w-auto">
            {RANGE_OPTIONS.map((opt) => {
              const active = filters.range === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...filters, range: opt.id })}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all",
                    active
                      ? "bg-[#1E4A85] text-white shadow-sm"
                      : "text-muted-foreground hover:bg-background hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status + actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <label className="sr-only" htmlFor={`status-${tab}`}>
              Payment status
            </label>
            <select
              id={`status-${tab}`}
              value={filters.status}
              onChange={(e) => onChange({ ...filters, status: e.target.value })}
              className="h-9 appearance-none rounded-lg border border-border/70 bg-background py-1.5 pl-3 pr-8 text-xs font-semibold text-foreground outline-none transition-colors hover:border-[#1E4A85]/40 focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>

          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-[#1E4A85]/30 hover:bg-[#1E4A85]/5 hover:text-[#1E4A85]"
            title="Reset filters"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <div className="mx-0.5 hidden h-6 w-px bg-border sm:block" />

          <button
            type="button"
            disabled={!!exporting}
            onClick={() => download("excel")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting === "excel" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5" />
            )}
            Excel
          </button>

          <button
            type="button"
            disabled={!!exporting}
            onClick={() => download("pdf")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1E4A85] px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#163A6B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting === "pdf" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            PDF
          </button>
        </div>
      </div>

      {/* Custom date row */}
      {filters.range === "custom" && (
        <div className="flex flex-wrap items-end gap-3 bg-[#1E4A85]/[0.03] px-3 py-2.5 lg:px-4">
          <p className="w-full text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:w-auto sm:pb-1.5">
            Custom range
          </p>
          <label className="flex flex-col gap-1 text-[10px] font-medium text-muted-foreground">
            From
            <input
              type="date"
              value={filters.from}
              onChange={(e) => onChange({ ...filters, from: e.target.value })}
              className="h-9 rounded-lg border border-border/70 bg-background px-2.5 text-xs font-medium text-foreground outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-medium text-muted-foreground">
            To
            <input
              type="date"
              value={filters.to}
              onChange={(e) => onChange({ ...filters, to: e.target.value })}
              className="h-9 rounded-lg border border-border/70 bg-background px-2.5 text-xs font-medium text-foreground outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
            />
          </label>
        </div>
      )}
    </div>
  );
}

export function reportQueryKey(filters: ReportFiltersState, franchiseId: string, tab: string) {
  const params = new URLSearchParams();
  params.set("format", "json");
  params.set("tab", tab);
  params.set("range", filters.range);
  params.set("status", filters.status);
  if (filters.range === "custom") {
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
  }
  if (franchiseId) params.set("franchiseId", franchiseId);
  return `/api/dashboard/report?${params.toString()}`;
}
