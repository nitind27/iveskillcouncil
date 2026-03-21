"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Copy, Check, MapPin } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { usePincodeLookup } from "@/hooks/usePincodeLookup";

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

interface Credentials {
  email: string;
  password?: string;
  loginUrl: string;
  firstTimeSetup?: boolean;
}

export default function AddFranchiseForm({ onSuccess, onCancel }: AddFranchiseFormProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
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

  const loadPlans = React.useCallback(async () => {
    let list: Plan[] = [];
    let lastStatus = 0;
    try {
      const res = await fetch("/api/franchises/plans", { credentials: "include" });
      lastStatus = res.status;
      const data = await res.json();
      list = Array.isArray(data.data) ? data.data : [];
      if (list.length === 0) {
        const fallback = await fetch("/api/admin/plans", { credentials: "include" });
        lastStatus = fallback.status;
        const fallbackData = await fallback.json();
        list = Array.isArray(fallbackData.data) ? fallbackData.data : [];
      }
    } catch {
      try {
        const res = await fetch("/api/admin/plans", { credentials: "include" });
        lastStatus = res.status;
        const data = await res.json();
        list = Array.isArray(data.data) ? data.data : [];
      } catch {
        list = [];
      }
    }
    setPlans(list);
    if (list.length > 0) {
      setForm((f) => (f.planId ? f : { ...f, planId: String(list[0].id) }));
    } else if (lastStatus === 401) {
      showError("Session expired", "Please log in again.");
    } else if (lastStatus === 403) {
      showError("Access denied", "You don't have permission to view plans.");
    }
  }, []);

  useEffect(() => {
    loadPlans().finally(() => setLoadingPlans(false));
  }, [loadPlans]);

  const { fetchByPincode, loading: pincodeLoading, error: pincodeError, clearError: clearPincodeError } = usePincodeLookup(
    (data) => setForm((prev) => ({
      ...prev,
      address: prev.address || data.area,
      city: data.city,
      state: data.state,
    }))
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "pincode") clearPincodeError();
  };

  const handleGetArea = () => {
    fetchByPincode(form.pincode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameR = validateName(form.ownerName);
    const emailR = validateEmail(form.ownerEmail);
    const phoneR = form.ownerPhone.trim() ? validatePhone(form.ownerPhone) : { valid: true };
    if (!nameR.valid) { await showError("Validation", nameR.error!); return; }
    if (!emailR.valid) { await showError("Validation", emailR.error!); return; }
    if (!phoneR.valid) { await showError("Validation", phoneR.error!); return; }
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
      if (data?.data?.credentials) {
        setCredentials(data.data.credentials);
        setEmailSent(!!data.data.emailSent);
        await showSuccess("Created", "Franchise created. Copy credentials below and share with the owner.");
      } else {
        await showSuccess("Created", "Franchise created.");
        onSuccess();
      }
    } catch (err) {
      await showError("Error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      showError("Copy failed", "Could not copy to clipboard");
    }
  };

  if (credentials) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="font-semibold text-foreground mb-2">Franchise created successfully</p>
          {credentials.firstTimeSetup ? (
            <p className="text-sm text-muted-foreground mb-3">
              Setup instructions sent to {credentials.email}. Owner will use OTP on first login, then set password.
            </p>
          ) : !emailSent ? (
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
              Email could not be sent. Copy these credentials and share with the franchise owner manually.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">
              Credentials sent to {credentials.email}. Copy below as backup.
            </p>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Username (Email)</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={credentials.email}
                className="flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(credentials.email, "email")}
                className="px-3 py-2 rounded-lg border border-input hover:bg-muted transition-colors"
              >
                {copied === "email" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {credentials.password && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  readOnly
                  value={credentials.password}
                  className="flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(credentials.password!, "password")}
                  className="px-3 py-2 rounded-lg border border-input hover:bg-muted transition-colors"
                >
                  {copied === "password" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Login URL</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                readOnly
                value={credentials.loginUrl}
                className="flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(credentials.loginUrl, "url")}
                className="px-3 py-2 rounded-lg border border-input hover:bg-muted transition-colors"
              >
                {copied === "url" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => { setCredentials(null); onSuccess(); }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

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
          <select
            name="planId"
            value={form.planId}
            onChange={handleChange}
            className={inputClass}
            required
            disabled={plans.length === 0}
          >
            <option value="">
              {plans.length === 0
                ? "No plans available — Add plans in Subscription first"
                : "Select plan"}
            </option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {String(p.name)} — ₹{Number(p.price).toLocaleString()} / {Number(p.durationInDays)} days
              </option>
            ))}
          </select>
          {plans.length === 0 && (
            <p className="mt-1.5 text-xs text-amber-600">
              No plans found. Create plans in{" "}
              <a href="/subscription/plans" className="underline hover:no-underline">Manage Plans</a> first, or{" "}
              <button type="button" onClick={() => { setLoadingPlans(true); loadPlans().finally(() => setLoadingPlans(false)); }} className="underline hover:no-underline font-medium">
                refresh
              </button>
              .
            </p>
          )}
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
          <input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="Street, area (auto from pincode)" />
        </div>
        <div>
          <label className={labelClass}>Pincode</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              className={inputClass}
              placeholder="6-digit pincode"
              maxLength={6}
            />
            <button
              type="button"
              onClick={handleGetArea}
              disabled={pincodeLoading || form.pincode.trim().replace(/\D/g, "").length !== 6}
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap flex items-center gap-2"
            >
              {pincodeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              Get area
            </button>
          </div>
          {pincodeError && <p className="mt-1 text-xs text-amber-600">{pincodeError}</p>}
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input type="text" name="city" value={form.city} onChange={handleChange} className={inputClass} placeholder="Auto from pincode" />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input type="text" name="state" value={form.state} onChange={handleChange} className={inputClass} placeholder="Auto from pincode" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-border hover:bg-muted">
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || plans.length === 0}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Add Franchise
        </button>
      </div>
    </form>
  );
}
