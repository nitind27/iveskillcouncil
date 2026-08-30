"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/common";
import {
  Building2,
  Loader2,
  Save,
  Shield,
  Percent,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Link2,
  ShoppingCart,
} from "lucide-react";
import { ROLES } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Beneficiary {
  slot: number;
  label: string;
  accountHolderName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  panNumber: string;
  email: string;
  phone: string;
  cashfreeVendorId: string | null;
  vendorStatus: string | null;
  status: string;
  accountMasked: string | null;
  isConfigured: boolean;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  status: string;
}

interface PlanSplitConfig {
  beneficiary1Pct: number;
  beneficiary2Pct: number;
  beneficiary3Pct: number;
  isActive: boolean;
  total: number;
}

const EMPTY_BEN: Omit<Beneficiary, "slot" | "isConfigured" | "accountMasked"> = {
  label: "",
  accountHolderName: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  panNumber: "",
  email: "",
  phone: "",
  cashfreeVendorId: null,
  vendorStatus: null,
  status: "ACTIVE",
};

export default function EasySplitConfigPage() {
  const { user } = useAuth();
  const isAdmin =
    Number(user?.roleId) === ROLES.SUPER_ADMIN ||
    Number(user?.roleId) === ROLES.ADMIN;

  const [loading, setLoading] = useState(true);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planConfigs, setPlanConfigs] = useState<
    Record<number, { price: number; split: PlanSplitConfig | null }>
  >({});
  const [benForms, setBenForms] = useState<Record<number, typeof EMPTY_BEN & { slot: number }>>({});
  const [savingBen, setSavingBen] = useState<number | null>(null);
  const [registeringBen, setRegisteringBen] = useState<number | null>(null);
  const [savingPlan, setSavingPlan] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [benRes, plansRes] = await Promise.all([
        fetch("/api/admin/split-beneficiaries", { credentials: "include" }),
        fetch("/api/admin/plans", { credentials: "include" }),
      ]);
      const benJson = await benRes.json();
      const plansJson = await plansRes.json();

      if (!benRes.ok) throw new Error(benJson.error || "Failed to load beneficiaries");
      if (!plansRes.ok) throw new Error(plansJson.error || "Failed to load plans");

      const bens: Beneficiary[] = benJson.data?.beneficiaries || [];
      setBeneficiaries(bens);

      const forms: Record<number, typeof EMPTY_BEN & { slot: number }> = {};
      for (const b of bens) {
        forms[b.slot] = {
          slot: b.slot,
          label: b.label,
          accountHolderName: b.accountHolderName,
          bankName: b.bankName || "",
          bankAccountNumber: b.bankAccountNumber,
          bankIfsc: b.bankIfsc,
          panNumber: b.panNumber || "",
          email: b.email || "",
          phone: b.phone || "",
          cashfreeVendorId: b.cashfreeVendorId,
          vendorStatus: b.vendorStatus,
          status: b.status,
        };
      }
      for (const slot of [1, 2, 3]) {
        if (!forms[slot]) forms[slot] = { ...EMPTY_BEN, slot };
      }
      setBenForms(forms);

      const planList: Plan[] = plansJson.data || [];
      setPlans(planList);

      const configs: Record<number, { price: number; split: PlanSplitConfig | null }> = {};
      await Promise.all(
        planList.map(async (p) => {
          const r = await fetch(`/api/admin/plans/${p.id}/split-config`, { credentials: "include" });
          const j = await r.json();
          configs[p.id] = {
            price: j.data?.price ?? p.price,
            split: j.data?.splitConfig ?? null,
          };
        })
      );
      setPlanConfigs(configs);
    } catch (e) {
      await showError("Load failed", e instanceof Error ? e.message : "Could not load Easy Split config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  const allVendorsRegistered = useMemo(
    () => beneficiaries.filter((b) => b.isConfigured && b.cashfreeVendorId).length >= 3,
    [beneficiaries]
  );

  const saveBeneficiary = async (slot: number) => {
    const form = benForms[slot];
    if (!form) return;
    setSavingBen(slot);
    try {
      const existing = beneficiaries.find((b) => b.slot === slot);
      const bankDetailsChanged =
        existing &&
        (existing.bankAccountNumber !== form.bankAccountNumber ||
          existing.bankIfsc !== form.bankIfsc ||
          existing.accountHolderName !== form.accountHolderName);

      const res = await fetch("/api/admin/split-beneficiaries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, bankDetailsChanged }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Error", json.error || "Failed to save");
        return;
      }
      await showSuccess("Saved", `Beneficiary ${slot} bank details saved`);
      await loadData();
    } finally {
      setSavingBen(null);
    }
  };

  const registerVendor = async (slot: number) => {
    setRegisteringBen(slot);
    try {
      const res = await fetch(`/api/admin/split-beneficiaries/${slot}/register`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Registration failed", json.error || "Cashfree vendor error");
        return;
      }
      await showSuccess(
        "Registered",
        `Vendor ${json.data?.cashfreeVendorId} — status: ${json.data?.vendorStatus}`
      );
      await loadData();
    } finally {
      setRegisteringBen(null);
    }
  };

  const updatePlanSplit = (planId: number, field: string, value: number | boolean) => {
    setPlanConfigs((prev) => {
      const cur = prev[planId] || { price: 0, split: null };
      const split = cur.split || {
        beneficiary1Pct: 50,
        beneficiary2Pct: 30,
        beneficiary3Pct: 20,
        isActive: true,
        total: 100,
      };
      const next = { ...split, [field]: value };
      next.total =
        Number(next.beneficiary1Pct) + Number(next.beneficiary2Pct) + Number(next.beneficiary3Pct);
      return { ...prev, [planId]: { ...cur, split: next } };
    });
  };

  const updatePlanPrice = (planId: number, price: number) => {
    setPlanConfigs((prev) => ({
      ...prev,
      [planId]: { ...(prev[planId] || { split: null }), price },
    }));
  };

  const savePlanConfig = async (planId: number) => {
    const cfg = planConfigs[planId];
    if (!cfg?.split) return;
    const total = cfg.split.total;
    if (Math.abs(total - 100) > 0.001) {
      await showError("Invalid split", `Percentages must total 100% (currently ${total}%)`);
      return;
    }
    setSavingPlan(planId);
    try {
      const res = await fetch(`/api/admin/plans/${planId}/split-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          price: cfg.price,
          beneficiary1Pct: cfg.split.beneficiary1Pct,
          beneficiary2Pct: cfg.split.beneficiary2Pct,
          beneficiary3Pct: cfg.split.beneficiary3Pct,
          isActive: cfg.split.isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Error", json.error || "Failed to save");
        return;
      }
      await showSuccess("Saved", `${json.data?.planName} — price & split saved`);
      await loadData();
    } finally {
      setSavingPlan(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Admin access required to configure Cashfree Easy Split.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumb
        items={[
          { label: "Subscription", href: "/subscription/plans" },
          { label: "Easy Split Config" },
        ]}
      />

      <div className="rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#1E4A85]/[0.06] to-[#C4A35A]/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-start gap-3">
            <Shield className="mt-0.5 h-6 w-6 text-[#1E4A85]" />
            <div>
              <h1 className="text-xl font-bold text-[#1E4A85]">Cashfree Easy Split</h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Franchise fee jo customer / franchise owner pay kare, woh automatically institute owner ke bank
                account(s) mein settle ho. Slot 1 = <strong>Institute Owner (primary)</strong>. Admin franchise
                deta hai — paisa owner ke account mein aata hai.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/franchise-orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1E4A85]/25 bg-white/80 px-3 py-2 text-sm font-semibold text-[#1E4A85] hover:bg-white"
          >
            <ShoppingCart className="h-4 w-4" />
            View payment orders
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading configuration…
        </div>
      ) : (
        <>
          {/* Beneficiaries */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#1E4A85]">
              <Building2 className="h-5 w-5" />
              Institute Owner Bank Accounts
            </h2>
            <p className="text-sm text-muted-foreground">
              Slot 1 = Institute Owner (100% default). Slots 2–3 optional partners.
            </p>
            <div className="grid gap-4 lg:grid-cols-3">
              {[1, 2, 3].map((slot) => {
                const form = benForms[slot];
                const saved = beneficiaries.find((b) => b.slot === slot);
                if (!form) return null;
                return (
                  <div
                    key={slot}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1E4A85]">
                        {slot === 1 ? "Institute Owner" : slot === 2 ? "Partner 2" : "Partner 3"}
                      </span>
                      {saved?.cashfreeVendorId ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {saved.vendorStatus || "Registered"}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600">Not registered</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {(
                        [
                          ["label", "Label", "text"],
                          ["accountHolderName", "Account holder", "text"],
                          ["bankName", "Bank name", "text"],
                          ["bankAccountNumber", "Account number", "text"],
                          ["bankIfsc", "IFSC", "text"],
                          ["panNumber", "PAN", "text"],
                          ["email", "Email", "email"],
                          ["phone", "Phone", "tel"],
                        ] as const
                      ).map(([key, label, type]) => (
                        <div key={key}>
                          <label className="text-[11px] font-medium text-muted-foreground">
                            {label}
                          </label>
                          <input
                            type={type}
                            className="mt-0.5 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
                            value={form[key] || ""}
                            onChange={(e) =>
                              setBenForms((prev) => ({
                                ...prev,
                                [slot]: { ...prev[slot], [key]: e.target.value },
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={savingBen === slot}
                        onClick={() => saveBeneficiary(slot)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#1E4A85] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {savingBen === slot ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={registeringBen === slot || !saved?.isConfigured}
                        onClick={() => registerVendor(slot)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#1E4A85]/30 px-3 py-1.5 text-xs font-semibold text-[#1E4A85] disabled:opacity-50"
                      >
                        {registeringBen === slot ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Link2 className="h-3.5 w-3.5" />
                        )}
                        Register Cashfree
                      </button>
                    </div>
                    {saved?.cashfreeVendorId && (
                      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                        Vendor: {saved.cashfreeVendorId}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Plan split config */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#1E4A85]">
              <Percent className="h-5 w-5" />
              Franchise plan price & split %
            </h2>
            {!allVendorsRegistered && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Register all 3 beneficiaries with Cashfree before enabling splits on checkout.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => {
                const cfg = planConfigs[plan.id];
                const split = cfg?.split || {
                  beneficiary1Pct: 100,
                  beneficiary2Pct: 0,
                  beneficiary3Pct: 0,
                  isActive: false,
                  total: 100,
                };
                const totalOk = Math.abs(split.total - 100) < 0.001;
                return (
                  <div
                    key={plan.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-bold text-[#1E4A85]">{plan.name}</span>
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={split.isActive}
                          onChange={(e) =>
                            updatePlanSplit(plan.id, "isActive", e.target.checked)
                          }
                        />
                        Active
                      </label>
                    </div>
                    <div className="mb-3">
                      <label className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <IndianRupee className="h-3 w-3" />
                        Franchise price (INR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="mt-0.5 w-full rounded-lg border border-border px-2.5 py-1.5 text-sm font-semibold"
                        value={cfg?.price ?? plan.price}
                        onChange={(e) => updatePlanPrice(plan.id, Number(e.target.value))}
                      />
                    </div>
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="mb-2 flex items-center gap-2">
                        <span className="w-20 text-xs text-muted-foreground">Account {n}</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          className="flex-1 rounded-lg border border-border px-2.5 py-1.5 text-sm"
                          value={split[`beneficiary${n}Pct` as keyof PlanSplitConfig] as number}
                          onChange={(e) =>
                            updatePlanSplit(
                              plan.id,
                              `beneficiary${n}Pct`,
                              Number(e.target.value)
                            )
                          }
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    ))}
                    <p
                      className={cn(
                        "mb-3 text-xs font-medium",
                        totalOk ? "text-emerald-600" : "text-red-600"
                      )}
                    >
                      Total: {split.total.toFixed(2)}% {totalOk ? "✓" : "(must be 100%)"}
                    </p>
                    <button
                      type="button"
                      disabled={savingPlan === plan.id || !totalOk}
                      onClick={() => savePlanConfig(plan.id)}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-[#1E4A85] py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {savingPlan === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save price & split
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}
