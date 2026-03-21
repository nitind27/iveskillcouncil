"use client";

import { useState } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface AttendanceData {
  date: string;
  status: string | null;
  method: string | null;
}

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data, error, isLoading } = useSWR<AttendanceData>(
    `/api/attendance?date=${date}`,
    fetcher,
    { revalidateOnFocus: true }
  );

  const status = data?.status ?? null;

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div>
        <h1 className="text-3xl font-bold text-foreground">My Attendance</h1>
        <p className="text-muted-foreground mt-1">View your attendance record</p>
      </div>

      <Card className="rounded-xl shadow-lg max-w-md">
        <CardContent className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <ClipboardCheck className="w-10 h-10 text-primary" />
              <div>
                <p className="font-medium">
                  {status === "PRESENT"
                    ? "Present"
                    : status === "ABSENT"
                      ? "Absent"
                      : status === "LATE"
                        ? "Late"
                        : "Not marked"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {status ? `Attendance marked for ${date}` : "No attendance record for this date"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
