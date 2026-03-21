"use client";

import { useState, useEffect } from "react";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { User, Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/lib/toast";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelClass = "block text-sm font-medium text-foreground mb-1";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        await showError("Error", data.error || "Failed to update profile");
        return;
      }
      await showSuccess("Saved", "Profile updated successfully");
      await refreshUser();
    } catch {
      await showError("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your profile information</p>
      </div>

      <Card className="rounded-xl shadow-lg max-w-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">
                {user.fullName?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <p className="font-semibold text-lg">{user.fullName}</p>
              <p className="text-sm text-muted-foreground">{user.roleName}</p>
              {user.franchise && (
                <p className="text-xs text-muted-foreground mt-1">{user.franchise.name}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={inputClass}
                placeholder="Optional"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
