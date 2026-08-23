"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/common";
import {
  User,
  Loader2,
  Save,
  Mail,
  Phone,
  Building2,
  Shield,
  KeyRound,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/lib/toast";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-[#1E4A85]/15 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-[#1E4A85]/40 focus:ring-2 focus:ring-[#1E4A85]/15";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#1E4A85]/80";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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

  const initials = useMemo(() => {
    const name = user?.fullName?.trim() || "U";
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [user?.fullName]);

  const dirty = useMemo(() => {
    if (!user) return false;
    return (
      form.fullName.trim() !== (user.fullName || "").trim() ||
      form.email.trim() !== (user.email || "").trim() ||
      form.phone.trim() !== (user.phone || "").trim()
    );
  }, [form, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((p) => {
        const next = { ...p };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameR = validateName(form.fullName);
    const emailR = validateEmail(form.email);
    const phoneR = form.phone.trim() ? validatePhone(form.phone) : { valid: true as const };
    const errors: Record<string, string> = {};
    if (!nameR.valid) errors.fullName = nameR.error!;
    if (!emailR.valid) errors.email = emailR.error!;
    if (!phoneR.valid) errors.phone = phoneR.error!;
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
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
        <div className="flex justify-center py-24">
          <Loader2 className="h-9 w-9 animate-spin text-[#1E4A85]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumb />

      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E4A85] sm:text-3xl">
            Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and update your personal information
          </p>
        </div>
        <Link
          href="/account"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[#1E4A85]/15 bg-white px-3.5 py-2 text-sm font-medium text-[#1E4A85] shadow-sm transition hover:border-[#1E4A85]/30 hover:bg-[#1E4A85]/5"
        >
          <KeyRound className="h-4 w-4" />
          Change password
        </Link>
      </div>

      {/* Identity banner */}
      <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-white shadow-sm">
        <div className="relative h-28 bg-gradient-to-br from-[#1E4A85] via-[#1E4A85] to-[#163a6b] sm:h-32">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 40%, #C4A35A 0%, transparent 45%), radial-gradient(circle at 85% 20%, rgba(255,255,255,0.25) 0%, transparent 40%)",
            }}
          />
          <div className="absolute -bottom-10 left-5 flex items-end gap-4 sm:left-8 sm:-bottom-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-[#C4A35A] to-[#a8873f] text-2xl font-bold text-white shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
              {initials}
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-14 sm:px-8 sm:pt-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-foreground sm:text-2xl">
                {user.fullName}
              </h2>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1E4A85]/15 bg-[#1E4A85]/8 px-2.5 py-1 text-xs font-semibold text-[#1E4A85]">
                  <Shield className="h-3.5 w-3.5" />
                  {user.roleName}
                </span>
                {user.franchise?.name && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A35A]/30 bg-[#C4A35A]/10 px-2.5 py-1 text-xs font-semibold text-[#8a6f2e]">
                    <Building2 className="h-3.5 w-3.5" />
                    {user.franchise.name}
                  </span>
                )}
                {user.franchise?.state && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {user.franchise.state}
                  </span>
                )}
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 self-start rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
              <BadgeCheck className="h-3.5 w-3.5" />
              Active account
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        {/* Edit form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#1E4A85]/12 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex items-center gap-3 border-b border-[#1E4A85]/8 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E4A85]/10">
              <User className="h-5 w-5 text-[#1E4A85]" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Personal details</h3>
              <p className="text-xs text-muted-foreground">
                These details appear across the portal
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className={cn(inputClass, fieldErrors.fullName && "border-red-400 focus:ring-red-200")}
                required
                autoComplete="name"
              />
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1E4A85]/45" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={cn(
                    inputClass,
                    "pl-10",
                    fieldErrors.email && "border-red-400 focus:ring-red-200"
                  )}
                  required
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone <span className="font-normal normal-case tracking-normal text-muted-foreground">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1E4A85]/45" />
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={cn(
                    inputClass,
                    "pl-10",
                    fieldErrors.phone && "border-red-400 focus:ring-red-200"
                  )}
                  placeholder="10-digit mobile number"
                  autoComplete="tel"
                />
              </div>
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#1E4A85]/8 pt-5">
            <button
              type="submit"
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163a6b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
            {dirty && !saving && (
              <button
                type="button"
                onClick={() => {
                  setForm({
                    fullName: user.fullName || "",
                    email: user.email || "",
                    phone: user.phone || "",
                  });
                  setFieldErrors({});
                }}
                className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {/* Side info */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#1E4A85]/12 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1E4A85]/70">
              Account
            </p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Role</dt>
                <dd className="mt-0.5 font-medium text-foreground">{user.roleName}</dd>
              </div>
              {user.franchise && (
                <>
                  <div>
                    <dt className="text-xs text-muted-foreground">Franchise</dt>
                    <dd className="mt-0.5 font-medium text-foreground">{user.franchise.name}</dd>
                  </div>
                  {user.franchise.state && (
                    <div>
                      <dt className="text-xs text-muted-foreground">State</dt>
                      <dd className="mt-0.5 font-medium text-foreground">{user.franchise.state}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs text-muted-foreground">Status</dt>
                    <dd className="mt-0.5 font-medium capitalize text-foreground">
                      {user.franchise.status?.toLowerCase?.() || user.franchise.status}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-[#C4A35A]/25 bg-gradient-to-br from-[#C4A35A]/10 to-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#1E4A85]">Security</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Keep your password strong and never share login details.
            </p>
            <Link
              href="/account"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4A85] hover:underline"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Manage password
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
