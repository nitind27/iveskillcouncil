"use client";

import React, { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/common";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Shield, Loader2, Save, Edit2 } from "lucide-react";
import { ROLES } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";

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
}

export default function SubscriptionPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [planPerms, setPlanPerms] = useState<Record<number, Set<number>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [editingPlan, setEditingPlan] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ price: number; durationInDays: number; status: string } | null>(null);

  const isSuperAdmin = Number(user?.roleId) === ROLES.SUPER_ADMIN || user?.roleName === "SUPER_ADMIN";

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [plansRes, permRes] = await Promise.all([
        fetch("/api/admin/plans", { credentials: "include" }),
        fetch("/api/permissions", { credentials: "include" }),
      ]);
      if (!plansRes.ok || !permRes.ok) {
        setLoading(false);
        return;
      }
      const plansData = await plansRes.json();
      const permData = await permRes.json();
      const plansList = plansData.data || [];
      const permsList = permData.data || [];
      setPlans(plansList);
      setPermissions(permsList);

      const next: Record<number, Set<number>> = {};
      for (const plan of plansList) {
        const res = await fetch(`/api/admin/plans/${plan.id}/permissions`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          next[plan.id] = new Set((data.data || []) as number[]);
        } else {
          next[plan.id] = new Set();
        }
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
    if (window.location.hash === "#plan-permissions") {
      const el = document.getElementById("plan-permissions");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading]);

  const togglePlanPerm = (planId: number, permissionId: number) => {
    if (!isSuperAdmin) return;
    setPlanPerms((prev) => {
      const set = new Set(prev[planId] ?? []);
      if (set.has(permissionId)) set.delete(permissionId);
      else set.add(permissionId);
      return { ...prev, [planId]: set };
    });
  };

  const savePlanPerms = async (planId: number) => {
    if (!isSuperAdmin) return;
    setSaving(planId);
    try {
      const res = await fetch(`/api/admin/plans/${planId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ permissionIds: Array.from(planPerms[planId] ?? []) }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const startEdit = (plan: Plan) => {
    if (!isSuperAdmin) return;
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
      setPlans((prev) => prev.map((p) => (p.id === editingPlan ? { ...p, ...data.data } : p)));
      setEditingPlan(null);
      setEditForm(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const byModule = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Subscription Plans
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage plan pricing and plan-wise permissions. Only Super Admin can edit.
        </p>
      </div>

      {/* Plan cards with edit */}
      {plans.length === 0 && !loading && (
        <div className="rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-900/20 p-6 text-center">
          <p className="font-semibold text-amber-800 dark:text-amber-200">⚠️ Subscription plans load nahi hue</p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Database me <code className="bg-amber-200/50 dark:bg-amber-800/50 px-1 rounded">subscription_plans</code> table me SILVER, GOLD, DIAMOND hona chahiye. Seed chalaen: <code className="bg-amber-200/50 dark:bg-amber-800/50 px-1 rounded">npm run db:seed</code></p>
          <button type="button" onClick={loadData} className="mt-4 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700">Retry</button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => startEdit(plan)}
                  className="p-1.5 rounded hover:bg-muted"
                  aria-label="Edit plan"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {editingPlan === plan.id && editForm ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    Price
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={editForm.price}
                      onChange={(e) => setEditForm((f) => f && { ...f, price: Number(e.target.value) })}
                      className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Duration (days)
                    <input
                      type="number"
                      min={1}
                      value={editForm.durationInDays}
                      onChange={(e) => setEditForm((f) => f && { ...f, durationInDays: Number(e.target.value) })}
                      className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Status
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => f && { ...f, status: e.target.value })}
                      className="mt-1 block w-full rounded border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </label>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={savePlanDetails}
                      disabled={saving !== null}
                      className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                      {saving === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingPlan(null); setEditForm(null); }}
                      className="px-3 py-1.5 rounded border border-border text-sm hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    ₹{plan.price.toLocaleString()} / {plan.durationInDays} days
                  </p>
                  <p className="text-sm">
                    Status: <span className={plan.status === "ACTIVE" ? "text-green-600" : "text-muted-foreground"}>{plan.status}</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan-wise permissions matrix */}
      <Card id="plan-permissions" className="rounded-xl shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle>Plan-wise permissions</CardTitle>
          <CardContent className="pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Control which features each subscription plan can access. Franchise users get role permissions intersected with their plan permissions.
            </p>
            <div className="rounded-lg bg-muted/60 border border-border p-4 text-sm">
              <p className="font-semibold text-foreground mb-2">Kaise edit karein (SUPER_ADMIN):</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Neeche table me <strong className="text-foreground">right scroll</strong> karein — <strong className="text-foreground">SILVER</strong>, <strong className="text-foreground">GOLD</strong>, <strong className="text-foreground">DIAMOND</strong> columns (checkboxes + Save) right taraf dikhenge.</li>
                <li>Har <strong className="text-foreground">row</strong> ek permission hai (e.g. View Dashboard, Manage Franchises). Har <strong className="text-foreground">column</strong> ek plan.</li>
                <li>Jis plan me permission deni hai, us plan ke column me us permission ki row me <strong className="text-foreground">checkbox</strong> pe click karein (✓ check ho jayega).</li>
                <li>Badlav save karne ke liye us plan column ke upar wale <strong className="text-foreground">Save</strong> button pe click karein.</li>
              </ol>
            </div>
          </CardContent>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="font-medium">No permissions loaded.</p>
              <p className="text-sm mt-1">Permissions sync karne ke liye niche Retry dabayein.</p>
              <button
                type="button"
                onClick={loadData}
                className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          ) : plans.length === 0 ? (
            <div className="py-8 text-center rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-900/20">
              <p className="font-semibold text-amber-800 dark:text-amber-200">⚠️ Plan columns isliye nahi dikh rahe: Plans load nahi hue</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Jab tak <strong>subscription_plans</strong> me SILVER, GOLD, DIAMOND nahi honge, tab tak checkboxes wale columns render nahi honge. Seed chalaen: <code className="bg-amber-200/50 px-1 rounded">npm run db:seed</code></p>
              <button type="button" onClick={loadData} className="mt-4 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700">Retry</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-2 mb-4">
                ✓ <strong>{plans.length} plans loaded:</strong> {plans.map((p) => p.name).join(", ")} — Neeche table me ye columns (checkboxes + Save) dikhenge. Scroll karein agar saari columns ek saath na dikhein.
              </p>
              <div className="overflow-x-auto -mx-2 px-2 border border-border rounded-lg">
                <table className="w-full border-collapse text-sm" style={{ minWidth: `${280 + plans.length * 140}px` }}>
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-semibold text-foreground bg-muted/50 sticky left-0 z-10 w-[200px] max-w-[200px]">Permission</th>
                      <th className="text-left py-3 px-2 font-semibold text-foreground bg-muted/50 sticky left-[200px] z-10 w-[100px] max-w-[100px]">Module</th>
                      {plans.map((plan) => (
                        <th key={plan.id} className="text-center py-3 px-2 font-semibold text-foreground w-[140px] min-w-[140px] bg-primary/10 text-primary border-l border-border whitespace-nowrap">
                          <span className="block text-primary">{plan.name}</span>
                          {isSuperAdmin && (
                            <button
                              type="button"
                              className="mt-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1"
                              onClick={() => savePlanPerms(plan.id)}
                              disabled={saving === plan.id}
                            >
                              {saving === plan.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save</span>
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(byModule).map(([module, perms]) => (
                      <React.Fragment key={module}>
                        {perms.map((p) => (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2.5 px-2 text-foreground bg-card sticky left-0 z-10 w-[200px] max-w-[200px]">{p.label}</td>
                            <td className="py-2.5 px-2 text-muted-foreground bg-card sticky left-[200px] z-10 w-[100px] max-w-[100px]">{p.module}</td>
                            {plans.map((plan) => (
                              <td key={plan.id} className="text-center py-2.5 px-2 w-[140px] min-w-[140px] border-l border-border bg-background">
                                <label className="inline-flex items-center justify-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={planPerms[plan.id]?.has(p.id) ?? false}
                                    onChange={() => togglePlanPerm(plan.id, p.id)}
                                    disabled={!isSuperAdmin}
                                    className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-2 focus:ring-primary/30 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                                  />
                                    {/* <span className="">{p.label} for {plan.name}</span> */}
                                  </label>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
