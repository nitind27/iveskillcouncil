"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardContent } from "@/components/common/Card";
import {
  Sparkles,
  BarChart3,
  Clock3,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import type { StatCardData } from "@/components/adminpanel/dashboard/DashboardStats";
import DashboardOverview from "@/components/adminpanel/dashboard/DashboardOverview";
import DashboardAnalytics from "@/components/adminpanel/dashboard/DashboardAnalytics";
import DashboardActivity from "@/components/adminpanel/dashboard/DashboardActivity";
import StatDetailModal from "@/components/adminpanel/dashboard/StatDetailModal";
import FranchiseFilterDropdown from "@/components/dashboard/FranchiseFilterDropdown";
import StudentDashboard from "@/components/adminpanel/dashboard/StudentDashboard";
import type { ReportFiltersState } from "@/components/adminpanel/dashboard/DashboardReportToolbar";
import DashboardReportToolbar from "@/components/adminpanel/dashboard/DashboardReportToolbar";
import StudentReportPanel from "@/components/adminpanel/dashboard/StudentReportPanel";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { ROLES } from "@/lib/permissions";
import { fetcher } from "@/lib/fetcher";
import { SectionLoader } from "@/components/common/PageLoader";

interface DashboardData {
  stats: {
    totalFranchises: number;
    activeFranchises: number;
    totalStudents: number;
    totalStaff: number;
    pendingFees: number;
    pendingCertificates: number;
    attendancePercent: number;
    supportRequestsCount?: number;
    courseEnquiriesCount?: number;
    franchiseInquiriesCount?: number;
    offerApplicationsCount?: number;
    totalAttendanceToday?: number;
  };
  recentPayments: { id: string; studentName: string; amount: string; status: string; date: string }[];
  attendanceStats: Record<string, number>;
  recentSupportRequests?: { id: string; fullName: string; email: string; message: string; createdAt: string }[];
}

type DashboardTab = "overview" | "analytics" | "activity";

const DASHBOARD_TABS: { id: DashboardTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "activity", label: "Activity", icon: Clock3 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const roleId = user?.roleId ?? 0;
  const [franchiseFilter, setFranchiseFilter] = useState("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [selectedCard, setSelectedCard] = useState<StatCardData | null>(null);
  const [reportFilters, setReportFilters] = useState<ReportFiltersState>({
    range: "all",
    from: "",
    to: "",
    status: "ALL",
  });
  const dashboardUrl = franchiseFilter ? `/api/dashboard?franchiseId=${franchiseFilter}` : "/api/dashboard";
  const { data: franchisesData } = useSWR(
    (roleId === 1 || roleId === 2) ? "/api/franchises?limit=100" : null,
    fetcher
  );
  const franchises = Array.isArray(franchisesData)
    ? franchisesData
    : ((franchisesData as { data?: unknown[]; franchises?: unknown[] } | null)?.data ??
       (franchisesData as { data?: unknown[]; franchises?: unknown[] } | null)?.franchises ??
       []);
  const { data, error, isLoading } = useSWR<DashboardData>(dashboardUrl, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 3000,
    keepPreviousData: true,
  });

  const errorMsg = error
    ? (error as { status?: number }).status === 401
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to load dashboard"
    : null;

  if (isLoading && !data) {
    return <SectionLoader text="Loading dashboard..." />;
  }

  if (errorMsg && !data) {
    return (
      <div className="space-y-4">
        <Card className="rounded-xl">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {errorMsg}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // STUDENT: show only their own personal dashboard
  if ((data as { studentDashboard?: boolean }).studentDashboard) {
    return (
      <div className="space-y-4">
        <StudentDashboard data={data as unknown as Parameters<typeof StudentDashboard>[0]["data"]} />
      </div>
    );
  }

  const { stats, recentPayments, attendanceStats, recentSupportRequests } = data;
  const isSuperAdminOrAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  return (
    <div className="space-y-4 pb-2">
      {/* Compact top bar: greeting + clock + filter */}
      <DashboardWelcomePanel
        userName={user?.fullName}
        roleName={user?.roleName}
        franchiseFilter={
          (roleId === 1 || roleId === 2) && franchises.length > 0 ? (
            <FranchiseFilterDropdown
              value={franchiseFilter}
              onChange={setFranchiseFilter}
              options={franchises.map((f: { id: string; name: string }) => ({
                id: f.id,
                name: f.name,
              }))}
              variant="light"
            />
          ) : null
        }
      />

      {/* Slim tabs */}
      <div className="inline-flex w-full flex-wrap items-center gap-1 rounded-xl border border-[#D7E3F4] bg-white p-1 shadow-sm sm:w-auto">
        {DASHBOARD_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                isActive
                  ? "bg-[#061B36] text-white shadow-sm"
                  : "text-[#5B6B82] hover:bg-[#F4F7FB] hover:text-[#061B36]",
              ].join(" ")}
            >
              <Icon className={isActive ? "h-3.5 w-3.5 text-[#FF8500]" : "h-3.5 w-3.5"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            <DashboardReportToolbar
              tab="overview"
              filters={reportFilters}
              onChange={setReportFilters}
              franchiseId={franchiseFilter}
            />
            <DashboardOverview
              stats={stats}
              roleId={roleId}
              recentPayments={recentPayments}
              attendanceStats={attendanceStats}
              recentSupportRequests={recentSupportRequests}
              onCardClick={setSelectedCard}
              franchiseId={franchiseFilter}
            />
            {(isSuperAdminOrAdmin || roleId === ROLES.SUB_ADMIN) && (
              <StudentReportPanel franchiseId={franchiseFilter || undefined} />
            )}
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div
            key="analytics-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <DashboardAnalytics
              filters={reportFilters}
              onFiltersChange={setReportFilters}
              franchiseId={franchiseFilter}
            />
          </motion.div>
        )}

        {activeTab === "activity" && (
          <motion.div
            key="activity-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <DashboardActivity
              filters={reportFilters}
              onFiltersChange={setReportFilters}
              franchiseId={franchiseFilter}
              isAdmin={isSuperAdminOrAdmin}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <StatDetailModal
        card={selectedCard}
        franchiseFilter={franchiseFilter}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}

function DashboardWelcomePanel({
  userName,
  roleName,
  franchiseFilter,
}: {
  userName?: string;
  roleName?: string;
  franchiseFilter?: React.ReactNode;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => getTimeGreeting(now), [now]);
  const firstName = userName?.trim().split(/\s+/)[0] ?? "Admin";
  const GreetingIcon = greeting.icon;

  const timeText = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateText = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="relative z-10 overflow-visible rounded-2xl border border-[#D7E3F4] bg-gradient-to-r from-white via-[#F4F8FE] to-[#EAF2FC] text-[#061B36] shadow-[0_10px_30px_-18px_rgba(6,27,54,0.35)]">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-40 [background:radial-gradient(circle_at_80%_20%,rgba(255,133,0,0.18),transparent_42%),radial-gradient(circle_at_100%_80%,rgba(21,154,112,0.16),transparent_40%)]" />
      <div className="relative flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="min-w-0 flex items-center gap-3">
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${greeting.iconBg}`}>
            <GreetingIcon className={`h-5 w-5 ${greeting.iconColor}`} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold leading-tight tracking-tight sm:text-xl [font-family:var(--font-jakarta)]">
              {greeting.label}, <span className="text-[#FF8500]">{firstName}</span>
            </h1>
            <p className="truncate text-xs text-[#5B6B82]">
              {roleName || "Admin"} · {dateText}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {franchiseFilter}
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#D7E3F4] bg-white px-3 py-2 shadow-sm">
            <Clock3 className="h-3.5 w-3.5 text-[#124E96]" />
            <span className="font-mono text-sm font-semibold tabular-nums tracking-wide text-[#061B36]">{timeText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeGreeting(date: Date) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return {
      label: "Good Morning",
      icon: Sun,
      iconBg: "bg-[#FF8500]/12",
      iconColor: "text-[#E67600]",
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      label: "Good Afternoon",
      icon: Sun,
      iconBg: "bg-[#124E96]/10",
      iconColor: "text-[#124E96]",
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      label: "Good Evening",
      icon: Sunset,
      iconBg: "bg-[#FF8500]/12",
      iconColor: "text-[#E67600]",
    };
  }
  return {
    label: "Good Night",
    icon: Moon,
      iconBg: "bg-[#061B36]/8",
      iconColor: "text-[#061B36]",
  };
}
