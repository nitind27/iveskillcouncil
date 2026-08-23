"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Breadcrumb } from "@/components/common";
import {
  Shield,
  Loader2,
  Save,
  Edit2,
  X,
  Crown,
  Gem,
  Medal,
  CheckCircle2,
  CircleDashed,
  RefreshCw,
  Layers,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { ROLES } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Permission {
  id: number;
  key: string;
  label: string;
  module: string;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  durationInDays: number;
  status: string;
  permissionIds?: number[];
}

type PlanTier = "SILVER" | "GOLD" | "DIAMOND" | "DEFAULT";

function getPlanTier(name: string): PlanTier {
  const n = name.trim().toUpperCase();
  if (n.includes("DIAMOND")) return "DIAMOND";
  if (n.includes("GOLD")) return "GOLD";
  if (n.includes("SILVER")) return "SILVER";
  return "DEFAULT";
}

const TIER_STYLE: Record<
  PlanTier,
  {
    Icon: typeof Crown;
    accent: string;
    badge: string;
    ring: string;
    header: string;
    price: string;
    glow: string;
  }
> = {
  SILVER: {
    Icon: Medal,
    accent: "from-slate-500/20 via-slate-200/10 to-transparent",
    badge: "bg-slate-600 text-white",
    ring: "ring-slate-300/60",
    header: "text-slate-700 dark:text-slate-200",
    price: "text-slate-800 dark:text-slate-100",
    glow: "hover:border-slate-400/50",
  },
  GOLD: {
    Icon: Crown,
    accent: "from-[#C4A35A]/35 via-[#C4A35A]/10 to-transparent",
    badge: "bg-[#C4A35A] text-[#0B132B]",
    ring: "ring-[#C4A35A]/40",
    header: "text-[#8B6914] dark:text-[#E8D5A3]",
    price: "text-[#1E4A85] dark:text-[#8EB6E8]",
    glow: "hover:border-[#C4A35A]/50",
  },
  DIAMOND: {
    Icon: Gem,
    accent: "from-[#1E4A85]/30 via-[#2A66B2]/10 to-transparent",
    badge: "bg-[#1E4A85] text-white",
    ring: "ring-[#1E4A85]/35",
    header: "text-[#1E4A85] dark:text-[#8EB6E8]",
    price: "text-[#1E4A85] dark:text-[#8EB6E8]",
    glow: "hover:border-[#1E4A85]/45",
  },
  DEFAULT: {
    Icon: Layers,
    accent: "from-[#1E4A85]/15 via-transparent to-transparent",
    badge: "bg-[#1E4A85] text-white",
    ring: "ring-[#1E4A85]/25",
    header: "text-[#1E4A85] dark:text-[#8EB6E8]",
    price: "text-foreground",
    glow: "hover:border-[#1E4A85]/35",
  },
};

async function fetchJson<T>(url: string): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, { credentials: "include" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: json?.error || `Request failed (${res.status})`,
      };
    }
    return { ok: true, status: res.status, data: json.data as T };
  } catch {
    return { ok: false, status: 0, error: "Network error — is the server running?" };
  }
}

