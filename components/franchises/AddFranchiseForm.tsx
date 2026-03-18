"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";

interface Plan {
  id: number;
  name: string;
  price: number;
  durationInDays: number;
  status: string;
}

interface AddFranchiseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
const labelClass = "block text-sm font-medium text-foreground mb-1";

export default function AddFranchiseForm({ onSuccess, onCancel }: AddFranchiseFormProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    planId: "",
    subscriptionStart: "",
    subscriptionEnd: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/plans", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setPlans(data.data || []);
          if ((data.data?.length) && !form.planId) setForm((f) => ({ ...f, planId: String(data.data[0].id) }));
        }
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.ownerName.trim() || !form.ownerEmail.trim() || !form.planId || !form.subscriptionStart || !form.subscriptionEnd) {
      await showError("Validation", "Name, Owner Name, Owner Email, Plan, Start & End dates required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/franchises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          ownerName: form.ownerName.trim(),
          ownerEmail: form.ownerEmail.trim(),
          ownerPhone: form.ownerPhone.trim() || undefined,
          planId: Number(form.planId),
          subscriptionStart: form.subscriptionStart,
          subscriptionEnd: form.subscriptionEnd,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          pincode: form.pincode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        await showError("Error", data.error || "Failed to create franchise.");
        setSubmitting(false);
        return;
      }
      await showSuccess("Created", "Franchise created. Login credentials sent to owner email (if SMTP configured).");
      onSuccess();
    } catch (err) {
      await showError("Error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  if (loadingPlans) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={labelClass}>Franchise Name *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="e.g. Main Branch" required />
        </div>
        <div>
          <label className={labelClass}>Owner Name *</label>
          <input type="text" name="ownerName" value={form.ownerName} onChange={handleChange} className={inputClass} placeholder="Full name" required />
        </div>
        <div>
          <label className={labelClass}>Owner Email *</label>
          <input type="email" name="ownerEmail" value={form.ownerEmail} onChange={handleChange} className={inputClass} placeholder="owner@example.com" required />
        </div>
        <div>
          <label className={labelClass}>Owner Phone</label>
          <input type="tel" name="ownerPhone" value={form.ownerPhone} onChange={handleChange} className={inputClass} placeholder="+91..." />
        </div>
        <div>
          <label className={labelClass}>Subscription Plan *</label>
          <select name="planId" value={form.planId} onChange={handleChange} className={inputClass} required>
            <option value="">Select plan</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — ₹{p.price.toLocaleString()}/{p.durationInDays} days</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Subscription Start *</label>
          <input type="date" name="subscriptionStart" value={form.subscriptionStart} onChange={handleChange} className={inputClass} min={today} required />
        </div>
        <div>
          <label className={labelClass}>Subscription End *</label>
          <input type="date" name="subscriptionEnd" value={form.subscriptionEnd} onChange={handleChange} className={inputClass} min={form.subscriptionStart || today} required />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass}>Address</label>
          <input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="Street, area" />
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input type="text" name="city" value={form.city} onChange={handleChange} className={inputClass} placeholder="City" />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input type="text" name="state" value={form.state} onChange={handleChange} className={inputClass} placeholder="State" />
        </div>
        <div>
          <label className={labelClass}>Pincode</label>
          <input type="text" name="pincode" value={form.pincode} onChange={handleChange} className={inputClass} placeholder="Pincode" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-border hover:bg-muted">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Add Franchise
        </button>
      </div>
    </form>
  );
}
