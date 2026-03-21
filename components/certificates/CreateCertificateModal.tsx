"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/common/GlassModal";
import { Loader2, Award } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";

interface Student {
  id: string;
  fullName: string;
  email: string;
  courseName: string;
  franchiseName: string;
}

interface CreateCertificateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCertificateModal({ open, onClose, onSuccess }: CreateCertificateModalProps) {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const isSubAdmin = roleId === ROLES.SUB_ADMIN;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    if (open) {
      setStudentId("");
      setLoading(true);
      const url = isSubAdmin ? "/api/students?limit=500" : "/api/students?limit=500";
      fetch(url, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          const raw = d?.data ?? d;
          const list = raw?.items ?? raw;
          return Array.isArray(list) ? list : [];
        })
        .then((list: Student[]) => setStudents(list))
        .catch(() => setStudents([]))
        .finally(() => setLoading(false));
    }
  }, [open, isSubAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      await showError("Validation", "Select a student");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        await showError("Error", data.error || "Failed to create certificate request");
        return;
      }
      await showSuccess("Success", "Certificate request created successfully");
      onClose();
      onSuccess?.();
    } catch {
      await showError("Error", "Failed to create certificate request");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";
  const labelClass = "block text-sm font-medium text-foreground mb-1";

  return (
    <GlassModal open={open} onClose={onClose} title="Create Certificate Request" size="lg" closeOnOverlayClick={!submitting}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Student *</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className={inputClass}
            required
            disabled={loading}
          >
            <option value="">{loading ? "Loading students..." : "Select student"}</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} – {s.courseName} ({s.franchiseName})
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">Creates a certificate request for the selected student</p>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm">Cancel</button>
          <button type="submit" disabled={submitting || loading} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
            Create Request
          </button>
        </div>
      </form>
    </GlassModal>
  );
}
