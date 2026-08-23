"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Loader2,
  RefreshCw,
  Activity,
  TrendingUp,
  IndianRupee,
  GraduationCap,
  ClipboardCheck,
  Building2,
} from "lucide-react";
import DashboardAnalytics from "@/components/adminpanel/dashboard/DashboardAnalytics";
import DashboardActivity from "@/components/adminpanel/dashboard/DashboardActivity";
import FranchiseFilterDropdown from "@/components/dashboard/FranchiseFilterDropdown";
import type { ReportFiltersState } from "@/components/adminpanel/dashboard/DashboardReportToolbar";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

type ReportTab = "analytics" | "activity";

const REPORT_TABS: { id: ReportTab; label: string; icon: typeof BarChart3 }[] = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "activity", label: "Activity Feed", icon: Activity },
];

interface DashboardStats {
  totalFranchises: number;
  activeFranchises: number;
  totalStudents: number;
  totalRevenue: number;
  pendingFees: number;
  attendancePercent: number;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const roleId = user?.roleId ?? 0;
  const isSuperAdminOrAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const [franchiseFilter, setFranchiseFilter] = useState("");
  const [activeTab, setActiveTab] = useState<ReportTab>("analytics");
  const [reportFilters, setReportFilters] = useState<ReportFiltersState>({
    range: "30d",
    from: "",
    to: "",
    status: "ALL",
  });

  const dashboardUrl = franchiseFilter
    ? `/api/dashboard?franchiseId=${franchiseFilter}`
    : "/api/dashboard";

  const { data: franchisesData } = useSWR(
    isSuperAdminOrAdmin ? "/api/franchises?limit=100" : null,
    fetcher
  );

  const { data: dashData, isLoading: dashLoading, mutate } = useSWR<{
    stats: DashboardStats;
  }>(dashboardUrl, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const franchises = Array.isArray(franchisesData)
    ? franchisesData
    : ((franchisesData as { data?: { id: string; name: string }[] } | null)?.data ?? []);

  const stats = dashData?.stats ?? {
    totalFranchises: 0,
    activeFranchises: 0,
    totalStudents: 0,
    totalRevenue: 0,
    pendingFees: 0,
    attendancePercent: 0,
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white/80">Reports</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Analytics & Reports
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E8D5A3]">
                <TrendingUp className="h-3 w-3" />
                Insights
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-white/60 sm:text-sm">
              Revenue, attendance, leads & payments — filter by period and export Excel/PDF
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isSuperAdminOrAdmin && franchises.length > 0 && (
              <FranchiseFilterDropdown
                value={franchiseFilter}
                onChange={setFranchiseFilter}
                options={franchises.map((f: { id: string; name: string }) => ({
                  id: f.id,
                  name: f.name,
                }))}
                variant="dark"
              />
            )}
            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", dashLoading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick stats strip */}
        <div className="border-t border-white/10 bg-black/10 px-5 py-3 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatPill
              icon={IndianRupee}
              label="Revenue (30d)"
              value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
              loading={dashLoading && !dashData}
            />
            <StatPill
              icon={GraduationCap}
              label="Students"
              value={String(stats.totalStudents)}
              loading={dashLoading && !dashData}
            />
            <StatPill
              icon={Building2}
              label="Franchises"
              value={`${stats.activeFranchises}/${stats.totalFranchises}`}
              loading={dashLoading && !dashData}
            />
            <StatPill
              icon={IndianRupee}
              label="Pending fees"
              value={String(stats.pendingFees)}
              loading={dashLoading && !dashData}
            />
            <StatPill
              icon={ClipboardCheck}
              label="Attendance"
              value={`${stats.attendancePercent}%`}
              loading={dashLoading && !dashData}
            />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="inline-flex w-full flex-wrap gap-1 rounded-xl border border-[#1E4A85]/12 bg-card p-1 shadow-sm sm:w-auto">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition sm:flex-none",
                active
                  ? "bg-[#1E4A85] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-[#1E4A85]"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", active && "text-[#C4A35A]")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "analytics" && (
          <motion.div
            key="analytics"
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
            key="activity"
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
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C4A35A]/20 text-[#E8D5A3]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[9px] font-semibold uppercase tracking-wider text-white/50">
          {label}
        </p>
        {loading ? (
          <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-white/70" />
        ) : (
          <p className="truncate text-sm font-bold tabular-nums">{value}</p>
        )}
      </div>
    </div>
  );
}
