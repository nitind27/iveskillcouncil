"use client";

import { useState } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { UserCheck, Loader2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface AssignedStudent {
  id: string;
  fullName: string;
  email: string;
  courseName: string;
}

export default function AssignedStudentsPage() {
  const { data, error, isLoading } = useSWR<{ items: AssignedStudent[] }>(
    "/api/staff/assigned-students",
    fetcher,
    { revalidateOnFocus: true }
  );

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Assigned Students</h1>
        <p className="text-muted-foreground mt-1">Students assigned to you</p>
      </div>

      <Card className="rounded-xl shadow-lg">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UserCheck className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-lg font-semibold mb-2">No assigned students</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Students assigned to you will appear here. Contact your admin if you expect to see assignments.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{s.fullName}</td>
                      <td className="py-3 px-4">{s.email}</td>
                      <td className="py-3 px-4">{s.courseName}</td>
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
