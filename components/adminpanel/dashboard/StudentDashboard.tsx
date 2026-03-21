"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card";
import {
  Building2,
  BookOpen,
  IndianRupee,
  CheckCircle2,
  ClipboardCheck,
  Award,
  ArrowRight,
  Wallet,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StudentDashboardData {
  studentDashboard: true;
  profile: {
    fullName: string;
    email: string;
  } | null;
  message?: string;
  franchise?: { name: string };
  course?: {
    name: string;
    durationMonths: number;
    admissionDate: string;
    status: string;
  };
  fees?: {
    totalFee: number;
    paidFee: number;
    pendingFee: number;
    percentPaid: number;
  };
  attendance?: {
    totalDays: number;
    presentDays: number;
    attendancePercent: number;
  };
  certificate?: {
    status: string;
    certificateNumber: string;
    issueDate: string | null;
  } | null;
  recentPayments?: { id: string; amount: string; status: string; date: string }[];
}

interface StudentDashboardProps {
  data: StudentDashboardData;
}

export default function StudentDashboard({ data }: StudentDashboardProps) {
  if (!data.profile) {
    return (
      <Card className="rounded-xl shadow-lg">
        <CardContent className="py-12 text-center text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{data.message ?? "Student record not found. Please contact your franchise."}</p>
        </CardContent>
      </Card>
    );
  }

  const { profile, franchise = { name: "—" }, course = { name: "—", durationMonths: 0, admissionDate: "", status: "—" }, fees = { totalFee: 0, paidFee: 0, pendingFee: 0, percentPaid: 0 }, attendance = { totalDays: 0, presentDays: 0, attendancePercent: 0 }, certificate = null, recentPayments = [] } = data;

  return (
    <div className="space-y-6">
      {/* Welcome & Profile */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 p-6">
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {profile.fullName}
        </h2>
        <p className="text-muted-foreground mt-1">{profile.email}</p>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="w-4 h-4" />
            {franchise.name}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            {course.name}
          </span>
        </div>
      </div>

      {/* Stats Grid - Student's own data only */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Fee</p>
                <p className="text-2xl font-bold mt-1">₹{fees.totalFee.toLocaleString("en-IN")}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold mt-1 text-green-600">₹{fees.paidFee.toLocaleString("en-IN")}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">₹{fees.pendingFee.toLocaleString("en-IN")}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                <p className="text-2xl font-bold mt-1">{attendance.attendancePercent}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {attendance.presentDays} / {attendance.totalDays} days
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course & Franchise Details Card */}
      <Card variant="elevated" className="rounded-xl shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            My Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Franchise</p>
              <p className="font-medium">{franchise.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Course</p>
              <p className="font-medium">{course.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{course.durationMonths} months</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admission Date</p>
              <p className="font-medium">{course.admissionDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span className={cn(
                "inline-flex px-2 py-1 rounded-full text-sm font-medium",
                course.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"
              )}>
                {course.status}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Fee Progress</p>
            <div className="w-full bg-muted rounded-lg h-3 overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${fees.percentPaid}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{fees.percentPaid}% paid (₹{fees.paidFee.toLocaleString("en-IN")} / ₹{fees.totalFee.toLocaleString("en-IN")})</p>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Status */}
      <Card variant="elevated" className="rounded-xl shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Certificate
            </CardTitle>
            <Link
              href="/certificate"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              View details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {certificate ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Award className="w-10 h-10 text-primary shrink-0" />
              <div>
                <p className="font-medium">{certificate.certificateNumber}</p>
                <p className="text-sm text-muted-foreground">Status: {certificate.status}</p>
                {certificate.issueDate && (
                  <p className="text-xs text-muted-foreground mt-1">Issued: {certificate.issueDate}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No certificate yet. It will appear here once issued.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments (Student's own) */}
      {recentPayments.length > 0 && (
        <Card variant="elevated" className="rounded-xl shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>My Recent Payments</CardTitle>
              <Link
                href="/my-fees"
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium">₹{Number(p.amount).toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.date ? new Date(p.date).toLocaleDateString("en-IN") : "—"}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium",
                    p.status === "SUCCESS" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-800"
                  )}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card variant="elevated" className="rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/my-course"
              className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl hover:bg-accent hover:shadow-md transition-all"
            >
              <BookOpen className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium text-center">My Course</span>
            </Link>
            <Link
              href="/my-fees"
              className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl hover:bg-accent hover:shadow-md transition-all"
            >
              <IndianRupee className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium text-center">My Fees</span>
            </Link>
            <Link
              href="/attendance"
              className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl hover:bg-accent hover:shadow-md transition-all"
            >
              <ClipboardCheck className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium text-center">Attendance</span>
            </Link>
            <Link
              href="/feedback"
              className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl hover:bg-accent hover:shadow-md transition-all"
            >
              <span className="text-2xl">💬</span>
              <span className="text-sm font-medium text-center">Feedback</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
