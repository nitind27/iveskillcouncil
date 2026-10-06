"use client";

import { useState } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { BookOpen, Loader2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface CourseItem {
  id: string;
  courseName: string;
  courseDescription: string | null;
  durationMonths: number;
  totalFee: number;
}

interface CourseData {
  courseName: string;
  courseDescription: string | null;
  durationMonths: number;
  courses?: CourseItem[];
  franchiseName: string;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  admissionDate: string;
  status: string;
}

export default function MyCoursePage() {
  const { data, error, isLoading } = useSWR<CourseData>("/api/students/me", fetcher, {
    revalidateOnFocus: true,
  });

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

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No course enrollment found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div>
        <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
        <p className="text-muted-foreground mt-1">
          {data.franchiseName} · {data.courses?.length || 1} course{(data.courses?.length || 1) === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid gap-4">
        {(data.courses?.length
          ? data.courses
          : [
              {
                id: "primary",
                courseName: data.courseName,
                courseDescription: data.courseDescription,
                durationMonths: data.durationMonths,
                totalFee: data.totalFee,
              },
            ]
        ).map((course) => (
          <Card key={course.id} className="rounded-xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{course.courseName}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{data.franchiseName}</p>
                  {course.courseDescription && (
                    <p className="mt-3 text-sm text-foreground/90">{course.courseDescription}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-4">
                    <span className="text-sm">
                      <span className="text-muted-foreground">Duration:</span> {course.durationMonths} months
                    </span>
                    <span className="text-sm">
                      <span className="text-muted-foreground">Course fee:</span> ₹
                      {Number(course.totalFee).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-6 text-sm">
          <div className="flex flex-wrap gap-6">
            <span>
              <span className="text-muted-foreground">Admission:</span> {data.admissionDate}
            </span>
            <span>
              <span className="text-muted-foreground">Total fee:</span> ₹{data.totalFee.toLocaleString("en-IN")}
            </span>
            <span>
              <span className="text-muted-foreground">Paid:</span> ₹{data.paidFee.toLocaleString("en-IN")}
            </span>
            <span>
              <span className="text-muted-foreground">Pending:</span> ₹{data.pendingFee.toLocaleString("en-IN")}
            </span>
            <span>
              <span className="text-muted-foreground">Status:</span>{" "}
              <span className="font-medium">{data.status}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
