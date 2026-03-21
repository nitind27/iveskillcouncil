"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { ClipboardCheck, Loader2, Save, Filter } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";

interface StudentEntry {
  id: string;
  fullName: string;
  email: string;
  status: string | null;
}

interface AttendanceData {
  date: string;
  students: StudentEntry[];
  stats: Record<string, number>;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
}

export default function AttendanceManualPage() {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const showFranchiseFilter = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [franchiseId, setFranchiseId] = useState("");
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: franchisesData } = useSWR(
    showFranchiseFilter ? "/api/franchises?limit=100" : null,
    fetcher
  );
  const franchises = Array.isArray(franchisesData)
    ? franchisesData
    : ((franchisesData as { data?: unknown[]; franchises?: unknown[] } | null)?.data ??
       (franchisesData as { data?: unknown[]; franchises?: unknown[] } | null)?.franchises ??
       []);

  const attendanceUrl = `/api/attendance?date=${date}${franchiseId ? `&franchiseId=${franchiseId}` : ""}`;
  const { data, error, isLoading, mutate } = useSWR<AttendanceData>(
    attendanceUrl,
    fetcher,
    { revalidateOnFocus: true }
  );

  const students = data?.students ?? [];

  useEffect(() => {
    const map: Record<string, string> = {};
    students.forEach((s) => {
      map[s.id] = s.status ?? "";
    });
    setEntries(map);
  }, [students]);

  const handleStatusChange = (userId: string, status: string) => {
    setEntries((p) => ({ ...p, [userId]: status }));
  };

  const handleSave = async () => {
    const list = Object.entries(entries)
      .filter(([, v]) => ["PRESENT", "ABSENT", "LATE"].includes(v))
      .map(([userId, status]) => ({ userId, status: status as "PRESENT" | "ABSENT" | "LATE" }));

    if (list.length === 0) {
      await showError("Validation", "Mark at least one student");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date, entries: list }),
      });
      const d = await res.json();
      if (!res.ok) {
        await showError("Error", d.error || "Failed to save");
        return;
      }
      await showSuccess("Saved", "Attendance updated");
      mutate();
    } catch {
      await showError("Error", "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manual Attendance</h1>
          <p className="text-muted-foreground mt-1">Mark attendance for students</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {showFranchiseFilter && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={franchiseId}
                onChange={(e) => setFranchiseId(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm min-w-[160px]"
              >
                <option value="">All Franchises</option>
                {franchises.map((f: { id: string; name: string }) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      {data?.totalPresent !== undefined && (
        <div className="flex gap-4">
          <span className="text-sm">Present: <strong>{data.totalPresent}</strong></span>
          <span className="text-sm">Absent: <strong>{data.totalAbsent}</strong></span>
          <span className="text-sm">Late: <strong>{data.totalLate}</strong></span>
        </div>
      )}

      <Card className="rounded-xl shadow-lg">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No students in this franchise for the selected date.
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-3 px-4 rounded-lg border border-border hover:bg-muted/30"
                >
                  <div>
                    <p className="font-medium">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {(["PRESENT", "ABSENT", "LATE"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleStatusChange(s.id, opt)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          entries[s.id] === opt
                            ? opt === "PRESENT"
                              ? "bg-green-500 text-white"
                              : opt === "ABSENT"
                                ? "bg-red-500 text-white"
                                : "bg-amber-500 text-white"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
