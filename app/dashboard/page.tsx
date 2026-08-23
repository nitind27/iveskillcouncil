"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardContent } from "@/components/common/Card";
import {
  Loader2,
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
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { ROLES } from "@/lib/permissions";
import { fetcher } from "@/lib/fetcher";

interface DashboardData {
  stats: {
    totalFranchises: number;
    activeFranchises: number;
    totalStudents: number;
    totalStaff: number;
    totalRevenue: number;
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
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center rounded-xl border border-[#1E4A85]/15 bg-[#0B132B] px-4 py-12 text-white">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#C4A35A]" />
            <span className="text-sm font-medium">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
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
    <div className="space-y-3 pb-2">
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
              variant="dark"
            />
          ) : null
        }
      />

      {/* Slim tabs */}
      <div className="inline-flex w-full flex-wrap items-center gap-1 rounded-lg border border-border/70 bg-card p-1 sm:w-auto">
        {DASHBOARD_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                isActive
                  ? "bg-[#1E4A85] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              <Icon className={isActive ? "h-3.5 w-3.5 text-[#C4A35A]" : "h-3.5 w-3.5"} />
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
            />
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
    <div className="relative z-10 overflow-visible rounded-xl border border-[#1E4A85]/25 bg-gradient-to-r from-[#0B132B] via-[#163A6B] to-[#1E4A85] text-white shadow-md">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-40 [background:radial-gradient(circle_at_10%_20%,rgba(196,163,90,.18),transparent_40%)]" />
      <div className="relative flex flex-col gap-2.5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
        <div className="min-w-0 flex items-center gap-2.5">
          <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${greeting.iconBg}`}>
            <GreetingIcon className={`h-4 w-4 ${greeting.iconColor}`} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight sm:text-lg">
              {greeting.label}, <span className="text-[#C4A35A]">{firstName}</span>
            </h1>
            <p className="truncate text-[11px] text-white/65">
              {roleName || "Admin"} · {dateText}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {franchiseFilter}
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-2.5 py-1.5">
            <Clock3 className="h-3.5 w-3.5 text-[#C4A35A]" />
            <span className="font-mono text-sm font-semibold tabular-nums tracking-wide">{timeText}</span>
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
      iconBg: "bg-amber-400/20",
      iconColor: "text-amber-300",
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      label: "Good Afternoon",
      icon: Sun,
      iconBg: "bg-[#C4A35A]/25",
      iconColor: "text-[#E8D5A3]",
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      label: "Good Evening",
      icon: Sunset,
      iconBg: "bg-orange-400/20",
      iconColor: "text-orange-300",
    };
  }
  return {
    label: "Good Night",
    icon: Moon,
    iconBg: "bg-indigo-400/20",
    iconColor: "text-indigo-300",
  };
}
