"use client";

import Link from "next/link";
import {
  GraduationCap,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Building2,
  Award,
  HelpCircle,
  MessageSquare,
  Tag,
  ArrowRight,
  Activity,
  Users,
  ClipboardCheck,
  Clock3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card";
import { cn } from "@/lib/utils";
import DashboardStats, { type StatCardData } from "./DashboardStats";
import { ROLES } from "@/lib/permissions";
import { canRoleAccessPath } from "@/lib/role-menu-config";

type DashboardStats = {
  totalFranchises?: number;
  activeFranchises?: number;
  totalStudents: number;
  totalStaff?: number;
  totalRevenue: number;
  pendingFees?: number;
  pendingCertificates?: number;
  attendancePercent?: number;
  supportRequestsCount?: number;
  courseEnquiriesCount?: number;
  franchiseInquiriesCount?: number;
  offerApplicationsCount?: number;
  totalAttendanceToday?: number;
};

type Payment = {
  id: string;
  studentName: string;
  amount: string;
  date: string;
};

type SupportRequest = {
  id: string;
  fullName: string;
  email: string;
  message: string;
};

type DashboardOverviewProps = {
  stats: DashboardStats;
  roleId: number;
  recentPayments: Payment[];
  attendanceStats: Record<string, number>;
  recentSupportRequests?: SupportRequest[];
  onCardClick: (card: StatCardData) => void;
};

export default function DashboardOverview({
  stats,
  roleId,
  recentPayments,
  attendanceStats,
  recentSupportRequests,
  onCardClick,
}: DashboardOverviewProps) {
  const isAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;
  const pendingTotal = (stats.pendingFees ?? 0) + (stats.pendingCertificates ?? 0);
  const leadTotal =
    (stats.courseEnquiriesCount ?? 0) +
    (stats.franchiseInquiriesCount ?? 0) +
    (stats.offerApplicationsCount ?? 0);

  const attendanceEntries = Object.entries(attendanceStats).filter(([, v]) => v > 0);
  const totalMarked = attendanceEntries.reduce((s, [, v]) => s + v, 0);

  const quickActions = [
    { label: "Add Student", href: "/students?add=1", icon: GraduationCap, show: canRoleAccessPath(roleId, "/students") },
    { label: "Add Franchise", href: "/franchises/new", icon: Building2, show: canRoleAccessPath(roleId, "/franchises") },
    { label: "Certificates", href: "/certificates/requests", icon: Award, show: canRoleAccessPath(roleId, "/certificates") },
    { label: "Reports", href: "/reports", icon: Activity, show: canRoleAccessPath(roleId, "/reports") },
    { label: "Support", href: "/dashboard/support", icon: HelpCircle, show: isAdmin },
    { label: "Enquiries", href: "/dashboard/enquiries", icon: MessageSquare, show: isAdmin },
  ].filter((a) => a.show);

  return (
    <div className="flex flex-col gap-3">
      {/* Alert */}
      {pendingTotal > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Action required</p>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
              {stats.pendingFees ?? 0} pending fee records · {stats.pendingCertificates ?? 0} certificate approvals waiting
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onCardClick({
                type: "pending_fees",
                title: "Pending Fees",
                value: String(stats.pendingFees ?? 0),
                change: "Students with balance",
                description: "Pending",
                color: "",
                bgColor: "",
                accent: "pending_fees",
                show: true,
                icon: IndianRupee,
              })
            }
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Review now
          </button>
        </div>
      )}

      {/* Hero KPIs — full width */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HeroKpi label="Students" value={(stats.totalStudents ?? 0).toLocaleString()} sub="Total enrolled" icon={GraduationCap} tone="green" onClick={() => onCardClick(buildCard("students", stats))} />
        <HeroKpi label="Revenue" value={`₹${Number(stats.totalRevenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} sub="Last 30 days" icon={IndianRupee} tone="emerald" onClick={() => onCardClick(buildCard("revenue", stats))} />
        <HeroKpi label="Attendance" value={`${stats.attendancePercent ?? 0}%`} sub={`${stats.totalAttendanceToday ?? totalMarked} marked today`} icon={TrendingUp} tone="blue" onClick={() => onCardClick(buildCard("attendance", stats))} />
        <HeroKpi label="Pending" value={String(pendingTotal)} sub="Fees + certificates" icon={AlertTriangle} tone="amber" onClick={() => onCardClick(buildCard("pending_fees", stats))} />
      </div>

      {/* Quick Actions — compact single row, full width */}
      {quickActions.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card px-2 py-3 text-center shadow-sm transition-all hover:border-[#1E4A85]/40 hover:bg-[#1E4A85]/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E4A85]/10 transition-colors group-hover:bg-[#1E4A85]">
                <action.icon className="h-4 w-4 text-[#1E4A85] transition-colors group-hover:text-white" />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-foreground">{action.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Institute Metrics — full width */}
      <div>
        <SectionHeader title="Institute Metrics" subtitle="Click any card for full details" />
        <div className="mt-2">
          <DashboardStats stats={stats} roleId={roleId} onCardClick={onCardClick} />
        </div>
      </div>

      {/* Bottom row — equal height cards */}
      <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
        {/* Recent Payments */}
        <Card className="flex h-full flex-col rounded-xl border border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/50 bg-muted/30 !px-4 !py-2.5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 !p-0">
            {recentPayments.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No payments yet</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {recentPayments.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-muted/30">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.studentName}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="h-3 w-3" />
                        {new Date(p.date).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{Number(p.amount).toLocaleString("en-IN")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <TodayAttendanceCard
          stats={stats}
          attendanceStats={attendanceStats}
          totalMarked={totalMarked}
        />

        {/* Leads + Support */}
        <Card className="flex h-full flex-col rounded-xl border border-border/70 shadow-sm md:col-span-2 xl:col-span-1">
          <CardHeader className="border-b border-border/50 bg-[#1E4A85]/5 !px-4 !py-2.5">
            <CardTitle className="text-sm font-semibold text-[#1E4A85] dark:text-[#8EB6E8]">
              Leads &amp; Support
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col !p-3">
            {isAdmin && leadTotal > 0 && (
              <div className="mb-3 space-y-1.5">
                <LeadRow icon={MessageSquare} label="Course Enquiries" count={stats.courseEnquiriesCount ?? 0} href="/dashboard/enquiries" />
                <LeadRow icon={Building2} label="Franchise Inquiries" count={stats.franchiseInquiriesCount ?? 0} href="/dashboard/franchise-inquiries" />
                <LeadRow icon={Tag} label="Offer Applications" count={stats.offerApplicationsCount ?? 0} href="/dashboard/offer-applications" />
              </div>
            )}
            {isAdmin && (stats.supportRequestsCount ?? 0) > 0 && recentSupportRequests ? (
              <div className={leadTotal > 0 ? "border-t border-border/50 pt-3" : ""}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-semibold">
                    <HelpCircle className="h-3.5 w-3.5" />
                    Support ({stats.supportRequestsCount})
                  </p>
                  <Link href="/dashboard/support" className="text-[11px] font-medium text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <ul className="space-y-2">
                  {recentSupportRequests.slice(0, 3).map((r) => (
                    <li key={r.id} className="rounded-lg border border-border/50 px-3 py-2">
                      <p className="text-sm font-medium">{r.fullName}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{r.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              !leadTotal && (
                <p className="py-4 text-center text-sm text-muted-foreground">No leads or support requests</p>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function TodayAttendanceCard({
  stats,
  attendanceStats,
  totalMarked,
}: {
  stats: DashboardStats;
  attendanceStats: Record<string, number>;
  totalMarked: number;
}) {
  const percent = stats.attendancePercent ?? 0;
  const markedToday = stats.totalAttendanceToday ?? totalMarked;

  const statusConfig: Record<string, { label: string; color: string; bar: string }> = {
    PRESENT: { label: "Present", color: "text-emerald-600", bar: "bg-emerald-500" },
    ABSENT: { label: "Absent", color: "text-red-600", bar: "bg-red-500" },
    LATE: { label: "Late", color: "text-amber-600", bar: "bg-amber-500" },
    LEAVE: { label: "On Leave", color: "text-blue-600", bar: "bg-blue-500" },
  };

  const statusRows = ["PRESENT", "ABSENT", "LATE", "LEAVE"].map((key) => {
    const matched = Object.entries(attendanceStats).find(([k]) => k.toUpperCase() === key);
    return { key, count: matched?.[1] ?? 0, ...statusConfig[key] };
  });

  const maxCount = Math.max(markedToday, ...statusRows.map((r) => r.count), 1);

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-xl border border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/30 !px-4 !py-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-[#1E4A85]" />
            Today&apos;s Attendance
          </CardTitle>
          <span className="rounded-full bg-[#1E4A85]/10 px-2 py-0.5 text-[10px] font-semibold text-[#1E4A85]">
            {markedToday} marked
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col !p-4">
        {/* Ring + headline */}
        <div className="flex flex-col items-center text-center">
          <AttendanceRing percent={percent} size="lg" />
          <p className="mt-2 text-sm font-semibold text-foreground">
            {percent}% attendance rate
          </p>
          <p className="text-xs text-muted-foreground">
            {markedToday === 0 ? "No entries marked yet today" : `${markedToday} students marked today`}
          </p>
        </div>

        {/* Status breakdown bars */}
        <div className="mt-4 space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Status Breakdown
          </p>
          {statusRows.map((row) => (
            <div key={row.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className={cn("font-medium", row.color)}>{row.label}</span>
                <span className="font-bold tabular-nums">{row.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", row.bar)}
                  style={{ width: `${Math.max((row.count / maxCount) * 100, row.count > 0 ? 8 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Institute snapshot — fills bottom */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
          <InstituteStatTile icon={GraduationCap} label="Students" value={String(stats.totalStudents ?? 0)} tint="emerald" />
          <InstituteStatTile icon={ClipboardCheck} label="Marked" value={String(markedToday)} tint="blue" />
          <InstituteStatTile icon={Building2} label="Franchises" value={String(stats.totalFranchises ?? "—")} tint="indigo" />
          <InstituteStatTile icon={Users} label="Staff" value={String(stats.totalStaff ?? "—")} tint="purple" />
        </div>
      </CardContent>
    </Card>
  );
}

function InstituteStatTile({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tint: "emerald" | "blue" | "indigo" | "purple";
}) {
  const tints = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  };

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tints[tint])}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-base font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function HeroKpi({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  tone: "green" | "emerald" | "blue" | "amber";
  onClick?: () => void;
}) {
  const tones = {
    green: "from-emerald-500/10 to-emerald-500/5 border-emerald-200/60 text-emerald-700 dark:border-emerald-800/40 dark:text-emerald-400",
    emerald: "from-teal-500/10 to-teal-500/5 border-teal-200/60 text-teal-700 dark:border-teal-800/40 dark:text-teal-400",
    blue: "from-blue-500/10 to-blue-500/5 border-blue-200/60 text-blue-700 dark:border-blue-800/40 dark:text-blue-400",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-200/60 text-amber-700 dark:border-amber-800/40 dark:text-amber-400",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-gradient-to-br p-3.5 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5",
        tones[tone]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/60">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </button>
  );
}

function AttendanceRing({ percent, size = "md" }: { percent: number; size?: "md" | "lg" }) {
  const r = size === "lg" ? 40 : 32;
  const dim = size === "lg" ? 104 : 88;
  const stroke = size === "lg" ? 8 : 7;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  const center = dim / 2;

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: dim, height: dim }}>
      <svg className="-rotate-90" width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#1E4A85"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className={cn("font-bold", size === "lg" ? "text-xl" : "text-base")}>{percent}%</p>
        <p className="text-[8px] uppercase tracking-wide text-muted-foreground">Present</p>
      </div>
    </div>
  );
}

