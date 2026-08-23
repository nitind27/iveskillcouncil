"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/common";
import {
  Shield,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  User,
  Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-[#1E4A85]/15 bg-white px-3.5 py-2.5 pr-11 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-[#1E4A85]/40 focus:ring-2 focus:ring-[#1E4A85]/15";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#1E4A85]/80";

function passwordChecks(password: string) {
  return [
    { id: "len", label: "At least 8 characters", ok: password.length >= 8 },
    { id: "upper", label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    { id: "lower", label: "One lowercase letter", ok: /[a-z]/.test(password) },
    { id: "num", label: "One number", ok: /\d/.test(password) },
  ];
}

function strengthScore(password: string) {
  const checks = passwordChecks(password);
  const passed = checks.filter((c) => c.ok).length;
  if (!password) return { score: 0, label: "", color: "bg-slate-200" };
  if (passed <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (passed === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (passed === 3) return { score: 3, label: "Good", color: "bg-[#1E4A85]" };
  return { score: 4, label: "Strong", color: "bg-emerald-500" };
}

export default function AccountPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const checks = useMemo(() => passwordChecks(form.newPassword), [form.newPassword]);
  const strength = useMemo(() => strengthScore(form.newPassword), [form.newPassword]);
  const canSubmit =
    form.currentPassword.length > 0 &&
    form.newPassword.length >= 8 &&
    form.newPassword === form.confirmPassword &&
    !saving;

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
    const errors: Record<string, string> = {};
    if (!form.currentPassword) errors.currentPassword = "Current password is required";
    if (!form.newPassword) errors.newPassword = "New password is required";
    else if (form.newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters";
    }
    if (!form.confirmPassword) errors.confirmPassword = "Please confirm your new password";
    else if (form.newPassword !== form.confirmPassword) {
      errors.confirmPassword = "New passwords do not match";
    }
    if (form.currentPassword && form.newPassword && form.currentPassword === form.newPassword) {
      errors.newPassword = "New password must be different from current password";
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
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
      setShow({ current: false, next: false, confirm: false });
    } catch {
      await showError("Error", "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Breadcrumb />

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E4A85] sm:text-3xl">
            Account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your password and keep your account secure
          </p>
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[#1E4A85]/15 bg-white px-3.5 py-2 text-sm font-medium text-[#1E4A85] shadow-sm transition hover:border-[#1E4A85]/30 hover:bg-[#1E4A85]/5"
        >
          <User className="h-4 w-4" />
          Edit profile
        </Link>
      </div>

      {/* Security banner */}
      <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-[#1E4A85] via-[#1E4A85] to-[#163a6b] px-5 py-6 sm:px-8 sm:py-7">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 50%, #C4A35A 0%, transparent 40%), radial-gradient(circle at 90% 10%, rgba(255,255,255,0.22) 0%, transparent 35%)",
            }}
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white sm:text-xl">Security settings</h2>
                <p className="mt-0.5 text-sm text-white/75">
                  {user?.email
                    ? `Signed in as ${user.email}`
                    : "Change password for your portal account"}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#C4A35A]/20 px-2.5 py-1.5 text-xs font-semibold text-[#F5E6C8] ring-1 ring-[#C4A35A]/35">
              <Lock className="h-3.5 w-3.5" />
              Password protected
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#1E4A85]/12 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex items-center gap-3 border-b border-[#1E4A85]/8 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E4A85]/10">
              <KeyRound className="h-5 w-5 text-[#1E4A85]" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Change password</h3>
              <p className="text-xs text-muted-foreground">
                Use a strong password you don’t reuse elsewhere
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className={labelClass}>
                Current password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={show.current ? "text" : "password"}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  className={cn(
                    inputClass,
                    fieldErrors.currentPassword && "border-red-400 focus:ring-red-200"
                  )}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E4A85]/50 transition hover:text-[#1E4A85]"
                  aria-label={show.current ? "Hide password" : "Show password"}
                >
                  {show.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.currentPassword && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.currentPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className={labelClass}>
                New password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={show.next ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  className={cn(
                    inputClass,
                    fieldErrors.newPassword && "border-red-400 focus:ring-red-200"
                  )}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E4A85]/50 transition hover:text-[#1E4A85]"
                  aria-label={show.next ? "Hide password" : "Show password"}
                >
                  {show.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.newPassword}</p>
              )}

              {form.newPassword.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 flex-1 rounded-full transition",
                            i <= strength.score ? strength.color : "bg-slate-200"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {strength.label}
                    </span>
                  </div>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {checks.map((c) => (
                      <li
                        key={c.id}
                        className={cn(
                          "flex items-center gap-1.5 text-xs",
                          c.ok ? "text-emerald-700" : "text-muted-foreground"
                        )}
                      >
                        {c.ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        )}
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={show.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={cn(
                    inputClass,
                    fieldErrors.confirmPassword && "border-red-400 focus:ring-red-200"
                  )}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E4A85]/50 transition hover:text-[#1E4A85]"
                  aria-label={show.confirm ? "Hide password" : "Show password"}
                >
                  {show.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
              )}
              {!fieldErrors.confirmPassword &&
                form.confirmPassword.length > 0 &&
                form.newPassword === form.confirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Passwords match
                  </p>
                )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#1E4A85]/8 pt-5">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163a6b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Update password
            </button>
            {(form.currentPassword || form.newPassword || form.confirmPassword) && !saving && (
              <button
                type="button"
                onClick={() => {
                  setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setFieldErrors({});
                }}
                className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#1E4A85]/12 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1E4A85]/70">
              Tips
            </p>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
              <li>Use 8+ characters with letters and numbers.</li>
              <li>Don’t reuse passwords from other sites.</li>
              <li>Never share your login with anyone.</li>
              <li>Change password if you suspect misuse.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#C4A35A]/25 bg-gradient-to-br from-[#C4A35A]/10 to-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#1E4A85]">Profile</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Update your name, email, or phone from the profile page.
            </p>
            <Link
              href="/profile"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4A85] hover:underline"
            >
              <User className="h-3.5 w-3.5" />
              Go to profile
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
