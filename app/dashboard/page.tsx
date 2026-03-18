"use client";

import React from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import {
  Building2,
  GraduationCap,
  Award,
  Activity,
  Loader2,
} from "lucide-react";
import DashboardStats from "@/components/adminpanel/dashboard/DashboardStats";
import { useAuth } from "@/contexts/AuthContext";

const DashboardCharts = dynamic(
  () => import("@/components/adminpanel/dashboard/DashboardCharts"),
  {
    ssr: false,
    loading: () => (
      <Card className="rounded-xl shadow-lg">
        <CardContent className="py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    ),
  }
);
import { ROLES } from "@/lib/permissions";
import { canRoleAccessPath } from "@/lib/role-menu-config";
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
  };
  recentPayments: { id: string; studentName: string; amount: string; status: string; date: string }[];
  attendanceStats: Record<string, number>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 3000,
    keepPreviousData: true,
  });

  const roleId = user?.roleId ?? 0;
  const showQuickActions = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const errorMsg = error
    ? (error as { status?: number }).status === 401
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to load dashboard"
    : null;

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card className="rounded-xl shadow-lg">
          <CardContent className="py-12 text-center text-muted-foreground">
            {errorMsg}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentPayments, attendanceStats } = data;

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <DashboardStats stats={stats} roleId={roleId} />

      <DashboardCharts recentPayments={recentPayments} attendanceStats={attendanceStats} />

      {showQuickActions && (
        <Card className="rounded-xl shadow-lg shadow-black/5 dark:shadow-none">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {canRoleAccessPath(roleId, "/franchises") && (
                <QuickActionButton label="Add Franchise" icon={Building2} href="/franchises/new" />
              )}
              {canRoleAccessPath(roleId, "/students") && (
                <QuickActionButton label="Add Student" icon={GraduationCap} href="/students/new" />
              )}
              {canRoleAccessPath(roleId, "/certificates") && (
                <QuickActionButton label="Certificates" icon={Award} href="/certificates/requests" />
              )}
              {canRoleAccessPath(roleId, "/reports") && (
                <QuickActionButton label="Reports" icon={Activity} href="/reports" />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuickActionButton({
  label,
  icon: Icon,
  href,
}: {
  label: string;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl hover:bg-accent hover:shadow-md transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
