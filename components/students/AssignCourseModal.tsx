"use client";

import { useEffect, useState } from "react";
import { GlassModal } from "@/components/common/GlassModal";
import { BookOpen, Hash, Loader2, Check } from "lucide-react";
import { showError, showSuccess } from "@/lib/toast";

interface Course {
  id: string;
  name: string;
  baseFee: number;
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [totalFee, setTotalFee] = useState("");
  const [initialPayment, setInitialPayment] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");

  useEffect(() => {
    if (!open || !student) return;
    setCourseId("");
    setTotalFee("");
    setInitialPayment("");
    setPaymentMode("CASH");
    setLoading(true);
    const q = student.franchiseId
      ? `?franchiseId=${encodeURIComponent(student.franchiseId)}`
      : "";
    fetch(`/api/students/franchise-courses${q}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const items = d?.data?.courses ?? d?.data?.items ?? d?.data ?? [];
        setCourses(Array.isArray(items) ? items : []);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [open, student]);

  const onPickCourse = (id: string) => {
    setCourseId(id);
    const c = courses.find((x) => x.id === id);
    if (c) setTotalFee(String(c.baseFee));
  };

  const submit = async () => {
    if (!student) return;
    if (!courseId) {
      await showError("Course", "Select a course");
      return;
    }
    if (!totalFee || Number(totalFee) < 0) {
      await showError("Fee", "Enter a valid total fee");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${student.id}/assign-course`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          courseId,
          totalFee: Number(totalFee),
          initialPayment: initialPayment ? Number(initialPayment) : 0,
          paymentMode,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Error", json.error || "Failed");
        return;
      }
      const bits = [`${student.fullName} enrolled in ${json.data?.courseName || "course"}`];
      if (json.data?.emailSent) bits.push("course details emailed");
      if (json.data?.receiptEmailSent) bits.push("fee receipt emailed");
      await showSuccess("Course assigned", bits.join(" · "));
      onSuccess?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassModal open={open} onClose={onClose} title="Assign course" size="md">
      {!student ? null : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#1E4A85]/12 bg-gradient-to-br from-[#1E4A85]/5 to-white p-4">
            <p className="text-lg font-bold text-[#1E4A85]">{student.fullName}</p>
            <p className="mt-1 inline-flex items-center gap-1 font-mono text-xs font-bold text-[#C4A35A]">
              <Hash className="h-3.5 w-3.5" />
              {student.studentCode}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Select the course for this student and set fees. This is separate from adding personal
            details.
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#1E4A85]" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Course</label>
                <select
                  value={courseId}
                  onChange={(e) => onPickCourse(e.target.value)}
                  className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — ₹{Number(c.baseFee).toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
                {!courses.length && (
                  <p className="mt-1 text-[11px] text-amber-700">
                    No courses on this franchise. Add courses under Franchise Courses first.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                    Total fee (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={totalFee}
                    onChange={(e) => setTotalFee(e.target.value)}
                    className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                    Initial payment (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(e.target.value)}
                    className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                    placeholder="Optional"
                  />
                </div>
              </div>
              {Number(initialPayment) > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                    Payment mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || loading}
              onClick={submit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BookOpen className="h-4 w-4" />
              )}
              Assign course
            </button>
          </div>
        </div>
      )}
    </GlassModal>
  );
}
