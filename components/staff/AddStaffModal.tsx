"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/common/GlassModal";
import { Loader2, UserPlus } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";

interface Franchise {
  id: string;
  name: string;
}

interface AddStaffModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddStaffModal({ open, onClose, onSuccess }: AddStaffModalProps) {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const isSubAdmin = roleId === ROLES.SUB_ADMIN;

  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loadingFranchises, setLoadingFranchises] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    franchiseId: isSubAdmin && user?.franchiseId ? String(user.franchiseId) : "",
    fullName: "",
    email: "",
    phone: "",
    password: "Staff@123",
    salary: "",
    joiningDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (open) {
      setForm({
        franchiseId: isSubAdmin && user?.franchiseId ? String(user.franchiseId) : "",
        fullName: "",
        email: "",
        phone: "",
        password: "Staff@123",
        salary: "",
        joiningDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [open, isSubAdmin, user?.franchiseId]);

  useEffect(() => {
    if (!open) return;
    if (!isSubAdmin) {
      setLoadingFranchises(true);
      fetch("/api/franchises?limit=200", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          const x = d.data ?? d;
          return Array.isArray(x) ? x : (x?.franchises ?? []);
        })
        .then((fl: Franchise[]) => setFranchises(Array.isArray(fl) ? fl : []))
        .catch(() => setFranchises([]))
        .finally(() => setLoadingFranchises(false));
    }
  }, [open, isSubAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameR = validateName(form.fullName);
    const emailR = validateEmail(form.email);
    const phoneR = form.phone.trim() ? validatePhone(form.phone) : { valid: true };
    if (!nameR.valid) { await showError("Validation", nameR.error!); return; }
    if (!emailR.valid) { await showError("Validation", emailR.error!); return; }
    if (!phoneR.valid) { await showError("Validation", phoneR.error!); return; }
    if (!form.franchiseId || !form.salary || parseFloat(form.salary) < 0) {
      await showError("Validation", "Please fill franchise and salary");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password || "Staff@123",
          franchiseId: form.franchiseId,
          salary: parseFloat(form.salary),
          joiningDate: form.joiningDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        await showError("Error", data.error || "Failed to add staff");
        return;
      }
      await showSuccess("Success", "Staff added successfully");
      onClose();
      onSuccess?.();
    } catch {
      await showError("Error", "Failed to add staff");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";
  const labelClass = "block text-sm font-medium text-foreground mb-1";

  return (
    <GlassModal open={open} onClose={onClose} title="Add Staff" size="lg" closeOnOverlayClick={!submitting}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isSubAdmin && (
          <div>
            <label className={labelClass}>Franchise *</label>
            <select
              name="franchiseId"
              value={form.franchiseId}
              onChange={handleChange}
              className={inputClass}
              required
              disabled={loadingFranchises}
            >
              <option value="">Select franchise</option>
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full name" className={inputClass} required maxLength={150} />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" className={inputClass} required />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" className={inputClass} maxLength={14} />
          </div>
          <div>
            <label className={labelClass}>Salary (₹) *</label>
            <input type="number" name="salary" value={form.salary} onChange={handleChange} className={inputClass} min="0" step="0.01" required />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Joining Date</label>
            <input type="date" name="joiningDate" value={form.joiningDate} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Password (default: Staff@123)</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className={inputClass} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm"
          >Cancel</button>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Add Staff
          </button>
        </div>
      </form>
    </GlassModal>
  );
}
