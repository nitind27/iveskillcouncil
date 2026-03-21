"use client";

import { useState } from "react";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { Shield, Loader2, Key } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelClass = "block text-sm font-medium text-foreground mb-1";

export default function AccountPage() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.currentPassword) {
      await showError("Validation", "Current password is required");
      return;
    }
    if (!form.newPassword) {
      await showError("Validation", "New password is required");
      return;
    }
    if (form.newPassword.length < 8) {
      await showError("Validation", "New password must be at least 8 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      await showError("Validation", "New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        await showError("Error", data.error || "Failed to change password");
        return;
      }
      await showSuccess("Success", "Password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      await showError("Error", "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Change your password and security settings</p>
      </div>

      <Card className="rounded-xl shadow-lg max-w-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Change Password</h2>
              <p className="text-sm text-muted-foreground">
                Use a strong password with at least 8 characters
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                className={inputClass}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className={inputClass}
                placeholder="Confirm new password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Change Password
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