export default function SubscriptionPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [planPerms, setPlanPerms] = useState<Record<number, Set<number>>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [editingPlan, setEditingPlan] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    price: number;
    durationInDays: number;
    status: string;
  } | null>(null);
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  const isSuperAdminOrAdmin =
    Number(user?.roleId) === ROLES.SUPER_ADMIN ||
    Number(user?.roleId) === ROLES.ADMIN ||
    user?.roleName === "SUPER_ADMIN" ||
    user?.roleName === "Admin";

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [plansRes, permRes] = await Promise.all([
        fetchJson<Plan[]>("/api/admin/plans"),
        fetchJson<Permission[]>("/api/permissions"),
      ]);

      if (plansRes.status === 401 || permRes.status === 401) {
        setLoadError("Session expired or database unreachable. Re-login, and keep npm run db:proxy running.");
        setPlans([]);
        setPermissions([]);
        setPlanPerms({});
        return;
      }

      if (!plansRes.ok && !permRes.ok) {
        setLoadError(plansRes.error || permRes.error || "Failed to load data");
        setPlans([]);
        setPermissions([]);
        setPlanPerms({});
        return;
      }

      const plansList = plansRes.ok ? plansRes.data || [] : [];
      const permsList = permRes.ok ? permRes.data || [] : [];

      if (!plansRes.ok) {
        setLoadError(plansRes.error || "Failed to load plans");
      } else if (!permRes.ok) {
        setLoadError(permRes.error || "Failed to load permissions");
      }

      setPlans(plansList);
      setPermissions(permsList);

      const next: Record<number, Set<number>> = {};
      for (const plan of plansList) {
        next[plan.id] = new Set(plan.permissionIds ?? []);
      }
      setPlanPerms(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    if (window.location.hash === "#plan-permissions" && !loading) {
      document.getElementById("plan-permissions")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [loading]);

  const togglePlanPerm = (planId: number, permissionId: number) => {
    if (!isSuperAdminOrAdmin) return;
    setPlanPerms((prev) => {
      const set = new Set(prev[planId] ?? []);
      if (set.has(permissionId)) set.delete(permissionId);
      else set.add(permissionId);
      return { ...prev, [planId]: set };
    });
  };

  const savePlanPerms = async (planId: number) => {
    if (!isSuperAdminOrAdmin) return;
    setSaving(planId);
    try {
      const res = await fetch(`/api/admin/plans/${planId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ permissionIds: Array.from(planPerms[planId] ?? []) }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const planName = plans.find((p) => p.id === planId)?.name ?? "Plan";
      showSuccess("Saved", `${planName} permissions updated.`);
    } catch (e) {
      console.error(e);
      showError("Save failed", "Could not update plan permissions. Check db:proxy.");
    } finally {
      setSaving(null);
    }
  };

  const startEdit = (plan: Plan) => {
    if (!isSuperAdminOrAdmin) return;
    setEditingPlan(plan.id);
    setEditForm({
      price: plan.price,
      durationInDays: plan.durationInDays,
      status: plan.status,
    });
  };

  const savePlanDetails = async () => {
    if (editingPlan == null || !editForm) return;
    setSaving(editingPlan);
    try {
      const res = await fetch(`/api/admin/plans/${editingPlan}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setPlans((prev) =>
        prev.map((p) =>
          p.id === editingPlan
            ? { ...p, ...data.data, permissionIds: p.permissionIds }
            : p
        )
      );
      setEditingPlan(null);
      setEditForm(null);
      showSuccess("Updated", "Plan details saved.");
    } catch (e) {
      console.error(e);
      showError("Update failed", "Could not save plan details.");
    } finally {
      setSaving(null);
    }
  };

  const byModule = useMemo(
    () =>
      permissions.reduce((acc, p) => {
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
      }, {} as Record<string, Permission[]>),
    [permissions]
  );

  const modules = useMemo(() => Object.keys(byModule).sort(), [byModule]);

  const filteredEntries = useMemo(() => {
    const entries = Object.entries(byModule);
    if (moduleFilter === "all") return entries;
    return entries.filter(([m]) => m === moduleFilter);
  }, [byModule, moduleFilter]);

  const activeCount = plans.filter((p) => p.status === "ACTIVE").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="relative overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-br from-[#1E4A85]/[0.08] via-card to-[#C4A35A]/[0.06] px-6 py-16">
          <div className="relative flex flex-col items-center gap-3">
            <Loader2 className="h-9 w-9 animate-spin text-[#1E4A85]" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading subscription plans…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <Breadcrumb />

      <section className="relative overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-br from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] px-6 py-7 text-white shadow-lg shadow-[#1E4A85]/20 sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#C4A35A]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E8D5A3]">
              <Shield className="h-3.5 w-3.5" />
              Subscription control
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Manage Plans</h1>
            <p className="text-sm leading-relaxed text-white/70 sm:text-[15px]">
              Set pricing, duration, and feature access for each subscription tier.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">Plans</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums">{plans.length}</p>
            </div>
            <div className="rounded-xl border border-[#C4A35A]/30 bg-[#C4A35A]/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#E8D5A3]/80">
                Active
              </p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-[#F5E6C8]">{activeCount}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
                Permissions
              </p>
              <p className="mt-0.5 text-xl font-bold tabular-nums">{permissions.length}</p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 self-stretch rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {loadError && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Could not load fully</p>
              <p className="mt-0.5 text-amber-800/90 dark:text-amber-200/90">{loadError}</p>
              <p className="mt-1 text-xs text-amber-800/70 dark:text-amber-200/70">
                Tip: run <code className="rounded bg-amber-900/10 px-1">npm run db:proxy</code> in a
                separate terminal, then refresh.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A6B]"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {!isSuperAdminOrAdmin && (
        <div className="flex items-start gap-3 rounded-xl border border-[#C4A35A]/25 bg-[#C4A35A]/10 px-4 py-3 text-sm text-[#5C4A1F] dark:text-[#E8D5A3]">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>View-only mode. Only Super Admin / Admin can edit plans and permissions.</p>
        </div>
      )}

      {plans.length === 0 && !loadError && (
        <div className="rounded-2xl border border-dashed border-[#C4A35A]/50 bg-[#C4A35A]/[0.06] px-6 py-10 text-center">
          <CircleDashed className="mx-auto h-10 w-10 text-[#C4A35A]" />
          <p className="mt-3 text-base font-semibold text-foreground">No subscription plans found</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Seed the database so subscription_plans includes SILVER, GOLD, and DIAMOND.
          </p>
          <button
            type="button"
            onClick={loadData}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#163A6B]"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const tier = getPlanTier(plan.name);
          const style = TIER_STYLE[tier];
          const Icon = style.Icon;
          const enabledCount = planPerms[plan.id]?.size ?? 0;
          const isEditing = editingPlan === plan.id && editForm;

          return (
            <article
              key={plan.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300",
                style.glow,
                tier === "GOLD" && "md:scale-[1.02] md:shadow-md ring-1",
                tier === "GOLD" && style.ring
              )}
            >
              <div className={cn("absolute inset-x-0 top-0 h-28 bg-gradient-to-b", style.accent)} />
              <div className="relative flex flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl shadow-sm",
                        style.badge
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className={cn("text-lg font-bold tracking-tight", style.header)}>
                        {plan.name}
                      </h2>
                      <span
                        className={cn(
                          "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          plan.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            plan.status === "ACTIVE" ? "bg-emerald-500" : "bg-muted-foreground"
                          )}
                        />
                        {plan.status}
                      </span>
                    </div>
                  </div>
                  {isSuperAdminOrAdmin && !isEditing && (
                    <button
                      type="button"
                      onClick={() => startEdit(plan)}
                      className="rounded-lg border border-border/70 bg-background/80 p-2 text-muted-foreground transition hover:border-[#1E4A85]/40 hover:bg-[#1E4A85]/5 hover:text-[#1E4A85]"
                      aria-label={`Edit ${plan.name}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3 rounded-xl border border-[#1E4A85]/15 bg-background/80 p-4">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Price (₹)
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm((f) => f && { ...f, price: Number(e.target.value) })
                        }
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm font-medium outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
                      />
                    </label>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Duration (days)
                      <input
                        type="number"
                        min={1}
                        value={editForm.durationInDays}
                        onChange={(e) =>
                          setEditForm(
                            (f) => f && { ...f, durationInDays: Number(e.target.value) }
                          )
                        }
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm font-medium outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
                      />
                    </label>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm((f) => f && { ...f, status: e.target.value })
                        }
                        className="mt-1.5 h-10 w-full rounded-lg border border-border bg-card px-3 text-sm font-medium outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </label>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={savePlanDetails}
                        disabled={saving !== null}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1E4A85] text-sm font-semibold text-white hover:bg-[#163A6B] disabled:opacity-50"
                      >
                        {saving === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlan(null);
                          setEditForm(null);
                        }}
                        className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p
                        className={cn(
                          "text-3xl font-extrabold tracking-tight tabular-nums",
                          style.price
                        )}
                      >
                        ₹{Number(plan.price).toLocaleString("en-IN")}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        per{" "}
                        <span className="font-semibold text-foreground">
                          {plan.durationInDays} days
                        </span>
                      </p>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#1E4A85]" />
                        {enabledCount} features enabled
                      </span>
                      <a
                        href="#plan-permissions"
                        className="font-semibold text-[#1E4A85] hover:underline dark:text-[#8EB6E8]"
                      >
                        Edit access →
                      </a>
                    </div>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section
        id="plan-permissions"
        className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm"
      >
        <div className="border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.06] via-transparent to-[#C4A35A]/[0.06] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-[#1E4A85] dark:text-[#8EB6E8]">
                <Layers className="h-4 w-4" />
                Plan-wise permissions
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Toggle features per plan, then save each column.
              </p>
            </div>
            {modules.length > 0 && (
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="h-10 rounded-lg border border-border/70 bg-background px-3 text-sm font-medium outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
              >
                <option value="all">All modules</option>
                {modules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {permissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center">
              <p className="font-semibold text-foreground">No permissions loaded</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check database connection, then retry.
              </p>
              <button
                type="button"
                onClick={loadData}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A6B]"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#C4A35A]/40 bg-[#C4A35A]/[0.05] py-10 text-center">
              <p className="font-semibold text-foreground">Plan columns unavailable</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Load subscription plans first to edit the permission matrix.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table
                className="w-full border-collapse text-sm"
                style={{ minWidth: `${220 + plans.length * 150}px` }}
              >
                <thead>
                  <tr className="bg-[#1E4A85] text-white">
                    <th className="sticky left-0 z-20 min-w-[200px] bg-[#1E4A85] px-3 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Permission
                    </th>
                    <th className="min-w-[100px] bg-[#163A6B] px-3 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Module
                    </th>
                    {plans.map((plan) => {
                      const tier = getPlanTier(plan.name);
                      return (
                        <th
                          key={plan.id}
                          className="min-w-[140px] border-l border-white/10 px-3 py-3 text-center"
                        >
                          <span className="block text-xs font-bold uppercase tracking-wide">
                            {plan.name}
                          </span>
                          {isSuperAdminOrAdmin && (
                            <button
                              type="button"
                              className={cn(
                                "mt-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition disabled:opacity-50",
                                tier === "GOLD"
                                  ? "bg-[#C4A35A] text-[#0B132B] hover:brightness-110"
                                  : "bg-white/15 text-white hover:bg-white/25"
                              )}
                              onClick={() => savePlanPerms(plan.id)}
                              disabled={saving === plan.id}
                            >
                              {saving === plan.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              Save
                            </button>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map(([module, perms]) => (
                    <React.Fragment key={module}>
                      <tr className="bg-[#1E4A85]/[0.04]">
                        <td
                          colSpan={2 + plans.length}
                          className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1E4A85] dark:text-[#8EB6E8]"
                        >
                          {module}
                        </td>
                      </tr>
                      {perms.map((p) => (
                        <tr
                          key={p.id}
                          className="border-t border-border/50 transition-colors hover:bg-[#1E4A85]/[0.03]"
                        >
                          <td className="sticky left-0 z-10 min-w-[200px] bg-card px-3 py-2.5 font-medium text-foreground shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                            {p.label}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{p.module}</td>
                          {plans.map((plan) => {
                            const checked = planPerms[plan.id]?.has(p.id) ?? false;
                            return (
                              <td
                                key={plan.id}
                                className="border-l border-border/40 px-3 py-2.5 text-center"
                              >
                                <button
                                  type="button"
                                  disabled={!isSuperAdminOrAdmin}
                                  onClick={() => togglePlanPerm(plan.id, p.id)}
                                  aria-pressed={checked}
                                  aria-label={`${p.label} for ${plan.name}`}
                                  className={cn(
                                    "mx-auto flex h-8 w-8 items-center justify-center rounded-lg border transition",
                                    checked
                                      ? "border-[#1E4A85] bg-[#1E4A85] text-white shadow-sm"
                                      : "border-border bg-background text-muted-foreground hover:border-[#1E4A85]/40",
                                    !isSuperAdminOrAdmin && "cursor-not-allowed opacity-60"
                                  )}
                                >
                                  {checked ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <span className="h-2 w-2 rounded-full bg-current opacity-30" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
