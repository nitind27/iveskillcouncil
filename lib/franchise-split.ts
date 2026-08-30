import { prisma } from "@/lib/prisma";
import type { CfOrderSplit } from "@/lib/cashfree";
import { validateSplitPercentages } from "@/lib/split-validation";

export interface ResolvedPlanSplit {
  orderSplits: CfOrderSplit[];
  snapshot: {
    planId: number;
    planName: string;
    amount: number;
    beneficiaries: Array<{
      slot: number;
      label: string;
      vendorId: string;
      percentage: number;
    }>;
  };
}

const OWNER_SLOT = 1;

/** Load plan split — franchise fee goes to institute owner bank account(s). */
export async function resolvePlanSplitForOrder(
  planId: number,
  planName: string,
  amount: number
): Promise<
  { ok: true; data: ResolvedPlanSplit } | { ok: false; error: string; code: "NO_CONFIG" | "INVALID" }
> {
  const config = await prisma.planSplitConfig.findUnique({
    where: { planId },
  });

  if (!config || !config.isActive) {
    return { ok: false, error: "Owner payout is not configured for this plan", code: "NO_CONFIG" };
  }

  const pct1 = Number(config.beneficiary1Pct);
  const pct2 = Number(config.beneficiary2Pct);
  const pct3 = Number(config.beneficiary3Pct);
  const validation = validateSplitPercentages(pct1, pct2, pct3);
  if (!validation.valid) {
    return { ok: false, error: validation.error, code: "INVALID" };
  }

  const pcts = [pct1, pct2, pct3];
  const activeSlots = pcts.map((p, i) => ({ slot: i + 1, pct: p })).filter((x) => x.pct > 0);

  if (activeSlots.length === 0) {
    return { ok: false, error: "At least one owner account must receive a share", code: "INVALID" };
  }

  const beneficiaries = await prisma.splitBeneficiary.findMany({
    where: { status: "ACTIVE", slot: { in: activeSlots.map((s) => s.slot) } },
    orderBy: { slot: "asc" },
  });

  const bySlot = new Map(beneficiaries.map((b) => [b.slot, b]));

  // Primary institute owner (slot 1) must always be registered when they receive a share
  if (pct1 > 0) {
    const owner = bySlot.get(OWNER_SLOT);
    if (!owner?.cashfreeVendorId) {
      return {
        ok: false,
        error: "Institute Owner bank account must be registered with Cashfree first",
        code: "INVALID",
      };
    }
  }

  const orderSplits: CfOrderSplit[] = [];
  const snapshotBeneficiaries: ResolvedPlanSplit["snapshot"]["beneficiaries"] = [];

  for (const { slot, pct } of activeSlots) {
    const ben = bySlot.get(slot);
    if (!ben?.cashfreeVendorId) {
      return {
        ok: false,
        error: `Owner account ${slot} (${ben?.label || "unconfigured"}) is not registered with Cashfree`,
        code: "INVALID",
      };
    }
    orderSplits.push({
      vendor_id: ben.cashfreeVendorId,
      percentage: pct,
      tags: { slot: String(slot), label: ben.label, role: slot === OWNER_SLOT ? "institute_owner" : "partner" },
    });
    snapshotBeneficiaries.push({
      slot,
      label: ben.label,
      vendorId: ben.cashfreeVendorId,
      percentage: pct,
    });
  }

  return {
    ok: true,
    data: {
      orderSplits,
      snapshot: {
        planId,
        planName,
        amount,
        beneficiaries: snapshotBeneficiaries,
      },
    },
  };
}

export function isEasySplitRequired(): boolean {
  return process.env.CASHFREE_EASY_SPLIT_REQUIRED === "true";
}

export async function applyFranchiseOrderSplit(orderId: string): Promise<void> {
  const { splitCashfreeOrderAfterPayment } = await import("@/lib/cashfree");
  const order = await prisma.franchiseOrder.findUnique({
    where: { orderId },
  });
  if (!order || order.splitApplied) return;

  let splits: import("@/lib/cashfree").CfOrderSplit[] | null = null;

  const snapshot = order.splitConfigSnapshot as {
    beneficiaries?: Array<{ vendorId: string; percentage: number; slot: number; label: string }>;
  } | null;

  if (snapshot?.beneficiaries?.length) {
    splits = snapshot.beneficiaries
      .filter((b) => b.percentage > 0)
      .map((b) => ({
        vendor_id: b.vendorId,
        percentage: b.percentage,
        tags: { slot: String(b.slot), label: b.label },
      }));
  } else {
    const resolved = await resolvePlanSplitForOrder(
      order.planId,
      order.planName,
      Number(order.amount)
    );
    if (resolved.ok) splits = resolved.data.orderSplits;
  }

  if (!splits?.length) return;

  const result = await splitCashfreeOrderAfterPayment(orderId, splits);
  await prisma.franchiseOrder.update({
    where: { orderId },
    data: {
      splitApplied: result.success,
      splitStatus: result.success ? "SPLIT_APPLIED" : `SPLIT_FAILED: ${result.error}`,
    },
  });

  if (!result.success) {
    console.warn(`Easy Split fallback failed for ${orderId}:`, result.error);
  }
}

/** After franchise fee is paid, mark linked application as payment received. */
export async function onFranchiseOrderPaid(orderId: string): Promise<void> {
  const order = await prisma.franchiseOrder.findUnique({
    where: { orderId },
    include: { application: true },
  });
  if (!order?.applicationId || !order.application) return;
  if (order.application.status === "APPROVED" || order.application.status === "REJECTED") return;

  await prisma.franchiseApplication.update({
    where: { id: order.applicationId },
    data: {
      status: order.application.status === "PENDING" ? "VERIFIED" : order.application.status,
      adminNotes: [
        order.application.adminNotes,
        `[Payment received] Order ${order.orderId} · ₹${Number(order.amount).toLocaleString("en-IN")} · ${new Date().toLocaleString("en-IN")}`,
      ]
        .filter(Boolean)
        .join("\n"),
      reviewedAt: new Date(),
    },
  });
}
