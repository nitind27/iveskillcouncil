"use client";

import React from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Loader2, Mail, MessageSquare } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface EnquiryRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  courseName: string;
  message: string | null;
  address: string | null;
  pincode: string | null;
  area: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
}

interface ApiResponse {
  enquiries: EnquiryRow[];
}

export default function CourseEnquiriesPage() {
  const { data, error, isLoading } = useSWR<ApiResponse>(
    "/api/course-enquiries",
    fetcher,
    { revalidateOnFocus: true }
  );

  const enquiries = data?.enquiries ?? [];
  const errorMsg =
    (error as { status?: number })?.status === 401
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to load enquiries";

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

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          Course Enquiries
        </h1>
        <p className="text-muted-foreground mt-1">
          Enquire Now submissions from the user panel. Also sent to admin email via SMTP.
        </p>
      </div>

      <Card className="rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Enquiries ({enquiries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enquiries.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No course enquiries yet.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold">Date</th>
                    <th className="text-left py-3 px-2 font-semibold">Name</th>
                    <th className="text-left py-3 px-2 font-semibold">Email</th>
                    <th className="text-left py-3 px-2 font-semibold">Phone</th>
                    <th className="text-left py-3 px-2 font-semibold">Address / Pincode</th>
                    <th className="text-left py-3 px-2 font-semibold">Course(s)</th>
                    <th className="text-left py-3 px-2 font-semibold">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((row) => (
                    <tr key={row.id} className="border-b border-border/70 hover:bg-muted/50">
                      <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 font-medium">{row.fullName}</td>
                      <td className="py-3 px-2">
                        <a
                          href={`mailto:${row.email}`}
                          className="text-primary hover:underline"
                        >
                          {row.email}
                        </a>
                      </td>
                      <td className="py-3 px-2">{row.phone}</td>
                      <td className="py-3 px-2 text-muted-foreground max-w-[200px]">
                        {[row.address, [row.area, row.city, row.state].filter(Boolean).join(", "), row.pincode].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="py-3 px-2">{row.courseName}</td>
                      <td className="py-3 px-2 text-muted-foreground max-w-xs truncate">
                        {row.message || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
