"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassModal } from "@/components/common/GlassModal";
import { BookOpen, Hash, Loader2, Trash2 } from "lucide-react";
import { showDeleteConfirm, showError, showSuccess } from "@/lib/toast";

interface Course {
  id: string;
  name: string;
  baseFee: number;
}

interface Enrollment {
  id: string;
  courseId: string;
  courseName: string;
  totalFee: number;
  primary: boolean;
}

interface AssignCourseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  student: {
    id: string;
    studentCode: string;
    fullName: string;
    franchiseId?: string;
  } | null;
}

export function AssignCourseModal({
  open,
  onClose,
  onSuccess,
  student,
}: AssignCourseModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolled, setEnrolled] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [initialPayment, setInitialPayment] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");

  const load = async () => {
    if (!student) return;
    setLoading(true);
    const q = student.franchiseId
      ? `?franchiseId=${encodeURIComponent(student.franchiseId)}`
      : "";
    try {
      const [courseRes, enrolledRes] = await Promise.all([
        fetch(`/api/students/franchise-courses${q}`, { credentials: "include" }),
        fetch(`/api/students/${student.id}/assign-course`, { credentials: "include" }),
      ]);
      const courseJson = await courseRes.json();
      const enrolledJson = await enrolledRes.json();
      const items = courseJson?.data?.courses ?? courseJson?.data?.items ?? courseJson?.data ?? [];
      setCourses(Array.isArray(items) ? items : []);
      setEnrolled(Array.isArray(enrolledJson?.data?.enrollments) ? enrolledJson.data.enrollments : []);
    } catch {
      setCourses([]);
      setEnrolled([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !student) return;
    setSelected({});
    setInitialPayment("");
    setPaymentMode("CASH");
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student?.id]);

  const enrolledIds = useMemo(() => new Set(enrolled.map((row) => row.courseId)), [enrolled]);
  const available = courses.filter((course) => !enrolledIds.has(course.id));
  const picked = Object.entries(selected);

  const toggle = (course: Course) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[course.id] != null) delete next[course.id];
      else next[course.id] = String(course.baseFee);
      return next;
    });
  };

  const submit = async () => {
    if (!student) return;
    if (!picked.length) {
      await showError("Courses", "Tick at least one course to add");
      return;
    }
    if (picked.some(([, fee]) => fee === "" || Number(fee) < 0 || !Number.isFinite(Number(fee)))) {
      await showError("Fee", "Enter a valid fee for every selected course");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${student.id}/assign-course`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courses: picked.map(([courseId, totalFee]) => ({
            courseId,
            totalFee: Number(totalFee),
          })),
          initialPayment: initialPayment ? Number(initialPayment) : 0,
          paymentMode,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Error", json.error || "Failed");
        return;
      }
      const names = (json.data?.added || []).map((row: { courseName: string }) => row.courseName).join(", ");
      const bits = [`${student.fullName} added to ${names || "the selected courses"}`];
      if (json.data?.emailSent) bits.push("course details emailed");
      if (json.data?.receiptEmailSent) bits.push("fee receipt emailed");
      await showSuccess("Courses added", bits.join(" · "));
      onSuccess?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const removeCourse = async (row: Enrollment) => {
    if (!student) return;
    const ok = await showDeleteConfirm(
      "Remove course",
      `Remove ${row.courseName} from ${student.fullName}? Other courses stay.`
    );
    if (!ok.isConfirmed) return;
    const res = await fetch(
      `/api/students/${student.id}/assign-course?courseId=${encodeURIComponent(row.courseId)}`,
      { method: "DELETE", credentials: "include" }
    );
    const json = await res.json();
    if (!res.ok) {
      await showError("Error", json.error || "Failed to remove");
      return;
    }
    setEnrolled((prev) => prev.filter((item) => item.courseId !== row.courseId));
    onSuccess?.();
  };

  return (
    <GlassModal open={open} onClose={onClose} title="Student courses" size="md">
      {!student ? null : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#1E4A85]/12 bg-gradient-to-br from-[#1E4A85]/5 to-white p-4">
            <p className="text-lg font-bold text-[#1E4A85]">{student.fullName}</p>
            <p className="mt-1 inline-flex items-center gap-1 font-mono text-xs font-bold text-[#C4A35A]">
              <Hash className="h-3.5 w-3.5" />
              {student.studentCode}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#1E4A85]" />
            </div>
          ) : (
            <>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1E4A85]">
                  Already enrolled
                </p>
                {enrolled.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-xs text-muted-foreground">
                    No course yet. Add one or more below.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {enrolled.map((row) => (
                      <li
                        key={row.courseId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{row.courseName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Fee ₹{row.totalFee.toLocaleString("en-IN")}
                            {row.primary ? " · certificate course" : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCourse(row)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-[11px] font-bold text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#1E4A85]">
                  Add courses
                </p>
                {available.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Every franchise course is already added.
                  </p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {available.map((course) => {
                      const on = selected[course.id] != null;
                      return (
                        <li
                          key={course.id}
                          className={`rounded-xl border px-3 py-2 ${
                            on ? "border-[#1E4A85] bg-[#1E4A85]/5" : "border-slate-200"
                          }`}
                        >
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggle(course)}
                              className="h-4 w-4 accent-[#1E4A85]"
                            />
                            <span className="min-w-0 flex-1 text-sm font-medium">{course.name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              ₹{Number(course.baseFee).toLocaleString("en-IN")}
                            </span>
                          </label>
                          {on && (
                            <label className="mt-2 block text-[11px] font-semibold text-slate-600">
                              Fee for this course
                              <input
                                type="number"
                                min={0}
                                value={selected[course.id]}
                                onChange={(e) =>
                                  setSelected((prev) => ({ ...prev, [course.id]: e.target.value }))
                                }
                                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-normal"
                              />
                            </label>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {picked.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                      Initial payment (optional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={initialPayment}
                      onChange={(e) => setInitialPayment(e.target.value)}
                      className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank transfer</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={saving || loading || picked.length === 0}
                  onClick={submit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                  Add {picked.length || ""} course{picked.length === 1 ? "" : "s"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </GlassModal>
  );
}
