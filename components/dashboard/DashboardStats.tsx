"use client";

import { Card, CardContent } from "@/components/common/Card";
import {
  Building2,
  GraduationCap,
  Users,
  IndianRupee,
  Award,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  stats: {
    totalFranchises: number;
    activeFranchises: number;
    totalStudents: number;
    totalStaff: number;
    totalRevenue: number;
    pendingCertificates: number;
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Franchises",
      value: stats.totalFranchises.toString(),
      change: `${stats.activeFranchises} active`,
      trend: "up" as const,
      icon: Building2,
      description: "Franchise locations",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Total Students",
      value: stats.totalStudents.toLocaleString(),
      change: "+12.5%",
      trend: "up" as const,
      icon: GraduationCap,
      description: "Enrolled students",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Total Staff",
      value: stats.totalStaff.toLocaleString(),
      change: "+5.2%",
      trend: "up" as const,
      icon: Users,
      description: "Staff members",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Total Revenue",
      value: `₹${(stats.totalRevenue / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      change: "+20.1%",
      trend: "up" as const,
      icon: IndianRupee,
      description: "Last 30 days",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "Pending Certificates",
      value: stats.pendingCertificates.toString(),
      change: "Requires attention",
      trend: "up" as const,
      icon: Award,
      description: "Awaiting approval",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: "Growth Rate",
      value: "+15.3%",
      change: "+4.2%",
      trend: "up" as const,
      icon: TrendingUp,
      description: "vs last month",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} variant="elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {stat.change}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {stat.description}
                  </span>
                </div>
              </div>
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", stat.bgColor)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

