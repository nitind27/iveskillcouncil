"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { ClipboardCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceStats {
  PRESENT?: number;
  ABSENT?: number;
  LATE?: number;
}

interface AttendanceOverviewProps {
  stats: AttendanceStats;
}

export default function AttendanceOverview({ stats }: AttendanceOverviewProps) {
  const total = (stats.PRESENT || 0) + (stats.ABSENT || 0) + (stats.LATE || 0);
  const presentCount = stats.PRESENT || 0;
  const absentCount = stats.ABSENT || 0;
  const lateCount = stats.LATE || 0;
  const presentPercentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  const attendanceItems = [
    { label: "Present", count: presentCount, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30", icon: CheckCircle2 },
    { label: "Absent", count: absentCount, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30", icon: XCircle },
    { label: "Late", count: lateCount, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30", icon: Clock },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No attendance recorded today</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Attendance Rate</span>
                <span className="text-2xl font-bold">{presentPercentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${presentPercentage}%` }} />
              </div>
            </div>
            <div className="space-y-3">
              {attendanceItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", item.bgColor)}>
                      <item.icon className={cn("w-5 h-5", item.color)} />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{item.count}</span>
                    {total > 0 && <span className="text-xs text-muted-foreground">({Math.round((item.count / total) * 100)}%)</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold">{total}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