function LeadRow({ icon: Icon, label, count, href }: { icon: React.ElementType; label: string; count: number; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 transition-colors hover:border-[#1E4A85]/30 hover:bg-muted/40">
      <span className="flex items-center gap-2 text-xs font-medium">
        <Icon className="h-3.5 w-3.5 text-[#1E4A85]" />
        {label}
      </span>
      <span className="flex items-center gap-1 text-xs font-bold text-[#1E4A85] dark:text-[#8EB6E8]">
        {count}
        <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}

function buildCard(type: StatDetailType, stats: DashboardStats): StatCardData {
  const map: Record<string, Partial<StatCardData>> = {
    students: { title: "Total Students", value: String(stats.totalStudents), change: "Enrolled", icon: GraduationCap },
    revenue: { title: "Total Revenue", value: `₹${Number(stats.totalRevenue).toLocaleString("en-IN")}`, change: "Last 30 days", icon: IndianRupee },
    attendance: { title: "Attendance %", value: `${stats.attendancePercent ?? 0}%`, change: "Today", icon: TrendingUp },
    pending_fees: { title: "Pending Fees", value: String(stats.pendingFees ?? 0), change: "Students with balance", icon: IndianRupee },
  };
  const base = map[type] ?? map.students!;
  return {
    type: type as StatDetailType,
    title: base.title!,
    value: base.value!,
    change: base.change!,
    description: "",
    color: "",
    bgColor: "",
    accent: type,
    show: true,
    icon: base.icon!,
  };
}

type StatDetailType = StatCardData["type"];
