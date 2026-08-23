"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  Loader2,
  Search,
  Filter,
  X,
  Users,
  Download,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Table, type TableColumn } from "@/components/common/Table";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { StatCardData } from "@/components/adminpanel/dashboard/DashboardStats";

type DetailRow = Record<string, string | number | null> & { id?: string };

type DetailPayload = {
  title: string;
  columns: { key: string; label: string }[];
  items: DetailRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type StatDetailModalProps = {
  card: StatCardData | null;
  franchiseFilter?: string;
  onClose: () => void;
};

const STATUS_KEYS = new Set(["status"]);
const FRANCHISE_KEYS = new Set(["franchiseName"]);
const COURSE_KEYS = new Set(["courseName"]);

function cellValue(value: unknown) {
  if (value == null || value === "") return "—";
  return String(value);
}

function renderCell(key: string, value: unknown) {
  const text = cellValue(value);
  if (text === "—") return <span className="text-muted-foreground">—</span>;

  if (key === "email" || key === "studentEmail") {
    return (
      <a href={`mailto:${text}`} className="text-[#1E4A85] hover:underline dark:text-[#8EB6E8]">
        {text}
      </a>
    );
  }

  if (key === "phone") {
    return (
      <a href={`tel:${text}`} className="font-medium text-foreground hover:text-[#1E4A85]">
        {text}
      </a>
    );
  }

  if (STATUS_KEYS.has(key)) {
    const upper = text.toUpperCase();
    const tone =
      upper === "ACTIVE" || upper === "SUCCESS" || upper === "PRESENT"
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : upper === "PENDING" || upper === "REQUESTED"
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          : upper === "ABSENT" || upper === "FAILED" || upper === "REJECTED"
            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    return (
      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", tone)}>
        {text}
      </span>
    );
  }

  if (key === "message") {
    return (
      <span className="line-clamp-2 max-w-[280px] text-xs text-muted-foreground" title={text}>
        {text}
      </span>
    );
  }

  if (key.includes("Fee") || key === "amount" || key === "salary") {
    return <span className="font-semibold text-emerald-700 dark:text-emerald-400">{text}</span>;
  }

  return <span className="text-sm text-foreground">{text}</span>;
}

function buildTableColumns(apiColumns: { key: string; label: string }[]): TableColumn<DetailRow>[] {
  return [
    {
      key: "__idx",
      header: "#",
      width: "48px",
      sortable: false,
      render: (value) => (
        <span className="text-xs font-medium text-muted-foreground">{value}</span>
      ),
    },
    ...apiColumns.map((col) => ({
      key: col.key,
      header: col.label,
      sortable: true,
      render: (value: unknown) => renderCell(col.key, value),
    })),
  ];
}

function uniqueValues(rows: DetailRow[], key: string): string[] {
  const set = new Set<string>();
  rows.forEach((row) => {
    const v = row[key];
    if (v != null && String(v).trim()) set.add(String(v));
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function StatDetailContent({
  card,
  franchiseFilter,
}: {
  card: StatCardData;
  franchiseFilter: string;
}) {
  const url = `/api/dashboard/details?type=${encodeURIComponent(card.type)}${
    franchiseFilter ? `&franchiseId=${encodeURIComponent(franchiseFilter)}` : ""
  }&limit=100`;

  const { data, error, isLoading } = useSWR<DetailPayload>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [franchiseColFilter, setFranchiseColFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");

  useEffect(() => {
    setSearch("");
    setStatusFilter("all");
    setFranchiseColFilter("all");
    setCourseFilter("all");
  }, [card.type]);

  const hasStatus = data?.columns.some((c) => STATUS_KEYS.has(c.key));
  const hasFranchise = data?.columns.some((c) => FRANCHISE_KEYS.has(c.key));
  const hasCourse = data?.columns.some((c) => COURSE_KEYS.has(c.key));

  const statusOptions = useMemo(
    () => (data ? uniqueValues(data.items, "status") : []),
    [data]
  );
  const franchiseOptions = useMemo(
    () => (data ? uniqueValues(data.items, "franchiseName") : []),
    [data]
  );
  const courseOptions = useMemo(
    () => (data ? uniqueValues(data.items, "courseName") : []),
    [data]
  );

  const filteredRows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();

    return data.items
      .filter((row) => {
        if (statusFilter !== "all" && String(row.status ?? "") !== statusFilter) return false;
        if (franchiseColFilter !== "all" && String(row.franchiseName ?? "") !== franchiseColFilter)
          return false;
        if (courseFilter !== "all" && String(row.courseName ?? "") !== courseFilter) return false;

        if (!q) return true;
        return data.columns.some((col) =>
          String(row[col.key] ?? "")
            .toLowerCase()
            .includes(q)
        );
      })
      .map((row, idx) => ({ ...row, __idx: idx + 1 }));
  }, [data, search, statusFilter, franchiseColFilter, courseFilter]);

  const columns = useMemo(
    () => (data ? buildTableColumns(data.columns) : []),
    [data]
  );

  const activeFilters =
    (search ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (franchiseColFilter !== "all" ? 1 : 0) +
    (courseFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFranchiseColFilter("all");
    setCourseFilter("all");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
        <p className="text-sm text-muted-foreground">Loading records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
        {(error as Error).message || "Failed to load details"}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="Card Count" value={card.value} accent />
        <StatPill label="Total Records" value={String(data.pagination.total)} />
        <StatPill label="Filtered" value={String(filteredRows.length)} />
        <StatPill label="Type" value={card.change} small />
      </div>

      {/* Advanced filters — horizontal toolbar (no narrow column wrap) */}
      <div className="rounded-xl border border-[#1E4A85]/12 bg-muted/20 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-[#1E4A85] dark:text-[#8EB6E8]">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#1E4A85]/10">
              <Filter className="h-3.5 w-3.5" />
            </span>
            <span>Filters</span>
            {activeFilters > 0 && (
              <span className="rounded-full bg-[#1E4A85] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </div>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="relative min-w-0 flex-1 lg:min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all columns..."
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-shadow focus:border-[#1E4A85]/40 focus:ring-2 focus:ring-[#1E4A85]/15"
            />
          </div>

          {hasStatus && statusOptions.length > 0 && (
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              className="w-full sm:w-auto sm:min-w-[160px]"
            />
          )}
          {hasFranchise && franchiseOptions.length > 0 && (
            <FilterSelect
              label="Franchise"
              value={franchiseColFilter}
              onChange={setFranchiseColFilter}
              options={franchiseOptions}
              className="w-full sm:w-auto sm:min-w-[160px]"
            />
          )}
          {hasCourse && courseOptions.length > 0 && (
            <FilterSelect
              label="Course"
              value={courseFilter}
              onChange={setCourseFilter}
              options={courseOptions}
              className="w-full sm:w-auto sm:min-w-[160px]"
            />
          )}
        </div>
      </div>

      {/* Data table */}
      {filteredRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium text-muted-foreground">No records match your filters</p>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-xs font-semibold text-[#1E4A85] hover:underline dark:text-[#8EB6E8]"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border/80 bg-card shadow-sm [&_table]:text-sm [&_thead]:bg-[#1E4A85] [&_thead_th]:!text-white [&_thead_th]:!text-[11px] [&_thead_th]:!font-semibold [&_thead_th]:!uppercase [&_thead_th]:!tracking-wide [&_tbody_tr:hover]:bg-[#1E4A85]/5">
          <Table<DetailRow>
            data={filteredRows}
            columns={columns}
            pagination
            pageSize={8}
            zebraStriping
            stickyHeader
            emptyMessage="No records found"
            className="[&_.rounded-xl]:rounded-xl [&_.rounded-xl]:border-0 [&_.shadow-sm]:shadow-none"
          />
        </div>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Download className="h-3 w-3" />
        Tip: Click column headers to sort · Use filters to narrow results quickly
      </p>
    </div>
  );
}

export default function StatDetailModal({
  card,
  franchiseFilter = "",
  onClose,
}: StatDetailModalProps) {
  const open = Boolean(card);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      className="max-w-[min(96vw,1180px)]"
      title={card?.title || "Details"}
      description={
        card
          ? `${card.change} · Click headers to sort, use filters to search`
          : undefined
      }
    >
      {card && (
        <StatDetailContent
          key={`${card.type}-${franchiseFilter}`}
          card={card}
          franchiseFilter={franchiseFilter}
        />
      )}
    </Modal>
  );
}

function StatPill({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        accent
          ? "border-[#1E4A85]/20 bg-gradient-to-br from-[#1E4A85]/10 to-[#C4A35A]/10"
          : "border-border/70 bg-background"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-bold text-foreground",
          small ? "truncate text-xs" : "text-lg",
          accent && "text-[#1E4A85] dark:text-[#8EB6E8]"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-[#1E4A85]/40 focus:ring-2 focus:ring-[#1E4A85]/15"
      >
        <option value="all">All {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
