"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import Link from "next/link";
import {
  Building2,
  GraduationCap,
  Award,
  Activity,
  Loader2,
  HelpCircle,
  Mail,
} from "lucide-react";
import DashboardStats from "@/components/adminpanel/dashboard/DashboardStats";
import StudentDashboard from "@/components/adminpanel/dashboard/StudentDashboard";
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

export default function DashboardPage() {
  const { user } = useAuth();
  const roleId = user?.roleId ?? 0;
  const [franchiseFilter, setFranchiseFilter] = useState("");
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
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(dashboardUrl, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 3000,
    keepPreviousData: true,
  });

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

  // STUDENT: show only their own personal dashboard
  if ((data as { studentDashboard?: boolean }).studentDashboard) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <StudentDashboard data={data as unknown as Parameters<typeof StudentDashboard>[0]["data"]} />
      </div>
    );
  }

  const { stats, recentPayments, attendanceStats, recentSupportRequests } = data;
  const isSuperAdminOrAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  return (
    <div className="space-y-6">
      <Breadcrumb />

      {(roleId === 1 || roleId === 2) && franchises.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by Franchise:</span>
          <select
            value={franchiseFilter}
            onChange={(e) => setFranchiseFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[180px]"
          >
            <option value="">All Franchises (Full Analytics)</option>
            {franchises.map((f: { id: string; name: string }) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      )}

      <DashboardStats stats={stats} roleId={roleId} />

      <DashboardCharts recentPayments={recentPayments} attendanceStats={attendanceStats} />

      {isSuperAdminOrAdmin && (stats.supportRequestsCount ?? 0) > 0 && (
        <Card className="rounded-xl shadow-lg shadow-black/5 dark:shadow-none border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Support Requests ({stats.supportRequestsCount})
              </CardTitle>
              <Link
                href="/dashboard/support"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentSupportRequests && recentSupportRequests.length > 0 ? (
              <div className="space-y-3">
                {recentSupportRequests.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted"
                  >
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{r.fullName}</p>
                      <a href={`mailto:${r.email}`} className="text-sm text-primary hover:underline">
                        {r.email}
                      </a>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No support requests yet.</p>
            )}
          </CardContent>
        </Card>
      )}

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
                <QuickActionButton label="Add Student" icon={GraduationCap} href="/students?add=1" />
              )}
              {canRoleAccessPath(roleId, "/certificates") && (
                <QuickActionButton label="Certificates" icon={Award} href="/certificates/requests" />
              )}
              {isSuperAdminOrAdmin && (
                <QuickActionButton label="Support Requests" icon={HelpCircle} href="/dashboard/support" />
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
