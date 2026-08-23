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
import { motion } from "framer-motion";

const CHART_COLORS = ["#1E4A85", "#2A66B2", "#C4A35A", "#34C759", "#7C3AED"];

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
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.25 }}
      >
        <Card variant="elevated" className="rounded-xl border border-border/70 shadow-sm">
          <CardHeader className="!px-4 !pb-0 !pt-3">
            <CardTitle className="text-sm font-semibold">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="!px-4 !py-3">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Amount"]} />
                  <Bar
                    dataKey="amount"
                    fill="#1E4A85"
                    radius={[4, 4, 0, 0]}
                    name="Amount"
                    animationDuration={700}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.25, delay: 0.04 }}
      >
        <Card variant="elevated" className="rounded-xl border border-border/70 shadow-sm">
          <CardHeader className="!px-4 !pb-0 !pt-3">
            <CardTitle className="text-sm font-semibold">Today&apos;s Attendance</CardTitle>
          </CardHeader>
          <CardContent className="!px-4 !py-3">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    isAnimationActive
                    animationDuration={700}
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
      </motion.div>
    </div>
  );
}
