"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Award, BookOpen, ChevronDown, Loader2, Percent, Receipt, Search, Wallet } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { CourseFeeSummary as Summary } from "@/lib/course-fee-summary";

const PREVIEW_ROWS = 8;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function CourseFeeSummary({ franchiseId }: { franchiseId?: string }) {
  const url = franchiseId ? `/api/dashboard/course-fees?franchiseId=${franchiseId}` : "/api/dashboard/course-fees";
  const { data, error, isLoading } = useSWR<Summary>(url, fetcher, { keepPreviousData: true, revalidateOnFocus: false });
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const gstPct = Math.round((data?.gstRate ?? 0.18) * 100);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = data?.rows ?? [];
    return q ? all.filter((r) => r.courseName.toLowerCase().includes(q) || (r.category || "").toLowerCase().includes(q)) : all;
  }, [data, query]);
  const visible = showAll || query ? rows : rows.slice(0, PREVIEW_ROWS);
  const t = data?.totals;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-card shadow-sm">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0B132B] via-[#163A6B] to-[#1E4A85] px-4 py-3.5 text-white">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#C4A35A]/20 blur-2xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <Receipt className="h-[18px] w-[18px] text-[#E8C46A]" />
            </span>
            <div>
              <h2 className="text-sm font-bold sm:text-base">Course-wise Fees</h2>
              <p className="text-[11px] text-white/65">
                Fees with {gstPct}% GST and student certificate royalty
                {t ? ` · ${t.courses} courses · ${t.students.toLocaleString("en-IN")} students` : ""}
              </p>
            </div>
          </div>
          <label className="relative block sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search course..."
              className="h-8 w-full rounded-lg border border-white/15 bg-white/10 pl-8 pr-3 text-xs text-white outline-none placeholder:text-white/45 focus:border-[#E8C46A]/60 focus:bg-white/15"
            />
          </label>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[#1E4A85]" />
          Loading course fees...
        </div>
      ) : error && !data ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Could not load course fees.</p>
      ) : t ? (
        <>
          <div className="grid grid-cols-2 gap-2.5 p-3 lg:grid-cols-4">
            <SummaryTile icon={Wallet} label="Total Amount" value={inr(t.totalAmount)} sub="Course fees (before GST)" tone="navy" />
            <SummaryTile icon={Percent} label={`GST @ ${gstPct}%`} value={inr(t.gst)} sub="Tax on course fees" tone="violet" />
            <SummaryTile icon={Receipt} label="Total incl. GST" value={inr(t.totalWithGst)} sub="Amount + GST" tone="emerald" />
            <SummaryTile
              icon={Award}
              label="Certificate Royalty"
              value={inr(t.royalty)}
              sub={`+ ${inr(t.royaltyGst)} GST = ${inr(t.royalty + t.royaltyGst)}`}
              tone="gold"
            />
          </div>

          {rows.length === 0 ? (
            <p className="px-4 pb-8 pt-4 text-center text-sm text-muted-foreground">
              {query ? "No course matches your search." : "No students are assigned to a course yet."}
            </p>
          ) : (
            <div className="overflow-x-auto border-t border-border/60">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Course</th>
                    <th className="px-3 py-2.5 text-right">Students</th>
                    <th className="px-3 py-2.5 text-right">Fee / Student</th>
                    <th className="px-3 py-2.5 text-right">Total Amount</th>
                    <th className="px-3 py-2.5 text-right">GST {gstPct}%</th>
                    <th className="px-3 py-2.5 text-right">Total + GST</th>
                    <th className="px-4 py-2.5 text-right">Certificate Royalty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {visible.map((r) => (
                    <tr key={r.courseId} className="transition-colors hover:bg-[#1E4A85]/[0.03]">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E4A85]/10 text-[#1E4A85]">
                            <BookOpen className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[260px] truncate font-semibold text-foreground" title={r.courseName}>
                              {r.courseName}
                            </p>
                            {r.category && <p className="truncate text-[11px] text-muted-foreground">{r.category}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold tabular-nums text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          {r.students}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{inr(r.feePerStudent)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{inr(r.totalAmount)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-violet-700 dark:text-violet-400">{inr(r.gst)}</td>
                      <td className="px-3 py-2.5 text-right font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {inr(r.totalWithGst)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <p className="font-bold tabular-nums text-[#9A7A1E] dark:text-[#E8C46A]">{inr(r.royalty)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {r.royaltyPerStudent != null
                            ? `${inr(r.royaltyPerStudent)} × ${r.students}`
                            : r.royaltyMissing > 0
                              ? `Not set for ${r.royaltyMissing} student${r.royaltyMissing > 1 ? "s" : ""}`
                              : "Varies by plan"}
                          {r.royalty > 0 ? ` · +${inr(r.royaltyGst)} GST` : ""}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#1E4A85]/30 bg-[#1E4A85]/[0.06] font-bold">
                    <td className="px-4 py-2.5 text-xs uppercase tracking-wider text-[#1E4A85] dark:text-[#8EB6E8]">
                      Total{query ? " (all courses)" : ""}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{t.students}</td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-right tabular-nums">{inr(t.totalAmount)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-violet-700 dark:text-violet-400">{inr(t.gst)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-400">{inr(t.totalWithGst)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#9A7A1E] dark:text-[#E8C46A]">{inr(t.royalty)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {!query && rows.length > PREVIEW_ROWS && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="flex w-full items-center justify-center gap-1 border-t border-border/60 py-2 text-xs font-semibold text-[#1E4A85] hover:bg-muted/40 dark:text-[#8EB6E8]"
            >
              {showAll ? "Show less" : `Show all ${rows.length} courses`}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
            </button>
          )}

          {t.royaltyMissing > 0 && (
            <p className="border-t border-border/60 bg-amber-50/60 px-4 py-2 text-[11px] text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
              Certificate royalty (exam fee by plan) is not set for {t.royaltyMissing} student
              {t.royaltyMissing > 1 ? "s" : ""}. Set it in Courses → Exam fee by plan.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  tone: "navy" | "violet" | "emerald" | "gold";
}) {
  const tones = {
    navy: "from-[#1E4A85]/10 to-[#1E4A85]/[0.02] border-[#1E4A85]/20 text-[#1E4A85] dark:text-[#8EB6E8]",
    violet: "from-[#124E96]/10 to-[#124E96]/[0.02] border-[#124E96]/20 text-[#124E96] dark:text-[#8EB6E8]",
    emerald: "from-[#159A70]/10 to-[#159A70]/[0.02] border-[#159A70]/25 text-[#159A70] dark:text-emerald-400",
    gold: "from-[#FF8500]/12 to-[#FF8500]/[0.03] border-[#FF8500]/30 text-[#E67600] dark:text-[#FFB45A]",
  };
  return (
    <div className={cn("rounded-xl border bg-gradient-to-br px-3.5 py-3", tones[tone])}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">{label}</p>
        <Icon className="h-4 w-4 opacity-80" />
      </div>
      <p className="mt-1 truncate text-xl font-extrabold tabular-nums text-foreground">{value}</p>
      <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
