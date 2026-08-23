"use client";

import { useMemo } from "react";
import useSWR from "swr";
import {
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  Users,
  Loader2,
  MessageSquare,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import DashboardReportToolbar, {
  reportQueryKey,
  type ReportFiltersState,
} from "./DashboardReportToolbar";

const COLORS = ["#1E4A85", "#C4A35A", "#34C759", "#EF4444", "#8B5CF6", "#06B6D4"];

type ReportPayload = {
  meta?: { rangeLabel: string; franchiseLabel: string };
  totals: {
    totalStudents: number;
    totalStaff: number;
    totalFranchises: number;
    activeFranchises: number;
    revenue: number;
    paymentCount: number;
    avgPayment: number;
    pendingFees: number;
    pendingCertificates: number;
    attendancePercent: number;
    attendanceTotal: number;
    supportCount: number;
    courseEnquiries: number;
    franchiseInquiries: number;
    offerApplications: number;
    leadTotal: number;
  };
  paymentsByStatus: { status: string; count: number; amount: number }[];
  studentsByStatus: { status: string; count: number }[];
  attendanceStats: Record<string, number>;
  monthlyRevenue: { month: string; amount: number }[];
  franchiseRevenue: { name: string; amount: number; count: number }[];
  payments: {
    id: string;
    studentName: string;
    franchiseName: string;
    amount: number;
    status: string;
    date: string;
  }[];
};

type Props = {
  filters: ReportFiltersState;
  onFiltersChange: (f: ReportFiltersState) => void;
  franchiseId: string;
};

export default function DashboardAnalytics({ filters, onFiltersChange, franchiseId }: Props) {
  const url = reportQueryKey(filters, franchiseId, "analytics");
  const { data, error, isLoading } = useSWR<ReportPayload>(url, fetcher, {
    keepPreviousData: true,
    dedupingInterval: 2000,
  });

  const pieData = useMemo(() => {
    if (!data?.paymentsByStatus?.length) return [{ name: "No data", value: 1, color: "#94a3b8" }];
    return data.paymentsByStatus.map((p, i) => ({
      name: p.status,
      value: p.count,
      color: COLORS[i % COLORS.length],
    }));
  }, [data]);

  const attendancePie = useMemo(() => {
    const entries = Object.entries(data?.attendanceStats || {}).filter(([, v]) => v > 0);
    if (!entries.length) return [{ name: "No data", value: 1, color: "#94a3b8" }];
    return entries.map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length],
    }));
  }, [data]);

  return (
    <div className="space-y-3">
      <DashboardReportToolbar
        tab="analytics"
        filters={filters}
        onChange={onFiltersChange}
        franchiseId={franchiseId}
      />

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#1E4A85]" />
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Failed to load analytics.</p>
      ) : data ? (
        <>
          {data.meta && (
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{data.meta.rangeLabel}</span>
              {" · "}
              {data.meta.franchiseLabel}
              {" · "}
              Payment status: <span className="font-semibold">{filters.status}</span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 xl:grid-cols-8">
            <Kpi label="Revenue" value={`₹${Math.round(data.totals.revenue).toLocaleString("en-IN")}`} icon={IndianRupee} tone="teal" />
            <Kpi label="Payments" value={String(data.totals.paymentCount)} icon={TrendingUp} tone="blue" />
            <Kpi label="Avg Pay" value={`₹${Math.round(data.totals.avgPayment).toLocaleString("en-IN")}`} icon={IndianRupee} tone="emerald" />
            <Kpi label="Students" value={String(data.totals.totalStudents)} icon={GraduationCap} tone="green" />
            <Kpi label="Staff" value={String(data.totals.totalStaff)} icon={Users} tone="blue" />
            <Kpi label="Attendance" value={`${data.totals.attendancePercent}%`} icon={TrendingUp} tone="teal" />
            <Kpi label="Pending" value={String(data.totals.pendingFees + data.totals.pendingCertificates)} icon={AlertTriangle} tone="amber" />
            <Kpi label="Leads" value={String(data.totals.leadTotal)} icon={MessageSquare} tone="violet" />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <ChartCard title="Monthly Revenue Trend">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v: number) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
                    <Line type="monotone" dataKey="amount" stroke="#1E4A85" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Payment Status Split">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={2}>
                      {pieData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Attendance Breakdown">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={attendancePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={78}>
                      {attendancePie.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Franchise Revenue (Top)">
              <div className="h-[240px]">
                {data.franchiseRevenue.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Select All Franchises to compare
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.franchiseRevenue.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
                      <Bar dataKey="amount" fill="#C4A35A" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <MiniTable
              title="Students by Status"
              rows={data.studentsByStatus.map((s) => [s.status, String(s.count)])}
            />
            <MiniTable
              title="Payment Status Totals"
              rows={data.paymentsByStatus.map((p) => [
                p.status,
                `${p.count} · ₹${Math.round(p.amount).toLocaleString("en-IN")}`,
              ])}
            />
            <MiniTable
              title="Quick Counts"
              rows={[
                ["Support", String(data.totals.supportCount)],
                ["Course Enquiries", String(data.totals.courseEnquiries)],
                ["Franchise Inquiries", String(data.totals.franchiseInquiries)],
                ["Offer Apps", String(data.totals.offerApplications)],
                ["Pending Fees", String(data.totals.pendingFees)],
                ["Certificates", String(data.totals.pendingCertificates)],
              ]}
            />
          </div>

          <Card className="rounded-xl border border-border/70 shadow-sm">
            <CardHeader className="!px-4 !py-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">
                Filtered Payments ({data.payments.length})
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Total ₹{data.payments.reduce((s, p) => s + p.amount, 0).toLocaleString("en-IN")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="!p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1E4A85] text-white">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Student</th>
                    <th className="px-3 py-2 font-semibold">Franchise</th>
                    <th className="px-3 py-2 font-semibold text-right">Amount</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                        No payments for selected filters
                      </td>
                    </tr>
                  ) : (
                    data.payments.slice(0, 25).map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2 whitespace-nowrap">{new Date(p.date).toLocaleDateString("en-IN")}</td>
                        <td className="px-3 py-2 font-medium">{p.studentName}</td>
                        <td className="px-3 py-2 text-muted-foreground">{p.franchiseName}</td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">{p.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: "teal" | "blue" | "amber" | "emerald" | "green" | "violet";
}) {
  const tones: Record<string, string> = {
    teal: "border-teal-200/70 from-teal-50/80",
    blue: "border-blue-200/70 from-blue-50/80",
    amber: "border-amber-200/70 from-amber-50/80",
    emerald: "border-emerald-200/70 from-emerald-50/80",
    green: "border-green-200/70 from-green-50/80",
    violet: "border-violet-200/70 from-violet-50/80",
  };
  return (
    <Card className={cn("rounded-xl border bg-gradient-to-br to-transparent shadow-sm", tones[tone])}>
      <CardContent className="!px-3 !py-2.5">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-0.5 truncate text-sm font-bold">{value}</p>
          </div>
          <Icon className="h-3.5 w-3.5 shrink-0 text-[#1E4A85]" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-xl border border-border/70 shadow-sm">
      <CardHeader className="!px-4 !py-2.5 border-b border-border/50">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="!p-3">{children}</CardContent>
    </Card>
  );
}

function MiniTable({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <Card className="rounded-xl border border-border/70 shadow-sm">
      <CardHeader className="!px-4 !py-2.5 border-b border-border/50">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="!p-0">
        <ul className="divide-y divide-border/50">
          {rows.map(([k, v]) => (
            <li key={k} className="flex items-center justify-between px-4 py-2 text-xs">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-semibold">{v}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
