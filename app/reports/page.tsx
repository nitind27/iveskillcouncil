"use client";

import { useMemo } from "react";
import useSWR from "swr";
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
} from "recharts";
import { Breadcrumb } from "@/components/common";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { BarChart3, Loader2, IndianRupee, GraduationCap, ClipboardCheck } from "lucide-react";
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

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ReportsPage() {
  const { data, error, isLoading } = useSWR<DashboardData>("/api/dashboard", fetcher, {
    revalidateOnFocus: true,
  });

  const barData = useMemo(() => {
    const payments = data?.recentPayments ?? [];
    return payments.slice(0, 8).map((p) => ({
      name: p.studentName.length > 10 ? p.studentName.slice(0, 10) + "…" : p.studentName,
      amount: Number(p.amount) || 0,
    }));
  }, [data?.recentPayments]);

  const pieData = useMemo(() => {
    const stats = data?.attendanceStats ?? {};
    const entries = Object.entries(stats).filter(([, v]) => v > 0);
    if (entries.length === 0) return [{ name: "No data", value: 1, color: "#94a3b8" }];
    return entries.map(([name, value], i) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [data?.attendanceStats]);

  const stats = data?.stats ?? {
    totalFranchises: 0,
    activeFranchises: 0,
    totalStudents: 0,
    totalStaff: 0,
    totalRevenue: 0,
    pendingFees: 0,
    pendingCertificates: 0,
    attendancePercent: 0,
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1">Overview of key metrics and performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue (30d)</p>
                <p className="text-xl font-bold">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Fees</p>
                <p className="text-xl font-bold">{stats.pendingFees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance %</p>
                <p className="text-xl font-bold">{stats.attendancePercent}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Amount"]} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Today&apos;s Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
