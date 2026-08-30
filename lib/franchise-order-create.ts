import { prisma } from "@/lib/prisma";
import { createCashfreeOrder } from "@/lib/cashfree";
import { resolvePlanSplitForOrder, isEasySplitRequired } from "@/lib/franchise-split";

export function generateFranchiseOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `FRN-${ts}-${rnd}`;
}

export interface CreateFranchiseOrderInput {
  fullName: string;
  email: string;
  phone: string;
  planId: number;
  amount?: number;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  message?: string | null;
  applicationId?: bigint | null;
  createdByAdmin?: bigint | null;
}

export async function createFranchisePaymentOrder(
  input: CreateFranchiseOrderInput
): Promise<
  | {
      ok: true;
      orderId: string;
      paymentSessionId: string;
      amount: number;
      planName: string;
      easySplitEnabled: boolean;
      paymentUrl: string;
    }
  | { ok: false; error: string; status: number }
> {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: input.planId },
  });
  if (!plan || plan.status !== "ACTIVE") {
    return { ok: false, error: "Selected plan is not available.", status: 400 };
  }

  const amount =
    input.amount != null && input.amount >= 0 ? input.amount : Number(plan.price);
  const orderId = generateFranchiseOrderId();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

  const splitResolved = await resolvePlanSplitForOrder(plan.id, plan.name, amount);
  if (isEasySplitRequired() && !splitResolved.ok) {
    return {
      ok: false,
      error: splitResolved.error || "Owner payout not configured. Set up Easy Split first.",
      status: 400,
    };
  }

  const cfResult = await createCashfreeOrder({
    orderId,
    amount,
    customerName: input.fullName.trim(),
    customerEmail: input.email.trim().toLowerCase(),
    customerPhone: input.phone.trim(),
    returnUrl: `${appUrl}/userpanel/franchise-payment/status?order_id=${orderId}`,
    notifyUrl: `${appUrl}/api/franchise-payment/webhook`,
    orderNote: `Franchise Plan: ${plan.name}`,
    orderSplits: splitResolved.ok ? splitResolved.data.orderSplits : undefined,
  });

  if (!cfResult.success) {
    return { ok: false, error: `Payment gateway error: ${cfResult.error}`, status: 502 };
  }

  await prisma.franchiseOrder.create({
    data: {
      orderId,
      cfOrderId: cfResult.data.cf_order_id,
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      planId: plan.id,
      planName: plan.name,
      amount,
      status: "PENDING",
      paymentSessionId: cfResult.data.payment_session_id,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      address: input.address?.trim() || null,
      message: input.message?.trim() || null,
      applicationId: input.applicationId ?? null,
      createdByAdmin: input.createdByAdmin ?? null,
      splitApplied: false,
      splitStatus: splitResolved.ok ? "CONFIGURED_AT_ORDER" : null,
      splitConfigSnapshot: splitResolved.ok ? splitResolved.data.snapshot : undefined,
    },
  });

  const paymentUrl = `${appUrl}/userpanel/franchise-payment/pay?order_id=${orderId}`;

  return {
    ok: true,
    orderId,
    paymentSessionId: cfResult.data.payment_session_id,
    amount,
    planName: plan.name,
    easySplitEnabled: splitResolved.ok,
    paymentUrl,
  };
}
