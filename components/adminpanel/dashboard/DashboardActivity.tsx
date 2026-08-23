"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  HelpCircle,
  Mail,
  IndianRupee,
  Clock3,
  CheckCircle2,
  Loader2,
  Search,
  MessageSquare,
  GraduationCap,
  Building2,
  Award,
  Tag,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import DashboardReportToolbar, {
  reportQueryKey,
  type ReportFiltersState,
} from "./DashboardReportToolbar";

type ActivityItem = {
  id: string;
  type: "payment" | "support" | "enquiry" | "franchise_inquiry" | "offer" | "student" | "certificate";
  title: string;
  subtitle: string;
  meta?: string;
  amount?: number;
  status?: string;
  at: string;
  href?: string;
};

type ReportPayload = {
  meta?: { rangeLabel: string; franchiseLabel: string };
  totals: {
    revenue: number;
    paymentCount: number;
    supportCount: number;
    courseEnquiries: number;
    franchiseInquiries: number;
    offerApplications: number;
    leadTotal: number;
    pendingFees: number;
    pendingCertificates: number;
    studentsJoined: number;
    certificatesInRange: number;
    activityCount: number;
    totalStudents: number;
  };
  payments: {
    id: string;
    studentName: string;
    franchiseName: string;
    amount: number;
    status: string;
    date: string;
  }[];
  supportRequests: {
    id: string;
    fullName: string;
    email: string;
    message: string;
    createdAt: string;
  }[];
  enquiryList?: { id: string; fullName: string; courseName: string; email: string; createdAt: string }[];
  franchiseInquiryList?: { id: string; fullName: string; email: string; city: string | null; createdAt: string }[];
  activityFeed?: ActivityItem[];
};

type Props = {
  filters: ReportFiltersState;
  onFiltersChange: (f: ReportFiltersState) => void;
  franchiseId: string;
  isAdmin?: boolean;
};

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "payment", label: "Payments" },
  { id: "student", label: "Students" },
  { id: "enquiry", label: "Enquiries" },
  { id: "franchise_inquiry", label: "Franchise" },
  { id: "offer", label: "Offers" },
  { id: "support", label: "Support" },
  { id: "certificate", label: "Certificates" },
] as const;

