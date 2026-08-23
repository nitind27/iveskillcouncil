"use client";

import { Card, CardContent } from "@/components/common/Card";
import {
  Building2,
  GraduationCap,
  Users,
  IndianRupee,
  Award,
  TrendingUp,
  HelpCircle,
  MessageSquare,
  Tag,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StatDetailType =
  | "students"
  | "revenue"
  | "pending_fees"
  | "attendance"
  | "franchises"
  | "staff"
  | "pending_certificates"
  | "support"
  | "course_enquiries"
  | "franchise_inquiries"
  | "offer_applications"
  | "attendance_today";

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
  onCardClick?: (card: StatCardData) => void;
}

export type StatCardData = {
  type: StatDetailType;
  title: string;
  value: string;
  change: string;
  description: string;
  color: string;
  bgColor: string;
  accent: string;
  show: boolean;
  icon: React.ElementType;
};

const CARD_STYLES: Record<string, { accent: string; iconBg: string; iconColor: string }> = {
  students: { accent: "border-l-emerald-500", iconBg: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-600" },
  revenue: { accent: "border-l-teal-500", iconBg: "bg-teal-100 dark:bg-teal-900/30", iconColor: "text-teal-600" },
  pending_fees: { accent: "border-l-amber-500", iconBg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600" },
  attendance: { accent: "border-l-blue-500", iconBg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600" },
  franchises: { accent: "border-l-indigo-500", iconBg: "bg-indigo-100 dark:bg-indigo-900/30", iconColor: "text-indigo-600" },
  staff: { accent: "border-l-purple-500", iconBg: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-600" },
  pending_certificates: { accent: "border-l-orange-500", iconBg: "bg-orange-100 dark:bg-orange-900/30", iconColor: "text-orange-600" },
  support: { accent: "border-l-cyan-500", iconBg: "bg-cyan-100 dark:bg-cyan-900/30", iconColor: "text-cyan-600" },
  course_enquiries: { accent: "border-l-violet-500", iconBg: "bg-violet-100 dark:bg-violet-900/30", iconColor: "text-violet-600" },
  franchise_inquiries: { accent: "border-l-sky-500", iconBg: "bg-sky-100 dark:bg-sky-900/30", iconColor: "text-sky-600" },
  offer_applications: { accent: "border-l-rose-500", iconBg: "bg-rose-100 dark:bg-rose-900/30", iconColor: "text-rose-600" },
  attendance_today: { accent: "border-l-[#1E4A85]", iconBg: "bg-[#1E4A85]/10", iconColor: "text-[#1E4A85]" },
};

export default function DashboardStats({ stats, roleId, onCardClick }: DashboardStatsProps) {
  const revenueFormatted = `₹${Number(stats.totalRevenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const allCards: StatCardData[] = [
    { type: "students", title: "Total Students", value: (stats.totalStudents ?? 0).toLocaleString(), change: "Enrolled students", icon: GraduationCap, description: "Students", color: "", bgColor: "", accent: "students", show: true },
    { type: "revenue", title: "Total Revenue", value: revenueFormatted, change: "Last 30 days", icon: IndianRupee, description: "Revenue", color: "", bgColor: "", accent: "revenue", show: true },
    { type: "pending_fees", title: "Pending Fees", value: (stats.pendingFees ?? 0).toString(), change: "With balance due", icon: IndianRupee, description: "Pending", color: "", bgColor: "", accent: "pending_fees", show: true },
    { type: "attendance", title: "Attendance %", value: `${stats.attendancePercent ?? 0}%`, change: "Today's rate", icon: TrendingUp, description: "Present", color: "", bgColor: "", accent: "attendance", show: true },
    { type: "franchises", title: "Franchises", value: (stats.totalFranchises ?? 0).toString(), change: `${stats.activeFranchises ?? 0} active`, icon: Building2, description: "Locations", color: "", bgColor: "", accent: "franchises", show: roleId === 1 || roleId === 2 },
    { type: "staff", title: "Staff", value: (stats.totalStaff ?? 0).toLocaleString(), change: "Team members", icon: Users, description: "Team", color: "", bgColor: "", accent: "staff", show: roleId === 1 || roleId === 2 || roleId === 3 },
    { type: "pending_certificates", title: "Certificates", value: (stats.pendingCertificates ?? 0).toString(), change: "Awaiting approval", icon: Award, description: "Certificates", color: "", bgColor: "", accent: "pending_certificates", show: roleId === 1 || roleId === 2 || roleId === 3 },
    { type: "support", title: "Support", value: (stats.supportRequestsCount ?? 0).toString(), change: "Open requests", icon: HelpCircle, description: "Support", color: "", bgColor: "", accent: "support", show: roleId === 1 || roleId === 2 },
    { type: "course_enquiries", title: "Course Enquiries", value: (stats.courseEnquiriesCount ?? 0).toString(), change: "New leads", icon: MessageSquare, description: "Enquiries", color: "", bgColor: "", accent: "course_enquiries", show: roleId === 1 || roleId === 2 },
    { type: "franchise_inquiries", title: "Franchise Leads", value: (stats.franchiseInquiriesCount ?? 0).toString(), change: "Expansion leads", icon: Building2, description: "Inquiries", color: "", bgColor: "", accent: "franchise_inquiries", show: roleId === 1 || roleId === 2 },
    { type: "offer_applications", title: "Offer Apps", value: (stats.offerApplicationsCount ?? 0).toString(), change: "Campaign signups", icon: Tag, description: "Applications", color: "", bgColor: "", accent: "offer_applications", show: roleId === 1 || roleId === 2 },
    { type: "attendance_today", title: "Marked Today", value: (stats.totalAttendanceToday ?? 0).toString(), change: "Attendance entries", icon: ClipboardCheck, description: "Today", color: "", bgColor: "", accent: "attendance_today", show: roleId === 1 || roleId === 2 },
  ];

  const statCards = allCards.filter((c) => c.show);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {statCards.map((stat) => {
        const style = CARD_STYLES[stat.type] ?? CARD_STYLES.students;
        return (
          <Card
            key={stat.type}
            variant="elevated"
            clickable={Boolean(onCardClick)}
            onClick={() => onCardClick?.(stat)}
            className={cn(
              "group cursor-pointer overflow-hidden rounded-xl border border-border/60 border-l-4 bg-card shadow-sm transition-all duration-200 hover:border-[#1E4A85]/30 hover:shadow-md",
              style.accent
            )}
          >
            <CardContent className="!px-3.5 !py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 truncate text-xl font-bold tracking-tight">{stat.value}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{stat.change}</p>
                </div>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", style.iconBg)}>
                  <stat.icon className={cn("h-4 w-4", style.iconColor)} />
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
