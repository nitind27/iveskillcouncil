"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Hash,
  Mail,
  Phone,
  Building2,
  BookOpen,
  MapPin,
  IndianRupee,
  Calendar,
  Loader2,
  GraduationCap,
  User,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { EditStudentModal } from "@/components/students/EditStudentModal";
import { showDeleteConfirm, showSuccess, showError } from "@/lib/toast";

/** Above ChatWidget (z-400) so profile never sits under the FAB. */
const PROFILE_DRAWER_Z = 10050;

export interface StudentProfileData {
  id: string;
  studentCode: string;
  fullName: string;
  firstName?: string | null;
  surname?: string | null;
  relationship?: string | null;
  fatherHusbandName?: string | null;
  motherName?: string | null;
  email: string;
  phone: string | null;
  alternateMobile?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  profileImageUrl?: string | null;
  signatureUrl?: string | null;
  showFatherOnCertificate?: boolean;
  showSurnameOnCertificate?: boolean;
  status: string;
  franchiseId?: string;
  franchiseName: string;
  courseName: string | null;
  courseAssigned: boolean;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  admissionDate: string;
  address: string | null;
  area: string | null;
  pincode: string | null;
  city: string | null;
  state: string | null;
  payments: Array<{
    id: string;
    amount: number;
    paymentMode: string;
    status: string;
    paymentDate: string;
  }>;
}

interface StudentProfileDrawerProps {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
  onAssignCourse?: (student: {
    id: string;
    studentCode: string;
    fullName: string;
  }) => void;
  onStudentUpdated?: (studentId: string) => void;
  onStudentDeleted?: (studentId: string) => void;
}

