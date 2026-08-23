"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/common/GlassModal";
import { Loader2, Award, Users, User } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  fullName: string;
  email: string;
  courseName: string;
  courseId?: string;
  franchiseName: string;
}

interface Course {
  id: string;
  name: string;
}

interface CreateCertificateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCertificateModal({ open, onClose, onSuccess }: CreateCertificateModalProps) {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const isFranchise = roleId === ROLES.SUB_ADMIN;

  const [mode, setMode] = useState<"single" | "batch">("batch");
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");

  useEffect(() => {
    if (!open) return;
    setStudentId("");
    setCourseId("");
    setMode(isFranchise ? "batch" : "single");
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isFranchise]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        fetch("/api/students?limit=500", { credentials: "include" }),
        fetch(isFranchise ? "/api/students/franchise-courses" : "/api/courses?limit=200", {
          credentials: "include",
        }),
      ]);

      const studentsJson = await studentsRes.json();
      const coursesJson = await coursesRes.json();

      const rawStudents = studentsJson?.data ?? studentsJson;
      const list = rawStudents?.items ?? rawStudents;
      setStudents(Array.isArray(list) ? list : []);

      const rawCourses = coursesJson?.data ?? coursesJson;
      const courseList = Array.isArray(rawCourses) ? rawCourses : (rawCourses?.items ?? []);
      setCourses(
        courseList.map((c: { id: string; name: string; courseName?: string }) => ({
          id: c.id,
          name: c.name ?? c.courseName ?? "Course",
        }))
      );
    } catch {
      setStudents([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "batch") {
      if (!courseId) {
        await showError("Validation", "Select a course / batch");
        return;
      }
    } else if (!studentId) {
      await showError("Validation", "Select a student");
      return;
    }

    setSubmitting(true);
    try {
      const body = mode === "batch" ? { courseId } : { studentId };
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        await showError("Error", data.error || "Failed to create certificate request");
        return;
      }

      const payload = data.data ?? data;
      const msg =
        mode === "batch"
          ? `Batch request sent: ${payload.created ?? 0} created, ${payload.skipped ?? 0} already requested`
          : "Certificate request sent to institute admin";

      await showSuccess("Success", msg);
      onClose();
      onSuccess?.();
    } catch {
      await showError("Error", "Failed to create certificate request");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";
  const labelClass = "block text-sm font-medium text-foreground mb-1";

  const batchStudentCount = courseId
    ? students.filter((s) => (s.courseId ?? "") === courseId || s.courseName === courses.find((c) => c.id === courseId)?.name).length
    : 0;

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title="Request Certificate"
      size="lg"
      closeOnOverlayClick={!submitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isFranchise && (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Request goes to institute admin. You cannot print certificates — hard copies will be sent by
            the institute after approval.
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("batch")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition",
              mode === "batch"
                ? "border-[#1E4A85] bg-[#1E4A85]/10 text-[#1E4A85]"
                : "border-border hover:bg-muted/50"
            )}
          >
            <Users className="h-4 w-4" />
            Whole batch (course)
          </button>
          <button
            type="button"
            onClick={() => setMode("single")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition",
              mode === "single"
                ? "border-[#1E4A85] bg-[#1E4A85]/10 text-[#1E4A85]"
                : "border-border hover:bg-muted/50"
            )}
          >
            <User className="h-4 w-4" />
            Single student
          </button>
        </div>

        {mode === "batch" ? (
          <div>
            <label className={labelClass}>Course / Batch *</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={inputClass}
              required
              disabled={loading}
            >
              <option value="">{loading ? "Loading courses…" : "Select course / batch"}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {courseId && (
              <p className="mt-1 text-xs text-muted-foreground">
                ~{batchStudentCount} student(s) in this batch will be requested (skips already requested)
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className={labelClass}>Student *</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={inputClass}
              required
              disabled={loading}
            >
              <option value="">{loading ? "Loading students…" : "Select student"}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} – {s.courseName} ({s.franchiseName})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            Send Request
          </button>
        </div>
      </form>
    </GlassModal>
  );
}
