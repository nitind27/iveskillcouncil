import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyFranchiseOrderSplit, onFranchiseOrderPaid } from "@/lib/franchise-split";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function verifySignature(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  const secret = process.env.CASHFREE_SECRET_KEY || "";
  const data   = timestamp + rawBody;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64");
  return expected === signature;
}

async function markOrderPaid(orderId: string, cfPayId: string | null, payMode: string | null) {
  const order = await prisma.franchiseOrder.findUnique({ where: { orderId: String(orderId) } });
  if (!order || order.status === "PAID") return;

  const splitWasConfigured = order.splitStatus === "CONFIGURED_AT_ORDER";

  await prisma.franchiseOrder.update({
    where: { orderId: String(orderId) },
    data: {
      status:      "PAID",
      cfPaymentId: cfPayId ? String(cfPayId) : null,
      paymentMode: payMode,
      ...(splitWasConfigured
        ? { splitApplied: true, splitStatus: "SPLIT_AT_ORDER" }
        : {}),
    },
  });

  await onFranchiseOrderPaid(String(orderId));

  // Fallback: apply split after payment if not configured at order creation
  if (!splitWasConfigured && order.splitConfigSnapshot) {
    await applyFranchiseOrderSplit(String(orderId));
  } else if (!splitWasConfigured) {
    const refreshed = await prisma.franchiseOrder.findUnique({ where: { orderId: String(orderId) } });
    if (refreshed && !refreshed.splitApplied) {
      await applyFranchiseOrderSplit(String(orderId));
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody  = await request.text();
    const timestamp = request.headers.get("x-webhook-timestamp") || "";
    const signature = request.headers.get("x-webhook-signature") || "";

    if (process.env.CASHFREE_ENV === "PROD") {
      if (!verifySignature(rawBody, timestamp, signature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const type  = event?.type;

    if (type === "PAYMENT_SUCCESS_WEBHOOK") {
      const orderId   = event?.data?.order?.order_id;
      const cfPayId   = event?.data?.payment?.cf_payment_id;
      const payMode   = event?.data?.payment?.payment_method?.type || null;

      if (orderId) {
        await markOrderPaid(String(orderId), cfPayId, payMode);
      }
    } else if (type === "PAYMENT_FAILED_WEBHOOK") {
      const orderId = event?.data?.order?.order_id;
      if (orderId) {
        await prisma.franchiseOrder.updateMany({
          where: { orderId: String(orderId), status: "PENDING" },
          data: { status: "FAILED" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("franchise-payment/webhook:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
