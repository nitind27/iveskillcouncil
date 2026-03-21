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
  HelpCircle,
  MessageSquare,
  Tag,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  stats: {
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
  roleId?: number;
}

export default function DashboardStats({ stats, roleId }: DashboardStatsProps) {
  const revenueFormatted = `₹${Number(stats.totalRevenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const baseCards = [
    {
      title: "Total Students",
      value: (stats.totalStudents ?? 0).toLocaleString(),
      change: "Enrolled",
      icon: GraduationCap,
      description: "Students",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      show: true,
    },
    {
      title: "Total Revenue",
      value: revenueFormatted,
      change: "Last 30 days",
      icon: IndianRupee,
      description: "Revenue",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      show: true,
    },
    {
      title: "Pending Fees",
      value: (stats.pendingFees ?? 0).toString(),
      change: "Students with balance",
      icon: IndianRupee,
      description: "Pending",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      show: true,
    },
    {
      title: "Attendance %",
      value: `${stats.attendancePercent ?? 0}%`,
      change: "Today",
      icon: TrendingUp,
      description: "Present",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      show: true,
    },
  ];
  const adminCards = [
    { title: "Total Franchises", value: (stats.totalFranchises ?? 0).toString(), change: `${stats.activeFranchises ?? 0} active`, icon: Building2, description: "Locations", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30", show: roleId === 1 || roleId === 2 },
    { title: "Total Staff", value: (stats.totalStaff ?? 0).toLocaleString(), change: "Staff members", icon: Users, description: "Team", color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30", show: roleId === 1 || roleId === 2 || roleId === 3 },
    { title: "Pending Certificates", value: (stats.pendingCertificates ?? 0).toString(), change: "Awaiting approval", icon: Award, description: "Certificates", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30", show: roleId === 1 || roleId === 2 || roleId === 3 },
    { title: "Support Requests", value: (stats.supportRequestsCount ?? 0).toString(), change: "From login/contact", icon: HelpCircle, description: "Support", color: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-100 dark:bg-cyan-900/30", show: roleId === 1 || roleId === 2 },
    { title: "Course Enquiries", value: (stats.courseEnquiriesCount ?? 0).toString(), change: "Enrollment requests", icon: MessageSquare, description: "Enquiries", color: "text-indigo-600 dark:text-indigo-400", bgColor: "bg-indigo-100 dark:bg-indigo-900/30", show: roleId === 1 || roleId === 2 },
    { title: "Franchise Inquiries", value: (stats.franchiseInquiriesCount ?? 0).toString(), change: "Franchise leads", icon: Building2, description: "Inquiries", color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-100 dark:bg-teal-900/30", show: roleId === 1 || roleId === 2 },
    { title: "Offer Applications", value: (stats.offerApplicationsCount ?? 0).toString(), change: "Offer signups", icon: Tag, description: "Applications", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30", show: roleId === 1 || roleId === 2 },
    { title: "Attendance Today", value: (stats.totalAttendanceToday ?? 0).toString(), change: "Total marked", icon: ClipboardCheck, description: "Today", color: "text-sky-600 dark:text-sky-400", bgColor: "bg-sky-100 dark:bg-sky-900/30", show: roleId === 1 || roleId === 2 },
  ];
  const statCards = [...baseCards, ...adminCards].filter((c) => c.show);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} variant="elevated" className="rounded-xl shadow-lg shadow-black/5 dark:shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">{stat.change}</span>
                  <span className="text-sm text-muted-foreground">{stat.description}</span>
                </div>
              </div>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bgColor)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