export function StudentProfileDrawer({
  studentId,
  open,
  onClose,
  onAssignCourse,
  onStudentUpdated,
  onStudentDeleted,
}: StudentProfileDrawerProps) {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const canManage =
    roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN || roleId === ROLES.SUB_ADMIN;

  const [data, setData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProfile = useCallback(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/students/${studentId}/profile`, { credentials: "include" })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Failed to load profile");
        setData(json.data as StudentProfileData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    if (!open || !studentId) {
      setData(null);
      return;
    }
    fetchProfile();
  }, [open, studentId, fetchProfile]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleDelete = async () => {
    if (!data || !studentId) return;
    const res = await showDeleteConfirm(
      `Delete Student: ${data.fullName}?`,
      `Are you sure you want to delete student ${data.studentCode ? `[${data.studentCode}] ` : ""}${data.fullName}? This will permanently remove their enrollment, fee records, attendance, and all associated details.`
    );
    if (!res.isConfirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await response.json();
      if (!response.ok) {
        await showError("Delete Failed", json.error || "Could not delete student");
        return;
      }
      await showSuccess(
        "Student Deleted",
        `Student ${data.fullName} has been deleted successfully.`
      );
      onStudentDeleted?.(studentId);
      onClose();
    } catch {
      await showError("Error", "Failed to delete student. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  const initials =
    data?.fullName
      ?.split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const drawer = (
    <div
      className="fixed inset-0 flex justify-end"
      style={{ zIndex: PROFILE_DRAWER_Z }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0B1F3A]/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#1E4A85] via-[#163a6b] to-[#0B1F3A] px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#C4A35A]/20" />
          <div className="pointer-events-none absolute bottom-0 left-10 h-20 w-20 rounded-full bg-white/5" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-lg font-bold ring-2 ring-[#C4A35A]/50">
                {data?.profileImageUrl ? (
                  <img
                    src={data.profileImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#C4A35A]">
                  Student profile
                </p>
                <h2 className="truncate text-lg font-bold leading-tight">
                  {loading ? "Loading…" : data?.fullName || "Student"}
                </h2>
                {data && (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 font-mono text-xs font-semibold text-[#C4A35A]">
                    <Hash className="h-3 w-3" />
                    {data.studentCode}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/10 p-2 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action bar for Admins */}
        {data && canManage && (
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5">
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Student
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white py-2 text-xs font-bold text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete Student
            </button>
          </div>
        )}

        {/* Scrollable details */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
            </div>
          )}
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {data && !loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Stat
                  label="Total"
                  value={`₹${data.totalFee.toLocaleString("en-IN")}`}
                />
                <Stat
                  label="Paid"
                  value={`₹${data.paidFee.toLocaleString("en-IN")}`}
                  tone="emerald"
                />
                <Stat
                  label="Pending"
                  value={`₹${data.pendingFee.toLocaleString("en-IN")}`}
                  tone="amber"
                />
              </div>

              <Section title="Personal">
                <Row icon={User} text={`Gender: ${data.gender || "—"}`} />
                <Row icon={Calendar} text={`DOB: ${data.dateOfBirth || "—"}`} />
                <Row
                  icon={User}
                  text={`Father/Husband: ${data.fatherHusbandName || "—"}`}
                />
                <Row icon={User} text={`Mother: ${data.motherName || "—"}`} />
                {data.alternateMobile && (
                  <Row icon={Phone} text={`Alt: ${data.alternateMobile}`} />
                )}
              </Section>

              <Section title="Contact">
                <Row icon={Mail} text={data.email} />
                <Row icon={Phone} text={data.phone || "—"} />
              </Section>

              <Section title="Enrollment">
                <Row icon={Building2} text={data.franchiseName} />
                <Row
                  icon={BookOpen}
                  text={data.courseName || "Course not assigned"}
                  highlight={!data.courseAssigned}
                />
                <Row icon={Calendar} text={`Admitted ${data.admissionDate}`} />
                <Row
                  icon={GraduationCap}
                  text={data.status.replace(/_/g, " ")}
                />
              </Section>

              <Section title="Address">
                <Row
                  icon={MapPin}
                  text={
                    [data.address, data.area, data.city, data.state, data.pincode]
                      .filter(Boolean)
                      .join(", ") || "No address on file"
                  }
                />
              </Section>

              {data.payments.length > 0 && (
                <Section title="Recent Payments">
                  <ul className="divide-y divide-slate-100 text-xs">
                    {data.payments.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0"
                      >
                        <span className="text-slate-600">
                          {p.paymentDate
                            ? new Date(p.paymentDate).toLocaleDateString("en-IN")
                            : "—"}{" "}
                          ({p.paymentMode})
                        </span>
                        <span className="font-semibold text-emerald-700">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {!data.courseAssigned && onAssignCourse && (
                <button
                  type="button"
                  onClick={() =>
                    onAssignCourse({
                      id: data.id,
                      studentCode: data.studentCode,
                      fullName: data.fullName,
                    })
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C4A35A] py-3 text-sm font-bold text-[#0B1F3A]"
                >
                  <BookOpen className="h-4 w-4" />
                  Assign course
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Embedded Edit Modal */}
      {studentId && (
        <EditStudentModal
          studentId={studentId}
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            fetchProfile();
            onStudentUpdated?.(studentId);
          }}
        />
      )}
    </div>
  );

  if (typeof document === "undefined") return drawer;
  return createPortal(drawer, document.body);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#1E4A85]/70">
        {title}
      </p>
      <div className="space-y-1.5 rounded-2xl border border-[#1E4A85]/10 bg-white p-3 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  text,
  highlight,
}: {
  icon: typeof Mail;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          highlight ? "text-amber-500" : "text-[#1E4A85]"
        )}
      />
      <span
        className={cn(
          "break-words text-slate-700",
          highlight && "font-semibold text-amber-700"
        )}
      >
        {text}
      </span>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "emerald" | "amber";
}) {
  const toneClass = {
    default: "text-[#0B1F3A]",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
  }[tone];

  return (
    <div className="rounded-2xl border border-[#1E4A85]/10 bg-[#1E4A85]/[0.03] p-2.5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={cn("text-sm font-bold tabular-nums", toneClass)}>{value}</p>
    </div>
  );
}
