"use client";

import { useMemo } from "react";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface DashboardChartsProps {
  recentPayments: { studentName: string; amount: string; date: string }[];
  attendanceStats: Record<string, number>;
}

export default function DashboardCharts({ recentPayments, attendanceStats }: DashboardChartsProps) {
  const barData = useMemo(() => {
    return recentPayments.slice(0, 5).map((p) => ({
      name: p.studentName.length > 12 ? p.studentName.slice(0, 12) + "…" : p.studentName,
      amount: Number(p.amount) || 0,
    }));
  }, [recentPayments]);

  const pieData = useMemo(() => {
    const entries = Object.entries(attendanceStats).filter(([, v]) => v > 0);
    if (entries.length === 0) return [{ name: "No data", value: 1, color: "#94a3b8" }];
    return entries.map(([name, value], i) => ({
      name: name.charAt(0) + name.slice(1).toLowerCase(),
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [attendanceStats]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card variant="elevated" className="rounded-xl shadow-lg shadow-black/5 dark:shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Amount"]} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card variant="elevated" className="rounded-xl shadow-lg shadow-black/5 dark:shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Today&apos;s Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [v, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
