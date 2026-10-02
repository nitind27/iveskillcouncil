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

const NAVY = { accent: "border-l-[#124E96]", iconBg: "bg-[#124E96]/10", iconColor: "text-[#124E96]" };
const SAFFRON = { accent: "border-l-[#FF8500]", iconBg: "bg-[#FF8500]/12", iconColor: "text-[#E67600]" };
const EMERALD = { accent: "border-l-[#159A70]", iconBg: "bg-[#159A70]/10", iconColor: "text-[#159A70]" };
const CARD_STYLES: Record<string, { accent: string; iconBg: string; iconColor: string }> = {
  students: NAVY,
  revenue: EMERALD,
  pending_fees: SAFFRON,
  attendance: EMERALD,
  franchises: NAVY,
  staff: NAVY,
  pending_certificates: SAFFRON,
  support: EMERALD,
  course_enquiries: NAVY,
  franchise_inquiries: NAVY,
  offer_applications: SAFFRON,
  attendance_today: EMERALD,
};

export default function DashboardStats({ stats, roleId, onCardClick }: DashboardStatsProps) {
  const allCards: StatCardData[] = [
    { type: "students", title: "Total Students", value: (stats.totalStudents ?? 0).toLocaleString(), change: "Enrolled students", icon: GraduationCap, description: "Students", color: "", bgColor: "", accent: "students", show: true },
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
              "group cursor-pointer overflow-hidden rounded-2xl border border-[#E3E9F2] border-l-[3px] bg-white shadow-[0_8px_24px_-16px_rgba(6,27,54,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-18px_rgba(18,78,150,0.35)]",
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