export default function DashboardActivity({
  filters,
  onFiltersChange,
  franchiseId,
  isAdmin = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const url = reportQueryKey(filters, franchiseId, "activity");
  const { data, error, isLoading } = useSWR<ReportPayload>(url, fetcher, {
    keepPreviousData: true,
    dedupingInterval: 2000,
  });

  const feed = useMemo(() => {
    let list = data?.activityFeed || [];
    if (typeFilter !== "all") {
      list = list.filter((i) => i.type === typeFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.subtitle.toLowerCase().includes(q) ||
          (i.meta || "").toLowerCase().includes(q) ||
          (i.status || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, search, typeFilter]);

  const paymentTotal = (data?.payments || []).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-3">
      <DashboardReportToolbar
        tab="activity"
        filters={filters}
        onChange={onFiltersChange}
        franchiseId={franchiseId}
      />

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#1E4A85]" />
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Failed to load activity.</p>
      ) : data ? (
        <>
          {data.meta && (
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{data.meta.rangeLabel}</span>
              {" · "}
              {data.meta.franchiseLabel}
              {" · "}
              <span className="font-semibold">{data.totals.activityCount}</span> activity items
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <StatChip label="Payments" value={String(data.totals.paymentCount)} hint={`₹${Math.round(data.totals.revenue).toLocaleString("en-IN")}`} />
            <StatChip label="New Students" value={String(data.totals.studentsJoined)} hint={`${data.totals.totalStudents} total`} />
            <StatChip label="Leads" value={String(data.totals.leadTotal)} hint="Enquiries + offers" />
            <StatChip label="Support" value={String(data.totals.supportCount)} hint="In selected range" />
            <StatChip label="Certificates" value={String(data.totals.certificatesInRange)} hint={`${data.totals.pendingCertificates} pending`} />
            <StatChip label="Pending Fees" value={String(data.totals.pendingFees)} hint="Students due" />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, franchise, email, message..."
                className="h-10 w-full rounded-xl border border-border/70 bg-card py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-[#1E4A85]/40"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                    typeFilter === t.id
                      ? "bg-[#1E4A85] text-white"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-12">
            {/* Unified timeline */}
            <div className="space-y-2 lg:col-span-7">
              <div className="flex items-center justify-between">
                <SectionLabel title="Activity Timeline" count={feed.length} />
                <span className="text-xs font-semibold text-emerald-600">
                  Payments ₹{paymentTotal.toLocaleString("en-IN")}
                </span>
              </div>
              <Card className="overflow-hidden rounded-xl border border-border/70 shadow-sm">
                <CardContent className="!p-0">
                  {feed.length === 0 ? (
                    <EmptyState message="No activity for these filters. Try All Time or 12 Months." />
                  ) : (
                    <ul className="max-h-[560px] divide-y divide-border/50 overflow-y-auto">
                      {feed.map((item) => (
                        <li key={item.id}>
                          <ActivityRow item={item} />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right panels */}
            <div className="space-y-3 lg:col-span-5">
              {isAdmin && (
                <Card className="rounded-xl border border-[#1E4A85]/15 shadow-sm">
                  <CardHeader className="border-b border-border/50 bg-[#1E4A85]/5 !px-4 !py-2.5">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[#1E4A85]">
                      <MessageSquare className="h-4 w-4" />
                      Lead Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="!p-3 space-y-1.5">
                    <LeadLine label="Course Enquiries" count={data.totals.courseEnquiries} href="/dashboard/enquiries" />
                    <LeadLine label="Franchise Inquiries" count={data.totals.franchiseInquiries} href="/dashboard/franchise-inquiries" />
                    <LeadLine label="Offer Applications" count={data.totals.offerApplications} href="/dashboard/offer-applications" />
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-xl border border-border/70 shadow-sm">
                <CardHeader className="!flex-row !items-center !justify-between border-b border-border/50 bg-muted/30 !px-4 !py-2.5">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <IndianRupee className="h-4 w-4 text-emerald-600" />
                    Recent Payments
                  </CardTitle>
                  <span className="text-[10px] font-semibold text-muted-foreground">{data.payments.length}</span>
                </CardHeader>
                <CardContent className="!p-0">
                  {data.payments.length === 0 ? (
                    <EmptyState message="No payments in range." />
                  ) : (
                    <ul className="max-h-[220px] divide-y divide-border/50 overflow-y-auto">
                      {data.payments.slice(0, 8).map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{p.studentName}</p>
                            <p className="truncate text-muted-foreground">{p.franchiseName}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-bold text-emerald-600">₹{p.amount.toLocaleString("en-IN")}</p>
                            <StatusBadge status={p.status} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {isAdmin && (
                <Card className="overflow-hidden rounded-xl border border-border/70 shadow-sm">
                  <CardHeader className="!flex-row !items-center !justify-between border-b border-border/50 bg-muted/30 !px-4 !py-2.5">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <HelpCircle className="h-4 w-4" />
                      Support ({data.totals.supportCount})
                    </CardTitle>
                    <Link href="/dashboard/support" className="text-xs font-medium text-[#1E4A85] hover:underline">
                      View all →
                    </Link>
                  </CardHeader>
                  <CardContent className="!p-0">
                    {data.supportRequests.length === 0 ? (
                      <EmptyState message="No support requests in range." />
                    ) : (
                      <ul className="max-h-[200px] divide-y divide-border/50 overflow-y-auto">
                        {data.supportRequests.slice(0, 5).map((request) => (
                          <li key={request.id} className="px-4 py-3">
                            <div className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1E4A85]/10">
                                <Mail className="h-3.5 w-3.5 text-[#1E4A85]" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold">{request.fullName}</p>
                                <p className="line-clamp-2 text-xs text-muted-foreground">{request.message}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = iconFor(item.type);
  const tone = toneFor(item.type);
  const content = (
    <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
      <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tone.bg)}>
        <Icon className={cn("h-4 w-4", tone.icon)} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
            {item.meta && <p className="truncate text-[11px] text-muted-foreground">{item.meta}</p>}
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock3 className="h-3 w-3" />
              {new Date(item.at).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {typeof item.amount === "number" && (
              <p className="text-sm font-bold text-emerald-600">₹{item.amount.toLocaleString("en-IN")}</p>
            )}
            {item.status && <StatusBadge status={item.status} />}
            {item.href && <ArrowRight className="ml-auto mt-1 h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        </div>
      </div>
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

function iconFor(type: ActivityItem["type"]) {
  switch (type) {
    case "payment":
      return IndianRupee;
    case "support":
      return HelpCircle;
    case "enquiry":
      return MessageSquare;
    case "franchise_inquiry":
      return Building2;
    case "offer":
      return Tag;
    case "student":
      return GraduationCap;
    case "certificate":
      return Award;
    default:
      return Activity;
  }
}

function toneFor(type: ActivityItem["type"]) {
  switch (type) {
    case "payment":
      return { bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: "text-emerald-700 dark:text-emerald-400" };
    case "support":
      return { bg: "bg-cyan-100 dark:bg-cyan-900/30", icon: "text-cyan-700" };
    case "enquiry":
      return { bg: "bg-violet-100 dark:bg-violet-900/30", icon: "text-violet-700" };
    case "franchise_inquiry":
      return { bg: "bg-sky-100 dark:bg-sky-900/30", icon: "text-sky-700" };
    case "offer":
      return { bg: "bg-rose-100 dark:bg-rose-900/30", icon: "text-rose-700" };
    case "student":
      return { bg: "bg-blue-100 dark:bg-blue-900/30", icon: "text-blue-700" };
    case "certificate":
      return { bg: "bg-amber-100 dark:bg-amber-900/30", icon: "text-amber-700" };
    default:
      return { bg: "bg-muted", icon: "text-foreground" };
  }
}

function StatChip({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
      {hint && <p className="truncate text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionLabel({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-sm font-bold">{title}</h2>
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{count}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const ok =
    normalized.includes("success") ||
    normalized.includes("active") ||
    normalized.includes("issued") ||
    normalized.includes("approved");
  return (
    <span
      className={cn(
        "mt-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
        ok
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      )}
    >
      {ok && <CheckCircle2 className="h-2.5 w-2.5" />}
      {status}
    </span>
  );
}

function LeadLine({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-xs hover:border-[#1E4A85]/30 hover:bg-muted/40"
    >
      <span className="font-medium">{label}</span>
      <span className="font-bold text-[#1E4A85]">{count} →</span>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{message}</p>;
}
